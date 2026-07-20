# Share Button — Architecture Notes

*Written July 2026 before implementation.*

---

## What I'm building

A share button on every staff profile page. One click — on mobile it opens
the native share sheet so someone can text the link, post it, or AirDrop it.
On desktop it copies the URL and shows a brief confirmation.

No backend. No new database tables. Pure front-end.

---

## Why

Right now the only way to share a profile is to copy the URL manually from
the browser bar. That works but it's friction. Most people who land on a
profile did so by scanning a QR code on their phone — they're already on
mobile, already in share mode. One button removes the last step.

The footer has a "Nominate Someone" button on every page so that's covered.
This is about making it easy to spread someone's story once you've read it.

---

## How it works

1. Button renders on every published profile page near the staff member's name
2. On click — tries `navigator.share()` first
3. On mobile this opens the native share sheet (iMessage, WhatsApp, Instagram, AirDrop, etc.)
4. If the user cancels native share, nothing happens — no fallback needed
5. On desktop where `navigator.share` isn't available, copies URL to clipboard
6. Shows "Copied!" with a green checkmark for 2 seconds after clipboard copy
7. Older browser fallback uses `document.execCommand("copy")` via a hidden input

The URL shared is always the canonical profile URL:
`https://nowweseeyou.org/gallery/{slug}`

---

## Why native share matters

Most QR code scans happen on phones. When someone scans Brad's QR code in
the hallway and reads his story, they're already holding their phone. Native
share means they can forward it to a parent, post it to a school group chat,
or send it to a teacher in two taps without leaving the page. Clipboard copy
would require switching apps and pasting — native share removes that entirely.

---

## Technical decisions

**No external dependencies** — `navigator.share` and `navigator.clipboard`
are native browser APIs. Nothing to install.

**Cancel is silent** — if someone opens the native share sheet and then
dismisses it, nothing happens. No error, no fallback. That's the right
behavior — they changed their mind.

**`execCommand` fallback** — deprecated but still works in every browser.
Used as last resort only if `navigator.clipboard` throws, which happens
in some HTTP contexts. Shouldn't be needed on nowweseeyou.org since it's HTTPS.

---

## Files to create or modify

| File | Action |
|------|--------|
| `src/components/ShareButton.tsx` | Create — the share button component |
| `src/pages/ProfilePage.tsx` | Modify — add ShareButton below staff member role |

---

## Success criteria

- [ ] Share button appears on every published profile page
- [ ] Tapping on mobile opens native share sheet with correct URL and name
- [ ] Clicking on desktop copies URL and shows "Copied!" for 2 seconds
- [ ] Cancelling native share does nothing — no error shown
- [ ] Works correctly on Brad Fisher and Shirley P. profiles
- [ ] No horizontal overflow on mobile (390px viewport)
- [ ] Screenshot saved to docs/assets/share-button-jul2026.png
- [ ] test.md updated with share button test cases