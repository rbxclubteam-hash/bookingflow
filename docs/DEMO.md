# BookingFlow — Demo walkthrough

A scripted 2–4 minute path that shows the whole product: a customer booking, the admin
triage workflow, a reschedule, completion, and the double-booking guard.

All data is fictional demo data. The business is "Alder Studio"; the services and bookings
are seeded automatically.

## Before you start

```bash
cp .env.example .env
docker compose up --build
```

Wait for the backend to report healthy, then open two browser tabs:

- **Customer:** <http://localhost:3000/>
- **Admin:** <http://localhost:3000/admin>

All times shown in the app are UTC.

---

## 1. Book an appointment as a customer  (~60s)

1. Open the **customer** tab (`/`). Three services are offered: **Intro Consultation**
   (30 min), **Standard Session** (60 min), **Extended Session** (90 min).
2. Choose **Standard Session**.
3. On **Choose a date**, pick a weekday about a week out (avoid Sunday — it's closed).
4. On **Choose a time**, note that only open 30-minute starts are shown, and only times
   where the full 60 minutes fits before 18:00. Pick **10:00**.
5. On **Your details**, enter a name (e.g. `Dana Whitfield`) and an email
   (e.g. `dana.whitfield@example.com`). The right-hand summary shows the service, date,
   **10:00–11:00 UTC**, duration, and price. Leave the note blank or add one line.
6. Click **Confirm booking**. You get a confirmation screen with status **Pending** and a
   summary to keep.

> Point out: the customer was never shown a time that was already taken or too late in the
> day, and the booking was created as *pending* — the client can't self-confirm.

## 2. Triage it as the business  (~40s)

1. Switch to the **admin** tab (`/admin`) and refresh. The new **Dana Whitfield** booking
   appears with a **Pending** badge, alongside the seeded demo bookings.
2. Use the **Pending** filter to show only requests that need action, then switch back to
   **All**.
3. Click the **Dana Whitfield** row to open **Booking details** — service, time, duration,
   price, customer, and note.
4. Click **Confirm**. The status becomes **Confirmed**, and the available actions change to
   **Mark completed**, **Reschedule**, and **Cancel booking**.

## 3. Reschedule it  (~30s)

1. With the booking still open, click **Reschedule**.
2. Pick a different open time on the same or another day and confirm.
3. The booking keeps its **Confirmed** status and moves to the new time. Its previous slot
   is now free again — you can verify by starting a new customer booking for that old
   date/time and seeing the slot offered.

## 4. Complete it  (~15s)

1. Open the booking again and click **Mark completed**.
2. The status becomes **Completed** and no further actions are offered — it's terminal.
   (The seeded **Jordan Lee** booking is already in this state for comparison.)

## 5. Show the double-booking guard  (~40s)

1. In the **admin** tab, note the time of a booking that is **confirmed** (not cancelled) —
   for example the seeded **Avery Morgan** booking, or the one you just confirmed before
   completing it. If you completed yours, confirm a fresh customer booking first so there's
   an active one to collide with.
2. In the **customer** tab, start a new booking for the **same service, same date, and the
   same start time** as that active booking.
3. That start time is **not offered** on the time step — availability already excludes it.
4. (Optional, to show the server is the source of truth) send the create request directly:

   ```bash
   curl -i -X POST http://localhost:8000/api/bookings \
     -H 'Content-Type: application/json' \
     -d '{"service_id":"<service-id>","start_at":"<taken-slot-UTC>","customer_name":"Overlap Test","email":"overlap@example.com"}'
   ```

   The API responds **`409 Conflict`** — `{"detail":"Selected time is no longer
   available."}` — even though the request bypassed the UI. Service IDs are in
   `GET http://localhost:8000/api/services`.

> Point out: overlap protection lives in the backend, not the UI. Two people hitting the
> same slot at the same moment cannot both succeed — the second gets a `409`.

---

## Reset

To return to a clean seeded state:

```bash
docker compose down -v
docker compose up --build
```

`-v` wipes the demo database; the backend re-seeds the original services and bookings on
the next start.
