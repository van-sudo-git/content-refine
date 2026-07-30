# Review of the two documents, plus doc updates

## Short answer on multiple artists/journalists

Yes. The schema as it actually exists today supports many students per role per school.
Uniqueness on `club_roles` is `(user_id, school_id, role)` plus a partial unique index on
`(school_id, role, lower(email))` for un-claimed invites. That only prevents adding the *same
person* twice to the *same role*; it does not cap how many journalists, photographers, artists,
or PR members a school can have.

The one thing that is single-valued is *per nomination*: `journalist_id`, `photographer_id`, and
`artist_id` are one uuid each. So a school can have five artists, but a given story has one
assigned artist. That is a reasonable default and matches the "case lead is the journalist"
decision, so no change proposed unless you want co-assignments.

## Where the spec no longer matches what is built

Both documents describe the schema work as upcoming. Most of it already shipped, and a few
details drifted:

- Enum name is `club_role`, not `club_role_type`.
- `club_roles.user_id` is nullable (invite-by-email before the student has an account), there is
  an `email` column, and a check constraint requiring one of the two. The spec's SQL shows
  `user_id uuid NOT NULL` with no email column.
- `club_roles` also has `updated_at`.
- Nomination assignment FKs are `ON DELETE SET NULL`.
- RLS on `club_roles`, `nominations`, `flyers`, and `profiles` is written and live, including
  global-admin policies, using `private.is_school_admin` / `private.is_global_admin` /
  `private.has_club_role` helpers.
- A `flyers` table exists and backs the flyer generator, gated on the `pr` club role or admin.
- Email automation is built: the `notify_nomination_status_change` trigger fires
  `notify-nomination-assigned` on `approved` and `notify-nomination-published` on `published`,
  running on the app-email queue for `notify.nowweseeyou.org`.
- Still open: the auto-claim of an invite when a student signs up, the admin role-assignment UI,
  photographer/artist pickers in the Nominations tab, and the `/club` dashboard.

## Proposed edits

### `Club Roles: Permissions Spec`
1. Reframe the header from "spec for work not yet built" to "spec, with database and email
   layers shipped; UI pending."
2. Correct the SQL block to the shipped schema: `club_role` enum, nullable `user_id`, `email`
   column, check constraint, `updated_at`, unique indexes, `ON DELETE SET NULL` FKs.
3. Add a short "Multiplicity" note: unlimited members per role per school; exactly one
   journalist, photographer, and artist assigned per nomination.
4. Replace the "Work needed" list with a done vs. remaining split reflecting the state above.
5. Add the `flyers` table to the design section, since PR output has a real home now.

### `Retrospective: Founder to Platform`
1. Keep the voice and the honesty; only update "Where this stands right now" so it reflects that
   the schema, RLS, and the two notification emails are in place and the remaining gap is the
   student-facing UI and a real club using it.
2. No other changes; the narrative sections still read true.

## Technical notes

No database or code changes in this plan. It is documentation only: rewrite the two markdown
files under `docs/` (or wherever you keep them, they are not currently in the repo, so I would
add `docs/club-roles-permissions-spec.md` and `docs/retrospective-founder-to-platform.md`).
If you would rather I only answer the multiplicity question and leave the docs alone, say so.
