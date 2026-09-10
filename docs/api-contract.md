# BookingFlow MVP API Contract

This contract is frozen for the MVP. The admin experience is intentionally open and has no authentication.

## Frontend routes

- `/` — single-page booking flow
- `/admin` — demo admin dashboard

## API endpoints

### Health

`GET /health`

Response:

```json
{"status":"ok"}
```

### Services

`GET /api/services`

Service representation:

```json
{
  "id": "UUID",
  "name": "string",
  "description": "string",
  "duration_minutes": 60,
  "price_cents": 8500,
  "currency": "USD"
}
```

### Availability

`GET /api/availability?service_id=<UUID>&date=<YYYY-MM-DD>`

Response:

```json
{
  "service_id": "UUID",
  "date": "YYYY-MM-DD",
  "slots": [
    {
      "start_at": "RFC3339 UTC datetime",
      "end_at": "RFC3339 UTC datetime"
    }
  ]
}
```

Availability rules:

- Business hours are Monday–Saturday, 09:00–18:00 UTC.
- Sunday has no availability.
- Starts are aligned to a 30-minute grid.
- The complete service duration must fit before 18:00.
- The booking horizon is today through today + 30 days.
- Past slots are excluded.
- A slot is unavailable when its interval overlaps a booking whose status is not `cancelled`.
- Cancelled bookings release their time.

### Public booking creation

`POST /api/bookings`

Request:

```json
{
  "service_id": "UUID",
  "start_at": "RFC3339 UTC datetime",
  "customer_name": "string",
  "email": "string or null",
  "phone": "string or null",
  "note": "string or null"
}
```

At least one of `email` or `phone` is required. The client cannot select the initial status; all new bookings start as `pending`.

### Admin bookings

- `GET /api/admin/bookings`
  - Optional `date=YYYY-MM-DD`
  - Optional `status=pending|confirmed|cancelled|completed`
  - Results are sorted by `start_at` ascending.
- `GET /api/admin/bookings/{booking_id}`
- `PATCH /api/admin/bookings/{booking_id}/status`

Status request:

```json
{"status":"confirmed"}
```

Allowed transitions:

- `pending` → `confirmed` or `cancelled`
- `confirmed` → `completed` or `cancelled`
- `cancelled` and `completed` are terminal

- `PATCH /api/admin/bookings/{booking_id}/reschedule`

Reschedule request:

```json
{"start_at":"RFC3339 UTC datetime"}
```

Only pending and confirmed bookings may be rescheduled. Rescheduling keeps the current status and uses the same availability and collision rules as booking creation.

### Booking representation

```json
{
  "id": "UUID",
  "service_id": "UUID",
  "service": {
    "id": "UUID",
    "name": "string",
    "description": "string",
    "duration_minutes": 60,
    "price_cents": 8500,
    "currency": "USD"
  },
  "start_at": "RFC3339 UTC datetime",
  "end_at": "RFC3339 UTC datetime",
  "customer_name": "string",
  "email": "string or null",
  "phone": "string or null",
  "note": "string or null",
  "status": "pending|confirmed|cancelled|completed",
  "created_at": "RFC3339 UTC datetime"
}
```

## Errors

- `404 {"detail":"Service not found."}`
- `404 {"detail":"Booking not found."}`
- `409 {"detail":"Selected time is no longer available."}`
- `400 {"detail":"Booking cannot be modified in its current status."}`
- `422` uses FastAPI's standard validation response.

