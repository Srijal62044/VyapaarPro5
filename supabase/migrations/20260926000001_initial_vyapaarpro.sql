-- ==============================================================================
-- VyapaarPro - Initial Database Schema & Row Level Security (RLS)
-- Migration: 20260926000001_initial_vyapaarpro.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES & ROLES
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

-- Index for role lookup & email
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger to automatically create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

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
-- 5. SERVICE REQUESTS (LEADS / QUOTE INQUIRIES)
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

-- Request attachments / files
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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Customer cannot elevate their own role
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR public.is_super_admin()
    )
  );

CREATE POLICY "Admins can view and update profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Service Categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published service categories"
  ON public.service_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins manage service categories"
  ON public.service_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published services"
  ON public.services FOR SELECT
  USING (published = true OR public.is_admin());

CREATE POLICY "Admins manage all services"
  ON public.services FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Service Features & FAQs
ALTER TABLE public.service_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read service features"
  ON public.service_features FOR SELECT
  USING (true);
CREATE POLICY "Admins manage service features"
  ON public.service_features FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read service faqs"
  ON public.service_faqs FOR SELECT
  USING (true);
CREATE POLICY "Admins manage service faqs"
  ON public.service_faqs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Service Requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (guests or logged-in clients) can insert a new request
CREATE POLICY "Allow guests and users to create service requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Clients can only see their own requests; admins can see all
CREATE POLICY "Clients read own requests; Admins read all"
  ON public.service_requests FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR public.is_admin()
  );

-- Admins can update/manage requests
CREATE POLICY "Admins manage service requests"
  ON public.service_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete service requests"
  ON public.service_requests FOR DELETE
  USING (public.is_admin());

-- Service Request Files
ALTER TABLE public.service_request_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients read own request files; Admins read all"
  ON public.service_request_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = service_request_files.request_id
      AND (sr.user_id = auth.uid() OR public.is_admin())
    )
  );

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

CREATE POLICY "Clients view own projects; Admins view all"
  ON public.projects FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND client_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Admins manage projects"
  ON public.projects FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Milestones, Updates, Deliverables
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view milestones for own projects; Admins manage"
  ON public.project_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_milestones.project_id
      AND (p.client_id = auth.uid() OR public.is_admin())
    )
  );
CREATE POLICY "Admins manage milestones"
  ON public.project_milestones FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view updates for own projects; Admins manage"
  ON public.project_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_updates.project_id
      AND (p.client_id = auth.uid() OR public.is_admin())
    )
  );
CREATE POLICY "Admins manage updates"
  ON public.project_updates FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view deliverables for own projects; Admins manage"
  ON public.project_deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_deliverables.project_id
      AND (p.client_id = auth.uid() OR public.is_admin())
    )
  );
CREATE POLICY "Admins manage deliverables"
  ON public.project_deliverables FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Portfolio Items
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (published = true OR public.is_admin());

CREATE POLICY "Admins manage portfolio"
  ON public.portfolio_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Contact Messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view and manage contact messages"
  ON public.contact_messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agency settings"
  ON public.settings FOR SELECT
  USING (true);

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

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications (mark read)"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
