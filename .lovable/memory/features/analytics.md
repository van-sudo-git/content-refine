Analytics system for QR code tracking, page views, and appreciation stats.

## Tables (this project)
- `page_views`: daily view counts per profile_slug (unique on profile_slug + day)
- `appreciations`: messages with status (approved/pending/rejected)

## External Data (heros-redirect project)
- Supabase URL: https://iqywlsxdxhhduvbhotwx.supabase.co
- Client: src/lib/herosRedirectClient.ts (uses publishable anon key)
- `redirects` table: columns `id` (text, e.g. "brad"), `destination_url`, `active`
- `redirect_events_daily` table: columns `id` (redirect id), `day`, `count`
- QR ID to slug mapping in AdminAnalytics.tsx: { brad: "brad-fisher", bradflyer: "brad-fisher" }
- Other QR IDs: "about", "whoami", "gallery" (not profile-specific)

## RPC Functions (this project)
- `increment_page_view(p_slug text, p_day date)`: upserts daily page view count

## Frontend
- `ProfilePage.tsx`: fires `increment_page_view` on load (fire-and-forget)
- `AdminAnalytics.tsx`: Analytics tab showing summary cards, 30-day bar chart, per-profile breakdown
- Admin.tsx: has 4 tabs — Nominations, Profiles, Admins, Analytics

## Important
- When adding new profiles with QR codes, update QR_ID_TO_SLUG map in AdminAnalytics.tsx
- QR codes point to heros-redirect Vercel project which handles redirect + logging
