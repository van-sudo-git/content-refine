# Retrospective: QR Redirect Architecture

*Written July 2026 after building the first independent redirect service. Updated August 2026 after QR generation became part of the main profile workflow too. I kept the original history because the current architecture only makes sense if you know what broke first.*

---

## Where it started

Now We See You did not start with Lovable.

It started with Google Sites.

The first version is still live at:

```text
sites.google.com/view/now-we-see-me/gallery/brad-fisher
```

It had most of the current project in concept.

Brad's profile.

His story.

His quotes.

A Google Form for thank-you notes, which was the first version of the appreciation wall.

A nomination page.

A Privacy, Consent and Ethics page.

The thinking was there from the beginning.

The infrastructure was not.

Brad's quote from that first version is still part of the project:

> "Without us, it's kind of a break in the chain. We help keep things functional and presentable."

That came from the first conversation, before Lovable, before Supabase, and before the current technical architecture existed.

I made a flyer with a QR code so Brad could share his profile.

That QR code pointed directly to his Google Sites page.

The Google Sites version was also how I first introduced the project to people at school.

Before there was a custom platform, there was a working page I could show someone.

That mattered.

It made the idea concrete enough to have a real conversation about whether the school needed something like this.

The first version was rough in infrastructure.

It was not rough in purpose.

The QR problem came from treating the physical flyer and the website URL as if they had the same lifetime.

They do not.

---

## What broke

When I rebuilt the project, Brad's profile moved.

The QR code printed on his original flyer did not.

That is the problem with a direct QR destination.

A web page can move.

A printed flyer cannot update itself.

The second problem was analytics.

The direct Google Sites QR gave me no scan count.

I could put the flyer into the world, but I had no way to tell whether anyone used it.

Those two problems became much more important once portraits and QR codes started being displayed physically.

---

## What I tried first

The obvious fix was to create redirects inside the main Supabase project.

The basic design was:

```text
QR
 |
redirect ID
 |
redirect lookup
 |
profile URL
```

I added a `redirects` table and a `qr-redirect` Edge Function.

That worked technically.

The redirect could look up a destination and send the visitor there.

But at the time I was still thinking about what would happen if the entire main platform moved again.

If the QR itself depended on an endpoint belonging to the same system I was trying to protect it from, I had not completely separated the physical object from the application.

That led to the independent redirect service.

---

## The independent redirect service

I built `heros-redirect` as a separate Next.js service.

It has:

- its own repository
- its own deployment
- its own Supabase project
- its own redirect records
- its own daily scan counts

QR codes using that system point to:

```text
https://heros-redirect.vercel.app/r/<redirect-id>
```

The redirect ID stays on the physical QR.

The destination behind it can change.

That means I can update where the scan goes without changing the printed code.

This was especially useful for physical displays that already existed.

The Kirkland Arts Center code for Brad used this system.

That is how the `brad-kac` redirect recorded scans from the exhibition.

---

## How `heros-redirect` works

1. Someone scans the QR.
2. The phone opens `heros-redirect.vercel.app/r/<redirect-id>`.
3. The service looks up the redirect ID.
4. It records the scan.
5. It sends the visitor to the saved destination URL.
6. The visitor reaches the Now We See You profile.

The important part is the extra layer between the physical QR and the content page.

The QR identifies the redirect.

The redirect decides where the visitor goes.

---

## Why analytics mattered

At first I thought scan tracking would just be an interesting number.

It became more useful once the art left the website.

A profile page view could come from anywhere.

A scan of `brad-kac` meant someone had probably encountered that specific physical display at the Kirkland Arts Center.

That gave the analytics context.

The physical installation and the digital profile were connected by an ID I could measure.

That was the first time the QR architecture felt like part of the project rather than just a convenient link.

---

## The migration was not clean

For a period, redirect records existed in two places:

- the main application's Supabase project
- the separate `heros-redirect` project

The analytics dashboard therefore had to work with both data sources and avoid known overlap.

That complexity exists because the architecture developed in stages.

