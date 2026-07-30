# Club roles: email invites, auto-claim on signup, and the UX to drive it

## Current state (verified)

- `club_roles` already has `email text`, nullable `user_id`, `school_id`, `role`, timestamps.
- The `club_role` enum is `journalist | photographer | artist | pr`.
- There are no triggers in the database, so nothing links an invited email to a user when they sign up.
- `AdminLogin.tsx` signs the user out unless their email is in `school_admins`, so a club member cannot get past login today.
- `nominations` has `journalist_id`, `photographer_id`, `artist_id` and a `can_read_nomination` policy for assigned members. Profiles already allow PR read access per school.

## Part 1 — Remaining database work

Only one migration is still needed: auto-claim pending invites at signup.

```sql
CREATE OR REPLACE FUNCTION public.claim_club_role_invites()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.club_roles
     SET user_id = NEW.id, updated_at = now()
   WHERE user_id IS NULL AND lower(email) = lower(NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_claim_club_roles
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.claim_club_role_invites();
```

Plus a uniqueness guard so the same person is not invited twice for one role:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS club_roles_school_role_email_uniq
  ON public.club_roles (school_id, role, lower(email))
  WHERE email IS NOT NULL;
```

No RLS or grant changes: the existing school-scoped policies already cover admin management and self-read.

## Part 2 — UX code changes

### 2a. New "Club Roles" tab in the admin dashboard

`src/pages/Admin.tsx`

- Add `"club_roles"` to the `activeTab` union and a tab button next to Manage Admins.
- Render `<AdminClubRoles schoolId={schoolId} isDemo={isDemo} />`.

### 2b. New component `src/components/AdminClubRoles.tsx`

- Lists rows for the current school grouped by role.
- Each row shows the email plus a badge: "Active" when `user_id` is set, "Pending signup" when null.
- Invite form: email input + role select.
- Remove and change-role actions.
- Demo mode blocks writes through the existing `demoGuard`.

```tsx
const { data } = await supabase
  .from("club_roles")
  .select("id, role, email, user_id, created_at")
  .eq("school_id", schoolId)
  .order("role");

await supabase.from("club_roles").insert({
  school_id: schoolId,
  role,
  email: email.trim().toLowerCase(),
  user_id: null,
});
```

Unique-violation (`code === "23505"`) maps to the toast "This email is already invited for that role."

### 2c. Shared sign-in that routes by role

`src/pages/AdminLogin.tsx`

- Reword the heading from "Admin Access" to "Sign in" so both admins and club members use it.
- Replace the admin-only redirect with a role check after sign-in:
  1. `school_admins` match by email, go to `/admin`.
  2. Otherwise `club_roles` match on `user_id = auth.uid()`, go to `/club`.
  3. Otherwise sign out with "Access denied".
- Sign-up flow is unchanged. By the time the confirmed user signs in, the trigger has already set `user_id`, so step 2 finds them.

### 2d. New route `/club`

`src/pages/ClubDashboard.tsx` (new), gated behind `useAuthReady`.

```tsx
const { data: myRoles } = await supabase
  .from("club_roles")
  .select("role, school_id")
  .eq("user_id", user.id);
```

Sections render from the roles returned:

- `pr`: reuse the existing profile manager scoped to their school, plus flyers.
- `journalist` / `photographer` / `artist`: nominations assigned to them.

```tsx
supabase.from("nominations")
  .select("*")
  .eq(`${role}_id`, user.id)
  .order("created_at", { ascending: false });
```

- No roles: empty state pointing them at their school admin.

### 2e. Route registration

`src/App.tsx`

```tsx
import ClubDashboard from "./pages/ClubDashboard.tsx";
<Route path="/club" element={<ClubDashboard />} />
```

### 2f. Navigation

`src/components/Navbar.tsx`: optional "My Chapter" link shown only when the signed-in user has at least one club role. No change to public nav.

### 2g. Demo data

`src/lib/demoData.ts`: add a `DEMO_CLUB_ROLES` array mixing active and pending rows so the new tab is populated in demo mode.

## Files touched

- Migration: `claim_club_role_invites` function, trigger, unique index.
- New: `src/components/AdminClubRoles.tsx`, `src/pages/ClubDashboard.tsx`.
- Edited: `src/pages/Admin.tsx`, `src/pages/AdminLogin.tsx`, `src/App.tsx`, `src/lib/demoData.ts`, optionally `src/components/Navbar.tsx`.
- Untouched: existing RLS policies, edge functions, email templates.

## Business rules

- One email may hold several roles at one school; the index only blocks duplicate email plus role pairs.
- Signing up with a different email than the invite means no auto-claim; the admin deletes the pending row and re-invites.
- Deleting a club role revokes dashboard access immediately but does not clear existing nomination assignments.

## Open questions

1. Send a branded invite email through the existing notify pipeline on insert, or handle invites out of band?
2. Should deleting a club role also clear that person's in-flight nomination assignments?
