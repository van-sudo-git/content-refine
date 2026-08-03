Give club members a real place to work: `/club` dashboard + role write access

## What I verified in the current build

- **PR cannot actually log in today.** `Admin.tsx` has a PR-only path (flyer tab only), but `AdminLogin.tsx` checks `school_admins` on both session-restore and password sign-in, and signs out anyone without an admin row. So a PR member is rejected before ever reaching `/admin`.
- **Artists, journalists, photographers have read-only access at the database level.** `nominations` has a SELECT policy for assigned members (`private.can_read_nomination`) but no INSERT/UPDATE for them. `profiles` and `profile_images` are `ALL` for school admins only (plus PR SELECT). Storage `profile-images` upload/delete policies are admin-only. So even with a UI, uploads and publishing would fail.
- **Nothing links a nomination to the profile it becomes.** `profiles` has no `nomination_id`, so there's no way to scope "the profile for my assigned nomination."
- `flyers` already allows PR insert/update/select, and `profiles` already allows PR school-wide SELECT, so PR's data layer is done, only the login gate is blocking.

## What to build

### 1. Login routing (fixes PR, admits students)

Rework the access check in `AdminLogin.tsx` into one shared resolver that looks up both `school_admins` and `club_roles` for the signed-in email, then routes:

- school admin or global admin → `/admin`
- `pr` → `/admin` (lands on Flyer Generator, as it already does)
- `journalist`, `photographer`, `artist` → `/club`
- no row anywhere → sign out with the existing access-denied toast

Apply the same resolver to the session-restore effect, so a returning member is not signed out. Keep everything behind `useAuthReady`.

### 2. New `/club` dashboard

New route `/club` → `src/pages/ClubDashboard.tsx`, scoped to the member's own `club_roles` rows. It lists the nominations assigned to them and, per role:

- **Journalist**: see nominee details and reason, write/edit the profile (name, role, department, bio, slug), move status `assigned → in_progress → submitted`, and publish (creates/updates the `profiles` row and sets `status = 'published'`).
- **Photographer**: upload photos for the assigned nomination's profile (`image_type = 'additional'`).
- **Artist**: upload the portrait sketch (`image_type = 'portrait'`).

Reuse the existing upload logic from `AdminProfileManager.tsx` rather than writing a second uploader; extract the shared image-upload piece into a small component both pages use.

Photographers and artists cannot upload until the journalist has created the profile row, so the page shows a clear "waiting on the journalist to start the write-up" state.

### 3. Database changes

- `profiles.nomination_id uuid REFERENCES nominations(id) ON DELETE SET NULL` (nullable, so existing profiles are unaffected), plus a unique index so one nomination maps to one profile.
- Helper `private.is_assigned_to_profile(_user_id uuid, _profile_id uuid)` — true when the user's `club_roles.id` is the journalist/photographer/artist on the nomination behind that profile.
- New RLS policies:
  - `profiles`: journalist INSERT (must reference a nomination they're the journalist on) and UPDATE; assigned members SELECT their own in-progress profile.
  - `profile_images`: assigned members INSERT/SELECT/DELETE for their nomination's profile, with artist limited to `portrait` and photographer to `additional`.
  - `nominations`: assigned members UPDATE, restricted to the status column progression they own.
  - `storage.objects` on `profile-images`: allow INSERT/DELETE for any user holding a club role at a school, alongside the existing admin policy.
- Grants stay as-is (`authenticated` already has table privileges).

### 4. Email copy

With `/club` live, `roles-assigned.tsx` gets an accurate CTA: "Open dashboard" pointing at `/admin` for PR/admins and `/club` for journalist, photographer, artist. `notify-role-assigned/index.ts` passes the right URL based on role. Edge functions redeploy automatically.

## Notes

- Auto-claim of pending invites still needs to exist for this to work end to end: a student invited by email has `club_roles.user_id = NULL`, and all the RLS above keys off `auth.uid()`. The plan includes the `claim_club_role_invites` trigger on `auth.users` from the earlier spec, matching on lowercased email at signup.
- Demo mode (`/admin?demo=true`) is untouched; `/club` has no demo path in this pass.
- No change to the journalist-publish gate: publishing stays ungated per the spec.
