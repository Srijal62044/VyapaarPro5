-- ==============================================================================
-- VyapaarPro - Complete Production Database Migration
-- Single file for Supabase SQL Editor
-- Includes:
--   1. Schema Definition (Tables & Indexes)
--   2. Single Authorized Admin Email Configuration (kumarsrijal732@gmail.com)
--   3. Row Level Security (RLS) Policies
--   4. Auth Triggers & Role Enforcement
--   5. Idempotent Seed Data (Valid RFC Hexadecimal UUIDs only)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES & ROLE-BASED ACCESS CONTROL
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Authorized Admin Email Helper Function
CREATE OR REPLACE FUNCTION public.get_authorized_admin_email()
RETURNS TEXT AS $$
BEGIN
  -- Only this authenticated Supabase email holds admin access
  RETURN 'kumarsrijal732@gmail.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Helper function: checks if caller is authorized admin/super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    lower(trim(COALESCE(auth.jwt() ->> 'email', ''))) = lower(trim(public.get_authorized_admin_email()))
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND lower(trim(email)) = lower(trim(public.get_authorized_admin_email()))
        AND role IN ('admin', 'super_admin')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: checks if caller is authorized super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    lower(trim(COALESCE(auth.jwt() ->> 'email', ''))) = lower(trim(public.get_authorized_admin_email()))
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND lower(trim(email)) = lower(trim(public.get_authorized_admin_email()))
        AND role = 'super_admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger: automatically create profile on real auth.users signup
-- Only kumarsrijal732@gmail.com gets super_admin; all others are strictly customers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assigned_role TEXT;
  v_full_name TEXT;
  v_phone TEXT;
  v_company TEXT;
BEGIN
  IF lower(trim(COALESCE(NEW.email, ''))) = lower(trim(public.get_authorized_admin_email())) THEN
    v_assigned_role := 'super_admin';
  ELSE
    v_assigned_role := 'customer';
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_company := NEW.raw_user_meta_data->>'company_name';

  INSERT INTO public.profiles (id, email, full_name, phone, company_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    v_phone,
    v_company,
    v_assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
    role = v_assigned_role,
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: prevent non-authorized email accounts from ever being set to admin
CREATE OR REPLACE FUNCTION public.enforce_authorized_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('admin', 'super_admin') AND lower(trim(NEW.email)) != lower(trim(public.get_authorized_admin_email())) THEN
    NEW.role := 'customer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_admin_role ON public.profiles;
CREATE TRIGGER trg_enforce_admin_role
  BEFORE INSERT OR UPDATE OF role, email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_authorized_admin_role();

-- Helper RPC function for verified profile creation/synchronization
CREATE OR REPLACE FUNCTION public.ensure_profile(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_profile public.profiles;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User is not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  IF lower(trim(COALESCE(v_email, ''))) = lower(trim(public.get_authorized_admin_email())) THEN
    v_role := 'super_admin';
  ELSE
    v_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, company_name, role)
  VALUES (
    v_user_id,
    COALESCE(v_email, ''),
    COALESCE(p_full_name, split_part(v_email, '@', 1)),
    p_phone,
    p_company_name,
    v_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(p_full_name, public.profiles.full_name, split_part(v_email, '@', 1)),
    phone = COALESCE(p_phone, public.profiles.phone),
    company_name = COALESCE(p_company_name, public.profiles.company_name),
    role = v_role,
    updated_at = now()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. SERVICE CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON public.service_categories(slug);

-- ------------------------------------------------------------------------------
-- 3. SERVICES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('FIXED', 'STARTING_FROM', 'CUSTOM_QUOTE')),
  price NUMERIC(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  timeline TEXT,
  thumbnail_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  demo_url TEXT,
  deliverables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_published ON public.services(published);
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(featured);

-- ------------------------------------------------------------------------------
-- 4. SERVICE FEATURES & FAQS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_service_features_service ON public.service_features(service_id);

CREATE TABLE IF NOT EXISTS public.service_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_service_faqs_service ON public.service_faqs(service_id);

-- ------------------------------------------------------------------------------
-- 5. SERVICE REQUESTS (LEADS / INQUIRIES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  business_name TEXT,
  requirements TEXT NOT NULL,
  budget_range TEXT,
  preferred_contact_method TEXT DEFAULT 'WhatsApp',
  reference_links TEXT,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Discussing', 'Approved', 'In Progress', 'Completed', 'Cancelled')),
  internal_notes TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Not Discussed' CHECK (payment_status IN ('Not Discussed', 'Pending', 'Partially Received', 'Received')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_reference ON public.service_requests(reference_code);
CREATE INDEX IF NOT EXISTS idx_requests_user ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created ON public.service_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS public.service_request_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_files_request ON public.service_request_files(request_id);

-- ------------------------------------------------------------------------------
-- 6. PROJECTS & MILESTONES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'Design', 'Development', 'Testing', 'Review', 'Completed', 'On Hold', 'Cancelled')),
  progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_date DATE,
  expected_completion DATE,
  notes TEXT,
  internal_payment_status TEXT NOT NULL DEFAULT 'Not Discussed' CHECK (internal_payment_status IN ('Not Discussed', 'Pending', 'Partially Received', 'Received')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_reference ON public.projects(reference_code);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  due_date DATE,
  completed_date DATE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON public.project_milestones(project_id);

CREATE TABLE IF NOT EXISTS public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_updates_project ON public.project_updates(project_id);

CREATE TABLE IF NOT EXISTS public.project_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_deliverables_project ON public.project_deliverables(project_id);

-- ------------------------------------------------------------------------------
-- 7. PORTFOLIO ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  client_type TEXT,
  thumbnail_url TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  technologies JSONB DEFAULT '[]'::jsonb,
  demo_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_slug ON public.portfolio_items(slug);
CREATE INDEX IF NOT EXISTS idx_portfolio_published ON public.portfolio_items(published);

-- ------------------------------------------------------------------------------
-- 8. CONTACT MESSAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read', 'Replied', 'Archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);

-- ------------------------------------------------------------------------------
-- 9. SETTINGS & NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR public.is_super_admin()
    )
  );

