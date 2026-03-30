Analytics system for QR code tracking, page views, and appreciation stats.

## Tables (this project)
- `page_views`: daily view counts per profile_slug (unique on profile_slug + day)
- `appreciations`: messages with status (approved/pending/rejected)
- `redirects`: QR redirect entries with id (text PK), profile_slug, destination_url, active
- `redirect_events_daily`: daily scan counts per redirect id (composite PK: id + day)

## RPC Functions (this project)
- `increment_page_view(p_slug text, p_day date)`: upserts daily page view count
- `increment_redirect_daily(p_id text, p_day date)`: upserts daily redirect scan count

## Edge Function
- `qr-redirect`: receives `?id=xxx`, looks up redirect in local `redirects` table, logs scan via `increment_redirect_daily`, then 302 redirects to destination_url

## QR Code Flow
1. Admin creates a profile → QR code auto-generated on save
2. QR code points to: `https://{project}.supabase.co/functions/v1/qr-redirect?id={slug}`
3. Edge function logs scan to `redirect_events_daily` and redirects to profile page
4. Analytics tab reads from local `redirects` + `redirect_events_daily` tables
5. No more dependency on external heros-redirect project for new profiles

## Frontend
- `ProfilePage.tsx`: fires `increment_page_view` on load (fire-and-forget)
- `AdminProfileManager.tsx`: auto-generates QR code on profile save, allows regeneration
- `AdminAnalytics.tsx`: reads from local tables, dynamically maps QR IDs from `redirects` table
- Admin.tsx: has 4 tabs — Nominations, Profiles, Admins, Analytics

## Legacy
- Brad's QR codes (brad, bradflyer) seeded in local `redirects` table
- External heros-redirect project data can be migrated but is no longer needed for new profiles
- `herosRedirectClient.ts` still exists but is no longer imported
