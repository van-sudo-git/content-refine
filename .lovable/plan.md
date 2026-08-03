Fix the role-assigned email for non-admin club members

## Current issue
When a school admin adds a student to a club role (artist, journalist, photographer), the email they receive says "Open admin dashboard" and links to `/admin`. But the current access rules are:

- `/admin/login` only accepts users who have a row in `school_admins`.
- `/admin` only loads for school admins, global admins, or PR roles (`club_roles.role = 'pr'`).
- Artists, journalists, and photographers are rejected at login and sent back to `/admin/login` with an access-denied message.

So the email is misleading: an artist does not have admin access and does not need an admin account. They just need to wait for the admin to assign them to a nomination, at which point they will receive a second email with the nomination details.

## Proposed fix
Option A (minimal change): update the email template so it does not promise admin access.
- For artists, journalists, photographers: remove the "Open admin dashboard" button.
- Replace it with a short message like: "You're on the team. When a nomination is assigned to you, you'll receive another email with the details."
- Keep the "Open admin dashboard" button only for PR and school admin roles, or change the label to "Open dashboard" if PR access is intended.

Option B (build role dashboards): create a separate `/club` route and let artists, journalists, and photographers sign in.
- Add a route and page for students to view nominations assigned to them.
- Update the login flow to allow any role in `club_roles` to authenticate, then redirect based on role:
  - `admin` → `/admin`
  - `artist`, `journalist`, `photographer` → `/club`
  - `pr` → `/admin` (flyer-only, already implemented)
- This is a larger change but matches the wording in the email and the long-term direction of the platform.

## Recommendation
Start with Option A (email-only fix) because it is small, safe, and immediately removes the confusion. Option B can be planned as a follow-up if you want student-facing dashboards.

## Files to touch for Option A
- `supabase/functions/_shared/transactional-email-templates/roles-assigned.tsx`
- `supabase/functions/notify-role-assigned/index.ts` (to pass `hasDashboardAccess` flag)
- `supabase/functions/_shared/transactional-email-templates/registry.ts` (if template signature changes)

Then redeploy the affected Edge Functions.
