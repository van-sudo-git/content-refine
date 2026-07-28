Minimal database-only change: add an `email` column to `club_roles` so admins can assign roles by email (which they know) instead of by `user_id` UUID (which they don't). No UI or code changes — user will handle those outside Lovable.

What will change

- Add `email text` column to `public.club_roles`, stored lowercase.
- Make `user_id` nullable so a row can exist for an invited student before they've signed up.
- Add a `CHECK` constraint requiring at least one of `user_id` or `email` to be present.
- Add a unique index on `(school_id, role, email)` (partial, where `email is not null`) to prevent duplicate invites for the same role at the same school.
- Add an index on `lower(email)` for lookups.
- Leave existing RLS policies and grants unchanged — they already scope by `school_id`.

Not included

- No new tables, no triggers, no RPC.
- No changes to `AdminLogin`, `Admin.tsx`, or any React component.
- No demo data changes.
- No claim/linking logic — you'll wire `user_id` yourself later (either manually or with your own function).

Technical detail

Single migration:

```sql
ALTER TABLE public.club_roles
  ADD COLUMN email text,
  ALTER COLUMN user_id DROP NOT NULL,
  ADD CONSTRAINT club_roles_user_or_email_present
    CHECK (user_id IS NOT NULL OR email IS NOT NULL);

CREATE UNIQUE INDEX club_roles_school_role_email_uniq
  ON public.club_roles (school_id, role, lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX club_roles_email_idx
  ON public.club_roles (lower(email));
```