
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.is_school_admin(_email text, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.school_admins WHERE email = lower(_email) AND school_id = _school_id) $$;

CREATE OR REPLACE FUNCTION private.is_any_school_admin(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.school_admins WHERE email = lower(_email)) $$;

-- Recreate all dependent policies to reference the private helpers
-- appreciations
DROP POLICY IF EXISTS "Admins can delete appreciations" ON public.appreciations;
DROP POLICY IF EXISTS "Admins can view all appreciations" ON public.appreciations;
DROP POLICY IF EXISTS "Anyone can submit appreciations" ON public.appreciations;
CREATE POLICY "Admins can delete appreciations" ON public.appreciations FOR DELETE TO authenticated
  USING (private.is_any_school_admin((auth.jwt() ->> 'email')));
CREATE POLICY "Admins can view all appreciations" ON public.appreciations FOR SELECT TO authenticated
  USING (private.is_any_school_admin((auth.jwt() ->> 'email')));

-- page_views
DROP POLICY IF EXISTS "Admins can view page analytics" ON public.page_views;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Admins can view page analytics" ON public.page_views FOR SELECT TO authenticated
  USING (private.is_any_school_admin((auth.jwt() ->> 'email')));

-- profiles
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (private.is_any_school_admin((auth.jwt() ->> 'email')))
  WITH CHECK (private.is_any_school_admin((auth.jwt() ->> 'email')));

-- profile_images
DROP POLICY IF EXISTS "Admins can manage profile images" ON public.profile_images;
CREATE POLICY "Admins can manage profile images" ON public.profile_images FOR ALL TO authenticated
  USING (private.is_any_school_admin((auth.jwt() ->> 'email')))
  WITH CHECK (private.is_any_school_admin((auth.jwt() ->> 'email')));

-- redirects
DROP POLICY IF EXISTS "Admins can manage redirects" ON public.redirects;
DROP POLICY IF EXISTS "Redirects are public read" ON public.redirects;
CREATE POLICY "Admins can manage redirects" ON public.redirects FOR ALL TO authenticated
  USING (private.is_any_school_admin((auth.jwt() ->> 'email')))
  WITH CHECK (private.is_any_school_admin((auth.jwt() ->> 'email')));
CREATE POLICY "Active redirects are public read" ON public.redirects FOR SELECT TO anon, authenticated
  USING (active = true);

-- redirect_events_daily
DROP POLICY IF EXISTS "Redirect events insert" ON public.redirect_events_daily;
DROP POLICY IF EXISTS "Redirect events public read" ON public.redirect_events_daily;
CREATE POLICY "Admins can view redirect analytics" ON public.redirect_events_daily FOR SELECT TO authenticated
  USING (private.is_any_school_admin((auth.jwt() ->> 'email')));

-- school_admins
DROP POLICY IF EXISTS "Admins can add admins to their school" ON public.school_admins;
DROP POLICY IF EXISTS "Admins can remove admins from their school" ON public.school_admins;
DROP POLICY IF EXISTS "Admins can view their school admins" ON public.school_admins;
CREATE POLICY "Admins can add admins to their school" ON public.school_admins FOR INSERT TO authenticated
  WITH CHECK (private.is_school_admin((auth.jwt() ->> 'email'), school_id));
CREATE POLICY "Admins can remove admins from their school" ON public.school_admins FOR DELETE TO authenticated
  USING (private.is_school_admin((auth.jwt() ->> 'email'), school_id));
CREATE POLICY "Admins can view their school admins" ON public.school_admins FOR SELECT TO authenticated
  USING (private.is_school_admin((auth.jwt() ->> 'email'), school_id));

-- nominations
DROP POLICY IF EXISTS "Admins can update their school nominations" ON public.nominations;
DROP POLICY IF EXISTS "Admins can view their school nominations" ON public.nominations;
CREATE POLICY "Admins can update their school nominations" ON public.nominations FOR UPDATE TO authenticated
  USING (private.is_school_admin((auth.jwt() ->> 'email'), school_id));
CREATE POLICY "Admins can view their school nominations" ON public.nominations FOR SELECT TO authenticated
  USING (private.is_school_admin((auth.jwt() ->> 'email'), school_id));

-- storage.objects policies for profile-images
DROP POLICY IF EXISTS "Admins can delete profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
CREATE POLICY "Admins can delete profile images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-images' AND private.is_any_school_admin((auth.jwt() ->> 'email')));
CREATE POLICY "Admins can upload profile images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND private.is_any_school_admin((auth.jwt() ->> 'email')));
-- No public SELECT policy: bucket is public so files stay reachable by URL, but listing is blocked.

-- Drop public helpers now safe
DROP FUNCTION IF EXISTS public.is_school_admin(text, uuid);
DROP FUNCTION IF EXISTS public.is_any_school_admin(text);

-- Public wrapper for signed-in admin check
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.school_admins WHERE email = lower((auth.jwt() ->> 'email'))) $$;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;

-- Restrict other SECURITY DEFINER helpers to service_role only
REVOKE ALL ON FUNCTION public.increment_page_view(text, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_page_view(text, date) TO service_role;
REVOKE ALL ON FUNCTION public.increment_redirect_daily(text, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_redirect_daily(text, date) TO service_role;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Nomination validation trigger
CREATE OR REPLACE FUNCTION private.validate_nomination()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.nominator_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  IF length(NEW.nominator_email) > 254 THEN RAISE EXCEPTION 'Email too long'; END IF;
  IF length(NEW.nominator_name) < 1 OR length(NEW.nominator_name) > 120 THEN RAISE EXCEPTION 'Nominator name length invalid'; END IF;
  IF length(NEW.nominee_name) < 1 OR length(NEW.nominee_name) > 120 THEN RAISE EXCEPTION 'Nominee name length invalid'; END IF;
  IF length(NEW.nominee_role) > 120 THEN RAISE EXCEPTION 'Nominee role too long'; END IF;
  IF length(NEW.nominee_department) > 160 THEN RAISE EXCEPTION 'Nominee department too long'; END IF;
  IF length(NEW.reason) < 1 OR length(NEW.reason) > 4000 THEN RAISE EXCEPTION 'Reason length invalid'; END IF;
  NEW.status := 'pending';
  NEW.nominee_informed := false;
  NEW.admin_notes := NULL;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_nomination ON public.nominations;
CREATE TRIGGER trg_validate_nomination BEFORE INSERT ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION private.validate_nomination();
