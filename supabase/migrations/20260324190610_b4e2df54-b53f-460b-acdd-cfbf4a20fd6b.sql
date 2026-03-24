
-- Remove duplicate tables that belong in the heros-redirect project
DROP FUNCTION IF EXISTS public.increment_redirect_daily(uuid, date);
DROP TABLE IF EXISTS public.redirect_daily;
DROP TABLE IF EXISTS public.redirects;
