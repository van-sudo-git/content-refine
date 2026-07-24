# Now We See You

**nowweseeyou.org** — a platform that creates long-term, consent-based digital profiles for the essential workers who keep communities running but are rarely acknowledged by name. Designed to extend to any school, organization, or community where essential contributors go unseen. Current chapter: Lake Washington High School, Kirkland, WA.

Created by Evaan Ahlawat, a student at Lake Washington High School in Kirkland, WA. The initial proototype was in Google Sites [Now We See Me](https://sites.google.com/view/now-we-see-me), after which the first React and Supabase application foundation was developed with Lovable assistance; major later components were written directly by Evaan outside Lovable. See [AI_DISCLOSURE.md](./AI_DISCLOSURE.md).

**Live site:** [nowweseeyou.org](https://nowweseeyou.org)  
**Original Google Sites prototype:** [Now We See Me](https://sites.google.com/view/now-we-see-me)  
**AI disclosure:** [AI_DISCLOSURE.md](./AI_DISCLOSURE.md)  
**Project documentation:** [`docs/`](./docs/)

---

## The problem

The Lake Washington School District employs hundreds of classified staff members. They show up every day — fixing broken fixtures, managing school finances, supporting students with disabilities — and most people in the building do not know their names. When they retire or move on, there is often no shared record of the role they played in the school community.

Now We See You is designed as a durable, consent-based archive rather than a one-time recognition campaign. When Brad Fisher eventually leaves Lake Washington High School, students who come after him can still read his story and understand the contribution he made to the school.

---

## What it does

- **Staff profiles** — hand-drawn charcoal portraits, personal bios, and full stories for each featured staff member, published with explicit consent
- **Appreciation wall** — students and staff can leave public messages that are AI-moderated before going live
- **QR code system** — each featured profile can be reached through a QR code displayed in the school building; QR codes are permanent and resolve correctly even if the platform's hosting changes
- **Nomination workflow** — anyone can nominate the next staff member at [nowweseeyou.org/nominate](https://nowweseeyou.org/nominate). Nominations land in the admin dashboard where administrators review, approve, decline, or feature them. The `nominee_informed` field confirms whether the nominee knows they have been nominated. Approved nominations trigger in-person outreach and explicit consent before any profile work begins. Real nominations from LWSD staff are visible in [`docs/assets/admin-nominations-jul2026.png`](./docs/assets/admin-nominations-jul2026.png) and the admin workflow in [`docs/assets/admin-profiles-jul2026.png`](./docs/assets/admin-profiles-jul2026.png)
- **Admin dashboard** — school administrators can review nominations, manage profiles, track engagement, and generate print-ready QR flyers
- **Flyer generator** — admin tool that generates print-ready QR placards for each staff profile, with per-flyer scan tracking so engagement from each physical placard is measured independently
- **Share button** — one-tap sharing on every staff profile page; opens native share sheet on mobile so visitors can text or post a staff member's story directly from their phone; falls back to clipboard copy on desktop [`docs/assets/share-button-desktop-jul2026.png`](./docs/assets/share-button-desktop-jul2026.png) and [`docs/assets/share-button-desktop-jul2026.png`](./docs/assets/share-button-desktop-jul2026.png)
- **Analytics** — per-profile page views, daily QR scan counts from two Supabase projects, appreciation-message tracking, and period-over-period trends. Real engagement data in [`docs/assets/analytics-traffic-jul2026.png`](./docs/assets/analytics-traffic-jul2026.png) and [`docs/assets/analytics-per-profile-breakdown-jul2026.png`](./docs/assets/analytics-per-profile-breakdown-jul2026.png)

---

## Current profiles

- **Brad Fisher** — Head Custodian, Lake Washington High School
- **Shirley P.** — Bookkeeper / Accounting Technician, Lake Washington High School
- **Pauline Gillespie** — Office Professional, Lake Washington High School 
  - Added portrait via admin flow (no-code workflow) [`docs/assets/admin-nominations-jul2026.png`](./docs/assets/admin-update-portrait-jul2026.png)
- **Jose Guerrero** — Night Lead Custodian, Lake Washington High School
- **Michele Raymer** — Transition Center Teacher, Lake Washington High School
- **Beth Da Luz** — Receptionist, Lake Washington High School

Brad Fisher's portrait was exhibited at the Kirkland Arts Center in 2026.

---

## Platform usage — July 2026

Real engagement data as of July 2026. Screenshots in [`docs/assets/`](./docs/assets/).

- **1,173 page views** across all profiles (all time)
- **39 QR scans** from physical placards in school buildings and KAC exhibition
- **10 approved appreciation messages** — AI moderation active, 20 messages rejected
- **2,050% traffic increase** the week of the Kirkland Arts Center exhibition
- **3 nominations** received from LWSD staff email addresses
- **brad-kac** QR code deployed at KAC — 16 scans recorded from exhibition visitors

---

## Tech stack

- React + TypeScript + Vite + Tailwind CSS
- Supabase: PostgreSQL, Row Level Security, Edge Functions, and Storage
- Lovable: AI-assisted web development platform
- Deployed at [nowweseeyou.org](https://nowweseeyou.org)

---

## QR and analytics architecture

The project currently includes two QR-related systems.

### Main application

This repository handles profiles, appreciations, nominations, page views, admin access control, and QR redirect records created through the flyer generator.

### Standalone redirect service

[`heros-redirect`](https://github.com/van-sudo-git/heros-redirect) is a separate Next.js service used to support QR-to-profile routing and daily scan logging independently of the main application.

The dashboard combines analytics from both systems and avoids double-counting overlapping QR records. By using an independently deployable redirect layer, the project can update profile destinations without reprinting physical QR placards.

### Key backend components

- `supabase/functions/moderate-appreciation` — Deno Edge Function that routes appreciation messages through AI moderation before storing them. Moderation rules and approval criteria were designed for the school context.
- `supabase/functions/qr-redirect` — Deno Edge Function that resolves QR scan IDs to destination URLs and logs daily analytics through an atomic PL/pgSQL upsert.
- `supabase/migrations/` — migrations defining the schema, Row Level Security policies, and PL/pgSQL functions for atomic view and scan counting.

---

## Database schema

| Table | Purpose |
|---|---|
| `schools` | District schools; designed to support future multi-school expansion |
| `school_admins` | Email-based administrator access control per school |
| `profiles` | Staff profiles with slug, bio, role, and publication status |
| `profile_images` | Portrait, QR, and additional profile images |
| `appreciations` | Wall messages with moderation status |
| `nominations` | Community nominations with status workflow and school dropdown |
| `redirects` | QR-code-to-destination URL mapping |
| `redirect_events_daily` | Daily scan counts per QR code |
| `page_views` | Daily page-view counts per profile slug |

Row Level Security is enabled on all application tables. Administrative access is governed through PostgreSQL functions `is_school_admin()` and `is_any_school_admin()` defined in the migrations.

---

## Testing

Automated verification scripts are in `scripts/`:

- `scripts/verify-live-browser.ts` — Playwright headless browser tests checking SEO, auth redirects, and page functionality on nowweseeyou.org
- `scripts/verify-live-readonly.ts` — Supabase read-only checks verifying published profiles, QR redirect resolution, and appreciation data

Manual and automated test results are documented in [`test.md`](./test.md).

Run automated checks:
```bash
npx playwright install chromium
npx tsx scripts/verify-live-browser.ts
npx tsx scripts/verify-live-readonly.ts
```

---

## AI disclosure

See [AI_DISCLOSURE.md](./AI_DISCLOSURE.md) for full details.

Short version: Lovable generated significant portions of the front-end code based on Evaan's product requirements and design direction. The database schema, QR redirect architecture, analytics requirements, moderation behavior, nomination workflow, and flyer generator were designed and iterated through a mix of AI-assisted and manually edited code. All portrait artwork, staff interviews, consent conversations, and community relationships are Evaan's own work.

---

## Repository structure

```text
nowweseeyou/
├── docs/
│   ├── assets/                  # Analytics screenshots and platform evidence
│   └── flyer-generator.md       # Architecture notes for the flyer generator
├── scripts/
│   ├── verify-live-browser.ts   # Playwright live site verification
│   └── verify-live-readonly.ts  # Supabase data verification
├── src/
│   ├── components/              # React components including AdminAnalytics, AppreciationWall, FlyerPreview
│   ├── pages/                   # Route pages: Index, Gallery, ProfilePage, Admin, AdminFlyer, Nominate
│   ├── hooks/                   # useAuthReady (auth-loading state handling)
│   ├── lib/                     # herosRedirectClient, demoData, utilities
│   └── integrations/
│       └── supabase/            # Client and generated TypeScript types
├── supabase/
│   ├── functions/               # Edge functions: moderate-appreciation, qr-redirect
│   └── migrations/              # Database schema and policy migrations
├── AI_DISCLOSURE.md             # How AI tools were used
├── test.md                      # Manual and automated testing results
└── .env.example                 # Environment variable template
```

---

## Local development

```bash
npm install
npm run dev
```

Create a local `.env` file using `.env.example` as a template. Never commit real keys, service-role credentials, or production connection details.

---

## Changelog

### July 2026

- Share button — native mobile share sheet + clipboard fallback on every staff profile page [`share-button.md`](./docs/share-button.md)  
- Flyer generator — admin tool to generate print-ready QR placards with per-flyer analytics tracking [`flyer-generator.md`](./docs/flyer-generator.md)
- Nomination form — added school dropdown, made department optional, added database migration
- QR redirect URLs updated to nowweseeyou.org across all records
- Automated verification scripts added for live platform testing
- Analytics evidence documented — 1,173 page views, 39 QR scans, KAC traffic spike captured
- 4 new profiles added — Pauline Gillespie, Jose Guerrero, Michele Raymer, Beth Da Luz

### June 2026
- brad-kac QR code deployed at Kirkland Arts Center exhibition — 16 scans recorded
- AI moderation active — 20 messages rejected, 10 approved

### March–May 2026
- Initial platform build — profiles, appreciations, nominations, QR system, admin dashboard, analytics
- Brad Fisher and Shirley P. profiles launched

---

## Privacy and consent

Every staff member profiled on Now We See You has given explicit, informed consent before any content is published. The consent process is built into the platform workflow:

- No profile is published without the staff member's direct approval
- Staff members are shown exactly what their profile will look like before it goes live
- Profiles can be unpublished at any time at the staff member's request
- The nomination workflow is end-to-end consent-aware:
  - Anyone can submit a nomination at [nowweseeyou.org/nominate](https://nowweseeyou.org/nominate) — name, role, school, and reason required; department optional
  - The `nominee_informed` field confirms whether the nominee has been told they are being nominated before submission
  - Nominations land in the admin dashboard where they are reviewed, approved, declined, or featured by school administrators
  - Approved nominations trigger outreach to the nominee — Evaan meets them in person, explains the project, and gets explicit consent before any profile work begins
  - Only after consent is given does portrait work and profile creation start
  - Real nominations from LWSD staff are visible in [`docs/assets/admin-nominations-jul2026.png`](./docs/assets/admin-nominations-jul2026.png)
- Appreciation messages are AI-moderated before publication to protect staff members from inappropriate content
- The platform does not collect personal data from visitors beyond standard page view analytics

The platform is designed to give power to the people being profiled, not just the people building it.

---

## Extending to other schools and communities

Now We See You is designed from the beginning to be repeatable. The database schema includes a `schools` table with per-school admin access control — adding a new school is an administrative action, not a rebuild.

The model works for any organization where essential workers are under-recognized:

- **Other school districts** — any district can run their own instance using the same platform
- **Community organizations** — libraries, community centers, municipal services
- **Nonprofits** — staff and volunteers who keep organizations running

### How replication works

The platform follows a no-code replication model for new chapters:

1. A school or organization identifies a founding student or community member to lead the project
2. They receive access to the admin dashboard for their school
3. They follow the portrait and consent process to onboard their first staff member
4. QR placards are generated using the built-in flyer generator and displayed in the building
5. The appreciation wall and nomination form activate immediately for their community

A completed onboarding guide for new chapter admins is available at [`docs/start-a-chapter-guide.md`](./docs/start-a-chapter-guide.md).