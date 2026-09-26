-- ==============================================================================
-- VyapaarPro - Authorized Single Admin Email Security Migration
-- Migration: 20260926000003_admin_email_security.sql
-- ==============================================================================

-- 1. Create a secure configuration constant function for the authorized admin email
CREATE OR REPLACE FUNCTION public.get_authorized_admin_email()
RETURNS TEXT AS $$
BEGIN
  -- Single authorized administrator email for VyapaarPro
  RETURN 'kumarsrijal732@gmail.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 2. Update is_admin() helper function:
-- Checks authenticated JWT email OR public.profiles record
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

-- 3. Update is_super_admin() helper function
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

-- 4. Secure the new user signup trigger:
-- Only kumarsrijal732@gmail.com can receive the admin/super_admin role.
-- All other accounts are strictly defaulted to 'customer'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  IF lower(trim(NEW.email)) = lower(trim(public.get_authorized_admin_email())) THEN
    assigned_role := 'super_admin';
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = assigned_role,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to prevent role escalation on profiles update:
-- Any attempt to assign 'admin' or 'super_admin' to non-authorized emails is rejected.
CREATE OR REPLACE FUNCTION public.enforce_authorized_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('admin', 'super_admin') AND lower(trim(NEW.email)) != lower(trim(public.get_authorized_admin_email())) THEN
    -- Force reset to customer role
    NEW.role := 'customer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_admin_role ON public.profiles;
CREATE TRIGGER trg_enforce_admin_role
  BEFORE INSERT OR UPDATE OF role, email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_authorized_admin_role();

-- 6. Retroactively synchronize existing accounts in auth.users & public.profiles:
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

-- 7. Ensure Settings Table RLS Policies explicitly support Upsert for authorized admin
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
