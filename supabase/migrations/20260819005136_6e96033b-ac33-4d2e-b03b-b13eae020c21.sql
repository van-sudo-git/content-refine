REVOKE EXECUTE ON FUNCTION private.is_profile_journalist(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_profile_journalist(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.is_profile_journalist(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION private.is_publish_transition(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.is_publish_transition(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION private.is_publish_transition(uuid, text) TO authenticated;