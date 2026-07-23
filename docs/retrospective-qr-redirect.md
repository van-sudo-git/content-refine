# Retrospective: QR Redirect Architecture

*Written July 2026. The architecture described here is already built.
This is an explanation of how it got that way.*

---

## Where it started

Now We See You didn't start with Lovable. It started with Google Sites.

The first version is still live at
`sites.google.com/view/now-we-see-me/gallery/brad-fisher`. It had everything
the current platform has in concept - Brad's profile, his story, his quotes,
a Google Form for leaving thank you notes (the original appreciation wall),
a nomination page, and a Privacy, Consent and Ethics page. The thinking was
there from the beginning. The infrastructure was not.

Brad's quotes from that original version are the same ones on the platform
today: "Without us, it's kind of a break in the chain. We help keep things
functional and presentable." That line came from the first conversation,
before Lovable, before Supabase, before any of the current technical
architecture existed.

I made a flyer with a QR code so Brad could share his profile easily -
friends, family, people he wanted to show. The QR code on that flyer pointed
directly to his Google Sites page.

The Google Sites version was also how the project was first introduced to the
school's Vice Principal and Ms. Bateman. Before there was a real platform,
before there was Lovable or Supabase or a custom domain, there was a Google
Sites page and a conversation about whether this idea had a place in the
school. It did. The VP and Ms. Bateman saw immediately how it connected to
something the school had been thinking about - recognizing the people who
keep the building running but rarely get named in any official capacity.

That conversation shaped how the project grew. The culture club that exists
at the school already had a version of this instinct - celebrating community,
surfacing people who are usually in the background. Now We See You became a
more permanent, more structured expression of the same idea. Not a one-time
event but an archive. Not a celebration that ends when the school year does
but a record that outlasts any given student or staff member.

The Google Sites page made that conversation possible. It was rough in
infrastructure. It was not rough in thinking.

That was the first mistake. Not because Google Sites was wrong. Because a
direct link is not permanent.

---

## What broke

When I rebuilt the platform on Lovable, nowweseeyou.org moved. Brad's profile
moved. The QR code on his flyer did not.

Anyone he had already shared it with would scan it and land somewhere wrong.
The flyer was printed. It had already been given to people. There was no
taking it back.

Two things became clear at once.

First: a QR code that points directly to a platform is only as stable as
that platform. Change the platform and you have broken every physical object
that carries that code. Second: the Google Sites QR code had no analytics.
No scan count. No way to know if anyone had ever used it. The flyer existed
in the physical world and left no trace in the digital one.

---

## What I tried first

The obvious fix: store redirects in the main platform's Supabase database.
A `redirects` table. An ID. A destination URL. A Supabase edge function that
looks up the destination and sends the visitor there.

This worked. It is still in the codebase - there is a `redirects` table and
a `qr-redirect` edge function in the main Supabase project right now.

But it solved the wrong problem. The main platform runs on Lovable's hosting.
Move off Lovable - or let Lovable change how it handles domains - and the
edge function URL changes. The QR codes break again. I had replaced one
fragile dependency with a different fragile dependency.

---

## The actual problem

A printed flyer does not update itself. Neither does a placard on a school
wall. The physical object is permanent in a way that software is not, and
every time you connect a QR code directly to a platform you are betting that
the platform will never move. That is a bet you will eventually lose.

The redirect layer needed to be something I owned entirely. Not Lovable's
infrastructure. Not a Supabase project that lives inside the main app.
Something deployed independently, on infrastructure I control, that has
no dependency on whatever platform is running the main site.

---

## What I built

`heros-redirect`. A Next.js service on Vercel at
`heros-redirect.vercel.app`. Its own repository. Its own Supabase project
for analytics. Nothing connecting it to the main platform except the redirect
IDs themselves.

QR codes now point to:
```
https://heros-redirect.vercel.app/r/<redirect-id>
```

The destination URL behind that ID can change at any time. If the main
platform moves tomorrow, I update one value in the `heros-redirect` database
and every printed QR code works again immediately. The physical object and
the digital platform are decoupled. The QR code does not know or care what
is behind it.

Scan analytics came with it. Every scan logs to `redirect_events_daily`
with the redirect ID and the date. That is how the `brad-kac` code
accumulated 16 scans from the Kirkland Arts Center. That data did not exist
before this system existed.

---

## How it runs

1. Someone scans a QR code
2. Phone opens `heros-redirect.vercel.app/r/<redirect-id>`
3. Service looks up the ID in its own Supabase database
4. Logs the scan - fire-and-forget, does not block the redirect
5. Returns a 302 to the destination URL
6. Visitor lands on the profile

The logging is intentionally non-blocking. The redirect happens first.
If a scan fails to log, it just does not get counted. That is acceptable.
Making someone wait for an analytics write before reaching a profile is not.

---

## Supabase free tier

One practical thing worth documenting: Supabase pauses inactive projects
on the free tier after a week without activity. Early on this was a real
concern - a paused database takes the site down with it.

Moving the main platform to Lovable's paid plan solved most of this.
Lovable includes managed Supabase as part of the subscription. The main
platform's database stays active through regular usage.

The `heros-redirect` project runs on a free Supabase tier. It stays active
through natural QR scan traffic - enough people scanning placards each week
that the project never goes idle. So far this has not been a problem.

At one point I considered consolidating both into a single paid Supabase
instance. Lovable's managed Supabase made that unnecessary for now. The
two-project architecture adds some complexity in `AdminAnalytics` - there
is deduplication logic that merges scan data from both sources - but it
works cleanly and the separation is architecturally correct regardless.

---

## The migration

Going from the old system to the new one was not clean.

For a period, redirect records existed in both places - the main platform's
`redirects` table and `heros-redirect`'s database. The admin analytics
dashboard had to deduplicate QR scan data across both sources to avoid
counting the same scan twice.

That deduplication logic in `AdminAnalytics.tsx` exists because of the
transition period. It was not part of the original design. It is a record
of the fact that I built this incrementally rather than all at once.

If I were starting over: build `heros-redirect` first, before creating any
QR codes. Never connect a physical object directly to a platform's URL.
The current architecture is right. It just took two broken links and one
migration to get there.

---

## What it comes down to

The QR code on Brad's flyer is permanent. The software behind it is not.
Those two things needed to be separate from the beginning.

They weren't. Now they are.
