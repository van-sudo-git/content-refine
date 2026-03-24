Analytics system for QR code tracking, page views, and appreciation stats.

## Tables
- `redirects`: maps QR code IDs to profile slugs + destination URLs
- `redirect_daily`: daily hit counts per redirect (unique on redirect_id + day)
- `page_views`: daily view counts per profile_slug (unique on profile_slug + day)

## RPC Functions
- `increment_redirect_daily(p_id uuid, p_day date)`: upserts daily QR scan count
- `increment_page_view(p_slug text, p_day date)`: upserts daily page view count

## Edge Function
- `qr-redirect`: accepts `?id=<redirect_id>`, logs scan via RPC, redirects to destination_url
- QR code URL format: `https://mxhkpmqaoifrufzpqszl.supabase.co/functions/v1/qr-redirect?id=<redirect_id>`

## Frontend
- `ProfilePage.tsx`: fires `increment_page_view` on load (fire-and-forget)
- `AdminAnalytics.tsx`: Analytics tab showing summary cards, 30-day bar chart, per-profile breakdown
- Admin.tsx: has 4 tabs — Nominations, Profiles, Admins, Analytics

## Data Source (inspiration)
- Based on github.com/van-sudo-git/heros-redirect pattern