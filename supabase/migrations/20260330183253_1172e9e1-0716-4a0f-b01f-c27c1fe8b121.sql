
-- Redirects table: stores QR redirect entries linked to profiles
CREATE TABLE public.redirects (
  id text PRIMARY KEY,
  profile_slug text NOT NULL,
  destination_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redirects are public read" ON public.redirects
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage redirects" ON public.redirects
  FOR ALL TO authenticated
  USING (is_any_school_admin((auth.jwt() ->> 'email'::text)))
  WITH CHECK (is_any_school_admin((auth.jwt() ->> 'email'::text)));

-- Daily scan counts
CREATE TABLE public.redirect_events_daily (
  id text NOT NULL REFERENCES public.redirects(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (id, day)
);

ALTER TABLE public.redirect_events_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redirect events public read" ON public.redirect_events_daily
  FOR SELECT TO public USING (true);

CREATE POLICY "Redirect events insert" ON public.redirect_events_daily
  FOR INSERT TO public WITH CHECK (true);

-- Increment function for the edge function
CREATE OR REPLACE FUNCTION public.increment_redirect_daily(p_id text, p_day date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.redirect_events_daily (id, day, count)
  VALUES (p_id, p_day, 1)
  ON CONFLICT (id, day)
  DO UPDATE SET count = redirect_events_daily.count + 1;
END;
$$;