It was not designed as two systems from the beginning.

The historical QR codes already existed.

I was not going to break working physical codes just to make the database architecture look cleaner.

---

## What changed again in August

The main application's QR system kept developing after I wrote the first version of this retrospective.

The `qr-redirect` Edge Function in the main Supabase project became part of the normal profile workflow.

A shared helper now generates tracked profile QR codes.

The process is:

```text
saved profile slug
        |
find or reuse redirect ID
        |
generate QR for qr-redirect Edge Function
        |
store QR image
        |
save redirect destination
        |
https://nowweseeyou.org/gallery/<slug>
```

The destination is explicitly the production domain:

```text
https://nowweseeyou.org/gallery/<profile-slug>
```

That fixed an important problem where a generated QR could otherwise end up pointing to the wrong host.

---

## Reusing the redirect ID

One design detail I wanted to keep was redirect continuity.

When possible, profile QR generation reuses an existing redirect ID.

That matters if the public profile information changes later.

The goal is not to create a new physical QR every time something about the profile changes.

The redirect record should be the stable identity.

The destination behind it is the part that can be updated.

This also keeps historical and future scan counts tied to the same tracked redirect when the same redirect ID is reused.

---

## QR generation is now part of the Club workflow

The QR used to be something I created separately after finishing everything else.

That made it another founder-only task.

Now an assigned Journalist can generate the tracked QR after the draft profile exists.

There are two safeguards around that.

First, QR generation uses the saved slug.

If the Journalist changes the slug in the form but has not saved it, the system asks them to save first.

Second, the Journalist cannot regenerate the QR while the profile is published.

An administrator has to move the profile out of the published state before that part can be changed.

Those checks are there because the QR may become a physical object.

Changing it should be more deliberate than editing a paragraph.

---

## The Flyer Generator uses the main redirect system

The current Flyer Generator also uses the main Supabase `qr-redirect` endpoint.

It looks for an active redirect associated with the selected published profile.

The QR printed on the flyer points to the redirect endpoint, not directly to:

```text
/gallery/<slug>
```

The flyer still prints the readable profile URL underneath the QR so someone can type it manually if needed.

This is different from the original July plan, which expected the Flyer Generator to always use `heros-redirect`.

The actual implementation changed as the main QR system became more complete.

---

## So why are there still two systems?

Because physical QR codes already exist.

`heros-redirect` still matters for the independent and historical codes that were created there.

The main Supabase redirect system now handles new profile QR generation and the current Flyer Generator workflow.

The admin analytics work has had to understand both.

If I were designing the whole project today with no printed QR codes in the world, I would probably choose one redirect system and use it everywhere.

But that is not the project I have.

I have QR codes that were already printed, already displayed, and already scanned.

Breaking them for architectural neatness would be the wrong tradeoff.

---

## What I learned about "permanent" QR codes

I used to call these permanent QR codes.

That word is too strong.

No software endpoint is literally permanent.

Domains can expire.

Hosting can change.

A Supabase project can move.

A Vercel deployment can move.

What the redirect architecture gives me is something more useful:

**the destination can change without changing the printed QR.**

That is the property I actually need.

The physical code is durable because it points to an indirection layer instead of directly to the content page.

That is a better description than pretending any piece of internet infrastructure lasts forever.

---

## What I would do if I started again

I would create the redirect layer before printing the first flyer.

I would never put a content URL directly into a QR that I expect to stay on a wall for years.

I would decide the tracking ID before printing.

And I would choose one redirect system before creating physical codes.

I did not know those things when I made Brad's first flyer.

The broken-link problem is what taught me.

That is also why I do not want to remove the older architecture from the repository history.

The final design makes more sense when the mistake that created it is still visible.

---

## What it comes down to

The QR code is part of a physical object.

The profile is software.

They should not be tightly coupled.

The redirect is the layer between them.

That was the lesson from the first Google Sites flyer.

Everything since then has been an attempt to make that lesson work reliably at a larger scale.