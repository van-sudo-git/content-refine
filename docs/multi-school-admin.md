# Multi-School Admin - Architecture Notes

*Written July 2026 before implementation. Updated August 2026 after the multi-school admin, school onboarding, school settings, and public chapter gallery work were implemented and tested.*

---

## Why this is needed

The platform started at one school. It is not going to stay there.

When I first wrote this document, the problem was simple: if a second school wanted to use Now We See You, I needed a way to give them their own admin access without also giving them access to Lake Washington High School's nominations, profiles, and analytics.

There needed to be real separation between chapters.

That separation could not just be a dropdown in the frontend. A school administrator should be blocked from another school's data even if they tried to access it directly.

The database already had a lot of the foundation for this. The remaining work was making the application actually use that structure consistently and giving a global admin a practical way to manage multiple schools.

That work is now implemented.

---

## What the database already supported

This is the part that surprised me when I first looked at it closely.

The multi-school architecture was partly designed in from the beginning, before I knew I would actually need it.

The `schools` table already existed. Every school has its own row with a unique ID.

The `school_admins` table maps administrators to a `school_id`.

The `nominations` and `profiles` tables are also connected to a school.

The application already had PostgreSQL helper functions such as `is_school_admin()` and `is_any_school_admin()` for checking administrator access.

The original `Admin.tsx` also already loaded data using a school ID.

That meant the multi-school work did not require rebuilding the application around an entirely new concept. The school boundary was already present in the data model.

What was missing was:

- a distinction between a normal school admin and a global admin
- a school selector for the global admin
- a way to onboard a new school without editing the database manually
- consistent school scoping across newer features
- school-level settings
- a public chapter structure so visitors could browse schools separately

Those pieces were added later.

---

## What global admin means

There are now two kinds of administrator access.

### School admin

A school admin is tied to a specific school.

They log in and work inside their own chapter.

Their nominations, profiles, administrators, roles, analytics, settings, and flyer workflows are scoped to that school.

They do not get a school selector.

The important part is that this is not only a frontend filter. Row Level Security and database policies enforce the school boundary.

### Global admin

A global admin can work across chapters.

The distinction is stored using:

```text
school_admins.is_global_admin
```

A global admin can:

- see the school selector
- switch the dashboard between schools
- review each school's data independently
- onboard a new school
- assign the first administrator for that school
- add or remove administrators after switching into a school
- manage roles for the selected school
- review nominations and profiles for the selected school
- view that school's analytics
- change that school's public nomination setting

The application still uses the same school-scoped components underneath. Global admin access changes which school can be selected, not how the records themselves are structured.

---

## What global admin actually does

### Switch between schools

The dashboard now has a school selector for global administrators.

Selecting a school updates the active `schoolId` and reloads the data for that school.

The same school ID is then passed into the profile manager, analytics, role management, settings, and other school-scoped parts of the dashboard.

This was one of the reasons I wanted to reuse the existing `loadData(schoolId)` pattern instead of building a second admin application.

### Add a new school

`SchoolOnboarding.tsx` provides the onboarding workflow.

A global administrator enters:

- school name
- first administrator email

The workflow creates a row in `schools`, then creates the first `school_admins` row for that school.

That administrator can then sign in and manage the chapter.

The new school also becomes available in the global admin's school selector.

This means a new chapter no longer requires someone to open Supabase and manually insert database rows.

### Add administrators to any school

A global administrator can switch to a school and use the normal Manage Admins workflow for that chapter.

A school administrator can only manage administrator access within the school they are authorized to manage.

### Manage roles by school

Club roles are also school-scoped.

Journalist, Photographer, Artist, and Community Outreach roles belong to a school through `club_roles.school_id`.

That means a role at one school does not automatically grant any permissions at another school.

The Manage Roles tab uses the currently selected school in the same way as the rest of the admin dashboard.

### Control public nominations by school

Each school now has an:

```text
accepting_nominations
```

setting.

The School Settings UI lets an authorized administrator turn public nominations on or off for that school.

When the setting is on, the school can appear in the public Nominate Someone form.

When the setting is off, the school stops accepting new public nominations through that form.

This turned out to be important for expansion because adding a school to the database should not automatically mean that the school is ready to receive nominations.

---

## Public chapter galleries

The original multi-school plan focused mostly on administration.

Once the backend could actually support more than one school, the public side also needed a chapter model.

The public routes are now:

```text
/galleries
/galleries/:schoolSlug
/gallery/:profileSlug
```

### `/galleries`

This is the chapter directory.

It does not display every row in the `schools` table.

A school appears as a public chapter only after it has at least one published profile.

That distinction matters.

Creating a school in the admin dashboard means the chapter infrastructure exists. It does not mean the chapter has actually launched publicly.

### `/galleries/:schoolSlug`

Each public school gallery loads published profiles for one school.

The readable URL slug is currently derived from the school name, while the actual profile query uses the school's database ID.

The school ID remains the real data boundary.

The URL is just the public-facing path.

### `/gallery/:profileSlug`

