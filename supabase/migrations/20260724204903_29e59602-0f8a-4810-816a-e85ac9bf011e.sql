CREATE OR REPLACE FUNCTION private.is_global_admin(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_admins
    WHERE email = lower(_email) AND is_global_admin = true
  );
$$;

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

DROP POLICY IF EXISTS "Global admins can add admins to any school" ON public.school_admins;
CREATE POLICY "Global admins can add admins to any school"
  ON public.school_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_global_admin((auth.jwt() ->> 'email')));

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
  USING (private.is_global_admin((auth.jwt() ->> 'email')))
  WITH CHECK (private.is_global_admin((auth.jwt() ->> 'email')));