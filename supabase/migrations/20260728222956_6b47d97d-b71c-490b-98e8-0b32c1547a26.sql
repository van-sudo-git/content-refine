
REVOKE EXECUTE ON FUNCTION public.notify_nomination_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_nomination_status_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_nomination_status_change() FROM authenticated;
