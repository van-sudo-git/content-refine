# Club Roles: Permissions Spec

*Written August 2026. This spec documents the admin dashboard as it exists today, and the role permissions Now We See You needs so a chapter can run on a club of students instead of one founder doing every job Check out my retrospective: `[docs/retrospective-one-person-to-club.md](./retrospective-one-person-to-club.md)` . The database layer and email automation described here are already shipped; the UI changes are still pending.*

**Related documents:**

- Chapter onboarding guide: `[docs/start-a-chapter-guide.md](./start-a-chapter-guide.md)` — step-by-step guide for launching Now We See You at a new school or community
- Roles and nomination workflow diagram: `[docs/assets/roles-and-nomination-workflow-jul2026.png](./assets/roles-and-nomination-workflow-jul2026.png)`

![Roles and Workflow](./assets/roles-and-nomination-workflow-jul2026.png)

## Admin dashboard today

The admin dashboard (`nowweseeyou.org` admin panel) currently has five tabs,
all under a single admin login with no role separation:


| Feature         | What it does today                                                                     |
| --------------- | -------------------------------------------------------------------------------------- |
| Nominations     | Review incoming nominations, see status (pending/approved/featured), approve or reject |
| Profiles        | View and manage published staff profiles                                               |
| Manage Admins   | Add or remove admin accounts                                                           |
| Analytics       | View page views, QR scans, and engagement data per profile                             |
| Flyer Generator | Generate print-ready QR placards for a profile                                         |


Today, every one of these actions requires full admin access. There's no way
to give a student narrower access — for example, letting someone generate a
flyer without also being able to approve nominations or manage other admins.

## What's changing

Now We See You needs role-scoped access so nominations can move through a
club of students — journalist, photographer, artist, PR — instead of
everything routing through one admin account.

### Role permission matrix


| Role         | Can see                      | Can do                            |
| ------------ | ---------------------------- | --------------------------------- |
| Journalist   | Assigned nomination          | Submit profile, publish profile   |
| Photographer | Assigned nomination          | Upload photos                     |
| Artist       | Assigned nomination          | Upload art                        |
| PR           | Published profiles           | Generate flyer, log outreach/chat |
| Admin        | All nominations (own school) | Approve nomination, assign roles  |




### Multiplicity

A school can have any number of journalists, photographers, artists, and PR members.
The only `UNIQUE` constraints are per-person: the same user cannot hold the same role
twice at the same school, and the same email cannot be invited twice for the same role
at the same school. Per nomination, there is exactly one journalist, one photographer,
and one artist assigned.

### New workflow, tied to existing admin features

Roles and Workflow

1. **Nomination comes in** → admin reviews in the existing Nominations tab.
2. **Admin approves** → in addition to today's status change, this now
  triggers an email to the assigned journalist, photographer, and artist.
3. **Journalist, photographer, artist do the work** → interview, photo, art,
  staged consent at each step.
4. **Journalist submits and publishes the profile** — no admin-approval gate
  for publishing itself. The nominee's staged consent is the safeguard at
   this point, not a second admin check.
5. **Publish triggers two emails**: one to the PR role, and one lightweight
  notification to admin, letting them know a profile went live — informational
   only, not something admin needs to act on.
6. **PR role gets access to Flyer Generator for any published profile at
  their school** — not scoped to only the profiles they were notified
   about. PR does not get access to Nominations, Profiles, or Manage Admins.



## Decisions

- **Journalist-publish stays ungated.** No admin approval step before a
profile goes live. Admin instead gets a lightweight notification when a
profile is published — informational, not a checkpoint the journalist has
to wait on.
- **PR's flyer access is school-wide, not per-profile.** PR can generate a
flyer for any published profile at their school, not just the ones they
were emailed about. Simplifies the permission to a single school-scoped
grant rather than a per-notification allowlist.
- **No separate** `case_lead_id` **field.** The case lead is inferred from
whichever journalist is assigned to a nomination — one less field to keep
in sync, since journalist assignment already implies who's leading it.



## Design and architecture



### Table changes

`club_roles` (new table)


| Column      | Type | Notes                                        |
| ----------- | ---- | -------------------------------------------- |
| `id`        | uuid | primary key                                  |
| `email`     | text | email id                                     |
| `user_id`   | uuid | references the student's account             |
| `school_id` | uuid | scopes the role to one school                |
| `role`      | enum | `journalist`, `photographer`, `artist`, `pr` |


`nominations` (existing table, additions)


| Column            | Type | Notes                                                                      |
| ----------------- | ---- | -------------------------------------------------------------------------- |
| `status`          | enum | `pending`, `approved`, `assigned`, `in_progress`, `submitted`, `published` |
| `journalist_id`   | uuid | references `club_roles`; also serves as the case lead — no separate field  |
| `photographer_id` | uuid | references `club_roles`, nullable until assigned                           |
| `artist_id`       | uuid | references `club_roles`, nullable until assigned                           |


No changes needed to `profiles` beyond what publishing already touches — PR
access is granted through RLS on `school_id`, not a new column.

