## Clean up test admins and schools

Remove the three unconfirmed test accounts and their associated test schools, keeping Lake Washington High School and its two global admins intact.

### Migration steps

1. Delete from `auth.users` where email in:
   - `lwhs-testadmin1@mailinator.com`
   - `evaanahlawat+testadmin2@gmail.com`
   - `test@lwsd.org`

2. Delete from `public.school_admins` where email matches the same three addresses (should cascade/should be cleared explicitly).

3. Delete from `public.schools` where name in (`Test`, `Test School 2`, `LWHS Test Admin`). IDs:
   - `a42a0555-72b6-4bbf-a7de-584459b0debe` (Test)
   - `6b7670aa-55c4-439d-b5a3-318609632fa9` (Test School 2)
   - `106424cd-5b8e-488b-a852-4732da748f0e` (LWHS Test Admin)

### Result
- Schools table: only Lake Washington High School remains.
- school_admins: only `1061967@lwsd.org` and `evaanahlawat@gmail.com` remain (both global admins).
- auth.users: three unconfirmed test users removed.

No code changes; database cleanup only.