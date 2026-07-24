DROP POLICY IF EXISTS "Global admins can create schools" ON public.schools;
CREATE POLICY "Global admins can create schools"
  ON public.schools
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_global_admin((auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Global admins can add admins to any school" ON public.school_admins;
CREATE POLICY "Global admins can add admins to any school"
  ON public.school_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_global_admin((auth.jwt() ->> 'email')));