-- 1. Enums

CREATE TYPE public.club_role AS ENUM ('journalist', 'photographer', 'artist', 'pr');

CREATE TYPE public.nomination_status AS ENUM (
  'pending', 'approved', 'assigned', 'in_progress', 'submitted', 'published'
);

-- 2. New club_roles table

CREATE TABLE public.club_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.club_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_or_email_present CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_roles TO authenticated;
GRANT ALL ON public.club_roles TO service_role;

ALTER TABLE public.club_roles ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX club_roles_user_id_school_id_role_key
  ON public.club_roles (user_id, school_id, role);

CREATE UNIQUE INDEX club_roles_school_role_email_uniq
  ON public.club_roles (school_id, role, lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX club_roles_email_idx ON public.club_roles (lower(email));
CREATE INDEX club_roles_school_role_idx ON public.club_roles (school_id, role);

-- 3. Additions to nominations

ALTER TABLE public.nominations
  ADD COLUMN status public.nomination_status NOT NULL DEFAULT 'pending',
  ADD COLUMN journalist_id uuid REFERENCES public.club_roles(id) ON DELETE SET NULL,
  ADD COLUMN photographer_id uuid REFERENCES public.club_roles(id) ON DELETE SET NULL,
  ADD COLUMN artist_id uuid REFERENCES public.club_roles(id) ON DELETE SET NULL;

-- Update RLS policies as needed

### RLS policy changes

- `club_roles`: a user can read their own row; admins can read all rows for
their school (global admin: all schools).
- `nominations`: journalist/photographer/artist can select only rows where
their `user_id` matches `journalist_id`, `photographer_id`, or
`artist_id` for that nomination. Admin keeps existing school-scoped
visibility.
- `profiles`: add a policy allowing any user with `role = 'pr'` for a school
to select all published profiles at that school, and to insert into
whatever table backs Flyer Generator's output.
- These policies should be written alongside the multi-school-admin RLS work
already in progress, since both rely on the same `school_id`-scoping
pattern — reusing that pattern reduces the risk of writing two
inconsistent versions of "scope by school."



### Triggers / automation (Supabase Edge Functions)

- On `nominations.status` → `approved`: send email to `photographer_id` and
`artist_id` (journalist is set at the same time as approval, so they're
included too).
- On `nominations.status` → `published`: send email to all `pr` role users
at that school, and a separate lightweight notification email to admin.



### Admin dashboard changes

- **Manage Admins** tab (or a new **Manage Roles** tab) needs a UI to assign
a student to a role for a school — this is where `club_roles` rows get
created.
- **Nominations** tab needs fields to assign photographer and artist at
approval time (journalist assignment can double as an existing field or a
new dropdown).
- **Flyer Generator** needs to check `role = 'pr'` OR full admin, instead of
admin-only, before granting access.



### Work needed, roughly in order

1. Create `club_roles` table + migration.
2. Add `status`, `journalist_id`, `photographer_id`, `artist_id` columns to
  `nominations`.
3. Write and test the four RLS policies above.
4. Build the Edge Function triggers for the two email events.
5. Add role-assignment UI to admin dashboard.
6. Update Nominations tab to assign photographer/artist at approval.
7. Update Flyer Generator's access check to include the `pr` role.
8. End-to-end test: create a nomination, approve it, assign roles, submit
  and publish as journalist, confirm PR gets flyer access and admin gets
   the notification.



### Done

- `club_roles` table and `club_role` enum.
- `nomination_status` enum and `status`, `journalist_id`, `photographer_id`,
`artist_id` columns on `nominations`.
- RLS policies for `club_roles`, `nominations`, `flyers`, and `profiles`,
including school-scoped admin and global admin access.
- `flyers` table for PR-generated print assets.
- Edge Function triggers for `approved` and `published` nomination status
changes, wired to the app-email queue for `notify.nowweseeyou.org`.



### Still to build

- Auto-claim pending `club_roles` invites when a student signs up with a matching email.
- Add role-assignment UI to the admin dashboard (or a new "Manage Roles" tab).
- Update the Nominations tab so admins can assign photographer and artist at approval time.
- Update Flyer Generator access check to allow the `pr` role as well as admins.
- Build a student `/club` dashboard scoped to the user's roles.
- End-to-end test: create a nomination, approve it, assign roles, submit and publish
as journalist, confirm PR gets flyer access and admin gets the notification.

---



## Related resources

- **Chapter onboarding guide** — `[docs/start-a-chapter-guide.md](./start-a-chapter-guide.md)`
Step-by-step instructions for launching Now We See You at a new school or community,
including how to set up admin accounts, onboard the first staff member, and hand off
to a student club.
- **Roles and nomination workflow diagram** — `[docs/assets/roles-and-nomination-workflow-jul2026.png](./assets/roles-and-nomination-workflow-jul2026.png)`
Visual overview of how a nomination moves from submission through journalist,
photographer, and artist assignment to publication and PR outreach.

