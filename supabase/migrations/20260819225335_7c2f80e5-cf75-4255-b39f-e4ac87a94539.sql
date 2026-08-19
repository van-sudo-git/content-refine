REVOKE ALL ON FUNCTION public.link_nomination_assets_to_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_nomination_assets_to_profile() FROM anon;
REVOKE ALL ON FUNCTION public.link_nomination_assets_to_profile() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.link_nomination_assets_to_profile() TO service_role;
