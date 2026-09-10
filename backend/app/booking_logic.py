import uuid
from datetime import UTC, date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Booking, Service

SERVICE_NOT_FOUND = "Service not found."
BOOKING_NOT_FOUND = "Booking not found."
SLOT_UNAVAILABLE = "Selected time is no longer available."
BOOKING_IMMUTABLE = "Booking cannot be modified in its current status."

OPENING_HOUR = 9
CLOSING_HOUR = 18
SLOT_MINUTES = 30
BOOKING_HORIZON_DAYS = 30


def utc_now() -> datetime:
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def get_service_or_404(session: Session, service_id: uuid.UUID) -> Service:
    service = session.get(Service, service_id)
    if service is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, SERVICE_NOT_FOUND)
    return service


def get_booking_or_404(session: Session, booking_id: uuid.UUID) -> Booking:
    booking = session.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, BOOKING_NOT_FOUND)
    return booking


def requested_interval(service: Service, start_at: datetime) -> tuple[datetime, datetime]:
    if start_at.tzinfo is None or start_at.utcoffset() is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "start_at must include a timezone."
        )
    start_at = start_at.astimezone(UTC)
    end_at = start_at + timedelta(minutes=service.duration_minutes)
    validate_slot(start_at, end_at)
    return start_at, end_at


def validate_slot(start_at: datetime, end_at: datetime, *, now: datetime | None = None) -> None:
    now = (now or utc_now()).astimezone(UTC)
    today = now.date()
    start_date = start_at.date()
    if (
        start_at < now
        or start_date < today
        or start_date > today + timedelta(days=BOOKING_HORIZON_DAYS)
    ):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "start_at is outside the booking horizon."
        )
    if start_at.weekday() == 6:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Sunday is unavailable.")
    if start_at.minute % SLOT_MINUTES or start_at.second or start_at.microsecond:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "start_at must use the 30-minute slot grid."
        )
    opens = datetime.combine(start_date, time(OPENING_HOUR), UTC)
    closes = datetime.combine(start_date, time(CLOSING_HOUR), UTC)
    if start_at < opens or end_at > closes:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "Selected time is outside business hours."
        )


def overlap_query(
    start_at: datetime, end_at: datetime, *, exclude_id: uuid.UUID | None = None
) -> Select[tuple[Booking]]:
    query = select(Booking).where(
        Booking.status != "cancelled",
        Booking.start_at < end_at,
        Booking.end_at > start_at,
    )
    if exclude_id is not None:
        query = query.where(Booking.id != exclude_id)
    return query


def ensure_available(
    session: Session,
    start_at: datetime,
    end_at: datetime,
    *,
    exclude_id: uuid.UUID | None = None,
) -> None:
    if session.scalar(overlap_query(start_at, end_at, exclude_id=exclude_id)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, SLOT_UNAVAILABLE)


def commit_booking(session: Session, booking: Booking) -> Booking:
    try:
        session.add(booking)
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, SLOT_UNAVAILABLE) from exc
    session.refresh(booking)
    return booking


def available_slots(
    session: Session,
    service: Service,
    requested_date: date,
    *,
    now: datetime | None = None,
) -> list[tuple[datetime, datetime]]:
    now = (now or utc_now()).astimezone(UTC)
    if requested_date < now.date() or requested_date > now.date() + timedelta(
        days=BOOKING_HORIZON_DAYS
    ):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "date is outside the booking horizon."
        )
    if requested_date.weekday() == 6:
        return []

    cursor = datetime.combine(requested_date, time(OPENING_HOUR), UTC)
    closes = datetime.combine(requested_date, time(CLOSING_HOUR), UTC)
    duration = timedelta(minutes=service.duration_minutes)
    bookings = session.scalars(
        select(Booking).where(
            Booking.status != "cancelled",
            Booking.start_at < closes,
            Booking.end_at > cursor,
        )
    ).all()
    slots: list[tuple[datetime, datetime]] = []
    while cursor + duration <= closes:
        end_at = cursor + duration
        if cursor >= now and not any(
            as_utc(booking.start_at) < end_at and as_utc(booking.end_at) > cursor
            for booking in bookings
        ):
            slots.append((cursor, end_at))
        cursor += timedelta(minutes=SLOT_MINUTES)
    return slots
