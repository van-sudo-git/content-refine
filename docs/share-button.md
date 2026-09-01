# Share Button - Architecture Notes

*Written July 2026 before implementation. Updated after implementation and testing. This feature ended up staying very close to the original design.*

---

## What I built

Every staff profile has a Share button.

On a device that supports the Web Share API, tapping it opens the native share interface so someone can text the profile, send it to another app, or share it using whatever options their device provides.

If native sharing is not available, the button copies the profile URL to the clipboard instead.

No backend is involved.

No database record is created.

It is a small frontend feature.

---

## Why

Before this feature, the only way to share a profile was to copy the URL manually from the browser.

That works, but it adds friction.

A lot of people encounter Now We See You by scanning a QR code.

That means they are already holding a phone when they reach the profile.

If they read someone's story and want to send it to someone else, the Share button removes the need to select and copy the browser URL manually.

This is not about making the platform more social.

It is about making a person's story easier to pass along once someone has chosen to read it.

---

## How it works

1. `ShareButton` receives the staff member's `name` and profile `slug`.
2. It builds the public URL:

```text
https://nowweseeyou.org/gallery/<slug>
```

3. On click, it checks whether `navigator.share` exists.
4. If native sharing is supported, it calls `navigator.share()` with:
   - profile title
   - short story text
   - public profile URL
5. If the user cancels the share sheet, nothing happens.
6. If native sharing is not available, it uses `navigator.clipboard.writeText()`.
7. If clipboard access fails, it falls back to a temporary hidden input and `document.execCommand("copy")`.
8. After a successful clipboard copy, the button displays:

```text
Copied!
```

for two seconds.

---

## Shared content

The native share payload is built from the profile.

Title:

```text
Meet [Full Name] | Now We See You
```

Text:

```text
Read [First Name]'s story on Now We See You.
```

URL:

```text
https://nowweseeyou.org/gallery/<slug>
```

The individual profile route is important.

The Share button should never share an admin URL, temporary preview URL, school gallery route, or development host.

It shares the public staff profile directly.

---

## Why native share matters

Most QR code scans happen on phones.

Someone scans a portrait or flyer, reads the profile, and already has the device in their hand.

On supported devices, native sharing lets the operating system decide what choices to show.

That might include messaging, email, AirDrop, WhatsApp, or another installed app.

The application does not need separate integrations for each one.

It just hands the story and URL to the device.

---

## Technical decisions

### No external dependencies

`navigator.share` and `navigator.clipboard` are browser APIs.

The feature did not need another package or backend service.

### Cancel is silent

If someone opens the native share interface and changes their mind, that is not an error.

The code catches the cancellation and returns without showing a warning or copying the link anyway.

That behavior stayed exactly as planned.

### Clipboard fallback

On devices without native sharing, the URL is copied using:

```text
navigator.clipboard.writeText()
```

The button temporarily changes to:

```text
Copied!
```

with a check icon.

### Older browser fallback

If the Clipboard API is unavailable, the component creates a temporary input, selects the URL, uses:

```text
document.execCommand("copy")
```

and then removes the temporary element.

`execCommand` is old browser behavior, but it is only used as the final fallback.

---

## Files involved

| File | Purpose |
|---|---|
| `src/components/ShareButton.tsx` | Handles native share and clipboard behavior |
| `src/pages/ProfilePage.tsx` | Places the Share button on the public profile |

No database migration, Edge Function, storage change, or new API was needed.

---

## Testing

The feature has been manually tested in the main cases.

### Mobile

Expected:

```text
Tap Share
Native share interface opens
Correct profile name and URL are included
```

Result:

```text
Pass
```

### Desktop

Expected:

```text
Click Share
Profile URL is copied
Copied! appears for two seconds
```

Result:

```text
Pass
```

### Cancel

Expected:

```text
Open native share
Cancel
No error appears
No fallback action is forced
```

Result:

```text
Pass
```

### Mobile layout

The button was also checked as part of the 390px mobile layout testing.

It does not create horizontal overflow on the profile page.

---

## Evidence

Screenshots already stored in `docs/assets/`:

```text
share-button-jul2026.png
share-button-desktop-jul2026.png
```

The manual test results are also recorded in:

```text
test.md
```

---

## Success criteria

- [x] Share button appears on published profile pages
- [x] Native sharing uses the correct profile name and URL
- [x] Desktop fallback copies the public profile URL
- [x] "Copied!" confirmation appears after clipboard copy
- [x] Cancelling native share does not produce an error
- [x] Older browser fallback exists
- [x] Mobile layout has no horizontal overflow
- [x] Screenshots saved in `docs/assets/`
- [x] Manual test cases recorded in `test.md`

---

## What changed from the original design

Very little.

This was one of the rare features where the simplest version was also the final version.

There was no reason to build sharing analytics, app-specific buttons, social integrations, or a backend share service.

The browser already knows how the user wants to share something.

The platform only needs to give it the correct story and URL.

That is still all the feature does.