DROP POLICY IF EXISTS "Admins can view and update profiles" ON public.profiles;
CREATE POLICY "Admins can view and update profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Service Categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published service categories" ON public.service_categories;
CREATE POLICY "Public read published service categories"
  ON public.service_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage service categories" ON public.service_categories;
CREATE POLICY "Admins manage service categories"
  ON public.service_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published services" ON public.services;
CREATE POLICY "Public read published services"
  ON public.services FOR SELECT
  USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage all services" ON public.services;
CREATE POLICY "Admins manage all services"
  ON public.services FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Service Features & FAQs
ALTER TABLE public.service_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read service features" ON public.service_features;
CREATE POLICY "Public read service features"
  ON public.service_features FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage service features" ON public.service_features;
CREATE POLICY "Admins manage service features"
  ON public.service_features FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read service faqs" ON public.service_faqs;
CREATE POLICY "Public read service faqs"
  ON public.service_faqs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage service faqs" ON public.service_faqs;
CREATE POLICY "Admins manage service faqs"
  ON public.service_faqs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Service Requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow guests and users to create service requests" ON public.service_requests;
CREATE POLICY "Allow guests and users to create service requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Clients read own requests; Admins read all" ON public.service_requests;
CREATE POLICY "Clients read own requests; Admins read all"
  ON public.service_requests FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins manage service requests" ON public.service_requests;
CREATE POLICY "Admins manage service requests"
  ON public.service_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete service requests" ON public.service_requests;
CREATE POLICY "Admins delete service requests"
  ON public.service_requests FOR DELETE
  USING (public.is_admin());

-- Service Request Files
ALTER TABLE public.service_request_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients read own request files; Admins read all" ON public.service_request_files;
CREATE POLICY "Clients read own request files; Admins read all"
  ON public.service_request_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_files.request_id
      AND (sr.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Request creators upload files" ON public.service_request_files;
CREATE POLICY "Request creators upload files"
  ON public.service_request_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_files.request_id
      AND (sr.user_id = auth.uid() OR sr.user_id IS NULL OR public.is_admin())
    )
  );

-- 6. Projects & Project Milestones
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients view own projects; Admins view all" ON public.projects;
CREATE POLICY "Clients view own projects; Admins view all"
  ON public.projects FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND client_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;
