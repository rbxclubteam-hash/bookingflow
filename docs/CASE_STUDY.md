# BookingFlow — Case study

A full-stack appointment booking system for small, appointment-based service businesses,
built as a portfolio demo. FastAPI + PostgreSQL + Next.js, run locally with Docker Compose.

All data is fictional. There are no real users, no production deployment, and no business
results to report — this document describes what was built and why.

## Problem

Solo professionals and small teams that sell time — coaches, consultants, trainers,
therapists, tutors, small studios — usually take bookings informally: email threads, DMs,
a shared spreadsheet, a paper diary. That works until it doesn't:

- **Double bookings.** Two people are told the same slot is free.
- **Scheduling friction.** Every booking is a round of "how about Tuesday at 2?".
- **No shared view.** Nobody can glance at "what does Thursday look like?".
- **Messy changes.** A reschedule leaves the old slot blocked, or lands on a conflict.

## Product goal

A small system that owns the whole booking loop and is correct by construction:

1. Customers self-serve a booking in a few clear steps, and can only pick times that are
   genuinely open.
2. The business manages every booking — confirm, reschedule, complete, cancel — from one
   screen.
3. The server, not the UI, validates interval overlap on every booking request, so the
   normal booking flow cannot place an appointment that intersects an existing one.

Deliberately **not** in the MVP: authentication, staff accounts, payments, notifications,
calendar sync, multi-resource scheduling, a service-editor UI. Those are real-build
features; leaving them out keeps the demo honest and focused.

## Implemented workflow

**Customer** (`/`): `Service → Date → Time → Details → Confirmation`. The service sets the
duration and price. The date picker covers today through +30 days. The time step calls the
availability API and shows only open 30-minute-grid starts for that service and day. The
details step needs a name and at least one of email or phone, shows a live summary
(service, date, time, duration, price), and creates the booking as **pending**.

**Admin** (`/admin`): a list of all bookings with status and date filters. Opening a
booking shows its full detail and the actions that are valid for its current status:

- **pending** → Confirm, or Cancel
- **confirmed** → Mark completed, Reschedule, or Cancel
- **cancelled** / **completed** → terminal, no actions

Reschedule reuses the exact availability and overlap rules of booking creation (excluding
the booking's own current time), keeps the status, and frees the old slot.

## Business rules / overlap protection

Availability is computed server-side from a few rules:

- Open Monday–Saturday, 09:00–18:00 UTC; closed Sunday.
- Starts on a 30-minute grid.
- The **full service duration** must fit before 18:00 (a 90-minute service can't start
  after 16:30).
- Booking horizon: today … today + 30 days; past times are excluded.
- A candidate time is blocked if its interval overlaps **any booking that is not
  cancelled**. Cancelling a booking returns its time to the pool.

Overlap protection has two parts:

1. **Application-level validation.** Before a create or reschedule commits, the API queries
   for any non-cancelled booking whose interval intersects the requested one and returns
   `409 Selected time is no longer available.` if it finds one. This covers every interval
   overlap in the normal booking flow.
2. **Same-start database backstop.** A partial unique index covers the `start_at` of every
   non-cancelled booking, and the create path turns the resulting unique-violation into the
   same `409`. This closes the narrow race where two requests for the **identical start
   time** pass the application check at the same instant — only one row can be inserted. It
   is a plain uniqueness constraint on `start_at`, **not** a PostgreSQL exclusion
   constraint, so it does not independently prevent two overlapping bookings that start at
   *different* times.

In practice the application check keeps appointments from overlapping during normal use,
and the database index removes the identical-start race. A general guard against arbitrary
concurrent interval overlaps (for example a GiST exclusion constraint over a time range)
is a sensible next step for a production build.

## Technical approach

| Concern | Choice |
| --- | --- |
| API | FastAPI, a small frozen JSON contract (`docs/api-contract.md`) |
| Persistence | PostgreSQL 16 via SQLAlchemy; schema managed with Alembic |
| Time | Everything stored and returned in UTC; slots aligned to a 30-minute grid |
| Availability | Computed on demand from business hours + existing non-cancelled bookings |
| Integrity | Application-level interval-overlap check on every request, plus a partial-unique DB index on `start_at` (identical-start backstop, not an exclusion constraint) |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Local run | Docker Compose: `db`, `backend`, `frontend`; backend seeds demo data on start |

The API surface is intentionally small: list services, get availability for a
service+date, create a public booking, and admin read / status-change / reschedule. No
endpoint exists that the two screens don't need.

## Full-stack integration

The frontend talks to the backend over the documented JSON contract and nothing else. The
booking flow drives `GET /api/services`, `GET /api/availability`, and `POST /api/bookings`;
the admin screen drives `GET /api/admin/bookings`, `GET /api/admin/bookings/{id}`,
`PATCH …/status`, and `PATCH …/reschedule`. The whole stack — PostgreSQL, the API, and the
web app — comes up together with one `docker compose up`, and the seeded demo data means
it's usable immediately.

## Responsive / admin UX

- The customer flow is a single guided card with a step indicator; on a phone the steps
  and service cards stack, and the time grid reflows.
- The admin list is a table on desktop and a stack of booking cards on small screens;
  status is a colour-coded badge throughout.
- Booking actions live in a focused detail modal that only offers transitions that are
  valid for the current status.
- Checked at ~375 px, ~768 px, and ~1280 px: the page never scrolls horizontally; wide
  content (the admin table on mid widths) scrolls inside its own container.

## What this demonstrates to a potential client

- **A complete vertical slice**, not a front-end mockup: real API, real database, real
  persistence, real availability math.
- **Correctness under pressure** — duration-aware availability, interval-overlap validation
  on every booking request, and a database uniqueness backstop that removes the
  identical-start race.
- **A clean domain model** with an explicit status lifecycle and enforced transitions.
- **FastAPI + Next.js integration** against a small, deliberate, frozen contract.
- **Considered UX** across desktop and mobile for both the customer and the operator.
- **Scoped judgement** — a focused MVP that names what it leaves for a real build rather
  than half-implementing it.
