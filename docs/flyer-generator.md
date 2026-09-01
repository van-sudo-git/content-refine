# Flyer Generator - Architecture Notes

*Written July 2026 before implementation. Updated August 2026 to document the version that is now running in the dashboard.*

---

## What I was trying to build

The original idea was a page that would let me generate a printable flyer for any published staff profile.

The flyer needed:

- staff member name
- role
- tracked QR code
- readable profile URL
- Now We See You branding
- a layout that prints cleanly without needing a separate design tool

Before this feature, I generated QR codes manually and designed each flyer separately.

That was manageable for one or two profiles.

It did not make sense as a chapter workflow.

---

## Why I built it

The problem became obvious with Brad's profile.

When Brad's portrait was selected for the Kirkland Arts Center exhibition, I wanted a QR code that could be connected to that physical display and measured separately from normal website traffic.

That experience made physical displays a real part of the platform.

Every new profile may eventually need a flyer or placard.

If generating one requires me to open a design tool, find the right QR, copy the URL, and rebuild the same layout manually, then the chapter still depends on me.

The Flyer Generator moves that work into the platform.

---

## Where it lives now

The original plan was a separate:

```text
/admin/flyer
```

route.

I changed that during implementation.

The Flyer Generator now appears as a tab inside the existing dashboard.

That keeps it inside the same school-scoped context as the rest of the admin tools.

A school administrator sees the Flyer Generator for the currently selected school.

A Community Outreach user can also access the Flyer Generator without receiving the rest of the administrator dashboard.

For a Community Outreach-only account, the Flyer Generator is effectively the restricted dashboard experience.

---

## How it works now

1. The dashboard provides the current `schoolId`.
2. Flyer Generator loads published profiles for that school.
3. The user selects a staff member.
4. The app looks through active redirect records for one whose destination matches that profile.
5. If a redirect is found, its ID is passed to `FlyerPreview`.
6. `FlyerPreview` generates a QR code pointing to the main Supabase `qr-redirect` Edge Function.
7. The flyer displays the staff member's name, role, QR code, readable profile URL, and project branding.
8. The user clicks **Print Flyer**.
9. Browser print mode hides the rest of the application and prints only the flyer.

The current data flow is:

```text
school
  |
published profiles
  |
selected profile slug
  |
active redirect lookup
  |
redirect ID
  |
Supabase qr-redirect URL
  |
QR code
  |
printable flyer
```

---

## The QR destination

The original July plan expected flyer QR codes to point to:

```text
https://heros-redirect.vercel.app/r/<redirect-id>
```

That changed.

The current Flyer Generator uses the main application's tracked redirect endpoint:

```text
https://<supabase-project>.supabase.co/functions/v1/qr-redirect?id=<redirect-id>
```

That redirect then sends the visitor to the production profile:

```text
https://nowweseeyou.org/gallery/<slug>
```

The QR itself therefore does not point directly to the public profile page.

The readable profile URL is still printed on the flyer underneath the QR.

That gives someone a fallback if they want to type the address manually.

---

## Redirect lookup

The Flyer Generator does not silently create a random untracked QR.

It looks for an active redirect that belongs to the selected profile.

The current implementation loads active redirects and looks for a destination containing:

```text
/gallery/<selected-slug>
```

If it finds one, the flyer can be rendered.

If it does not find one, the user sees:

```text
No active QR redirect found for this profile.
```

That is safer than printing a QR code that bypasses tracking or points somewhere incorrect.

Profile QR generation elsewhere in the workflow is responsible for establishing the tracked redirect.

---

## School scoping

The profile dropdown is school-scoped.

The query requires:

```text
status = published
school_id = current school
```

This was an important correction after the first version of the feature.

A school should not see another school's staff profiles just because the user has access to the Flyer Generator.

Global administrators switch the current school at the dashboard level.

The Flyer Generator then receives that selected school ID.

---

## Community Outreach access

The original Flyer Generator was designed as an admin-only feature.

That became too restrictive once the club role system was added.

Community Outreach needs to produce and share flyers.

They do not need permission to:

- approve nominations
- edit profiles
- manage administrators
- manage club roles
- view the full admin workflow

The current access model therefore allows a Community Outreach user to reach the Flyer Generator for their own school without granting full administrator access.

The permission is school-wide for published profiles.

Community Outreach does not need a separate assignment for every individual profile.

---

## QR code library

The project uses the existing `qrcode` package.

`FlyerPreview.tsx` renders the QR into a canvas.

No extra QR dependency was needed.

The QR is generated in the browser from the redirect URL.

---

## Print layout

The flyer uses browser printing rather than a PDF-generation library.

Clicking:

```text
Print Flyer
```

calls:

```text
window.print()
```

Print-specific CSS:

- hides the dashboard
- keeps only the flyer visible
- centers the flyer
- uses A4 portrait sizing
- preserves the intended background and border colors
- removes normal browser page margins

This also means someone can choose **Save as PDF** from the browser print dialog if they want a digital copy.

I did not need to build separate PDF-generation code.

---

## Current flyer layout

The implemented flyer contains:

```text
NOW WE SEE YOU

Meet [Staff Member Name]

[Role]

[QR CODE]

SCAN TO READ [FIRST NAME]'S STORY

and discover the people who keep our community running

nowweseeyou.org/gallery/[slug]

A student-led portrait and storytelling project
```

The design intentionally stays simple.

The portrait is not included in the flyer itself.

The QR and the person's name are the focus.

---

## Files involved

| File | Purpose |
|---|---|
| `src/pages/AdminFlyer.tsx` | Loads school-scoped published profiles and finds the active redirect |
| `src/components/FlyerPreview.tsx` | Generates the QR and renders the printable layout |
| `src/pages/Admin.tsx` | Places Flyer Generator inside the dashboard and controls administrator or Community Outreach access |

The original plan called for adding a separate route in `App.tsx`.

The final implementation did not need that route because the Flyer Generator became a dashboard tab instead.

---

## What I am not building right now

- bulk generation of every profile flyer at once
- different visual templates for every profile
- portrait images embedded into the flyer
- a separate server-generated PDF system
- a unique tracking ID for every individual printed copy
- a redesign that forces all historical `heros-redirect` codes into the main redirect system

The current flyer uses the profile's existing active redirect.

That means the scan is tracked against that redirect.

It does not create a brand-new unique redirect for every physical copy of the flyer.

If I later need to compare two different physical placements for the same profile, that would require a separate per-placement redirect feature.

---

## Success criteria

The original success criteria are now mostly complete:

- [x] Dropdown shows published profiles
- [x] Profiles are scoped to the selected school
- [x] Selecting a profile uses its active tracked redirect
- [x] QR code routes through the tracking endpoint
- [x] Flyer displays the correct staff name and role
- [x] Flyer displays the readable production profile URL
- [x] Flyer renders in print preview
- [x] Missing redirect produces an error instead of an untracked QR
- [x] Community Outreach can use the Flyer Generator without full admin access
- [x] Existing profile flyer flow has been manually tested
- [ ] Add a current final Flyer Generator screenshot to `docs/assets/`

---

## What changed from the first design

There were three main changes.

First, it moved from a separate page into the dashboard.

Second, Community Outreach gained access without becoming an administrator.

Third, the QR source changed from the independent `heros-redirect` service to the main application's tracked `qr-redirect` system for this workflow.

The feature is still doing what I originally wanted.

Pick a person.

Get the correct tracked QR.

Print a consistent flyer.

The implementation underneath it just became more connected to the rest of the chapter workflow than I expected when I first wrote the plan.