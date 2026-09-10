import uuid
from contextlib import asynccontextmanager
from datetime import UTC, date, datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.booking_logic import (
    BOOKING_IMMUTABLE,
    available_slots,
    commit_booking,
    ensure_available,
    get_booking_or_404,
    get_service_or_404,
    requested_interval,
)
from app.db import get_db
from app.models import BOOKING_STATUSES, Booking, Service
from app.schemas import (
    AvailabilityResponse,
    AvailabilitySlot,
    BookingCreate,
    BookingReschedule,
    BookingResponse,
    BookingStatusUpdate,
    ServiceResponse,
)
from app.seed import seed_demo_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_demo_data()
    yield


app = FastAPI(title="BookingFlow API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/services", response_model=list[ServiceResponse])
def list_services(session: Session = Depends(get_db)) -> list[Service]:
    return list(session.scalars(select(Service).order_by(Service.price_cents)).all())


@app.get("/api/availability", response_model=AvailabilityResponse)
def get_availability(
    service_id: uuid.UUID,
    date_: date = Query(alias="date"),
    session: Session = Depends(get_db),
) -> AvailabilityResponse:
    service = get_service_or_404(session, service_id)
    slots = available_slots(session, service, date_)
    return AvailabilityResponse(
        service_id=service.id,
        date=date_,
        slots=[AvailabilitySlot(start_at=start, end_at=end) for start, end in slots],
    )


@app.post("/api/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, session: Session = Depends(get_db)) -> Booking:
    service = get_service_or_404(session, payload.service_id)
    start_at, end_at = requested_interval(service, payload.start_at)
    ensure_available(session, start_at, end_at)
    booking = Booking(
        service_id=service.id,
        start_at=start_at,
        end_at=end_at,
        customer_name=payload.customer_name.strip(),
        email=str(payload.email) if payload.email else None,
        phone=payload.phone.strip() if payload.phone else None,
        note=payload.note,
        status="pending",
    )
    return commit_booking(session, booking)


@app.get("/api/admin/bookings", response_model=list[BookingResponse])
def list_bookings(
    date_: date | None = Query(default=None, alias="date"),
    status_: str | None = Query(default=None, alias="status"),
    session: Session = Depends(get_db),
) -> list[Booking]:
    if status_ is not None and status_ not in BOOKING_STATUSES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unsupported booking status.")
    query = select(Booking)
    if date_ is not None:
        day_start = datetime.combine(date_, datetime.min.time(), UTC)
        query = query.where(
            Booking.start_at >= day_start, Booking.start_at < day_start + timedelta(days=1)
        )
    if status_ is not None:
        query = query.where(Booking.status == status_)
    return list(session.scalars(query.order_by(Booking.start_at)).unique().all())


@app.get("/api/admin/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: uuid.UUID, session: Session = Depends(get_db)) -> Booking:
    return get_booking_or_404(session, booking_id)


@app.patch("/api/admin/bookings/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: uuid.UUID,
    payload: BookingStatusUpdate,
    session: Session = Depends(get_db),
) -> Booking:
    booking = get_booking_or_404(session, booking_id)
    transitions = {"pending": {"confirmed", "cancelled"}, "confirmed": {"completed", "cancelled"}}
    if payload.status not in transitions.get(booking.status, set()):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, BOOKING_IMMUTABLE)
    booking.status = payload.status
    session.commit()
    session.refresh(booking)
    return booking


@app.patch("/api/admin/bookings/{booking_id}/reschedule", response_model=BookingResponse)
def reschedule_booking(
    booking_id: uuid.UUID,
    payload: BookingReschedule,
    session: Session = Depends(get_db),
) -> Booking:
    booking = get_booking_or_404(session, booking_id)
    if booking.status not in {"pending", "confirmed"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, BOOKING_IMMUTABLE)
    service = get_service_or_404(session, booking.service_id)
    start_at, end_at = requested_interval(service, payload.start_at)
    ensure_available(session, start_at, end_at, exclude_id=booking.id)
    booking.start_at = start_at
    booking.end_at = end_at
    return commit_booking(session, booking)
