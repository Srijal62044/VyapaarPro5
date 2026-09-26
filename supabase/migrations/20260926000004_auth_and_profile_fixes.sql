-- ==============================================================================
-- VyapaarPro - Authentication & Profile Synchronization Fixes
-- Migration: 20260926000004_auth_and_profile_fixes.sql
-- ==============================================================================

-- 1. Ensure public.profiles table exists with all required columns
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

-- 2. Authorized admin email configuration
CREATE OR REPLACE FUNCTION public.get_authorized_admin_email()
RETURNS TEXT AS $$
BEGIN
  RETURN 'kumarsrijal732@gmail.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 3. Helper functions for role checking
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

-- 4. Robust Auth Trigger to automatically create profile on signup
-- Uses SECURITY DEFINER and SET search_path = public to bypass RLS safely
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
  -- Strict single authorized admin check
  IF lower(trim(COALESCE(NEW.email, ''))) = lower(trim(public.get_authorized_admin_email())) THEN
    v_assigned_role := 'super_admin';
  ELSE
    v_assigned_role := 'customer';
  END IF;

  -- Extract user metadata
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

-- Drop and recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Role Escalation Protection Trigger
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

-- 6. Ensure profile RPC function for client-side idempotent verification
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

-- 7. Configure Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own profile matching auth.uid()
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to read own profile or admins to read all
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Allow users to update their own profile (with role escalation safeguard)
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

-- Admins can manage all profiles
DROP POLICY IF EXISTS "Admins can view and update profiles" ON public.profiles;
CREATE POLICY "Admins can view and update profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Retroactively sync any existing users in auth.users missing in public.profiles
INSERT INTO public.profiles (id, email, full_name, phone, company_name, role)
SELECT 
  u.id, 
  COALESCE(u.email, ''), 
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'phone',
  u.raw_user_meta_data->>'company_name',
  CASE 
    WHEN lower(trim(COALESCE(u.email, ''))) = lower(trim(public.get_authorized_admin_email())) THEN 'super_admin'
    ELSE 'customer'
  END
FROM auth.users u
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
  role = EXCLUDED.role,
  updated_at = now();
