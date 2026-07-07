# AI Disclosure

Now We See You was developed with AI-assisted tools. This document explains how those tools were used, what Evaan led and contributed directly, and where AI generated or assisted with implementation.

The goal is to make the project's development process clear and transparent for anyone reviewing the work.

---

## Evaan's role and contributions

**The problem, mission, and product concept** — Evaan conceived the idea after building relationships with classified staff at his school and recognizing that many essential people in a school community are rarely known beyond their job titles. No AI tool suggested the project or its purpose.

**The community work** — Evaan created every charcoal and graphite portrait by hand, conducted staff interviews, managed consent conversations, and built the relationships that made public profiles possible.

**Product and experience design** — Evaan defined the profile structure, nomination workflow, appreciation-wall experience, QR-linked visitor journey, and the ways school staff and students would use the platform.

**Data and access-control requirements** — Evaan defined the key information the platform needed to support: staff profiles, nominations, appreciation messages, QR routing, daily engagement tracking, and school-based administrative access. The implementation developed through a mix of AI-assisted generation, direct edits, testing, and iteration.

**QR redirect architecture** — Evaan identified the need to separate printed QR codes from changing profile URLs, so that a physical placard could continue pointing visitors to the correct destination even if the main site changes. He designed the intended scan-to-profile experience, tested the physical QR workflow, and integrated it into the broader product. He built the standalone redirect service himself — see `heros-redirect` below.

**Analytics requirements** — Evaan defined the need to track profile views, QR scans, nominations, and appreciation activity, including avoiding double-counting while QR systems were being transitioned. He reviewed, tested, and iterated on the resulting dashboard behavior.

**Admin authentication behavior** — Evaan identified a timing problem where an administrator could be redirected before Supabase finished resolving session state. He worked through and tested a `useAuthReady` approach that waits for session resolution before protected content renders and cleans up the authentication subscription when the component unmounts.

**Moderation criteria** — Evaan defined and refined the school-specific rules for what kinds of appreciation messages should be approved, rejected, or flagged for review. The runtime system applies those criteria to each submitted message.

---

## Where AI tools were used

### Lovable

Lovable is an AI-assisted web-development platform that generates and revises application code from product requirements and design direction.

Evaan used Lovable to develop significant portions of the React front end, UI scaffolding, and Supabase-connected functionality. His process involved defining requirements, user flows, expected behavior, data needs, and visual direction; reviewing generated output; testing it with real users and project data; and iterating when the implementation did not meet the intended experience.

**Lovable's role:** generated and revised significant portions of application code based on Evaan's direction.  
**Evaan's role:** led product definition, community use case, feature requirements, system-level decisions, testing, debugging, and iterative refinement.

### Gemini 2.5 Flash Lite (via Lovable AI Gateway)

Gemini is used at runtime for appreciation-wall moderation through the `supabase/functions/moderate-appreciation` edge function.

When someone submits an appreciation message, the system sends the message and school-specific approval criteria to the model. The model returns a moderation result before the message is saved as approved or rejected. Evaan defined and refined the approval criteria and the user experience around moderation.

### Claude Code

Claude Code was used to scaffold a Remotion video-pipeline experiment in the `remotion/` subproject. This experiment is separate from the core Now We See You web application and is not required for the platform's primary functionality.

---

## Summary table

| Component | Evaan's role | AI/tool role |
|---|---|---|
| Product concept and mission | Conceived and led | None |
| Portrait artwork, interviews, and consent | Created and conducted directly | None |
| Public profile and nomination experience | Defined product requirements and user flow | Lovable assisted with application implementation |
| Front-end React application | Directed, reviewed, tested, and iterated | Lovable generated significant portions of code |
| Data model and school access requirements | Defined core product/data needs and reviewed iterations | Implementation used a mix of Lovable-assisted generation and direct edits |
| QR redirect service (`heros-redirect`) | Written directly by Evaan in Next.js | No AI tool used |
| QR-linked visitor journey | Designed, tested, and integrated | Standalone redirect service built directly; main app integration Lovable-assisted |
| Analytics behavior and dashboard requirements | Defined, reviewed, tested, and iterated | Implementation was AI-assisted and refined through testing |
| Admin auth readiness behavior | Identified the problem and tested/refined the solution | Implementation was developed in the project workflow |
| Appreciation moderation criteria | Defined and refined | Gemini 2.5 Flash Lite evaluates messages at runtime |
| Remotion video experiment | Directed as a separate experiment | Claude Code assisted with scaffolding |

---

## Ongoing approach

Evaan uses AI tools as development collaborators, not as substitutes for product ownership or community work. He aims to understand the workflows he deploys, test them with real users, document material design decisions, and be explicit about where AI generated or assisted with implementation.

