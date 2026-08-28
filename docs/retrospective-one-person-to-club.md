# Retrospective: Founder to Platform

*Written July 2026 while the club structure was still being designed. Updated August 2026 after the role system, Club Dashboard, and nomination workflow were implemented and tested. I kept the July sections because they show what I thought the problem was before I actually built the solution.*

---

## Where I was in July

At that point, I was every role at Now We See You at once.

I did the interviews. I drew the portraits. I took the photos when a drawing was not right for the moment. I wrote the profile text, built the website, fixed the bugs, made the flyers, and figured out the QR codes.

When something broke, whether it was the redirect, the admin dashboard, or a profile missing a school ID, I was the one who noticed and the one who fixed it.

That worked with a few profiles at one school.

It stopped working as a platform the moment I tried to picture a second school.

## Where I felt it

The clearest version of it was a week where I was juggling an interview I had not transcribed yet, a portrait that needed another pass, and a permissions bug in the database, all at the same time.

None of those three things were hard on their own.

Doing all three, in the same week, as the same person, was the actual problem I was trying to solve.

If Now We See You only exists because I personally do all of it, it does not scale to another school.

It scales to however many hours I have.

That is not a platform. That is just me with a website.

I was trying to build the former.

## What I got wrong at first

My first instinct was to treat scaling as an art problem.

Find someone who can draw like I draw, or lower the bar so photography replaces portraits.

That is a real fix for one piece of the project, but it misses the larger issue.

The bottleneck was never really about drawing.

It was about one person owning every step of getting a profile from a nomination to something live on the site.

## What I decided to build

I decided to build the platform around roles, not just features.

A Journalist who leads the interview and owns the write-up.

A Photographer.

An Artist who can work in their own medium instead of needing to copy mine.

A Community Outreach role that works with the profile once it is public.

And an administrator who keeps oversight of the chapter.

That is how I thought I could make the project transferable.

As founder, my job should not be to remain the only person who can run a chapter.

It should be to build a system where another school can run one with a small group of students who each understand their part.

## Where this stood in July

When I first wrote this retrospective, the club was not running yet.

The work happening that week was database groundwork.

The role table, nomination status, assignments, and multi-school permissions were being built together.

At that point I wrote:

> I'd rather write that down honestly now than pretend the club is already running.

That still matters to me.

Built is not the same as used.

And code existing in a branch is not the same as a workflow actually working.

The real questions were still ahead:

Could a student sign in and see only their work?

Could a Journalist create a profile without becoming an administrator?

Could an Artist upload a portrait without seeing everything else in the school?

Could the system stop a Journalist from publishing?

Could one student hold more than one role?

Those questions only became visible once I started using the role system rather than just designing it.

---

## What happened after I built it

The database roles were the easy part.

The harder part was figuring out what those roles should actually be able to do.

The first version of the design assumed a clean order:

```text
nomination
journalist
photographer
artist
publish
outreach
```

Real work does not happen that neatly.

An Artist can finish a portrait before the Journalist finishes the interview.

A Photographer might already have approved photographs before the profile exists.

And one student might be the Journalist and Artist on the same nomination.

That forced me to change the model.

## The profile could not be the starting point for everything

Originally I thought creative work would attach to a profile.

That sounds logical from a database perspective.

But if the profile has to exist before the Artist can upload anything, then the Artist is waiting for the Journalist.

That creates exactly the kind of bottleneck the role system was supposed to remove.

So creative work became nomination-first.

Portraits and additional photos can be tied to the approved nomination before a profile exists.

The Journalist can start the written profile separately.

That was a small database change, but a much better representation of how the team actually works.

## People can hold more than one role

I also designed the roles as if a chapter would always have four different students.

That is not realistic for a new chapter.

Early on, I may still be the Journalist and Artist on the same profile.

Someone doing Community Outreach might also help with another part of the project.

The Club Dashboard now checks every role the logged-in person holds for that nomination instead of stopping at the first one.

That means permissions combine naturally when one person has more than one assignment.

This seems obvious now.

It was not obvious when I was only looking at the schema.

## Publishing changed completely

My first design let the Journalist publish.

I thought the participant's consent was the important safeguard, and another administrator step would just slow the process down.

I changed my mind once I built the Club Dashboard.

A Journalist should be able to interview someone, write the profile, edit it, and prepare it for publication.

But the person creating the story should not automatically be the only person deciding when it becomes public.

The final rule became:

```text
Journalist creates.
Admin publishes.
```

I did not want that to be a rule enforced only by hiding a button.

The database permissions also block a Journalist from changing a profile to published.

That way a frontend mistake does not accidentally remove the review step.

## The Journalist role became bigger

The Journalist now does more than I originally planned.

From the Club Dashboard, the assigned Journalist can:

- start the linked draft profile
- edit the person's name, role, department, and story
- add the featured quote
- add optional Staff Reflection information
- work with the draft portrait and additional photos
- generate or refresh the tracked QR once the draft exists

The first saved write-up moves the nomination from:

```text
approved
```

to:

```text
in_progress
```

The profile itself remains a draft until the administrator publishes it.

## Media permissions needed their own rules

Once students could upload files, I also needed to decide who could remove them.

Before publication:

- the Artist can remove portrait work
- the Photographer can remove additional photography
- the Journalist can remove either type for the nomination they are responsible for

After publication, Club members cannot remove that media.

That boundary exists because deleting a draft upload is normal editing.

Deleting part of an already published public profile is a different action.

The administrator keeps control of the published profile.

## QR generation became part of the workflow too

The QR code used to feel like something I did at the very end myself.

That does not work if the chapter is supposed to operate without me.

The Journalist can now generate the tracked QR once the draft profile exists.

The system uses the saved profile slug.

If the Journalist edits the slug but has not saved it yet, QR generation stops and tells them to save first.

That prevents us from printing a QR for an old destination.

Again, it is a small detail that only became obvious when I pictured someone other than me doing the work.

---

## What the workflow looks like now

The main path is:

```text
pending
   |
approved
   |
in_progress
   |
published
```

A nomination comes in.

An administrator approves it and assigns the team.

The Artist and Photographer can start immediately.

The Journalist creates the draft.

The team finishes the work.

The administrator reviews and publishes it.

Community Outreach can then use the published profile and Flyer Generator.

It is much simpler than some of the intermediate workflow designs I tried.

---

## What has actually been tested

By August, the role workflow was no longer just schema work.

I tested the major pieces of the system, including:

- adding and removing club roles
- one email holding different roles
- assignment of Journalist, Photographer, and Artist
- club login and role routing
- nomination-first creative uploads
- Journalist draft creation
- movement to `in_progress`
- editing an existing draft
- Staff Reflection fields
- role-scoped media deletion
- QR generation
- admin-only publication
- publication synchronization back to the nomination
- multi-school scoping

That means I can now say the software workflow works.

I still would not say the organizational problem is solved.

The next test is longer and harder.

Can several students actually use it over a school year?

Can a chapter continue when I am not the person reminding everyone what comes next?

Can another school run the process without me sitting beside them?

Those are adoption questions, not coding questions.

The software can make that possible.

It cannot prove it by itself.

---

## Where I am now

The biggest difference from July is that the platform no longer assumes I have to do every part of a profile.

I still can.

That matters because the first chapter is still small.

But the system no longer requires it.

That was the goal.

The next stage is not another permissions feature.

It is using the workflow with real people, seeing where they get confused, and finding out whether the chapter can keep moving when I am not doing every job myself.

That is a much better problem to have than the one I started with.