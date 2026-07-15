# Flyer Generator — Architecture Notes

*Written July 2026 before implementation.*

---

## What I'm trying to build

A page in the admin dashboard (`/admin/flyer`) that lets me generate a
printable flyer for any staff member's profile. The flyer includes the
staff member's name, role, a QR code, and Now We See You branding.

The QR code on the flyer must point to the permanent heros-redirect URL
(`https://heros-redirect.vercel.app/r/<redirect-id>`) — not the profile
URL directly. This ensures the printed flyer stays valid even if the
profile URL changes in the future.

---

## Why I'm building this

Every time I add a new staff profile I need to print a physical flyer or
placard to display in the school building. Right now I generate the QR code
manually and design the flyer separately. This is slow and inconsistent
across profiles. This is the issue I encountered for Brad's profile when it 
got selected in Kirkland Art Center exhibition and I wanted to generate a 
flyer to check analytics specifically for users coming from the exhibition.

The flyer generator automates this: I select a staff member, the app looks
up their redirect ID, generates the correct QR code, and renders a
print-ready flyer in one step. This matters more as the platform grows —
adding four new profiles this summer means four new placards, and doing
each one manually doesn't scale.

---

## How it will work

1. Admin visits `/admin/flyer`
2. Dropdown shows all published staff profiles pulled from Supabase
3. Admin selects a profile
4. App queries the `redirects` table for that profile's active redirect ID
5. App generates a QR code pointing to
   `https://heros-redirect.vercel.app/r/<redirect-id>`
6. Flyer renders with staff member's name, role, QR code, and NYSM branding
7. Admin clicks Print — browser print dialog opens with print-optimized layout

---

## Data flow

```
Admin selects profile from dropdown
  → profile.slug identified
  → query redirects table WHERE profile_slug = slug AND active = true
  → get redirect.id
  → generate QR code for https://heros-redirect.vercel.app/r/<redirect-id>
  → render flyer layout with name, role, QR code, branding
  → window.print() on button click
```

---

## Technical decisions

**QR code library**
The `qrcode` package is already in `package.json`. It generates a QR code
as a canvas element that can be rendered inline in React. No new dependency
needed.

**Print layout**
Browser `window.print()` with `@media print` CSS to hide the admin
navigation and show only the flyer content. No external PDF library needed —
printing to PDF from the browser dialog covers the use case.

**Data source**
Main Supabase project — same client already used by the rest of the admin
dashboard. The `redirects` table has a `profile_slug` column that links each
redirect ID to a profile.

**Auth**
`/admin/flyer` is an admin-only route protected by the existing
`useAuthReady` hook and admin session check. No new authentication logic
needed.

**Component location**
New page at `src/pages/AdminFlyer.tsx` with a route added in `App.tsx`.
The flyer layout itself will be a separate component
`src/components/FlyerPreview.tsx` so it can be tested independently.

---

## Redirect ID lookup — edge case

A profile may have more than one redirect ID if the redirect was recreated
at some point. The query will filter for `active = true` and take the first
result. If no active redirect exists for a profile, the flyer generator will
show an error state rather than generating a QR code with a broken link.

---

## Flyer layout (planned)

```
┌─────────────────────────────────┐
│                                 │
│       NOW WE SEE YOU            │
│                                 │
│       [Staff Member Name]       │
│       [Role / Title]            │
│                                 │
│            [QR CODE]            │
│                                 │
│     Scan to read their story    │
│       nowweseeyou.org           │
│                                 │
└─────────────────────────────────┘
```

Single page, portrait orientation, designed to fit on a standard sheet
of paper or card stock for display in the school building.

---

## What I'm not building in v1

- Bulk flyer generation (one at a time is sufficient)
- Custom flyer designs per profile (one standard template)
- Portrait image on the flyer (name + role + QR is enough for v1)
- Email or download as PDF (browser print to PDF covers this)
- QR code for heros-redirect project redirects vs main project redirects
  distinction (will use main project redirects table for now)

---

## Files to create or modify

| File | Action |
|------|--------|
| `src/pages/AdminFlyer.tsx` | Create — main page component |
| `src/components/FlyerPreview.tsx` | Create — flyer layout component |
| `src/App.tsx` | Modify — add `/admin/flyer` route |

---

## Success criteria

The flyer generator is complete when:
- [ ] Dropdown shows all published profiles
- [ ] Selecting a profile generates the correct QR code
- [ ] QR code resolves to the correct heros-redirect URL when scanned
- [ ] Flyer renders cleanly in print preview
- [ ] Error state shown if no active redirect exists for selected profile
- [ ] Feature works for both Brad Fisher and Shirley P. profiles