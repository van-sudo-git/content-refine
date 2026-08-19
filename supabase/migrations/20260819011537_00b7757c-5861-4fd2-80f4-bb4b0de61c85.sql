-- 1. Tighten EXECUTE on the 5 pre-existing private helper functions
REVOKE ALL ON FUNCTION private.can_read_nomination(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_club_role(uuid, uuid, public.club_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_any_school_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_global_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_school_admin(text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.can_read_nomination(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_club_role(uuid, uuid, public.club_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_any_school_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_global_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_school_admin(text, uuid) TO authenticated;

-- 2. Let assigned journalists read their own (including unpublished) profiles
DROP POLICY IF EXISTS "Journalists can view their assigned profiles" ON public.profiles;
CREATE POLICY "Journalists can view their assigned profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (private.is_profile_journalist(id, auth.uid()));