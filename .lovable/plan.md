# Fix: invited club members can't sign in

## What's actually happening

Two separate issues, both now identified.

1. The missing verification email was the address typo (`microsft.com`). Fixed by you — the email arrived.
2. The "not registered as an admin" message is a different, real gap: the login page only recognizes **school admins**. It looks the signed-in email up in the school admins list, and if it's not there it signs the user out with that message.

`preetigoel@microsoft.com` was invited as a **journalist** (stored in the club roles table, with no linked account yet). Journalists, photographers, and artists are therefore locked out even after confirming their email — the invite email tells them to open the admin dashboard, but nothing lets them in.

## Plan

### 1. Claim the invite on first sign-in
When a user signs in, match their email against pending club-role invites and attach their account id to those rows, so the invite becomes a real, linked membership. Do this with a database trigger on account creation plus a matching check at sign-in (covers accounts created before the trigger existed).

### 2. Let club members through the login gate
Change the login check from "is this a school admin?" to "is this a school admin **or** a club member?". If neither, keep the current access-denied behavior. Also make the denied message accurate: tell them their email isn't on their school's admin or club list and to contact their school admin.

### 3. Route by role after sign-in
- School admins and global admins: `/admin` as today.
- Club members (journalist, photographer, artist, PR): a role-scoped club view at `/club`, showing only the nominations they are assigned to, plus the upload/edit actions their role needs (photographer: photos, artist: artwork, journalist: story text, PR: flyers).

### 4. Align the invite email
Update the role-invite email so the button points at the club view for students, and the admin dashboard only for actual admins.

## Scope choice

If you want the smallest possible change first, steps 1 and 2 alone unblock sign-in (members land on a read-only dashboard). Steps 3 and 4 make the experience correct. I'd recommend doing all four together, but say the word if you'd rather ship the unblock now and build the club view separately.

## Technical notes

- Migration: `claim_club_role_invites()` security-definer function + trigger on new accounts; backfill existing confirmed users whose email matches a pending invite.
- `src/pages/AdminLogin.tsx`: replace the single school-admins lookup with a combined admin/club-role lookup, then navigate based on the result.
- New `src/pages/ClubDashboard.tsx` + route in `src/App.tsx`, reading nominations already permitted by the existing "Assigned members view nomination" policy.
- Existing RLS on club roles and nominations already supports this; upload permissions for assigned members will be verified and extended only where missing.
- `supabase/functions/_shared/transactional-email-templates/roles-assigned.tsx` and `notify-role-assigned` for the email link change; both redeploy after edit.
