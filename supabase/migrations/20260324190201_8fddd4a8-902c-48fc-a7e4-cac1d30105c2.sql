
-- QR code redirects table (maps short IDs to profile slugs)
CREATE TABLE public.redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug text NOT NULL,
  destination_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage redirects" ON public.redirects
  FOR ALL TO authenticated
  USING (public.is_any_school_admin(auth.jwt() ->> 'email'))
  WITH CHECK (public.is_any_school_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Active redirects are public" ON public.redirects
  FOR SELECT TO public
  USING (active = true);

-- Daily QR scan counts
CREATE TABLE public.redirect_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  redirect_id uuid NOT NULL REFERENCES public.redirects(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  hits integer NOT NULL DEFAULT 1,
  UNIQUE(redirect_id, day)
);

ALTER TABLE public.redirect_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view redirect analytics" ON public.redirect_daily
  FOR SELECT TO authenticated
  USING (public.is_any_school_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Anyone can insert redirect analytics" ON public.redirect_daily
  FOR INSERT TO public
  WITH CHECK (true);

-- RPC to increment daily redirect count
CREATE OR REPLACE FUNCTION public.increment_redirect_daily(p_id uuid, p_day date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.redirect_daily (redirect_id, day, hits)
  VALUES (p_id, p_day, 1)
  ON CONFLICT (redirect_id, day)
  DO UPDATE SET hits = redirect_daily.hits + 1;
END;
$$;

-- Page views table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_slug text NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  views integer NOT NULL DEFAULT 1,
  UNIQUE(profile_slug, day)
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view page analytics" ON public.page_views
  FOR SELECT TO authenticated
  USING (public.is_any_school_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT TO public
  WITH CHECK (true);

-- RPC to increment daily page view count
CREATE OR REPLACE FUNCTION public.increment_page_view(p_slug text, p_day date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.page_views (profile_slug, day, views)
  VALUES (p_slug, p_day, 1)
  ON CONFLICT (profile_slug, day)
  DO UPDATE SET views = page_views.views + 1;
END;
$$;
