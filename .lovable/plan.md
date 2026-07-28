Decisions locked in: single Lovable commit for `types.ts`, no `featured` column, flyer files stored in existing `profile-images` bucket.

## Migration (single `supabase--migration` call, one transaction)

### Enums
- `public.club_role` — `journalist`, `photographer`, `artist`, `pr`
- `public.nomination_status` — `pending`, `approved`, `assigned`, `in_progress`, `submitted`, `published`

### Table `public.club_roles`
Columns: `id uuid PK default gen_random_uuid()`, `user_id uuid NOT NULL → auth.users(id) ON DELETE CASCADE`, `school_id uuid NOT NULL → schools(id) ON DELETE CASCADE`, `role public.club_role NOT NULL`, `created_at`, `updated_at`.
Unique `(user_id, school_id, role)`. Index `(school_id, role)`. `update_updated_at_column` BEFORE UPDATE trigger.

Grants: `SELECT, INSERT, UPDATE, DELETE` to `authenticated`; `ALL` to `service_role`. No `anon`.

RLS:
- SELECT: `user_id = auth.uid()` OR `private.is_school_admin(email, school_id)` OR `private.is_global_admin(email)`.
- INSERT / UPDATE / DELETE: school admin for that `school_id` OR global admin.

### Table `public.flyers`
Columns: `id uuid PK`, `profile_id uuid NOT NULL → profiles(id) ON DELETE CASCADE`, `school_id uuid NOT NULL → schools(id)`, `redirect_id text → redirects(id) ON DELETE SET NULL`, `file_url text` (path inside the existing `profile-images` bucket), `created_by uuid → auth.users(id)`, `created_at`, `updated_at`. `update_updated_at_column` trigger.

Grants: `SELECT, INSERT, UPDATE, DELETE` to `authenticated`; `ALL` to `service_role`. No `anon`.

RLS:
- SELECT: PR-role for `school_id` OR school/global admin.
- INSERT / UPDATE: PR-role for `school_id` OR school/global admin.
- DELETE: school/global admin only.

No storage bucket changes — reuses `profile-images`. Existing bucket policies already allow admin uploads; PR-role uploads happen through your frontend code, which you'll wire yourself.

### Helper functions (SECURITY DEFINER, search_path = public)
- `private.has_club_role(_user_id uuid, _school_id uuid, _role public.club_role) returns boolean`
- `private.can_read_nomination(_nomination_id uuid, _user_id uuid) returns boolean` — checks whether `_user_id` owns any of the nomination's `journalist_id` / `photographer_id` / `artist_id` `club_roles` rows. Used by the nominations SELECT policy to avoid recursive RLS.

### `public.profiles` — one new SELECT policy
- Authenticated caller with a `club_roles` row `role='pr'` for `profiles.school_id` may SELECT profiles regardless of `status`. Existing published-public and admin-manage policies untouched. **No PR write access to profiles.**

### `public.nominations` changes
- Add `journalist_id`, `photographer_id`, `artist_id` uuid nullable, all references `club_roles(id) ON DELETE SET NULL`.
- Replace `status text` with `status public.nomination_status NOT NULL DEFAULT 'pending'`: add new column, backfill (3 rows: `approved` → `approved`), drop old, rename.
- New SELECT policy for authenticated: `private.can_read_nomination(id, auth.uid())`. Existing school-admin and global-admin policies unchanged.

## Edge functions + trigger

Prerequisite check: if the email domain is not set up yet, I'll surface the email setup dialog first — nothing else in this section runs until that's resolved. Run `setup_email_infra` and `scaffold_transactional_email` if not already done.

- AFTER UPDATE trigger on `nominations` fires only when `status` changes. Uses `pg_net` to POST to the edge function with service-role auth.
- `notify-nomination-assigned` — on `status → approved`. Looks up `journalist_id`, `photographer_id`, `artist_id` in `club_roles`, resolves emails via `auth.users`, sends template `nomination-assigned` to each.
- `notify-nomination-published` — on `status → published`. Sends template `nomination-published-pr` to all `club_roles` with `role='pr'` in that school; sends `nomination-published-admin` to school admins for that school plus global admins.
- Three new templates in `supabase/functions/_shared/transactional-email-templates/` + registry update.

## Application order

1. One `supabase--migration` call carrying enums, both tables, grants, RLS, helpers, nominations changes + backfill, trigger. You review the full SQL before it runs.
2. Email infra prerequisites if missing.
3. Edge functions + templates written and deployed.
4. Lovable regenerates `src/integrations/supabase/types.ts` — single Lovable-authored commit, only file touched under `src/`. All frontend wiring stays yours.
