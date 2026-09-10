import uuid
from datetime import UTC, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Booking, Service

SERVICES = (
    (
        uuid.UUID("fd43c1cc-bb20-4cb8-91f0-6c8629eb1001"),
        "Intro Consultation",
        "A focused 30-minute introductory consultation.",
        30,
        4500,
    ),
    (
        uuid.UUID("fd43c1cc-bb20-4cb8-91f0-6c8629eb1002"),
        "Standard Session",
        "A complete 60-minute working session.",
        60,
        8500,
    ),
    (
        uuid.UUID("fd43c1cc-bb20-4cb8-91f0-6c8629eb1003"),
        "Extended Session",
        "A 90-minute session for deeper, complex work.",
        90,
        12000,
    ),
)


def _future_business_date(days_ahead: int) -> datetime:
    candidate = datetime.now(UTC).date() + timedelta(days=days_ahead)
    while candidate.weekday() == 6:
        candidate += timedelta(days=1)
    return datetime.combine(candidate, time(10), UTC)


def seed_demo_data(session: Session | None = None) -> None:
    owns_session = session is None
    session = session or SessionLocal()
    try:
        for service_id, name, description, duration, price in SERVICES:
            if session.get(Service, service_id) is None:
                session.add(
                    Service(
                        id=service_id,
                        name=name,
                        description=description,
                        duration_minutes=duration,
                        price_cents=price,
                        currency="USD",
                    )
                )
        session.flush()

        demo_bookings = (
            (
                uuid.UUID("267c734f-0254-4ff1-b943-c054c5862001"),
                SERVICES[0][0],
                1,
                0,
                "Avery Morgan",
                "pending",
            ),
            (
                uuid.UUID("267c734f-0254-4ff1-b943-c054c5862002"),
                SERVICES[1][0],
                2,
                1,
                "Jordan Lee",
                "confirmed",
            ),
            (
                uuid.UUID("267c734f-0254-4ff1-b943-c054c5862003"),
                SERVICES[2][0],
                3,
                2,
                "Taylor Kim",
                "cancelled",
            ),
        )
        for booking_id, service_id, days, hour_offset, customer, status in demo_bookings:
            if session.get(Booking, booking_id) is not None:
                continue
            service = session.get(Service, service_id)
            start_at = _future_business_date(days) + timedelta(hours=hour_offset)
            session.add(
                Booking(
                    id=booking_id,
                    service_id=service_id,
                    start_at=start_at,
                    end_at=start_at + timedelta(minutes=service.duration_minutes),
                    customer_name=customer,
                    email=f"{customer.lower().replace(' ', '.')}@example.com",
                    status=status,
                )
            )
        session.commit()
    finally:
        if owns_session:
            session.close()


if __name__ == "__main__":
    seed_demo_data()
