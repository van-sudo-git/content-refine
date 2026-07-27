-- Global admin support for multi-school onboarding
-- Evaan's emails get is_global_admin = true; everyone else defaults to false.

ALTER TABLE public.school_admins
ADD COLUMN IF NOT EXISTS is_global_admin boolean NOT NULL DEFAULT false;

UPDATE public.school_admins
SET is_global_admin = true
WHERE email IN ('evaanahlawat@gmail.com', '1061967@lwsd.org');

-- Helper: true when the signed-in user is a global admin
CREATE OR REPLACE FUNCTION private.is_global_admin(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.school_admins
    WHERE email = lower(_email)
      AND is_global_admin = true
  )
$$;

-- Global admins can onboard new schools
DROP POLICY IF EXISTS "Global admins can create schools" ON public.schools;
CREATE POLICY "Global admins can create schools"
  ON public.schools
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_global_admin((auth.jwt() ->> 'email')));

-- Global admins can assign the first admin (or any admin) to any school
DROP POLICY IF EXISTS "Global admins can add admins to any school" ON public.school_admins;
CREATE POLICY "Global admins can add admins to any school"
  ON public.school_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_global_admin((auth.jwt() ->> 'email')));

-- Global admins can manage any school's admin list and nominations from the dashboard
DROP POLICY IF EXISTS "Global admins can view all school admins" ON public.school_admins;
CREATE POLICY "Global admins can view all school admins"
  ON public.school_admins
  FOR SELECT
  TO authenticated
  USING (private.is_global_admin((auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Global admins can remove admins from any school" ON public.school_admins;
CREATE POLICY "Global admins can remove admins from any school"
  ON public.school_admins
  FOR DELETE
  TO authenticated
  USING (private.is_global_admin((auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Global admins can view all nominations" ON public.nominations;
CREATE POLICY "Global admins can view all nominations"
  ON public.nominations
  FOR SELECT
  TO authenticated
  USING (private.is_global_admin((auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Global admins can update all nominations" ON public.nominations;
CREATE POLICY "Global admins can update all nominations"
  ON public.nominations
  FOR UPDATE
  TO authenticated
  USING (private.is_global_admin((auth.jwt() ->> 'email')));
