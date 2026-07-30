# Retrospective: Founder to Platform

*Written Jul 2026. The one-person bottleneck described here is where I am
right now. The club structure described at the end is the plan I'm building
toward — the schema work for it started this week alongside the multi-school
admin branch, and the real test comes once school is back in session.*

---

## Where I am right now

Right now, I am every role at Now We See You at once.

I do the interviews. I draw the portraits. I take the photos when a drawing
isn't right for the moment. I write the profile text, build the website, fix
the bugs, make the flyers, figure out the QR codes. When something breaks —
the redirect, the admin dashboard, a profile missing a school ID — I'm the
one who notices and the one who fixes it.

That works with two profiles at one school. It stops working as a platform
the moment I try to picture a second school.

## Where I feel it

The clearest version of it is a week where I'm juggling an interview I
haven't transcribed yet, a portrait that needs a highlight pass, and a
permissions bug in the database, all at the same time. None of those three
things are hard on their own. Doing all three, in the same week, as the same
person, is the actual problem I'm trying to solve.

If Now We See You only exists because I personally do all of it, it doesn't
scale to another school. It scales to however many hours I have. That's not a
platform — that's just me, with a website. I'm trying to build the former.

## What I got wrong at first

My first instinct was to treat scaling as an art problem: find someone who
can draw like I draw, or lower the bar so photography replaces portraits.
That's a real fix for one piece of it, but it misses the actual issue. The
bottleneck was never really about drawing. It's about one person owning
every step of getting a profile from a nomination to something live on the
site.

## What I'm building instead

I'm building the platform around roles, not just features. A journalist who
leads the interview and owns getting it done. A photographer. An artist who
chooses their own medium — charcoal, pen, watercolor, digital, whatever
they're actually good at — instead of everyone needing to draw like me. A PR
role that handles outreach and sponsorships after a profile is already live,
instead of that sitting on my list too.

This is how I democratize it. As founder, my job isn't to be the only person
who can run a chapter — it's to build a platform where any school can run one
with a handful of students who each own one piece well. A club with four
defined roles can do that. One founder trying to be all four roles cannot.

## Where this stands right now

The club isn't running yet. What's actually happening this week is the
schema groundwork — the same migration that's fixing how school admins are
scoped in the database is where I'm adding a `role` field and a nomination
`status` field too. That's a small addition on paper, but it's the actual
foundation the whole structure depends on. The real test — a nomination
moving through actual student journalists, photographers, and artists, at
more than one school — can't happen until school is back in session.

I'd rather write that down honestly now than pretend the club is already
running. This isn't a story about having built something. It's a founder
deciding that the platform's next real feature isn't a button or a chart —
it's roles, and giving up sole ownership of every one of them.