CREATE POLICY "Admins manage projects"
  ON public.projects FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients view milestones for own projects; Admins manage" ON public.project_milestones;
CREATE POLICY "Clients view milestones for own projects; Admins manage"
  ON public.project_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_milestones.project_id
      AND (p.client_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage milestones" ON public.project_milestones;
CREATE POLICY "Admins manage milestones"
  ON public.project_milestones FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients view updates for own projects; Admins manage" ON public.project_updates;
CREATE POLICY "Clients view updates for own projects; Admins manage"
  ON public.project_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_updates.project_id
      AND (p.client_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage updates" ON public.project_updates;
CREATE POLICY "Admins manage updates"
  ON public.project_updates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients view deliverables for own projects; Admins manage" ON public.project_deliverables;
CREATE POLICY "Clients view deliverables for own projects; Admins manage"
  ON public.project_deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_deliverables.project_id
      AND (p.client_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage deliverables" ON public.project_deliverables;
CREATE POLICY "Admins manage deliverables"
  ON public.project_deliverables FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Portfolio Items
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published portfolio items" ON public.portfolio_items;
CREATE POLICY "Public read published portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage portfolio" ON public.portfolio_items;
CREATE POLICY "Admins manage portfolio"
  ON public.portfolio_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Contact Messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view and manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins view and manage contact messages"
  ON public.contact_messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read agency settings" ON public.settings;
CREATE POLICY "Public read agency settings"
  ON public.settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.settings;
DROP POLICY IF EXISTS "Admins insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins delete settings" ON public.settings;

CREATE POLICY "Admins insert settings"
  ON public.settings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins update settings"
  ON public.settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete settings"
  ON public.settings FOR DELETE
  USING (public.is_admin());

-- 10. Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications (mark read)" ON public.notifications;
CREATE POLICY "Users update own notifications (mark read)"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. RETROACTIVE SYNC FOR EXISTING USERS
-- ------------------------------------------------------------------------------
-- Sync any real account created in auth.users before running this migration
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  'super_admin'
FROM auth.users
WHERE lower(trim(email)) = lower(trim(public.get_authorized_admin_email()))
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'super_admin',
  email = EXCLUDED.email,
  updated_at = now();

UPDATE public.profiles
SET role = 'super_admin'
WHERE lower(trim(email)) = lower(trim(public.get_authorized_admin_email()));

UPDATE public.profiles
SET role = 'customer'
WHERE lower(trim(email)) != lower(trim(public.get_authorized_admin_email()));

-- ------------------------------------------------------------------------------
-- 11. INITIAL SEED DATA (Valid Hexadecimal UUIDs only)
-- ------------------------------------------------------------------------------

-- Agency Settings
INSERT INTO public.settings (key, value)
VALUES (
  'agency_profile',
  '{
    "name": "VyapaarPro",
    "tagline": "High-Performance Digital Engineering for Modern Businesses",
    "email": "kumarsrijal732@gmail.com",
    "phone": "+91 98765 43210",
    "whatsapp": "+91 98765 43210",
    "address": "Indiranagar 100ft Road, Bangalore, Karnataka 560038",
    "description": "VyapaarPro provides digital solutions and services for individuals, creators, startups, shops, businesses, and organizations. We build bespoke business websites, custom web applications, mobile apps, e-commerce systems, and full-spectrum digital branding to help enterprises scale sustainably.",
    "footer_text": "© 2026 VyapaarPro. All rights reserved. Every client solution is custom-engineered and deployed independently.",
    "social": {
      "twitter": "",
      "linkedin": "",
      "github": "",
      "instagram": ""
    },
    "developer": {
      "name": "SRIJAL KUMAR",
      "role": "Founder & Developer, VyapaarPro",
      "location": "BIHAR, INDIA",
      "bio": "Founder and software developer behind VyapaarPro. Dedicated to building practical, accessible, and high-performance digital solutions for clients ranging from creators and local shops to growing startups and businesses. Focused on direct collaboration, clean architecture, and transparent milestone delivery.",
      "focus": [
        "Web Development",
        "Android / App Development",
        "UI/UX Design",
        "Digital Products",
        "Custom Software Solutions"
      ],
      "avatar_url": "",
      "github": "",
      "instagram": "",
      "linkedin": "",
      "twitter": ""
    },
    "legal": {
      "governing_jurisdiction": "[Jurisdiction of Bihar / India]",
      "effective_date": "January 1, 2026",
      "last_updated": "September 2026",
      "legal_notice": "Notice: This legal text is an operational policy template. Please review and customize according to your specific registered entity and local regulations before public enforcement."
    }
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Service Categories (Valid hex UUID prefix c0000000-...)
INSERT INTO public.service_categories (id, name, slug, description, display_order)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Websites', 'websites', 'High-converting, responsive and ultra-fast business and brand websites.', 1),
  ('c0000000-0000-0000-0000-000000000002', 'Apps & Web Apps', 'apps', 'Modern scalable progressive web apps, Android apps and SaaS platforms.', 2),
  ('c0000000-0000-0000-0000-000000000003', 'E-Commerce', 'e-commerce', 'Online shopping stores, payment-ready architectures and digital catalogues.', 3),
  ('c0000000-0000-0000-0000-000000000004', 'Design & Branding', 'design-branding', 'Bespoke UI/UX interface design, vector identity, logos and creative assets.', 4),
  ('c0000000-0000-0000-0000-000000000005', 'Marketing & Growth', 'marketing-growth', 'Strategic SEO, Google Business Profiles, social creatives and performance marketing.', 5),
  ('c0000000-0000-0000-0000-000000000006', 'Business Solutions', 'business-solutions', 'Interactive QR menus, digital catalogs, CRM setups and workflow automation.', 6),
  ('c0000000-0000-0000-0000-000000000007', 'Technical Services', 'technical-services', 'Domain/cloud deployment, database engineering, bug fixing and API integrations.', 7),
  ('c0000000-0000-0000-0000-000000000008', 'Custom Solutions', 'custom-solutions', 'End-to-end proprietary software, microservices and enterprise digital transformation.', 8)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Services (Valid hex UUID prefix a0000000-...)
INSERT INTO public.services (
  id, category_id, name, slug, short_description, description,
  pricing_model, price, currency, timeline, thumbnail_url, featured, published, demo_url, deliverables
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Custom Business Website',
    'business-website',
    'Modern, mobile-first responsive corporate website designed to convert visitors into loyal clients.',
    'We engineer fast, secure, search-engine-optimized business websites tailored to your exact industry. Includes responsive mobile design, custom typography, inquiry capture, analytics integration, and blazingly fast load speeds.',
    'STARTING_FROM',
    14999.00,
    'INR',
    '7 - 14 Days',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["5 to 10 Custom Web Pages", "Mobile & Tablet Fully Responsive", "Contact & Lead Generation Form", "On-page SEO Optimization", "Fast CDN & SSL Setup Assistance", "1 Month Free Post-Launch Support"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'Full-Featured E-Commerce Website',
    'ecommerce-website',
    'Scalable online store with product catalog, cart flows, inventory tracking, and discount engine.',
    'Turn your inventory into an automated 24/7 revenue driver. Complete storefront with product categories, customer accounts, order management, promo codes, and streamlined checkout experience.',
    'STARTING_FROM',
    29999.00,
    'INR',
    '14 - 25 Days',
    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Product & Category Management", "Shopping Cart & Wishlist", "Admin Order & Inventory Dashboard", "Customer Accounts & Order History", "Coupon & Discount Management", "Shipping & Tax Rule Setup"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'Custom Web Application / SaaS MVP',
    'custom-web-application',
    'High-performance full-stack web application with role-based auth, dashboards, and custom database.',
    'Bring your software idea or proprietary business workflow to life with modern React/TypeScript frontend and scalable PostgreSQL backend. Includes authentication, user management, and custom APIs.',
    'STARTING_FROM',
    49999.00,
    'INR',
    '3 - 6 Weeks',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Role-Based Authentication", "Interactive Dashboards & Data Tables", "Custom Database Schema & Migrations", "RESTful / Graph API Integrations", "Security & Access Controls", "Full Source Code & Deployment Guide"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'Android & PWA Mobile Application',
    'android-pwa-application',
    'Native-feel Android app or installable Progressive Web App with offline support and push alerts.',
    'Reach your users directly on their home screens without high maintenance friction. We build lightweight, snappy Android applications and PWAs customized for your business service.',
    'STARTING_FROM',
    34999.00,
    'INR',
    '2 - 4 Weeks',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    false,
    true,
    NULL,
    '["Android APK & Bundle Ready", "Offline Caching & Fast Loading", "Push Notification Architecture", "Responsive Mobile-First UI", "Play Store Submission Guidance"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000004',
    'UI/UX Design & Interactive Prototypes',
    'ui-ux-design',
    'Pixel-perfect Figma designs, user journeys, design systems, and clickable high-fidelity prototypes.',
    'Validate your concept before writing code. We create modern visual identities, clean UI component libraries, wireframes, and interactive prototypes tailored for desktop and mobile.',
    'FIXED',
    12499.00,
    'INR',
    '5 - 10 Days',
    'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Complete Figma Source Files", "Responsive Mobile & Desktop Frames", "Design System & Color Tokens", "Interactive Prototype", "Developer Handoff Specs"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000004',
    'Logo, Identity & Brand Kit',
    'logo-branding',
    'Distinctive logo marks, typography pairings, brand guidelines, and social media media kits.',
    'Make your company unforgettable. We develop coherent brand identities that communicate credibility, innovation, and trust across print, digital, and promotional media.',
    'FIXED',
    7999.00,
    'INR',
    '3 - 5 Days',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
    false,
    true,
    NULL,
    '["3 Original Logo Concepts", "Vector Formats (SVG, AI, EPS, PNG)", "Brand Style Guide & Font Rules", "Social Media Display Avatars", "Business Card & Letterhead Mockups"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000007',
    'Local SEO & Google Business Setup',
    'seo-google-business',
    'Dominate local Google searches, Google Maps ranking, keyword optimization, and review funnels.',
    'Get discovered by nearby customers ready to buy. We optimize your Google Business Profile, implement structured schema markup, and establish local search visibility.',
    'FIXED',
    9999.00,
    'INR',
    '5 - 7 Days',
    'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?auto=format&fit=crop&w=1200&q=80',
    false,
    true,
    NULL,
    '["Google Business Profile Verification & Optimization", "Geo-targeted Keyword Research", "Local Citation Building", "Google Maps Pin & Category Optimization", "Review Generation Strategy Guide"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000006',
    'Digital Menu & QR Business Catalog',
    'digital-menu-qr-solutions',
    'Instant contactless digital menus, product showcases, and dynamic QR table ordering systems.',
    'Perfect for restaurants, retail showrooms, manufacturers, and trade booths. Update items, prices, and photos instantly without reprinting physical brochures.',
    'STARTING_FROM',
    6499.00,
    'INR',
    '3 - 5 Days',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Mobile Web Digital Menu / Catalog", "Print-Ready Branded QR Code Placards", "Self-service Category & Pricing Admin", "Instant WhatsApp Order Trigger", "Fast Cloud Hosting Included"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000007',
    'Website Maintenance & Bug Fixing',
    'website-maintenance-bug-fixing',
    'Professional troubleshooting, speed optimization, malware removal, and continuous updates.',
    'Keep your mission-critical website operational, secure, and blazing fast. We diagnose errors, repair broken integrations, optimize database queries, and manage backups.',
    'STARTING_FROM',
    4999.00,
    'INR',
    '1 - 3 Days',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
    false,
    true,
    NULL,
    '["Root Cause Diagnostic Report", "Code & Script Error Resolution", "Performance & Core Web Vitals Boost", "Automated Daily Backups Setup", "SSL Certificate & Domain Health Audit"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000008',
    'Enterprise Custom Digital Transformation',
    'enterprise-custom-solutions',
    'Proprietary ERPs, inventory portals, multi-system API bridges, and high-load architectures.',
    'For complex business models requiring tailored software infrastructure. We work directly with your stakeholders to plan, architect, engineer, and deploy proprietary systems.',
    'CUSTOM_QUOTE',
    0.00,
    'INR',
    'Consultation Based',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Dedicated Architecture Consultation", "Technical Specification & Scope Doc", "Enterprise Scalable Cloud Stack", "Milestone-Driven Phased Delivery", "SLA & Dedicated Engineering Team"]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  pricing_model = EXCLUDED.pricing_model,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  timeline = EXCLUDED.timeline,
  thumbnail_url = EXCLUDED.thumbnail_url,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  demo_url = EXCLUDED.demo_url,
  deliverables = EXCLUDED.deliverables,
  updated_at = now();

-- Service Features (Valid hex UUID prefix f0000000-...)
INSERT INTO public.service_features (id, service_id, title, description, display_order)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'High-Converting Layout', 'Strategic landing sections crafted to guide leads directly to phone and WhatsApp consultations.', 1),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Lightning Fast Performance', 'Optimized assets, WebP images, clean HTML5 and 90+ Google PageSpeed score.', 2),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Mobile-First Responsiveness', 'Pristine layout on smartphones, tablets, laptops, and ultra-wide screens.', 3),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Enterprise Security & SSL', 'Hardened headers, HTTPS encryption, spam-protected inquiry forms.', 4),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Product Variations & SKUs', 'Manage colors, sizes, inventory levels, and custom product fields easily.', 1),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Cart & Order Tracking', 'Seamless cart flows with real-time order updates and customer receipt notifications.', 2),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'Discounts & Coupon Codes', 'Create percentage or flat discounts, promo banners, and scheduled sales.', 3),
  ('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'Secure Role-Based Access', 'Granular client, staff, and admin security permissions backed by PostgreSQL.', 1),
  ('f0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'Real-time Dashboards', 'Interactive charts, metrics, activity logs, and exportable CSV/PDF reports.', 2),
  ('f0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'Third-Party API Connections', 'Connect WhatsApp Business, SMS gateways, CRMs, and email providers smoothly.', 3)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Service FAQs (Valid hex UUID prefix e0000000-...)
INSERT INTO public.service_faqs (id, service_id, question, answer, display_order)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'How does the service request and payment process work?', 'After you click "Get Started" and submit your requirements, VyapaarPro contacts you via WhatsApp or phone within 4-12 hours. We review your scope, agree on deliverables, and handle invoice payments directly outside the website. No online checkout is needed.', 1),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Will I own the source code and domain name?', 'Yes, 100%. Once project milestones are completed and delivered, all custom source code, assets, and design files belong entirely to you.', 2),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Can I request additional custom features later?', 'Absolutely. VyapaarPro provides ongoing maintenance and iterative feature sprints as your business evolves.', 3),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Do you integrate offline or manual payments into the e-commerce store?', 'Yes, we can configure cash-on-delivery, bank transfer instructions, WhatsApp ordering, or your chosen payment provider during the development phase.', 1),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'What technology stack do you build custom web apps with?', 'We primarily leverage React, TypeScript, Next.js, Node.js, and PostgreSQL for unmatched stability, speed, and long-term maintainability.', 1)
ON CONFLICT (id) DO UPDATE
SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  display_order = EXCLUDED.display_order;

-- Portfolio Items (Valid hex UUID prefix b0000000-...)
INSERT INTO public.portfolio_items (
  id, title, slug, description, category, client_type, thumbnail_url, images, technologies, demo_url, published
) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'Apex Logistics & Freight Web Portal',
    'apex-logistics-portal',
    'Comprehensive corporate website and shipment quote engine for a pan-India freight aggregator. Increased qualified corporate leads by 180% within 60 days of rollout.',
    'Websites',
    'Supply Chain & B2B Logistics',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["React", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"]'::jsonb,
    NULL,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Kaveri Handlooms E-Commerce Store',
    'kaveri-handlooms-store',
    'Artisanal ethnic wear brand storefront featuring high-resolution swatch previews, currency switching, automated catalog management, and WhatsApp direct inquiries.',
    'E-Commerce',
    'D2C Fashion & Retail',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["React", "Tailwind CSS", "PostgreSQL", "Cloudflare CDN"]'::jsonb,
    NULL,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'PulseHealth Clinic SaaS & Patient Queue',
    'pulsehealth-clinic-saas',
    'Multi-doctor appointment scheduling, real-time token queue management, and digital prescription generation used daily across 14 diagnostic centers.',
    'Apps & Web Apps',
    'Healthcare & Diagnostics',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["React", "TypeScript", "PostgreSQL", "Tailwind CSS", "WebSockets"]'::jsonb,
    NULL,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'UrbanBites Restaurant QR Menu & Ordering',
    'urbanbites-qr-menu',
    'Dynamic bilingual contactless QR menu and kitchen display screen for a high-volume gastro-pub chain. Reduced order wait times by 35%.',
    'Business Solutions',
    'Hospitality & Dining',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Progressive Web App", "React", "Tailwind CSS", "QR Engine"]'::jsonb,
    NULL,
    true
  )
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  client_type = EXCLUDED.client_type,
  thumbnail_url = EXCLUDED.thumbnail_url,
  images = EXCLUDED.images,
  technologies = EXCLUDED.technologies,
  demo_url = EXCLUDED.demo_url,
  published = EXCLUDED.published;

-- ------------------------------------------------------------------------------
-- 12. RATE LIMITING & SPAM PROTECTION (DISTRIBUTED PRODUCTION-GRADE)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.rate_limits(expires_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_expires_at TIMESTAMPTZ;
  v_count INT;
  v_window_start TIMESTAMPTZ;
  v_retry_after INT := 0;
  v_allowed BOOLEAN := true;
BEGIN
  IF (random() < 0.1) THEN
    DELETE FROM public.rate_limits WHERE expires_at < (v_now - INTERVAL '1 hour');
  END IF;

  SELECT count, window_start, expires_at
  INTO v_count, v_window_start, v_expires_at
  FROM public.rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    v_expires_at := v_now + (p_window_seconds || ' seconds')::interval;
    INSERT INTO public.rate_limits (key, count, window_start, expires_at)
    VALUES (p_key, 1, v_now, v_expires_at);

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'retry_after', 0,
      'reset_at', v_expires_at
    );
  END IF;

  IF v_now >= v_expires_at THEN
    v_expires_at := v_now + (p_window_seconds || ' seconds')::interval;
    UPDATE public.rate_limits
    SET count = 1, window_start = v_now, expires_at = v_expires_at
    WHERE key = p_key;

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'retry_after', 0,
      'reset_at', v_expires_at
    );
  END IF;

  IF v_count >= p_max_requests THEN
    v_allowed := false;
    v_retry_after := GREATEST(1, EXTRACT(EPOCH FROM (v_expires_at - v_now))::INT);

    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after', v_retry_after,
      'reset_at', v_expires_at
    );
  ELSE
    UPDATE public.rate_limits
    SET count = count + 1
    WHERE key = p_key;

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - (v_count + 1),
      'retry_after', 0,
      'reset_at', v_expires_at
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, INT, INT) TO anon, authenticated, service_role;

-- Triggers for input sanitization and length validation
CREATE OR REPLACE FUNCTION public.validate_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name := trim(NEW.name);
  NEW.email := lower(trim(NEW.email));
  NEW.subject := trim(NEW.subject);
  NEW.message := trim(NEW.message);

  IF length(NEW.name) < 2 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;

  IF length(NEW.email) < 5 OR NEW.email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Invalid email address format';
  END IF;

  IF length(NEW.subject) < 2 OR length(NEW.subject) > 250 THEN
    RAISE EXCEPTION 'Subject must be between 2 and 250 characters';
  END IF;

  IF length(NEW.message) < 5 OR length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Message must be between 5 and 5000 characters';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_contact_message ON public.contact_messages;
CREATE TRIGGER trg_validate_contact_message
  BEFORE INSERT OR UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message();

CREATE OR REPLACE FUNCTION public.validate_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.client_name := trim(NEW.client_name);
  NEW.client_email := lower(trim(NEW.client_email));
  NEW.client_phone := trim(NEW.client_phone);
  NEW.requirements := trim(NEW.requirements);

  IF length(NEW.client_name) < 2 OR length(NEW.client_name) > 100 THEN
    RAISE EXCEPTION 'Client name must be between 2 and 100 characters';
  END IF;

  IF length(NEW.client_email) < 5 OR NEW.client_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Invalid client email address format';
  END IF;

  IF length(NEW.client_phone) < 6 OR length(NEW.client_phone) > 30 THEN
    RAISE EXCEPTION 'Client phone number must be between 6 and 30 characters';
  END IF;

  IF length(NEW.requirements) < 5 OR length(NEW.requirements) > 5000 THEN
    RAISE EXCEPTION 'Requirements description must be between 5 and 5000 characters';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_service_request ON public.service_requests;
CREATE TRIGGER trg_validate_service_request
  BEFORE INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_request();

