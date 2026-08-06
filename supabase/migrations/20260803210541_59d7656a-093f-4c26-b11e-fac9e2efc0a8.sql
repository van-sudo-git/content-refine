CREATE POLICY "Admins can delete their school nominations"
ON public.nominations
FOR DELETE
TO authenticated
USING (private.is_school_admin((auth.jwt() ->> 'email'::text), school_id));

CREATE POLICY "Global admins can delete all nominations"
ON public.nominations
FOR DELETE
TO authenticated
USING (private.is_global_admin((auth.jwt() ->> 'email'::text)));

GRANT DELETE ON public.nominations TO authenticated;