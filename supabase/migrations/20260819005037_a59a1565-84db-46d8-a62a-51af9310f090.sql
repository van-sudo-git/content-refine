-- Helper: is the user the assigned journalist for a given profile (linked through its nomination)?
CREATE OR REPLACE FUNCTION private.is_profile_journalist(_profile_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.nominations n ON n.id = p.nomination_id
    JOIN public.club_roles cr ON cr.id = n.journalist_id
    WHERE p.id = _profile_id
      AND cr.user_id = _user_id
      AND cr.role = 'journalist'::club_role
  );
$$;

-- Helper: is this update a transition INTO 'published'?
-- Reads the pre-update status. SECURITY DEFINER + WITH CHECK runs before the new
-- tuple is written, so the subquery returns the OLD status of the row.
CREATE OR REPLACE FUNCTION private.is_publish_transition(_profile_id uuid, _new_status text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _profile_id
      AND p.status IS DISTINCT FROM 'published'
  ) AND _new_status = 'published';
$$;

-- Replace any prior version, then (re)create with the corrected logic.
DROP POLICY IF EXISTS "Journalists can update their assigned profiles" ON public.profiles;

CREATE POLICY "Journalists can update their assigned profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (private.is_profile_journalist(id, auth.uid()))
WITH CHECK (
  private.is_profile_journalist(id, auth.uid())
  AND NOT private.is_publish_transition(id, status)
);