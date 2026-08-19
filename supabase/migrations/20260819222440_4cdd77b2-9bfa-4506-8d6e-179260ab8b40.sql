GRANT UPDATE ON public.school_admins TO authenticated;

CREATE POLICY "Admins can update admins in their school"
ON public.school_admins
FOR UPDATE
TO authenticated
USING (private.is_school_admin((auth.jwt() ->> 'email'::text), school_id))
WITH CHECK (private.is_school_admin((auth.jwt() ->> 'email'::text), school_id));

CREATE POLICY "Global admins can update admins in any school"
ON public.school_admins
FOR UPDATE
TO authenticated
USING (private.is_global_admin((auth.jwt() ->> 'email'::text)))
WITH CHECK (private.is_global_admin((auth.jwt() ->> 'email'::text)));