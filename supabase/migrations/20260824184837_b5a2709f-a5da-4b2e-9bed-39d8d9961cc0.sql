-- 1. Helper: is this user the assigned journalist for this nomination + school?
CREATE OR REPLACE FUNCTION private.can_journalist_create_profile(_nomination_id uuid, _school_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    JOIN public.club_roles cr ON cr.id = n.journalist_id
    WHERE n.id = _nomination_id
      AND cr.user_id = _user_id
      AND cr.role = 'journalist'::club_role
      AND cr.school_id = n.school_id
      AND n.school_id = _school_id
  );
$$;

REVOKE ALL ON FUNCTION private.can_journalist_create_profile(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_journalist_create_profile(uuid, uuid, uuid) TO authenticated;

-- Narrow INSERT policy for assigned journalists
DROP POLICY IF EXISTS "Journalists can create their assigned draft profile" ON public.profiles;
CREATE POLICY "Journalists can create their assigned draft profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  nomination_id IS NOT NULL
  AND status = 'draft'
  AND school_id IS NOT NULL
  AND private.can_journalist_create_profile(nomination_id, school_id, auth.uid())
);

GRANT INSERT ON public.profiles TO authenticated;

-- 2. Auto-advance nomination to in_progress on first linked draft profile
CREATE OR REPLACE FUNCTION public.advance_nomination_on_draft_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.nomination_id IS NOT NULL AND NEW.status = 'draft' THEN
    UPDATE public.nominations
       SET status = 'in_progress'::public.nomination_status,
           updated_at = now()
     WHERE id = NEW.nomination_id
       AND status IN ('approved'::public.nomination_status, 'assigned'::public.nomination_status);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_nomination_on_draft_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_nomination_on_draft_profile() TO service_role;

DROP TRIGGER IF EXISTS profiles_advance_nomination_in_progress ON public.profiles;
CREATE TRIGGER profiles_advance_nomination_in_progress
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.advance_nomination_on_draft_profile();
