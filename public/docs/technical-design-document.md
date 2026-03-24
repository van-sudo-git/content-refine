# Now We See You — Technical Design Document

**Version:** 4.0  
**Date:** March 24, 2026  
**Author:** Evaan Ahlawat  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Design](#4-database-design)
5. [Storage Design](#5-storage-design)
6. [Authentication & Authorization — Deep Dive](#6-authentication--authorization--deep-dive)
7. [Admin Workflows — Deep Dive](#7-admin-workflows--deep-dive)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Extensibility & Expansion Guide](#9-extensibility--expansion-guide)
10. [Environment Setup](#10-environment-setup)
11. [Known Gaps / Risks / Technical Debt](#11-known-gaps--risks--technical-debt)
12. [Appendix A: SQL Schema](#appendix-a-sql-schema)
13. [Appendix B: API Contracts](#appendix-b-api-contracts)
14. [Appendix C: Secrets & External Integrations](#appendix-c-secrets--external-integrations)
15. [Appendix D: Mermaid Diagrams (copy into any Mermaid renderer)](#appendix-d-mermaid-diagrams)

---

## 1. System Overview

**Now We See You** is a student-led web application that celebrates unsung school heroes — custodians, cafeteria workers, aides, and other support staff. The platform allows:

- **Students/community** to nominate staff members for recognition
- **Students/community** to leave AI-moderated appreciation messages (including anonymous posts) on featured profiles
- **School admins** to review nominations, create and publish dynamic gallery profiles, manage other admins, moderate content, and delete inappropriate appreciation messages

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 8, Tailwind CSS 3 |
| UI Library | shadcn/ui (Radix primitives) |
| Animation | Framer Motion 12 |
| Forms | react-hook-form + Zod |
| Server State | @tanstack/react-query (QueryClient provisioned) |
| Backend | Lovable Cloud (Supabase-backed) |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (email/password) |
| Edge Functions | Deno (Supabase Edge Functions) |
| Storage | Supabase Storage (profile-images bucket) |
| AI Moderation | Lovable AI Gateway (Google Gemini 2.5 Flash Lite) |
| Analytics | Google Analytics 4 (G-Y5B9N202G7) |

### Design System

| Property | Value |
|----------|-------|
| Display Font | Cormorant Garamond (400–700, italic) |
| Body Font | DM Sans (300–600) |
| Background | Warm cream `hsl(40, 40%, 95%)` |
| Primary Text | Deep charcoal `hsl(25, 12%, 18%)` |
| Accent / Secondary | Lilac-purple `hsl(270, 40%, 50%)` |
| Card Background | `hsl(38, 35%, 92%)` |
| Muted Text | `hsl(25, 8%, 42%)` |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│  React SPA (Vite)                                   │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  Pages   │ │Components│ │ Supabase JS SDK   │   │
│  └──────────┘ └──────────┘ └─────────┬─────────┘   │
│                                      │              │
│  ┌────────────────────────────────┐  │              │
│  │  Google Analytics (gtag.js)   │  │              │
│  └────────────────────────────────┘  │              │
└──────────────────────────────────────┼──────────────┘
                                       │ HTTPS
                    ┌──────────────────┼──────────────┐
                    │         LOVABLE CLOUD            │
                    │                  │                │
                    │  ┌───────────────▼────────────┐  │
                    │  │     PostgREST API          │  │
                    │  │  (auto-generated REST)     │  │
                    │  └───────────────┬────────────┘  │
                    │                  │                │
                    │  ┌───────────────▼────────────┐  │
                    │  │     PostgreSQL Database     │  │
                    │  │  (RLS-protected tables)     │  │
                    │  └────────────────────────────┘  │
                    │                                   │
                    │  ┌────────────────────────────┐  │
                    │  │   Supabase Auth Service    │  │
                    │  │  (email/password)          │  │
                    │  └────────────────────────────┘  │
                    │                                   │
                    │  ┌────────────────────────────┐  │
                    │  │   Supabase Storage         │  │
                    │  │  (profile-images bucket)   │  │
                    │  └────────────────────────────┘  │
                    │                                   │
                    │  ┌────────────────────────────┐  │
                    │  │   Edge Functions (Deno)    │  │
                    │  │  moderate-appreciation     │──┼──► Lovable AI Gateway
                    │  └────────────────────────────┘  │
                    └──────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Pages

| Route | Component | Auth Required | Purpose |
|-------|-----------|:------------:|---------|
| `/` | `Index.tsx` | No | Landing — hero image, mission statement, featured profiles grid |
| `/gallery` | `Gallery.tsx` | No | Dynamic grid of all published profiles (pulled from DB) |
| `/gallery/:slug` | `ProfilePage.tsx` | No | Dynamic profile page with portrait, bio, QR code, photos, and appreciation wall |
| `/about` | `About.tsx` | No | About the project creator (with QR code) |
| `/nominate` | `Nominate.tsx` | No | Public nomination form (Zod-validated) |
| `/privacy` | `Privacy.tsx` | No | Privacy & ethics policy |
| `/admin/login` | `AdminLogin.tsx` | No (redirects if already authed) | Admin sign-in/sign-up |
| `/admin` | `Admin.tsx` | Yes (admin) | Dashboard for nominations, profiles, & admin management |
| `*` | `NotFound.tsx` | No | 404 fallback |

### 2.2 Major Components

| Component | File | Responsibility |
|-----------|------|---------------|
| `Layout` | `Layout.tsx` | Shared shell wrapping Navbar + Footer |
| `Navbar` | `Navbar.tsx` | Responsive navigation; "Who Am I" hidden on desktop, shown in mobile menu |
| `Footer` | `Footer.tsx` | Site footer |
| `AnimatedSection` | `AnimatedSection.tsx` | Framer Motion scroll-reveal wrapper |
| `AppreciationWall` | `AppreciationWall.tsx` | Appreciation form (supports anonymous posts) + message grid + admin delete (trash icon) |
| `AdminProfileManager` | `AdminProfileManager.tsx` | Full profile CRUD: create/edit profiles, upload images (portrait, QR, additional), publish/unpublish, delete |
| `NavLink` | `NavLink.tsx` | Active-state navigation link helper |

### 2.3 Navigation

**Desktop nav links:** Home, Gallery, Nominate, Privacy & Ethics  
**Mobile nav links:** Home, Gallery, Who Am I, Nominate, Privacy & Ethics  

The "Who Am I" link is intentionally hidden on desktop but accessible via mobile hamburger menu and linked from the home page.

### 2.4 Routing

- Uses `react-router-dom` v6 with `BrowserRouter`
- All routes defined in `App.tsx` as flat `<Route>` elements
- Dynamic profile pages via `/gallery/:slug` parameter
- No nested route layouts or `<Outlet>` usage
- No route guards/wrappers — admin protection is **imperative** (redirect in `useEffect`)

### 2.5 State Management

| Type | Mechanism | Notes |
|------|-----------|-------|
| Server state | Direct `useState`/`useEffect` + Supabase SDK | `react-query` QueryClient exists but is underutilized |
| Form state | `react-hook-form` + Zod | Used on Nominate page |
| Auth state | Checked on-demand via `supabase.auth.getSession()` | No global auth context/provider |
| UI state | Local `useState` | Menu open, loading flags, etc. |

---

## 3. Backend Architecture

### 3.1 Auto-Generated REST API (PostgREST)

All database operations use the Supabase JS SDK, which calls auto-generated REST endpoints. Security is enforced via Row-Level Security (RLS) policies on every table.

| Operation | Table | Caller | SDK Call |
|-----------|-------|--------|----------|
| `INSERT` | `nominations` | Public | `supabase.from("nominations").insert(...)` |
| `SELECT` | `nominations` | School admin | `supabase.from("nominations").select(...)` |
| `UPDATE` | `nominations` | School admin | `supabase.from("nominations").update(...)` |
| `SELECT` | `appreciations` | Public/Admin | `supabase.from("appreciations").select(...)` |
| `DELETE` | `appreciations` | Admin | `supabase.from("appreciations").delete(...)` |
| `SELECT` | `schools` | Public | `supabase.from("schools").select(...)` |
| `SELECT` | `school_admins` | School admin | `supabase.from("school_admins").select(...)` |
| `INSERT` | `school_admins` | School admin | `supabase.from("school_admins").insert(...)` |
| `DELETE` | `school_admins` | School admin | `supabase.from("school_admins").delete(...)` |
| `SELECT` | `profiles` | Public (published) / Admin (all) | `supabase.from("profiles").select(...)` |
| `INSERT` | `profiles` | Admin | `supabase.from("profiles").insert(...)` |
| `UPDATE` | `profiles` | Admin | `supabase.from("profiles").update(...)` |
| `DELETE` | `profiles` | Admin | `supabase.from("profiles").delete(...)` |
| `SELECT` | `profile_images` | Public (published profiles) / Admin | `supabase.from("profile_images").select(...)` |
| `INSERT` | `profile_images` | Admin | `supabase.from("profile_images").insert(...)` |
| `DELETE` | `profile_images` | Admin | `supabase.from("profile_images").delete(...)` |

### 3.2 Edge Functions

#### `moderate-appreciation`

| Property | Value |
|----------|-------|
| Runtime | Deno (Supabase Edge Functions) |
| Trigger | Client-side invocation via `supabase.functions.invoke()` |
| Auth | Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS |
| AI Model | `google/gemini-2.5-flash-lite` via Lovable AI Gateway |

**Logic:**
1. Parse `{ author_name?, message, profile_slug }` from request body
2. Validate: message required, ≤500 chars
3. Call AI gateway with system prompt defining approval/rejection criteria
4. Parse AI JSON response `{ approved: bool, reason: string }`
5. If approved → insert into `appreciations` with `status = "approved"`
6. If rejected → insert into `appreciations` with `status = "rejected"`
7. Return result to client with reason

**Rejection UX:** When a message is rejected, the user sees: *"This message wasn't posted as it doesn't appear to be positive or appreciative. Please try again with a kinder message."*

**Anonymous posting:** If `author_name` is empty/null, the appreciation is posted as "Anonymous" on the wall.

### 3.3 Database Functions (RPC)

| Function | Signature | Security | Purpose |
|----------|-----------|----------|---------|
| `is_any_school_admin` | `(_email text) → boolean` | `SECURITY DEFINER` | Check if email exists in any school's admin list |
| `is_school_admin` | `(_email text, _school_id uuid) → boolean` | `SECURITY DEFINER` | Check if email is admin for a specific school |
| `update_updated_at_column` | `() → trigger` | — | Auto-update `updated_at` on row change |

Both admin-check functions use `SECURITY DEFINER` to bypass RLS and prevent recursive policy evaluation.

### 3.4 Notification Logic

**Currently not implemented.** No email, push, or in-app notifications exist. This is identified as a gap in Section 11.

---

## 4. Database Design

### 4.1 Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    schools {
        uuid id PK
        text name
        text district
        timestamptz created_at
    }
    school_admins {
        uuid id PK
        text email
        uuid school_id FK
        timestamptz added_at
    }
    nominations {
        uuid id PK
        uuid school_id FK
        text nominee_name
        text nominee_role
        text nominee_department
        text reason
        text nominator_name
        text nominator_email
        boolean nominee_informed
        text status
        text admin_notes
        timestamptz created_at
        timestamptz updated_at
    }
    profiles {
        uuid id PK
        text slug UK
        text name
        text role
        text department
        text bio
        uuid school_id FK
        text status
        timestamptz created_at
        timestamptz updated_at
    }
    profile_images {
        uuid id PK
        uuid profile_id FK
        text image_url
        text image_type
        integer sort_order
        timestamptz created_at
    }
    appreciations {
        uuid id PK
        text message
        text author_name
        text profile_slug
        text status
        timestamptz created_at
    }
    schools ||--o{ school_admins : "has admins"
    schools ||--o{ nominations : "receives nominations"
    schools ||--o{ profiles : "has profiles (optional)"
    profiles ||--o{ profile_images : "has images"
```

### 4.2 Table Details

#### `schools`

| Column | Type | Nullable | Default | Notes |
|--------|------|:--------:|---------|-------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `name` | `text` | No | — | School name |
| `district` | `text` | No | `'Lake Washington School District'` | District name |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |

#### `school_admins`

| Column | Type | Nullable | Default | Notes |
|--------|------|:--------:|---------|-------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `email` | `text` | No | — | Admin's email (lowercased in queries) |
| `school_id` | `uuid` | No | — | FK → `schools.id` |
| `added_at` | `timestamptz` | No | `now()` | When admin was added |

#### `nominations`

| Column | Type | Nullable | Default | Notes |
|--------|------|:--------:|---------|-------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `school_id` | `uuid` | No | — | FK → `schools.id` |
| `nominee_name` | `text` | No | — | Name of person nominated |
| `nominee_role` | `text` | No | — | Their role (e.g., "Head Custodian") |
| `nominee_department` | `text` | No | — | Department (e.g., "Facilities") |
| `reason` | `text` | No | — | Why they deserve recognition |
| `nominator_name` | `text` | No | — | Who submitted the nomination |
| `nominator_email` | `text` | No | — | Submitter's email |
| `nominee_informed` | `boolean` | No | `false` | Whether nominee knows about it |
| `status` | `text` | No | `'pending'` | pending / approved / declined / featured |
| `admin_notes` | `text` | Yes | — | Internal admin notes |
| `created_at` | `timestamptz` | No | `now()` | Submission time |
| `updated_at` | `timestamptz` | No | `now()` | Last update (auto-updated via trigger) |

#### `profiles`

| Column | Type | Nullable | Default | Notes |
|--------|------|:--------:|---------|-------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `slug` | `text` | No | — | Unique URL slug (e.g., "brad-fisher") |
| `name` | `text` | No | — | Person's display name |
| `role` | `text` | No | — | Job title (e.g., "Head Custodian") |
| `department` | `text` | Yes | — | Department or school name |
| `bio` | `text` | Yes | — | Multi-paragraph bio (newline-separated) |
| `school_id` | `uuid` | Yes | — | FK → `schools.id` (optional — supports community profiles) |
| `status` | `text` | No | `'draft'` | draft / published |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Last update (auto-updated via trigger) |

#### `profile_images`

| Column | Type | Nullable | Default | Notes |
|--------|------|:--------:|---------|-------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `profile_id` | `uuid` | No | — | FK → `profiles.id` ON DELETE CASCADE |
| `image_url` | `text` | No | — | Full public URL from storage bucket |
| `image_type` | `text` | No | `'additional'` | portrait / qr / additional |
| `sort_order` | `integer` | No | `0` | Display ordering |
| `created_at` | `timestamptz` | No | `now()` | Upload timestamp |

#### `appreciations`

| Column | Type | Nullable | Default | Notes |
|--------|------|:--------:|---------|-------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `message` | `text` | No | — | The appreciation text |
| `author_name` | `text` | Yes | — | Null = anonymous (displayed as "Anonymous" on wall) |
| `profile_slug` | `text` | No | — | Soft link to profile slug |
| `status` | `text` | No | `'pending'` | pending / approved / rejected |
| `created_at` | `timestamptz` | No | `now()` | When posted |

### 4.3 Foreign Keys

| From | To | On Delete |
|------|----|-----------|
| `school_admins.school_id` | `schools.id` | (default — no cascade) |
| `nominations.school_id` | `schools.id` | (default — no cascade) |
| `profiles.school_id` | `schools.id` | (default — no cascade) |
| `profile_images.profile_id` | `profiles.id` | **CASCADE** |

### 4.4 Indexes

| Index | Table | Column(s) | Purpose |
|-------|-------|-----------|---------|
| `idx_profiles_slug` | `profiles` | `slug` | Fast profile lookup by URL slug |
| `idx_profiles_status` | `profiles` | `status` | Filter published/draft profiles |
| `idx_profiles_school_id` | `profiles` | `school_id` | Filter by school |
| `idx_profile_images_profile_id` | `profile_images` | `profile_id` | Join images to profile |
| `idx_profile_images_type` | `profile_images` | `image_type` | Filter by image type |

### 4.5 Row-Level Security Policies

#### `schools`
| Policy | Command | Roles | Condition |
|--------|---------|-------|-----------|
| Schools are viewable by everyone | SELECT | public | `true` |

#### `school_admins`
| Policy | Command | Roles | Condition |
|--------|---------|-------|-----------|
| Admins can view their school admins | SELECT | public | `is_school_admin(jwt.email, school_id)` |
| Admins can add admins to their school | INSERT | public | `is_school_admin(jwt.email, school_id)` |
| Admins can remove admins from their school | DELETE | public | `is_school_admin(jwt.email, school_id)` |

#### `nominations`
| Policy | Command | Roles | Condition |
|--------|---------|-------|-----------|
| Anyone can submit nominations | INSERT | public | `true` |
| Admins can view their school nominations | SELECT | public | `is_school_admin(jwt.email, school_id)` |
| Admins can update their school nominations | UPDATE | public | `is_school_admin(jwt.email, school_id)` |

#### `appreciations`
| Policy | Command | Roles | Condition |
|--------|---------|-------|-----------|
| Anyone can submit appreciations | INSERT | public | `true` |
| Approved appreciations are public | SELECT | public | `status = 'approved'` |
| Admins can view all appreciations | SELECT | authenticated | `is_any_school_admin(jwt.email)` |
| Admins can delete appreciations | DELETE | authenticated | `is_any_school_admin(jwt.email)` |

#### `profiles`
| Policy | Command | Roles | Condition |
|--------|---------|-------|-----------|
| Published profiles are public | SELECT | public | `status = 'published'` |
| Admins can manage profiles | ALL | authenticated | `is_any_school_admin(jwt.email)` |

#### `profile_images`
| Policy | Command | Roles | Condition |
|--------|---------|-------|-----------|
| Profile images for published profiles are public | SELECT | public | `EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND status = 'published')` |
| Admins can manage profile images | ALL | authenticated | `is_any_school_admin(jwt.email)` |

---

## 5. Storage Design

### 5.1 Storage Bucket

| Property | Value |
|----------|-------|
| Bucket name | `profile-images` |
| Public | Yes (public read access) |
| Purpose | Stores all profile-related images (portraits, QR codes, additional photos) |

### 5.2 File Organization

```
profile-images/
├── brad-fisher/
│   ├── portrait.jpeg      — Main portrait photo
│   ├── qr.jpeg            — QR code linking to profile page
│   ├── photo.jpeg          — Additional photo
│   └── action.jpeg         — Additional photo
├── jane-doe/
│   ├── portrait.jpeg
│   └── qr.jpeg
└── {slug}/
    └── {timestamp}.{ext}   — Uploaded via admin UI
```

### 5.3 Naming Conventions

- **Directory:** Profile slug (e.g., `brad-fisher/`)
- **Files uploaded via admin UI:** `{timestamp}.{ext}` (e.g., `1711234567890.jpeg`)
- **Manually uploaded (migration):** Descriptive names (e.g., `portrait.jpeg`, `qr.jpeg`)

### 5.4 Access Rules (Storage RLS)

| Policy | Command | Roles | Condition |
|--------|---------|-------|-----------|
| Anyone can view profile images | SELECT | public | `bucket_id = 'profile-images'` |
| Admins can upload profile images | INSERT | authenticated | `bucket_id = 'profile-images' AND is_any_school_admin(jwt.email)` |
| Admins can delete profile images | DELETE | authenticated | `bucket_id = 'profile-images' AND is_any_school_admin(jwt.email)` |

### 5.5 Static Assets (Repository)

These legacy/non-profile images remain as static files in `src/assets/`:

| File | Purpose |
|------|---------|
| `evaan-portrait.jpeg` | Project creator portrait (About page) |
| `about-qr.jpeg` | QR code for About page |
| `hero-community.jpg` | Hero section image on landing page |

---

## 6. Authentication & Authorization — Deep Dive

### 6.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTH LIFECYCLE                            │
│                                                             │
│  1. SIGN UP                                                 │
│     User → /admin/login → enters email + password           │
│     App → supabase.auth.signUp({ email, password })         │
│     Supabase → sends confirmation email                     │
│     User → clicks email link → account confirmed            │
│                                                             │
│  2. SIGN IN                                                 │
│     User → /admin/login → enters credentials                │
│     App → supabase.auth.signInWithPassword(...)             │
│     App → supabase.rpc("is_any_school_admin", { email })    │
│     ├─ TRUE  → navigate("/admin")                           │
│     └─ FALSE → supabase.auth.signOut() + "Access denied"    │
│                                                             │
│  3. SESSION CHECK (on page load)                            │
│     Admin.tsx / AdminLogin.tsx useEffect:                    │
│     App → supabase.auth.getSession()                        │
│     ├─ No session → redirect to /admin/login                │
│     └─ Has session → RPC check → allow or redirect          │
│                                                             │
│  4. SIGN OUT                                                │
│     Admin → clicks Logout button                            │
│     App → supabase.auth.signOut()                           │
│     App → navigate("/admin/login")                          │
│                                                             │
│  5. ADMIN DETECTION ON PUBLIC PAGES                         │
│     AppreciationWall checks session on mount:               │
│     supabase.auth.getSession() → if session exists →        │
│     supabase.rpc("is_any_school_admin") →                   │
│     if true → show trash icons on appreciation cards        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Authorization Model

The system uses a **table-based admin model** (not a roles enum):

```
┌──────────────┐         ┌──────────────────┐
│  auth.users  │         │  school_admins   │
│              │         │                  │
│  id (uuid)   │◄───────▶│  email (text)    │
│  email       │  match  │  school_id (FK)  │
│              │  by     │                  │
└──────────────┘ email   └────────┬─────────┘
                                  │
                                  │ FK
                                  ▼
                         ┌──────────────────┐
                         │     schools      │
                         │                  │
                         │  id (uuid)       │
                         │  name            │
                         └──────────────────┘
```

**Key design decisions:**
- Admin status is **not** stored in `auth.users` metadata or a separate `user_roles` table
- Instead, `school_admins` table links emails to schools
- Two `SECURITY DEFINER` functions abstract the lookup and are used in RLS policies
- This means admin access is **school-scoped** — an admin for School A cannot see School B's data
- Admin detection also runs on public pages (e.g., AppreciationWall) to conditionally show moderation controls
- Profile management uses `is_any_school_admin` (not school-scoped) since profiles can be community-wide

### 6.3 Permission Matrix

| Action | Public | Authenticated (non-admin) | School Admin | Any Admin |
|--------|:------:|:------------------------:|:------------:|:---------:|
| View gallery & published profiles | ✅ | ✅ | ✅ | ✅ |
| Submit nomination | ✅ | ✅ | ✅ | ✅ |
| Submit appreciation (incl. anonymous) | ✅ | ✅ | ✅ | ✅ |
| View approved appreciations | ✅ | ✅ | ✅ | ✅ |
| View ALL appreciations | ❌ | ❌ | ❌ | ✅ |
| Delete appreciations (trash icon) | ❌ | ❌ | ❌ | ✅ |
| View nominations | ❌ | ❌ | ✅ (own school) | ✅ (own school) |
| Update nomination status | ❌ | ❌ | ✅ (own school) | ✅ (own school) |
| Add/remove school admins | ❌ | ❌ | ✅ (own school) | ✅ (own school) |
| View school admins list | ❌ | ❌ | ✅ (own school) | ✅ (own school) |
| Create/edit/publish profiles | ❌ | ❌ | ❌ | ✅ |
| Upload/delete profile images | ❌ | ❌ | ❌ | ✅ |
| View draft profiles | ❌ | ❌ | ❌ | ✅ |

### 6.4 Security Layers

```
Layer 1: Supabase Auth (JWT)
  └─ Verifies identity (email/password)

Layer 2: RPC gate (application-level)
  └─ is_any_school_admin() — blocks non-admins from reaching /admin UI

Layer 3: RLS policies (database-level)
  └─ is_school_admin() — scopes data access per school
  └─ is_any_school_admin() — scopes profile/appreciation management
  └─ Even if someone bypasses the UI, the DB won't return unauthorized data

Layer 4: Storage policies (bucket-level)
  └─ Only admins can upload/delete from profile-images bucket
  └─ Public can read all stored images

Layer 5: Edge Function (service role)
  └─ moderate-appreciation uses SERVICE_ROLE_KEY
  └─ Bypasses RLS intentionally to insert moderated content

Layer 6: AI Moderation (content-level)
  └─ Gemini Flash Lite checks message intent before insertion
  └─ Rejects negative, inappropriate, or non-appreciative content
```

### 6.5 How to Expand Authentication

#### Adding New Admin Roles (e.g., Super Admin, Moderator)

**Option A: Extend school_admins with a role column**
```sql
ALTER TABLE public.school_admins ADD COLUMN role text NOT NULL DEFAULT 'admin';
-- Values: 'admin', 'moderator', 'super_admin'

-- New RPC function
CREATE FUNCTION public.has_school_role(_email text, _school_id uuid, _role text)
RETURNS boolean ...
```

**Option B: Separate user_roles table (recommended for complex RBAC)**
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'super_admin');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
) $$;
```

#### Adding Social Login (Google, etc.)
1. Configure OAuth provider in Lovable Cloud auth settings
2. Add social login buttons to AdminLogin.tsx
3. Use `supabase.auth.signInWithOAuth({ provider: 'google' })`
4. Admin check remains the same (email-based)

#### Adding Password Reset
1. Add "Forgot password" link to AdminLogin.tsx
2. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
3. Create `/reset-password` page that calls `supabase.auth.updateUser({ password })`

---

## 7. Admin Workflows — Deep Dive

### 7.1 Admin Dashboard Structure

```
/admin
├── Tab: Nominations
│   ├── Stats: Total | Pending | Approved | Featured
│   ├── List of nominations (filtered by school via RLS)
│   ├── Status badges: Pending | Approved | Declined | Featured
│   ├── Click to expand → view full details
│   ├── Update status (Approve / Feature / Decline / Reset)
│   ├── Admin notes textarea
│   └── Save changes
│
├── Tab: Profiles
│   ├── List of all profiles (draft + published)
│   ├── Create New Profile button
│   ├── Edit existing profiles
│   ├── Upload images (portrait, QR code, additional photos)
│   ├── Image management grid with type badges
│   ├── Publish / Unpublish toggle
│   └── Delete profile (with confirmation)
│
└── Tab: Manage Admins
    ├── List of current admins for the school
    ├── Add admin by email
    └── Remove admin (with confirmation)
```

### 7.2 Nomination Review Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PENDING    │────►│   APPROVED   │────►│   FEATURED   │
│              │     │              │     │ (on gallery)  │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       │
       ▼
┌──────────────┐
│   DECLINED   │
│              │
└──────────────┘
```

**Step-by-step:**
1. Community member submits nomination at `/nominate`
2. Form validated with Zod (nominee name, role, department, reason, nominator info)
3. Row inserted into `nominations` with `status = 'pending'`
4. School admin logs in → sees pending nominations
5. Admin reviews details, adds internal notes
6. Admin sets status to `approved`, `declined`, or `featured`
7. `updated_at` auto-updated via database trigger

### 7.3 Profile Creation & Publishing Workflow

```
┌──────────────────────────────────────────────────────┐
│  PROFILE LIFECYCLE                                   │
│                                                      │
│  1. Admin goes to Profiles tab → clicks New Profile  │
│  2. Fills in: Name, URL slug, role, department, bio  │
│  3. Uploads images:                                  │
│     - Portrait (main profile photo)                  │
│     - QR code (links to profile page)                │
│     - Additional photos (action shots, etc.)         │
│  4. Saves → profile created as DRAFT                 │
│  5. Admin reviews in profile list                    │
│  6. Clicks Publish → status = "published"            │
│  7. Profile appears in gallery automatically         │
│  8. Appreciation wall auto-enabled via profile slug  │
│  9. Admin can Unpublish to hide from gallery         │
│ 10. Admin can Delete (removes profile + all images)  │
└──────────────────────────────────────────────────────┘
```

**Image upload flow:**
1. Admin clicks "Upload Portrait" / "Upload QR Code" / "Upload Additional Photo"
2. File uploaded to `profile-images/{slug}/{timestamp}.{ext}` in storage
3. Public URL generated and stored in `profile_images` table
4. Images displayed in management grid with type badges
5. Admin can delete individual images

### 7.4 Appreciation Moderation Workflow

```
User submits message (optionally anonymous)
       │
       ▼
┌──────────────────┐
│  Edge Function   │
│  Validates input │
│  (≤500 chars)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  AI Moderation   │
│  Gemini Flash    │
│  Lite model      │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│APPROVED│ │ REJECTED │
│ (shown │ │ (stored  │
│ on wall│ │  but not │
│  with  │ │  shown)  │
│  toast)│ │          │
└────────┘ └──────────┘
         │
         ▼ (admin can)
    ┌──────────┐
    │ DELETED  │
    │ (removed │
    │ from DB) │
    └──────────┘
```

**Rejection message shown to user:**
> "This message wasn't posted as it doesn't appear to be positive or appreciative. Please try again with a kinder message."

**Admin moderation capabilities:**
- View all approved messages on any profile page
- Delete inappropriate messages that passed AI moderation via trash icon
- Trash icons are conditionally rendered only when admin is authenticated

### 7.5 Admin Management Workflow

```
Existing Admin
       │
       ├── Add new admin
       │   └── Enter email → INSERT into school_admins
       │       └── New admin can now log in and access dashboard
       │
       └── Remove admin
           └── Click trash icon → DELETE from school_admins
               └── Removed admin loses access immediately
```

**Important:** Adding an admin email to `school_admins` does NOT create an auth account. The new admin must separately sign up at `/admin/login`. Their email must match the one in `school_admins`.

---

## 8. Data Flow Diagrams

### 8.1 Appreciation Submission (Sequence)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant EdgeFn as moderate-appreciation
    participant AI as Lovable AI Gateway
    participant DB as PostgreSQL

    User->>Browser: Types message (optionally leaves name blank for anon)
    User->>Browser: Clicks Post
    Browser->>EdgeFn: POST {author_name?, message, profile_slug}
    EdgeFn->>EdgeFn: Validate (message required, ≤500 chars)
    EdgeFn->>AI: POST /v1/chat/completions (Gemini Flash Lite)
    Note over AI: System prompt defines<br/>approval/rejection criteria
    AI-->>EdgeFn: {approved: true/false, reason: "..."}
    EdgeFn->>DB: INSERT INTO appreciations (status = approved|rejected)
    EdgeFn-->>Browser: {success, approved, reason}
    alt Approved
        Browser->>DB: SELECT approved appreciations (reload wall)
        Browser->>User: "Thank you! 💜" toast + message appears
    else Rejected
        Browser->>User: "Message not posted" toast with guidance
    end
```

### 8.2 Nomination Submission (Sequence)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant DB as PostgreSQL

    User->>Browser: Fills nomination form
    Browser->>Browser: Zod schema validation
    alt Validation fails
        Browser->>User: Show field errors
    else Validation passes
        Browser->>DB: INSERT INTO nominations (status=pending, school_id from lookup)
        DB-->>Browser: Success (201)
        Browser->>User: Show confirmation screen with checkmark
    end
```

### 8.3 Admin Login (Sequence)

```mermaid
sequenceDiagram
    participant Admin
    participant Browser
    participant Auth as Supabase Auth
    participant DB as PostgreSQL

    Admin->>Browser: Enter email + password
    Browser->>Auth: signInWithPassword(email, password)
    Auth-->>Browser: JWT session token
    Browser->>DB: RPC is_any_school_admin(email)
    DB-->>Browser: true/false
    alt Is admin
        Browser->>Browser: Navigate to /admin
        Browser->>DB: SELECT school_admins WHERE email (get school_id)
        Browser->>DB: SELECT nominations WHERE school_id (RLS enforced)
        DB-->>Browser: Nominations for this school
    else Not admin
        Browser->>Auth: signOut()
        Browser->>Admin: "Access denied" toast
    end
```

### 8.4 Admin Creates Profile (Sequence)

```mermaid
sequenceDiagram
    participant Admin
    participant Browser
    participant Storage as Supabase Storage
    participant DB as PostgreSQL

    Admin->>Browser: Clicks "New Profile" in Profiles tab
    Admin->>Browser: Fills name, slug, role, department, bio
    Admin->>Browser: Uploads portrait image
    Browser->>Storage: PUT profile-images/{slug}/{timestamp}.jpeg
    Storage-->>Browser: Public URL
    Admin->>Browser: Clicks "Save Profile"
    Browser->>DB: INSERT INTO profiles (status='draft')
    DB-->>Browser: Profile row (with id)
    Browser->>DB: INSERT INTO profile_images (profile_id, image_url, type='portrait')
    DB-->>Browser: Success
    Admin->>Browser: Clicks "Publish"
    Browser->>DB: UPDATE profiles SET status='published' WHERE id=X
    DB-->>Browser: Success
    Note over Browser: Profile now visible in Gallery<br/>and at /gallery/{slug}
```

### 8.5 Admin Deletes Appreciation (Sequence)

```mermaid
sequenceDiagram
    participant Admin
    participant Browser
    participant DB as PostgreSQL

    Note over Admin: Already authenticated + on profile page
    Note over Browser: Trash icons visible because isAdmin=true
    Admin->>Browser: Clicks trash icon on appreciation card
    Browser->>DB: DELETE FROM appreciations WHERE id = X
    Note over DB: RLS checks: is_any_school_admin(jwt.email)
    DB-->>Browser: Success
    Browser->>Browser: Remove card from UI (state update)
    Browser->>Admin: "Deleted" toast
```

### 8.6 Admin Adds Another Admin

```mermaid
sequenceDiagram
    participant Admin
    participant Browser
    participant DB as PostgreSQL

    Admin->>Browser: Types new admin email, clicks Add
    Browser->>DB: INSERT INTO school_admins (email, school_id)
    Note over DB: RLS checks: is_school_admin(jwt.email, school_id)
    DB-->>Browser: Success
    Browser->>Browser: Refresh admin list
    Note over Browser: New admin must separately<br/>sign up at /admin/login
```

---

## 9. Extensibility & Expansion Guide

### 9.1 Adding a New School

1. Insert row into `schools` table (name, district)
2. Insert initial admin into `school_admins` (email, school_id)
3. Admin signs up at `/admin/login`
4. RLS automatically scopes their data

### 9.2 Adding Community Profiles (No School)

Profiles already support `school_id = NULL`, making them community-wide:
1. Admin creates profile without specifying a school
2. Profile appears in the global gallery
3. Future: Gallery page can filter by school or show all

### 9.3 Linking Nominations to Profiles

**Not yet implemented.** To enable "Create Profile from Nomination":
1. Add `nomination_id uuid REFERENCES nominations(id)` to profiles table
2. Add "Create Profile" button on approved nominations
3. Pre-fill profile form with nominee data
4. Link provides traceability from nomination → profile

### 9.4 Adding Notifications

**Email on new nomination:**
```sql
-- Database webhook or Edge Function trigger
-- When INSERT on nominations → call edge function → send email
```

**Implementation options:**
1. Supabase Database Webhooks → Edge Function → email API (Resend, SendGrid)
2. Realtime subscription in admin dashboard for live updates
3. Daily digest edge function via pg_cron

### 9.5 Adding Rate Limiting

**At Edge Function level:**
```typescript
// In moderate-appreciation:
// Check IP-based or fingerprint-based rate limit
// Store attempts in a rate_limits table or use in-memory counter
```

### 9.6 Multi-School Gallery

Gallery currently shows all published profiles globally. To support per-school filtering:
1. Profiles already have optional `school_id`
2. Add school filter/tabs to Gallery page
3. Each school could have a subdomain or route prefix

---

## 10. Environment Setup

### 10.1 Lovable Cloud (Auto-Provisioned)

| Service | Purpose | Status |
|---------|---------|--------|
| PostgreSQL database | All persistent data | ✅ Active |
| Supabase Auth | Email/password authentication | ✅ Active |
| PostgREST API | Auto-generated REST from schema | ✅ Active |
| Edge Functions (Deno) | Server-side logic (moderation) | ✅ Active |
| Storage | Profile image uploads | ✅ Active (profile-images bucket) |
| Realtime | Available but not currently used | ⬜ Available |

### 10.2 Client Environment Variables (`.env` — auto-managed)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | API base URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key for client SDK |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

### 10.3 Edge Function Secrets

| Secret | Purpose | Auto-provided |
|--------|---------|:------------:|
| `LOVABLE_API_KEY` | Lovable AI Gateway auth | Yes |
| `SUPABASE_URL` | DB access from edge functions | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypass RLS in edge functions | Yes |
| `SUPABASE_ANON_KEY` | Available (unused) | Yes |
| `SUPABASE_DB_URL` | Direct DB connection | Yes |
| `SUPABASE_PUBLISHABLE_KEY` | Available (unused) | Yes |

### 10.4 External Integrations

| Service | Endpoint / ID | Purpose |
|---------|---------------|---------|
| Lovable AI Gateway | `https://ai.gateway.lovable.dev/v1/chat/completions` | Content moderation |
| Google Analytics 4 | Measurement ID: `G-Y5B9N202G7` | Website analytics & traffic tracking |

### 10.5 Google Analytics Integration

GA4 is integrated via the global `gtag.js` snippet in `index.html`. It tracks:
- Page views (automatic)
- User engagement (automatic)
- No custom events configured yet

---

## 11. Known Gaps / Risks / Technical Debt

| # | Issue | Severity | Impact | Suggested Fix |
|---|-------|----------|--------|---------------|
| 1 | No notification system | **Medium** | Admins must manually check for nominations | Add email via edge function + webhook |
| 2 | No global auth context | **Low** | Session checked independently per page; could lead to inconsistencies | Create AuthProvider with React Context |
| 3 | react-query underutilized | **Low** | Missing caching, deduplication, background refetch | Migrate to useQuery/useMutation hooks |
| 4 | profile_slug is a soft reference | **Medium** | No referential integrity between appreciations and profiles | Add FK from appreciations.profile_slug to profiles.slug |
| 5 | Status fields are freeform text | **Low** | Typo risk, no DB validation | Convert to PostgreSQL enums |
| 6 | Admin signup exposed | **Low** | Anyone can create auth accounts (but can't access admin) | Hide signup, use invite-only flow |
| 7 | No rate limiting | **Medium** | Abuse via spam submissions | Add IP-based rate limits in edge function |
| 8 | No password reset flow | **Low** | Admins can't recover accounts | Add forgot-password + /reset-password page |
| 9 | No audit logging | **Low** | No trail of admin actions | Add audit_log table |
| 10 | CASCADE behavior on schools | **Low** | Deleting a school may leave orphaned nominations/admins | Add ON DELETE CASCADE to FKs |
| 11 | No custom GA4 events | **Low** | Limited analytics insight | Add events for nomination submit, appreciation post, admin actions |
| 12 | No nomination-to-profile link | **Low** | Profiles created independently from nominations | Add nomination_id FK to profiles |

### Resolved Since v2.0
- ✅ Dynamic profile CMS (profiles + profile_images tables + admin UI)
- ✅ Storage bucket for image uploads (profile-images)
- ✅ Database indexes on profiles, profile_images
- ✅ Brad Fisher migrated from hardcoded to dynamic system

---

## Appendix A: SQL Schema

```sql
-- =============================================
-- FULL SQL SCHEMA — Now We See You
-- Version 3.0 — March 24, 2026
-- =============================================

-- Schools
CREATE TABLE public.schools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    district text NOT NULL DEFAULT 'Lake Washington School District',
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools are viewable by everyone" ON public.schools FOR SELECT TO public USING (true);

-- School Admins
CREATE TABLE public.school_admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    school_id uuid NOT NULL REFERENCES public.schools(id),
    added_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view their school admins" ON public.school_admins FOR SELECT TO public USING (is_school_admin((auth.jwt() ->> 'email'), school_id));
CREATE POLICY "Admins can add admins to their school" ON public.school_admins FOR INSERT TO public WITH CHECK (is_school_admin((auth.jwt() ->> 'email'), school_id));
CREATE POLICY "Admins can remove admins from their school" ON public.school_admins FOR DELETE TO public USING (is_school_admin((auth.jwt() ->> 'email'), school_id));

-- Nominations
CREATE TABLE public.nominations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id),
    nominee_name text NOT NULL,
    nominee_role text NOT NULL,
    nominee_department text NOT NULL,
    reason text NOT NULL,
    nominator_name text NOT NULL,
    nominator_email text NOT NULL,
    nominee_informed boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'pending',
    admin_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit nominations" ON public.nominations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view their school nominations" ON public.nominations FOR SELECT TO public USING (is_school_admin((auth.jwt() ->> 'email'), school_id));
CREATE POLICY "Admins can update their school nominations" ON public.nominations FOR UPDATE TO public USING (is_school_admin((auth.jwt() ->> 'email'), school_id));

-- Profiles
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    department text,
    bio text,
    school_id uuid REFERENCES public.schools(id),
    status text NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published profiles are public" ON public.profiles FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL TO authenticated
    USING (is_any_school_admin((auth.jwt() ->> 'email')))
    WITH CHECK (is_any_school_admin((auth.jwt() ->> 'email')));

-- Profile Images
CREATE TABLE public.profile_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    image_type text NOT NULL DEFAULT 'additional',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile images for published profiles are public" ON public.profile_images FOR SELECT TO public
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND status = 'published'));
CREATE POLICY "Admins can manage profile images" ON public.profile_images FOR ALL TO authenticated
    USING (is_any_school_admin((auth.jwt() ->> 'email')))
    WITH CHECK (is_any_school_admin((auth.jwt() ->> 'email')));

-- Appreciations
CREATE TABLE public.appreciations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message text NOT NULL,
    author_name text,
    profile_slug text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appreciations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit appreciations" ON public.appreciations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Approved appreciations are public" ON public.appreciations FOR SELECT TO public USING (status = 'approved');
CREATE POLICY "Admins can view all appreciations" ON public.appreciations FOR SELECT TO authenticated USING (is_any_school_admin((auth.jwt() ->> 'email')));
CREATE POLICY "Admins can delete appreciations" ON public.appreciations FOR DELETE TO authenticated USING (is_any_school_admin((auth.jwt() ->> 'email')));

-- Indexes
CREATE INDEX idx_profiles_slug ON public.profiles(slug);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX idx_profile_images_profile_id ON public.profile_images(profile_id);
CREATE INDEX idx_profile_images_type ON public.profile_images(image_type);

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);
CREATE POLICY "Anyone can view profile images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-images');
CREATE POLICY "Admins can upload profile images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-images' AND is_any_school_admin((auth.jwt() ->> 'email')));
CREATE POLICY "Admins can delete profile images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'profile-images' AND is_any_school_admin((auth.jwt() ->> 'email')));

-- Triggers
CREATE TRIGGER update_nominations_updated_at BEFORE UPDATE ON public.nominations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions
CREATE OR REPLACE FUNCTION public.is_any_school_admin(_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_admins WHERE email = lower(_email))
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin(_email text, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_admins WHERE email = lower(_email) AND school_id = _school_id)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
```

---

## Appendix B: API Contracts

### Edge Function: `moderate-appreciation`

**Endpoint:** `POST /functions/v1/moderate-appreciation`

**Request:**
```json
{
  "author_name": "Jane",
  "message": "Thank you for everything!",
  "profile_slug": "brad-fisher"
}
```

**Response (approved):**
```json
{
  "success": true,
  "approved": true,
  "reason": "Your appreciation has been posted!"
}
```

**Response (rejected):**
```json
{
  "success": true,
  "approved": false,
  "reason": "This message wasn't posted as it doesn't appear to be positive or appreciative. Please try again with a kinder message."
}
```

### Supabase SDK Examples

**Fetch published profiles for gallery:**
```typescript
const { data } = await supabase
  .from("profiles")
  .select("id, slug, name, role, department")
  .eq("status", "published")
  .order("created_at", { ascending: true });
```

**Fetch profile by slug:**
```typescript
const { data } = await supabase
  .from("profiles")
  .select("id, slug, name, role, department, bio")
  .eq("slug", "brad-fisher")
  .eq("status", "published")
  .single();
```

**Fetch profile images:**
```typescript
const { data } = await supabase
  .from("profile_images")
  .select("id, image_url, image_type, sort_order")
  .eq("profile_id", profileId)
  .order("sort_order");
```

**Admin: Create profile:**
```typescript
const { data, error } = await supabase
  .from("profiles")
  .insert({
    name: "Jane Doe",
    slug: "jane-doe",
    role: "Cafeteria Manager",
    department: "Food Services",
    bio: "Jane has been...",
    school_id: schoolId, // optional
    status: "draft",
  })
  .select()
  .single();
```

**Admin: Upload profile image:**
```typescript
const { error } = await supabase.storage
  .from("profile-images")
  .upload(`jane-doe/${Date.now()}.jpeg`, file);

const { data } = supabase.storage
  .from("profile-images")
  .getPublicUrl(`jane-doe/${Date.now()}.jpeg`);

await supabase.from("profile_images").insert({
  profile_id: profileId,
  image_url: data.publicUrl,
  image_type: "portrait",
  sort_order: 0,
});
```

**Admin: Publish profile:**
```typescript
await supabase
  .from("profiles")
  .update({ status: "published" })
  .eq("id", profileId);
```

**Fetch approved appreciations:**
```typescript
const { data } = await supabase
  .from("appreciations")
  .select("id, author_name, message, created_at")
  .eq("profile_slug", "brad-fisher")
  .eq("status", "approved")
  .order("created_at", { ascending: false });
```

**Submit nomination:**
```typescript
const { error } = await supabase.from("nominations").insert({
  nominee_name: "Brad Fisher",
  nominee_role: "Head Custodian",
  nominee_department: "Facilities",
  reason: "Goes above and beyond every day...",
  nominator_name: "Jane Doe",
  nominator_email: "jane@school.edu",
  school_id: "uuid-here",
  nominee_informed: true,
});
```

---

## Appendix C: Secrets & External Integrations

| Secret Name | Location | Purpose |
|-------------|----------|---------|
| `LOVABLE_API_KEY` | Edge Function env | Authenticates with Lovable AI Gateway |
| `SUPABASE_URL` | Edge Function env | Database API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function env | Full DB access (bypasses RLS) |
| `SUPABASE_ANON_KEY` | Edge Function env | Available, unused |
| `SUPABASE_DB_URL` | Edge Function env | Direct Postgres connection string |
| `VITE_SUPABASE_URL` | Client `.env` | Client-side API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client `.env` | Client-side anon key |

| External Service | URL / ID | Auth Method | Purpose |
|-----------------|----------|-------------|---------|
| Lovable AI Gateway | `https://ai.gateway.lovable.dev/v1/chat/completions` | Bearer token (`LOVABLE_API_KEY`) | Content moderation |
| Google Analytics 4 | `G-Y5B9N202G7` | Public measurement ID | Website analytics |

---

## Appendix D: Mermaid Diagrams

All diagrams in this document use Mermaid syntax. To render them:

1. **Online:** Paste into [mermaid.live](https://mermaid.live)
2. **VS Code:** Install "Mermaid Preview" extension
3. **Notion/Confluence:** Use Mermaid code blocks
4. **Draw.io:** Import Mermaid syntax
5. **Lucidchart:** Copy diagram logic manually

### Tips for Architecture Diagrams
- Use the ERD in Section 4.1 as the base for your database diagram
- Use sequence diagrams in Section 8 as the base for flow diagrams
- The ASCII diagrams in Sections 6 and 7 can be recreated in any diagramming tool
