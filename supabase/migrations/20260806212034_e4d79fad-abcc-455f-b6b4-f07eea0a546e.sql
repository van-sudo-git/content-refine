CREATE OR REPLACE FUNCTION public.claim_club_role_invites()
RETURNS TABLE(id uuid, school_id uuid, role public.club_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF uid IS NULL OR uemail = '' THEN
    RETURN;
  END IF;

  UPDATE public.club_roles cr
     SET user_id = uid,
         updated_at = now()
   WHERE cr.user_id IS NULL
     AND cr.email IS NOT NULL
     AND lower(cr.email) = uemail
     AND NOT EXISTS (
       SELECT 1 FROM public.club_roles other
        WHERE other.user_id = uid
          AND other.school_id = cr.school_id
          AND other.role = cr.role
     );

  RETURN QUERY
    SELECT cr.id, cr.school_id, cr.role
      FROM public.club_roles cr
     WHERE cr.user_id = uid
        OR (cr.email IS NOT NULL AND lower(cr.email) = uemail);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_club_role_invites() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_club_role_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_club_role_invites() TO service_role;