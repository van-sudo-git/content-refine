-- Align historical website view totals with production analytics data.
-- This backfills site-wide page views into page_views using the existing 'home' bucket
-- so the admin dashboard can show complete historical traffic instead of only
-- profile-page client-side counter data.
INSERT INTO public.page_views (profile_slug, day, views)
VALUES
  ('home', DATE '2026-03-18', 30),
  ('home', DATE '2026-03-19', 1),
  ('home', DATE '2026-03-20', 393),
  ('home', DATE '2026-03-21', 128),
  ('home', DATE '2026-03-22', 2),
  ('home', DATE '2026-03-23', 15),
  ('home', DATE '2026-03-24', 90),
  ('home', DATE '2026-03-25', 7),
  ('home', DATE '2026-03-26', 7),
  ('home', DATE '2026-03-27', 94),
  ('home', DATE '2026-03-28', 10),
  ('home', DATE '2026-03-29', 7),
  ('home', DATE '2026-03-30', 8),
  ('home', DATE '2026-04-01', 2),
  ('home', DATE '2026-04-03', 11),
  ('home', DATE '2026-04-04', 8),
  ('home', DATE '2026-04-05', 6),
  ('home', DATE '2026-04-06', 9),
  ('home', DATE '2026-04-07', 15),
  ('home', DATE '2026-04-08', 24),
  ('home', DATE '2026-04-09', 1),
  ('home', DATE '2026-04-10', 11),
  ('home', DATE '2026-04-12', 3),
  ('home', DATE '2026-04-14', 2),
  ('home', DATE '2026-04-16', 1),
  ('home', DATE '2026-04-18', 1),
  ('home', DATE '2026-04-19', 2),
  ('home', DATE '2026-04-20', 6),
  ('home', DATE '2026-04-21', 4),
  ('home', DATE '2026-04-22', 11),
  ('home', DATE '2026-04-23', 45),
  ('home', DATE '2026-04-25', 13),
  ('home', DATE '2026-04-26', 2),
  ('home', DATE '2026-04-27', 9),
  ('home', DATE '2026-04-28', 5),
  ('home', DATE '2026-04-29', 1),
  ('home', DATE '2026-04-30', 1),
  ('home', DATE '2026-05-01', 1),
  ('home', DATE '2026-05-02', 42),
  ('home', DATE '2026-05-03', 3),
  ('home', DATE '2026-05-04', 11),
  ('home', DATE '2026-05-05', 3)
ON CONFLICT (profile_slug, day)
DO UPDATE SET views = EXCLUDED.views;

CREATE OR REPLACE FUNCTION public.get_production_pageview_total()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(views), 0)::integer
  FROM public.page_views;
$$;