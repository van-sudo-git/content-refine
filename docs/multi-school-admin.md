# Multi-School Admin - Architecture Notes

*Written July 2026 before implementation.*

---

## Why this is needed

The platform started at one school. It is not going to stay there.

Right now, if a second school wanted to use Now We See You, there is no way
to give them their own admin access without also giving them access to
Lake Washington High School's nominations, profiles, and analytics. There
is no separation. Everyone who has admin access sees everything.

That is fine for one school. It is not fine for two.

The fix is not complicated. The database already has everything it needs.
The frontend just does not use it yet.

---

## What the database already supports

This is the part that surprised me when I looked at it closely. The
multi-school architecture was designed in from the beginning, before I
knew I would actually need it.

The `schools` table exists. Every school has its own row with a unique ID.

The `school_admins` table maps email addresses to `school_id`. Every admin
is already tied to a specific school at the database level.

The `nominations` table has a `school_id` foreign key. So do profiles,
appreciations, and page views. Row Level Security policies scope every
table by school. This is not something I need to add - it is already there.

`is_school_admin(school_id)` and `is_any_school_admin()` are PostgreSQL
functions that already exist in the migrations. They check whether the
current user is an admin for a specific school or any school at all.

The current `Admin.tsx` already does this correctly for school admins. When
someone logs in, it looks up their email in `school_admins`, gets their
`school_id`, and calls `loadData(schoolId)`. A school admin already only
sees their school's data. That part works.

What does not work yet: I have no way to see all schools at once, and
there is no UI for onboarding a new school.

---

## What global admin means

There are two kinds of admin users.

**School admin.** A VP, teacher, or staff member at a specific school.
They log in and see only their school. Nominations, profiles, analytics -
all scoped to their campus. No school selector. No visibility into other
schools. This already works correctly.

**Global admin.** That is me. I need to see everything. When I log in I
want to be able to switch between schools, see each school's data
independently, create new schools, and assign their first admin email.

The difference between the two is one column: `is_global_admin` on the
`school_admins` table. It does not exist yet. Adding it is a one-line
migration. My emails get `is_global_admin = true`. Everyone else defaults
to `false`.

---

## What global admin would actually do

When I log in as global admin:

**Switch between schools.** A school selector dropdown at the top of the
dashboard. Selecting a school loads that school's nominations, profiles,
admins, and analytics - same as any school admin sees for their own school.
This reuses the existing `loadData(schoolId)` function. It just needs to
be called with the selected school instead of always the logged-in user's
school.

**See all schools in one place.** A summary view showing every school,
how many profiles they have, recent nomination activity. Useful for
understanding which chapters are active and which need attention.

**Add a new school.** A form that creates a new row in `schools` and
assigns a first admin email in `school_admins`. The new admin can then
log in and start managing their chapter. No database access required on
their end.

**Add admins to any school.** Right now adding an admin only works within
the school you are logged into. Global admin should be able to add admins
to any school from the same interface.

---

## What stays the same

School admins already see only their school's data. RLS policies enforce
this at the database level - it is not just a frontend filter. A school
admin who somehow accessed another school's data through the API would
still be blocked. That does not change.

The `loadData(schoolId)` function already accepts a school ID and loads
the right data. Global admin just calls it with a different school ID
depending on what is selected in the dropdown. No rewrite needed.

`AdminAnalytics` and `AdminProfileManager` both take a `schoolId` prop
already. They might need minor adjustments for the global admin school
selector but the foundation is there.

---

## Files to create or modify

| File | Action |
|------|--------|
| `supabase/migrations/` | Add `is_global_admin` boolean column to `school_admins` |
| `src/pages/Admin.tsx` | Detect global admin on login, show school selector if true |
| `src/components/SchoolOnboarding.tsx` | Create - new school form with name and first admin email |
| `src/components/AdminAnalytics.tsx` | Minor - pass selected school ID from global admin selector |
| `src/components/AdminProfileManager.tsx` | Minor - same as analytics |

---

## Migration

```sql
ALTER TABLE school_admins
ADD COLUMN is_global_admin boolean DEFAULT false;

UPDATE school_admins
SET is_global_admin = true
WHERE email IN ('evaanahkawat@gmail.com', '1061967@lwsd.org');
```

---

## Success criteria

- [ ] Evaan logs in and sees a school selector dropdown
- [ ] Selecting a school loads that school's nominations, profiles, admins, analytics
- [ ] School admin logs in and sees only their school - no selector shown
- [ ] New school creation works - school row and first admin email inserted
- [ ] New admin receives access immediately after being added
- [ ] Analytics and profile manager scope correctly to selected school
- [ ] Screenshots saved to docs/assets/
- [ ] test.md updated with multi-school test cases
- [ ] README changelog updated