Individual staff profile URLs remain under the original singular `/gallery/:profileSlug` route.

I intentionally kept those URLs stable because physical QR codes may already point to them.

Moving to multi-school galleries should not break an existing QR code just because the navigation around the profile changed.

---

## What stays the same

The central rule from the first version of this document did not change:

**school boundaries belong in the database, not just the interface.**

A school admin should not be able to see another school's records even if the frontend has a bug.

The application still relies on `school_id` throughout the main data model.

The global admin selector changes the school being managed, but ordinary school administrators remain restricted to their own chapter.

Existing components such as `AdminAnalytics` and `AdminProfileManager` continue to receive a school ID instead of becoming separate implementations for each school.

The same approach now also applies to:

- Manage Roles
- nominations and assignments
- School Settings
- Flyer Generator
- Club Dashboard permissions
- public chapter galleries

That consistency is more important than the school selector itself.

---

## Files created or modified

The original plan only listed a few files. The final implementation touched more parts of the application because multi-school behavior eventually became part of the public site and club workflow too.

| File | Purpose |
|---|---|
| `supabase/migrations/` | Added global-admin support, school-scoped policies, school settings, club roles, and later workflow permissions |
| `src/pages/Admin.tsx` | Detects global admin, provides school selector, and loads school-scoped dashboard data |
| `src/components/SchoolOnboarding.tsx` | Creates a new school and its first administrator |
| `src/components/SchoolSettings.tsx` | Controls whether a school accepts public nominations |
| `src/components/ManageRoles.tsx` | Manages school-scoped club roles |
| `src/components/AdminAnalytics.tsx` | Loads analytics for the selected school |
| `src/components/AdminProfileManager.tsx` | Manages profiles for the selected school |
| `src/pages/Nominate.tsx` | Shows schools that are currently accepting nominations |
| `src/pages/Galleries.tsx` | Lists schools with published profiles |
| `src/pages/Gallery.tsx` | Displays one school's published profiles |
| `src/lib/schoolGallery.ts` | Builds readable chapter gallery paths from school names |

---

## Original migration idea

The first version of this architecture was centered around adding one field:

```sql
ALTER TABLE school_admins
ADD COLUMN is_global_admin boolean DEFAULT false;
```

The production implementation evolved through multiple migrations after that.

The migration files in `supabase/migrations/` are the source of truth for the final database state.

The important part of the original idea remained the same:

```text
is_global_admin = false
```

means the administrator is school-scoped.

```text
is_global_admin = true
```

allows the administrator to work across schools.

Later migrations extended that model to cover the role system, public nomination settings, profile workflows, and other school-scoped permissions.

---

## Success criteria

These were the criteria I wrote before implementation.

### Original criteria

- [x] Global admin logs in and sees a school selector
- [x] Selecting a school loads that school's nominations, profiles, admins, and analytics
- [x] School admin logs in and sees only their school with no selector
- [x] New school creation creates the school and first admin record
- [x] New admin can use the existing authentication flow after being added
- [x] Analytics and profile manager scope to the selected school
- [x] Multi-school behavior has been manually tested
- [x] README updated to describe the chapter model
- [ ] Final multi-school screenshots added to `docs/assets/`
- [ ] `test.md` updated with the complete final multi-school test record

The remaining unchecked items are documentation work, not missing product functionality.

---

## What changed from the original plan

The original document mostly treated multi-school support as an administrator problem.

That was only the first half of it.

Once I implemented a second school in the system for testing, I had to think about what "another school" actually means across the whole product.

It means:

- administrators must be school-scoped
- club roles must be school-scoped
- nominations must belong to a school
- profiles must belong to a school
- analytics must be viewed by school
- public nominations must be controlled by school
- public galleries need to separate chapters
- a school should not look publicly active just because a database row exists

That last one was especially useful.

There are really three different states:

1. **The school exists in the database.**
2. **The school is ready to accept nominations.**
3. **The school has published work and is visible as a public chapter.**

Those should not be treated as the same thing.

`SchoolOnboarding` handles the first.

`accepting_nominations` controls the second.

Published profiles control the third.

That separation makes the chapter model much closer to how an actual school would launch the project.

---

## One thing I would still change later

The public gallery slug is currently generated from the school's name.

For example:

```text
Lake Washington High School
```

becomes a readable gallery route based on that name.

This works for the current platform, and the database ID is still used for the actual query.

If the project grows to enough chapters that school names change, duplicate names become possible, or permanent chapter URLs become more important, I would probably add a dedicated immutable `slug` column to `schools`.

I did not add it now because the current name-derived route works and adding another backend field would not improve the actual chapter workflow yet.

That is intentionally deferred rather than unfinished.

---

## Current result

The platform can now support more than one school without giving every administrator access to everything.

A global admin can create and manage chapters.

A school admin manages only their chapter.

Club roles remain tied to the school where they were assigned.

Each school decides whether it is ready to accept public nominations.

The public site separates chapters into school-specific galleries, but only shows chapters that have actually published work.

The original goal was to make adding a second school possible without rebuilding Now We See You.

That part is now working.