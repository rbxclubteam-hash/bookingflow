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

## Backend development

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e '.[dev]'
.venv/bin/alembic upgrade head
.venv/bin/python -m app.seed
.venv/bin/uvicorn app.main:app --reload
```

Run the fast local suite (SQLite by default):

```bash
.venv/bin/pytest -q
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

To exercise the same suite against a disposable PostgreSQL database, set `TEST_DATABASE_URL` to that database before running pytest. The test suite recreates its tables and must not be pointed at a development or production database.
