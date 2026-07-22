# Testing

Manual and automated verification of nowweseeyou.org.  
Last verified: July 17, 2026

---

## Automated verification

Two scripts in `scripts/` run against the live platform and database.

### Database and QR checks (`verify-live-readonly.ts`)

Verifies published profiles, redirect destinations, and QR resolution.

```json
{
  "publishedProfiles": [
    { "slug": "brad-fisher", "name": "Brad Fisher", "status": "published" },
    { "slug": "shirley-p", "name": "Shirley P.", "status": "published" },
    { "slug": "pauline-gillespie", "name": "Pauline Gillespie", "status": "published" },
    { "slug": "jose-guerrero", "name": "Jose Guerrero", "status": "published" },
    { "slug": "michele-raymer", "name": "Michele Raymer", "status": "published" },
    { "slug": "beth-da-luz", "name": "Beth Da Luz", "status": "published" }
  ],
  "redirects": [
    { "id": "beth-da-luz-flyer-4", "profile_slug": "beth-da-luz", "destination_url": "https://nowweseeyou.org/gallery/beth-da-luz", "active": true },
    { "id": "brad", "profile_slug": "brad-fisher", "destination_url": "https://nowweseeyou.org/gallery/brad-fisher", "active": true },
    { "id": "bradflyer", "profile_slug": "brad-fisher", "destination_url": "https://nowweseeyou.org/gallery/brad-fisher", "active": true },
    { "id": "shirley", "profile_slug": "shirley-p", "destination_url": "https://nowweseeyou.org/gallery/shirley-p", "active": true }
  ],
  "localScansToday": [],
  "bradAppreciationsSample": [
    { "profile_slug": "brad-fisher", "status": "approved" },
    { "profile_slug": "brad-fisher", "status": "approved" },
    { "profile_slug": "brad-fisher", "status": "approved" }
  ],
  "qrRedirects": {
    "shirley": "https://nowweseeyou.org/gallery/shirley-p",
    "brad": "https://nowweseeyou.org/gallery/brad-fisher",
    "bradflyer": "https://nowweseeyou.org/gallery/brad-fisher"
  }
}
```

### Browser checks (`verify-live-browser.ts`)

Playwright headless browser test on mobile viewport (390×844).

```json
{
  "bradSeo": {
    "title": "Brad Fisher, Head Custodian | Now We See You",
    "ogTitle": "Now We See You — Visibility for the People Behind the Scenes",
    "twitterCard": "summary_large_image",
    "canonical": "https://nowweseeyou.org/",
    "jsonLd": "{\"@context\":\"https://schema.org\",\"@type\":\"Person\",\"name\":\"Brad Fisher\",\"jobTitle\":\"Head Custodian\",\"worksFor\":{\"@type\":\"Organization\",\"name\":\"Lake Washington High School\"},\"image\":\"https://mxhkpmqaoifrufzpqszl.supabase.co/storage/v1/object/public/profile-images/brad-fisher/portrait.jpeg\",\"url\":\"https://nowweseeyou.org/gallery/brad-fisher\"}",
    "overflowX": false
  },
  "adminUnauthenticated": {
    "url": "https://nowweseeyou.org/admin/login",
    "redirectedToLogin": true
  },
  "adminDemo": {
    "url": "https://nowweseeyou.org/admin?demo=true",
    "hasAnalyticsTab": true,
    "hasDemoContent": true
  },
  "nominatePage": {
    "url": "https://nowweseeyou.org/nominate",
    "hasSubmit": true
  }
}
```

---

## Manual test results

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Scan Brad's QR (`brad`) | Loads brad-fisher profile at nowweseeyou.org | ✅ Pass |
| 2 | Scan Brad KAC QR (`brad-kac`) | Loads brad-fisher profile | ✅ Pass (heros-redirect) |
| 3 | Scan Shirley's QR (`shirley`) | Loads shirley-p profile | ✅ Pass |
| 4 | Submit appreciation message | Appears as pending, not public | ✅ Pass |
| 5 | Submit inappropriate message | Rejected by AI moderation | ✅ Pass |
| 6 | Submit nomination form | Appears in admin nominations queue | ✅ Pass |
| 7 | Non-admin visits /admin | Redirected to /admin/login | ✅ Pass |
| 8 | Admin login | Resolves without redirect loop | ✅ Pass |
| 9 | Analytics dashboard | Shows real data from both Supabase projects | ✅ Pass |
| 10 | Flyer generator — existing profile | Generates flyer with correct QR code | ✅ Pass |
| 11 | Flyer generator — new redirect | Creates redirect in database, generates flyer | ✅ Pass |
| 12 | Mobile layout | All pages render correctly, no horizontal overflow | ✅ Pass |
| 13 | Profile page title | Shows staff member name and role | ✅ Pass |
| 14 | Profile JSON-LD structured data | Person schema with correct name, image, URL | ✅ Pass |
| 15 | Share button — mobile | Tap share on Brad's profile on phone | Native share sheet opens with correct URL and name | ✅ Pass |
| 16 | Share button — desktop | Click share on desktop | URL copied, "Copied!" shown for 2 seconds | ✅ Pass |
| 17 | Share button — desktop -- whatsapp | Click share on desktop | opens Whatsapp and lets me post | ✅ Pass |
| 18 | Share button — cancel | Open native share on mobile, tap cancel | Nothing happens, no error shown | ✅ Pass |

---

## Known issues

| # | Issue | Status |
|---|-------|--------|
| 1 | `og:title` on profile pages returns site default instead of staff member name | Open — fix pending in Lovable |
| 2 | `canonical` URL on profile pages returns homepage instead of profile URL | Open — fix pending in Lovable |

---

## How to run automated checks

```bash
# Database and QR verification
npx tsx scripts/verify-live-readonly.ts

# Browser verification (requires Playwright)
npx playwright install chromium
npx tsx scripts/verify-live-browser.ts
```