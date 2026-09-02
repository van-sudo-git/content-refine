# Now We See You - Technical Architecture

**Updated:** September 2026  
**Author:** Evaan Ahlawat

Now We See You is a React, TypeScript, and Supabase application designed
to support multiple school chapters on one platform.

This document is an architectural map. Detailed design decisions are kept
in focused documents so they can evolve independently.

## System Overview

Frontend:
- React + TypeScript + Vite
- Tailwind CSS
- React Router

Backend:
- Supabase PostgreSQL
- Supabase Auth
- Row Level Security
- Supabase Storage
- Edge Functions

Core model:
- schools
- school administrators
- student roles
- nominations
- profiles
- profile media
- contributors
- QR redirects and analytics

## Public Routes

- `/`
- `/galleries`
- `/galleries/:schoolSlug`
- `/gallery/:profileSlug`
- `/about`
- `/media`
- `/nominate`
- `/privacy`

The individual `/gallery/:profileSlug` route remains stable because
physical QR codes may depend on it.

## Authenticated Experiences

### Admin

`/admin`

Supports:
- nominations
- profiles
- administrators
- student roles
- analytics
- flyer generation

### Club

`/club`

Supports:
- Journalist
- Artist
- Photographer

Community Outreach receives restricted Flyer Generator access.

## Current Workflow

`pending -> approved -> in_progress -> published`

The database enum also retains `assigned` and `submitted` from earlier
workflow iterations.

Artist and Photographer work is nomination-first. They can begin before
the Journalist creates a profile.

Journalists create and edit drafts but cannot publish.

Publishing remains an administrator action.

## Architecture Documentation

### Multi-school architecture
[`docs/multi-school-admin.md`](../../docs/multi-school-admin.md)

School isolation, global admins, school onboarding, nomination settings,
and public chapter behavior.

### Student roles and permissions
[`docs/club-roles-spec.md`](../../docs/club-roles-spec.md)

Journalist, Artist, Photographer, Community Outreach, overlapping roles,
and publication boundaries.

### Workflow evolution
[`docs/retrospective-one-person-to-club.md`](../../docs/retrospective-one-person-to-club.md)

Why the project moved from founder-only operation to a chapter model.

### QR architecture
[`docs/retrospective-qr-redirect.md`](../../docs/retrospective-qr-redirect.md)

Tracked redirects, physical QR durability, main Supabase QR system, and
the historical `heros-redirect` service.

### Flyer Generator
[`docs/flyer-generator.md`](../../docs/flyer-generator.md)

School-scoped printable QR placards.

### Sharing
[`docs/share-button.md`](../../docs/share-button.md)

Native mobile sharing and desktop clipboard fallback.

### Chapter replication
[`docs/start-a-chapter-guide.md`](../../docs/start-a-chapter-guide.md)

How another school can use the existing platform without building code.

## Database

Important tables include:

- `schools`
- `school_admins`
- `club_roles`
- `nominations`
- `profiles`
- `profile_images`
- `profile_contributors`
- `appreciations`
- `redirects`
- `redirect_events_daily`
- `page_views`

Generated TypeScript definitions are in:

`src/integrations/supabase/types.ts`

Database migrations and RLS policies are in:

`supabase/migrations/`

## Edge Functions

Current server-side functions live under:

`supabase/functions/`

They include:
- appreciation moderation
- QR redirect tracking
- page-view tracking
- role and nomination notifications
- transactional email handling

## Testing

See [`test.md`](../../test.md).

The testing document distinguishes:
- tests actually run
- source-level implementation verification
- final production acceptance checks

## AI Use

See [`AI_DISCLOSURE.md`](../../AI_DISCLOSURE.md).

AI-assisted development is disclosed separately from the runtime AI
moderation feature.

## Source of Truth

The implementation is the source of truth.

These focused documents record the reasoning behind major architectural
decisions without duplicating the entire codebase here.