# AI Disclosure and Technical Ownership

Now We See You was conceived, designed, developed, tested, and maintained by Evaan Ahlawat.

AI-assisted tools were used for specific parts of development. Lovable was used primarily to assist with initial UI/UX work and as the Supabase-connected development environment. During later development, Lovable was also used to generate or execute specific Supabase schema migrations and Row Level Security policies from Evaan's requirements.

Evaan defined the product, architecture, workflows, security behavior, and technical requirements; reviewed and tested the resulting changes; and directly implemented and integrated the application behavior and later feature development.

This disclosure explains that division clearly.

---

## Project Origin

Now We See You began before the current React application and before Lovable was used.

Evaan developed the project after interviewing staff members at Lake Washington High School. He created the original portraits, defined the consent-first approach, designed the staff profile format, developed the nomination and appreciation concepts, and introduced QR codes to connect physical artwork with digital stories.

He first built the project as a working Google Sites prototype:

[Original Now We See Me prototype](https://sites.google.com/view/now-we-see-me)

That version already included staff profiles, portrait artwork, interviews, QR-linked access, nominations, an appreciation wall, and privacy and consent guidelines.

The current application grew from that existing project and product model.

---

## How Lovable Was Used

### UI and UX

Lovable assisted with portions of the initial React interface, including page scaffolding, visual components, layouts, styling, responsive behavior, and UI iteration.

Evaan defined what the product needed to do, which pages and workflows were required, what information users should see, and how visitors, students, and administrators should move through the system.

He reviewed, tested, changed, and extended the application as the project evolved.

### Supabase-Connected Development Environment

Lovable also helped provide and manage the development environment connected to Supabase.

During later development, Lovable was used to generate or execute specific schema changes and Row Level Security policies based on Evaan's requirements. Examples include adding database columns, creating or updating RLS policies, and running migrations.

Evaan determined the required behavior, reviewed the resulting database changes, tested them against the application workflow, and continued the implementation and integration in the codebase.

Evaan directly worked on the underlying application architecture, including:

- database schema design
- PostgreSQL migration requirements
- Row Level Security behavior
- authentication and storage permissions
- school-scoped administrator access
- student role permissions
- nomination and profile workflows
- publication restrictions
- QR redirects and analytics
- multi-school onboarding
- production testing and debugging

Lovable accelerated parts of development. Evaan remained responsible for how the system's data, permissions, workflows, and security rules actually behaved.

---

## Core Technical Work by Evaan

### Multi-School Architecture

Evaan designed and implemented school-scoped administration and onboarding so multiple schools can use one platform while keeping their data and permissions separated.

A school can exist privately, decide when to accept nominations, and appear publicly only after it has published work.

Technical details: [Multi-School Admin Architecture](./docs/multi-school-admin.md)

### Student Role System

Evaan designed the role model and implemented the application workflow for Journalist, Artist, Photographer, and Community Outreach.

Students can hold overlapping roles, while permissions remain scoped to the correct school and assigned work.

Technical details: [Club Roles Specification](./docs/club-roles-spec.md)

### Nomination and Profile Workflow

Evaan designed and implemented the current active workflow:

```text
pending -> approved -> in_progress -> published
```

The database still retains `assigned` and `submitted` as historical status values, but they are not part of the current normal workflow.

Artists and photographers can begin from an approved nomination before the written profile exists. A Journalist's first save creates the linked draft and moves the nomination into active work.

Journalists can write and edit profiles but cannot publish them. Publication remains an administrator responsibility and is enforced through backend permissions, not only the interface.

Design history and implementation: [From One Person to a Club](./docs/retrospective-one-person-to-club.md)

### QR Architecture

Evaan redesigned the QR system after discovering that a physical QR code can outlive the URL it originally points to.

He built redirect-based QR handling so a printed code can remain usable even if the destination changes.

This work includes the standalone `heros-redirect` service, tracked redirects, scan analytics, the main application's QR workflow, production destination handling, and profile QR generation.

Technical details and design history: [QR Redirect Retrospective](./docs/retrospective-qr-redirect.md)

### Additional Platform Features

Evaan also directly developed and integrated features including:

- [Flyer Generator](./docs/flyer-generator.md)
- [Profile Share feature](./docs/share-button.md)
- Staff Reflection
- contributor attribution
- role-based media permissions
- school-controlled public nominations
- public chapter galleries
- school onboarding
- verification and testing scripts

The broader chapter workflow is documented in the [Start a Chapter Guide](./docs/start-a-chapter-guide.md).

---

## Key Technical Decisions

The project evolved through real use and testing. Several important architecture decisions came from problems Evaan discovered while building it.

These include:

- separating physical QR codes from final profile destinations
- preventing Journalists from publishing their own work
- allowing Artists and Photographers to begin before a profile exists
- supporting students who hold more than one role
- enforcing important permissions in the database
- keeping school setup, nomination opening, and public launch as separate states
- using one multi-school platform instead of creating a separate website for each chapter

These decisions are documented across the [Club Roles Specification](./docs/club-roles-spec.md), [Multi-School Architecture](./docs/multi-school-admin.md), and [QR Retrospective](./docs/retrospective-qr-redirect.md).

---

## Testing and Technical Understanding

Evaan tested the application using real project data and dedicated test workflows.

This included authentication, administrator permissions, school-scoped access, student roles, nomination assignments, profile creation, publication restrictions, QR redirects, media permissions, public chapter behavior, mobile behavior, and production data verification.

Evaan can explain the application beyond its visible interface, including:

- how nominations and profiles are linked
- how status transitions work
- how school-level access is enforced
- how Supabase Row Level Security is used
- why publication is protected in the backend
- how QR redirects separate physical codes from digital destinations
- how the multi-school architecture works
- why the current workflow changed from earlier versions

Testing evidence and workflow verification are maintained in [`test.md`](./test.md).

---

## AI Used Inside the Running Application

Now We See You also uses AI for one limited runtime function: moderation of appreciation messages.

Evaan defined the moderation purpose, rules, and user experience. The AI system evaluates submitted messages against those criteria before they are shown publicly.

The AI does not write staff profiles, conduct interviews, create portrait artwork, choose who should be featured, or decide whether a profile should be published.

---

## Technical Ownership Summary

| Area | Evaan's Contribution | Lovable / AI Contribution |
|---|---|---|
| Project concept and mission | Conceived directly | None |
| Original Google Sites prototype | Built directly | None |
| Portraits, interviews, and consent model | Created and conducted directly | None |
| Initial React UI/UX | Defined requirements, reviewed, tested, and iterated | Lovable assisted with initial UI scaffolding and implementation |
| Supabase architecture | Defined required schema, migrations, RLS behavior, permissions, workflows, and testing; reviewed and validated changes | Lovable generated or executed specific schema migrations and RLS changes from Evaan's requirements |
| Multi-school, roles, workflows, and later platform features | Designed the architecture and workflows; implemented and integrated application behavior; tested and debugged the systems | Lovable contributed specific Supabase schema and RLS changes where used |
| QR architecture | Designed, implemented, tested, and evolved directly | No Lovable contribution to the independently developed redirect architecture |
| Appreciation moderation | Defined rules and behavior | AI evaluates messages at runtime |

---

## Technical Ownership

Now We See You did not begin with an AI prompt.

It began with Evaan identifying a real problem, interviewing people at his school, creating their portraits, building the first version of the project, and then developing the technology needed to make the work repeatable across schools.

Lovable helped accelerate portions of UI development and supported the Supabase-connected development environment. It also generated or executed specific database migrations and RLS changes from Evaan's requirements.

Evaan remained responsible for defining the architecture and product behavior, reviewing and testing those changes, implementing and integrating the application workflows, debugging production behavior, and understanding how the finished system works.

The finished application reflects Evaan's product thinking, engineering decisions, implementation, testing, iteration, and responsibility for the system.
