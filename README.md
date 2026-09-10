# BookingFlow

BookingFlow is a portfolio-grade appointment booking demo built with FastAPI, PostgreSQL, and Next.js.

The frozen MVP contract is documented in [`docs/api-contract.md`](docs/api-contract.md).

## Development stack

The shared Docker Compose stack contains PostgreSQL, the backend API, and the frontend application. The backend and frontend build contexts are added on their respective feature branches.

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Health: http://localhost:8000/health

