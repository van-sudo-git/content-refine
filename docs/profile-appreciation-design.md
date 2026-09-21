# Profile Appreciation Design

**Updated:** September 2026

When I first built the profiles, the main way people could respond was by leaving a written message on the Appreciation Wall.

That worked well for people who had something specific to say, but I realized that not everyone wants to stop and write a full message.

I wanted to make it easier for someone to quickly show that they appreciated the person, while still keeping the written Appreciation Wall for people who wanted to say more.

## What I changed

I added a simple one-tap **Appreciate** button to each profile.

A visitor can tap it once to show appreciation.

The button changes to **Appreciated**, and the total count goes up.

They can tap it again to remove their appreciation.

This is separate from the Appreciation Wall.

The idea is:

- one tap if someone just wants to show support
- a written message if they want to say something more personal

## Why I kept it simple

I did not want the profiles to start feeling like social media.

There are no dislikes, emoji reactions, rankings, or feeds.

There is only one positive action: appreciate.

The focus should still be on the person, their portrait, their story, and their own reflection.

## How anonymous appreciation works

Visitors do not need to create an account.

The browser creates a random visitor ID and stores it locally.

That lets the site remember whether that browser has already appreciated a profile.

The public site does not show those visitor IDs.

It only shows:

- the total appreciation count
- whether the current browser has appreciated the profile

This is not meant to be a secure voting system.

Someone could clear their browser storage or use another browser and appreciate again.

I was okay with that tradeoff because this is a lightweight way to show recognition, not a competition or election.

## Making the page easier to explore

While working on the appreciation feature, I realized the main problem was not only adding a new button.

The Appreciation Wall was already on the page, but it was easy to miss because it appeared near the bottom of a long profile.

I wanted people to be able to discover the different parts of the profile without having to scroll through everything first.

I added section navigation for:

- Story
- Photos
- Reflection
- Appreciation

On desktop, the navigation stays visible in a floating sticky panel while the visitor scrolls.

On mobile, it becomes a sticky horizontal bar at the top of the profile content.

The active section changes as the visitor moves through the page, so it is always clear where they are.

The navigation also makes the Appreciation section much easier to discover.

Instead of having to reach the bottom of the profile, a visitor can jump directly to it.

For mobile, I use the shorter label **Reflection** so all of the sections fit more cleanly.

On desktop, I can use a more descriptive label such as **Reflection from Michele**.

## Making appreciation easier

I added a simple one-tap **Appreciate** button near the top of each profile.

A visitor does not have to scroll to the Appreciation Wall or write a full message just to show support.

They can tap once to appreciate the person.

The button changes to **Appreciated**, and the total count goes up.

They can tap it again to remove their appreciation.

The written Appreciation Wall still stays on the page for people who want to say something more personal.

## Database design

One-tap appreciations are stored separately from written appreciation messages.

The `profile_reactions` table stores one appreciation for each profile and anonymous visitor ID.

Public visitors cannot read the table directly.

The site uses database functions to:

- get the appreciation count
- check whether the current browser has appreciated the profile
- add or remove an appreciation

The functions only allow reactions on published profiles.

## What I wanted to preserve

The main goal was not to add more features to the page.

It was to make participation easier without changing what Now We See You is.

The portrait and story should still be the center of the experience.

The appreciation features are there to help more people respond to the person they just learned about.