# Fix returning club-member sign-in and role invitations

## Confirmed diagnosis

- `preetigoel@microsoft.com` already has a confirmed account. It was confirmed on August 6, and the auth logs show successful password sign-ins on August 7. A second confirmation email is neither needed nor normally sent for this account.
- The current PR invitation exists, but its `user_id` is still empty. The account and role row are therefore not linked.
- The backend already has `claim_club_role_invites()`, which can link pending role invitations to the signed-in account by matching the verified email, but the sign-in flow never calls it.
- The login page checks `club_roles` by email before claiming the invitation. Current access rules only let a club member read rows linked to their `user_id`, so the pending PR row is invisible and the app signs the successfully authenticated user back out with “Access denied.”
- The signup screen treats every repeated signup as if confirmation may still be pending. For an already-confirmed account, its “Resend confirmation email” action is misleading.
- Role-assignment emails always say “Open admin dashboard.” That destination is correct for PR, but incorrect for journalist, photographer, and artist roles, which use the club dashboard.

## Changes

1. **Claim pending role invitations immediately after authentication**
   - After password sign-in succeeds, call the existing authenticated claim function before checking the user’s destination.
   - Run the same claim step when the login page detects an existing authenticated session, covering confirmation-link returns and restored sessions.
   - Resolve access from the claimed role results and linked role rows, then route PR-only members to `/admin` and creative members to `/club`.

2. **Make role access checks use the account link**
   - Update the login destination check to use the authenticated user ID after claiming instead of relying only on an email query that RLS can hide.
   - Keep school-admin lookup and existing multi-role routing behavior unchanged.

3. **Correct repeated-signup guidance**
   - Keep duplicate-signup handling, but guide users to sign in first rather than implying that every existing account needs verification.
   - If sign-in returns an actual unconfirmed-email error, then show the resend-confirmation action.
   - Show a clear wrong-password/reset path separately from confirmation problems.

4. **Correct role-assignment email destinations**
   - PR email: “Open admin dashboard” linking to `/admin`.
   - Journalist, photographer, and artist email: “Open club dashboard” linking to `/club`.
   - Redeploy the role-assignment email function after updating it.

5. **Repair the current PR record and verify**
   - Link the existing PR row for `preetigoel@microsoft.com` to its confirmed account so it works immediately, while the sign-in claim prevents recurrence.
   - Verify: sign in with the existing account, confirm no verification prompt is shown, confirm the PR role is retained, and confirm routing reaches `/admin` without an access-denied logout.
   - Verify a fresh pending creative-role invitation is claimed after confirmation/sign-in and routes to `/club`.

## Scope

No schema expansion or account deletion is needed. The fix uses the existing account, role table, and claim function, with focused login-flow and email-template changes.