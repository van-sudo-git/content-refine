ALTER TABLE public.schools ADD COLUMN accepting_nominations boolean NOT NULL DEFAULT false;

UPDATE public.schools SET accepting_nominations = true WHERE name = 'Lake Washington High School';

-- Column-scoped update privilege: only this one setting is updatable by admins.
GRANT UPDATE (accepting_nominations) ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;

CREATE POLICY "School admins can update their school nomination setting"
ON public.schools
FOR UPDATE
TO authenticated
USING (private.is_school_admin((auth.jwt() ->> 'email'::text), id))
WITH CHECK (private.is_school_admin((auth.jwt() ->> 'email'::text), id));

CREATE POLICY "Global admins can update any school nomination setting"
ON public.schools
FOR UPDATE
TO authenticated
USING (private.is_global_admin((auth.jwt() ->> 'email'::text)))
WITH CHECK (private.is_global_admin((auth.jwt() ->> 'email'::text)));