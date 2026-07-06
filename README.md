# Now We See You

**nowweseeyou.org** — a platform that creates long-term, consent-based digital profiles for the classified school staff who keep schools running but are rarely acknowledged by name: custodians, bookkeepers, and paraeducators.

Created by Evaan Ahlawat, a student at Lake Washington High School in Kirkland, WA, using AI-assisted development tools. See [AI_DISCLOSURE.md](./AI_DISCLOSURE.md).

**Live site:** [nowweseeyou.org](https://nowweseeyou.org)  
**AI disclosure:** [AI_DISCLOSURE.md](./AI_DISCLOSURE.md)  
**Project documentation:** [`docs/`](./docs/)

---

## The problem

The Lake Washington School District employs hundreds of classified staff members. They show up every day — fixing broken fixtures, managing school finances, supporting students with disabilities — and most people in the building do not know their names. When they retire or move on, there is often no shared record of the role they played in the school community.

Now We See You is designed as a durable, consent-based archive rather than a one-time recognition campaign. When Brad Fisher eventually leaves Lake Washington High School, students who come after him can still read his story and understand the contribution he made to the school.

---

## What it does

- **Staff profiles** — hand-drawn charcoal portraits, personal bios, and full stories for each featured staff member, published with explicit consent
- **Appreciation wall** — students and staff can leave public messages that are moderated before going live
- **QR code system** — each featured profile can be reached through a QR code displayed in the school building
- **Nomination form** — anyone can nominate the next staff member to be featured at [nowweseeyou.org/nominate](https://nowweseeyou.org/nominate)
- **Admin dashboard** — school administrators can review nominations, manage profiles, and track engagement
- **Analytics** — per-profile page views, daily QR scan counts, appreciation-message tracking, and period-over-period trends

---

## Current profiles

- **Brad Fisher** — Head Custodian, Lake Washington High School
- **Shirley P.** — Bookkeeper, Lake Washington High School

Brad Fisher’s portrait was exhibited at the Kirkland Arts Center in 2026.

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

This repository handles profiles, appreciations, nominations, page views, admin access control, and the current internal QR redirect records.

### Standalone redirect service

[`heros-redirect`](https://github.com/van-sudo-git/heros-redirect) is a separate Next.js service used to support QR-to-profile routing and daily scan logging independently of the main application.

The dashboard can combine analytics from both systems and avoids double-counting overlapping QR records during the transition. By using an independently deployable redirect layer, the project can update profile destinations without needing to replace printed QR materials.

### Key backend components

- `supabase/functions/moderate-appreciation` — Deno Edge Function that routes appreciation messages through AI moderation before storing them. The moderation rules and approval criteria were designed for the school context; the AI evaluates each message before it is published.
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
| `nominations` | Community nominations with a status workflow |
| `redirects` | QR-code-to-destination URL mapping |
| `redirect_events_daily` | Daily scan counts per QR code |
| `page_views` | Daily page-view counts per profile slug |

Row Level Security is enabled on the application tables. Administrative access is governed through PostgreSQL functions such as `is_school_admin()` and `is_any_school_admin()` defined in the migrations.

---

## AI disclosure

See [AI_DISCLOSURE.md](./AI_DISCLOSURE.md) for full details.

Short version: Lovable generated significant portions of the front-end code based on Evaan’s product requirements and design direction. The database schema, QR redirect architecture, analytics requirements, moderation behavior, and nomination workflow were designed and iterated through a mix of AI-assisted and manually edited code. All portrait artwork, staff interviews, consent conversations, and community relationships are Evaan’s own work.

---

## Repository structure

```text
nowweseeyou/
├── src/
│   ├── components/       # React components including AdminAnalytics and AppreciationWall
│   ├── pages/            # Route pages: Index, Gallery, ProfilePage, Admin, Nominate
│   ├── hooks/            # useAuthReady (auth-loading state handling)
│   ├── lib/              # herosRedirectClient, demoData, utilities
│   └── integrations/
│       └── supabase/     # Client and generated TypeScript types
├── supabase/
│   ├── functions/        # Edge functions: moderate-appreciation, qr-redirect
│   └── migrations/       # Database schema and policy migrations
├── docs/                 # Retrospective design notes and architecture documentation
├── AI_DISCLOSURE.md      # How AI tools were used
├── CONTRIBUTORS.md       # Roles and project contributions
└── TESTING.md            # Manual end-to-end testing results
```

---

## Local development

```bash
npm install
npm run dev
```

Create a local `.env` file using `.env.example` as a template. Never commit real keys, service-role credentials, or production connection details.
