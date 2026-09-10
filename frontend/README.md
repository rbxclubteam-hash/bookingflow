# BookingFlow frontend

Next.js (App Router) + TypeScript + Tailwind CSS. Implements the two routes and the
frozen API contract described in [`../docs/api-contract.md`](../docs/api-contract.md):

- `/` — public multi-step booking flow (service → date → time → details → success)
- `/admin` — demo admin dashboard (no authentication, by design)

## Development

```bash
npm install
npm run dev
```

Runs against `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000`; see the
repo root `.env.example`). The backend does not need to be running for `npm run build`,
`npm run lint`, or `tsc` to succeed — data-loading areas have their own loading, empty,
and error states.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Structure

```
app/                  routes (/, /admin) and layout
components/booking/   public booking flow steps
components/admin/     admin dashboard, detail panel, reschedule modal
components/ui/        small shared primitives (Button, Card, Modal, states)
lib/                  typed API client, shared types, formatting helpers
```

No global state library or data-fetching library — plain `fetch` in `lib/api.ts`
plus React state.
