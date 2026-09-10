from datetime import UTC, date, datetime, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Booking, Service
from app.seed import SERVICES, seed_demo_data


def future_business_date(days: int = 7) -> date:
    candidate = datetime.now(UTC).date() + timedelta(days=days)
    while candidate.weekday() == 6:
        candidate += timedelta(days=1)
    return candidate


def next_sunday() -> date:
    today = datetime.now(UTC).date()
    days = (6 - today.weekday()) % 7
    return today + timedelta(days=days or 7)


def at(day: date, hour: int, minute: int = 0) -> datetime:
    return datetime.combine(day, time(hour, minute), UTC)


def payload(service_id: str, start_at: datetime, **overrides: object) -> dict[str, object]:
    result: dict[str, object] = {
        "service_id": service_id,
        "start_at": start_at.isoformat(),
        "customer_name": "Casey Rivera",
        "email": "casey@example.com",
        "phone": None,
        "note": "Portfolio demo booking",
    }
    result.update(overrides)
    return result


def service_id(client: TestClient, index: int = 0) -> str:
    return client.get("/api/services").json()[index]["id"]


def create(client: TestClient, start_at: datetime, index: int = 0, **overrides: object):
    return client.post(
        "/api/bookings", json=payload(service_id(client, index), start_at, **overrides)
    )


def test_health(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_services_list(client: TestClient) -> None:
    response = client.get("/api/services")
    assert response.status_code == 200
    assert [
        (item["name"], item["duration_minutes"], item["price_cents"]) for item in response.json()
    ] == [
        ("Intro Consultation", 30, 4500),
        ("Standard Session", 60, 8500),
        ("Extended Session", 90, 12000),
    ]


def test_availability_generation(client: TestClient) -> None:
    day = future_business_date(10)
    response = client.get(
        "/api/availability", params={"service_id": service_id(client), "date": day.isoformat()}
    )
    assert response.status_code == 200
    slots = response.json()["slots"]
    assert slots[0]["start_at"].startswith(f"{day.isoformat()}T09:00:00")
    assert slots[-1]["start_at"].startswith(f"{day.isoformat()}T17:30:00")


def test_sunday_has_no_availability(client: TestClient) -> None:
    response = client.get(
        "/api/availability",
        params={"service_id": service_id(client), "date": next_sunday().isoformat()},
    )
    assert response.status_code == 200
    assert response.json()["slots"] == []


def test_service_duration_must_fit_before_close(client: TestClient) -> None:
    day = future_business_date(11)
    response = client.get(
        "/api/availability",
        params={"service_id": service_id(client, 2), "date": day.isoformat()},
    )
    starts = [slot["start_at"] for slot in response.json()["slots"]]
    assert any(value.startswith(f"{day.isoformat()}T16:30:00") for value in starts)
    assert not any(value.startswith(f"{day.isoformat()}T17:00:00") for value in starts)


def test_booking_create_is_pending(client: TestClient) -> None:
    response = create(client, at(future_business_date(), 14))
    assert response.status_code == 201
    assert response.json()["status"] == "pending"
    assert response.json()["end_at"].startswith(
        (at(future_business_date(), 14) + timedelta(minutes=30)).isoformat()[:19]
    )


def test_email_only_is_valid(client: TestClient) -> None:
    response = create(client, at(future_business_date(), 15), phone=None)
    assert response.status_code == 201


def test_phone_only_is_valid(client: TestClient) -> None:
    response = create(
        client,
        at(future_business_date(), 15, 30),
        email=None,
        phone="+1 555 0100",
    )
    assert response.status_code == 201


def test_missing_contact_is_rejected(client: TestClient) -> None:
    response = create(client, at(future_business_date(), 16), email=None, phone=None)
    assert response.status_code == 422


def test_invalid_service_is_404(client: TestClient) -> None:
    response = client.post(
        "/api/bookings",
        json=payload("00000000-0000-0000-0000-000000000000", at(future_business_date(), 13)),
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Service not found."}


@pytest.mark.parametrize(
    "start_at",
    [
        lambda: datetime.now(UTC) - timedelta(days=1),
        lambda: datetime.now(UTC) + timedelta(days=31),
    ],
)
def test_past_or_out_of_range_booking_is_rejected(client: TestClient, start_at) -> None:
    candidate = start_at().replace(hour=10, minute=0, second=0, microsecond=0)
    response = create(client, candidate)
    assert response.status_code == 422


def test_overlapping_booking_is_rejected(client: TestClient) -> None:
    day = future_business_date(12)
    assert create(client, at(day, 13), index=1).status_code == 201
    response = create(client, at(day, 13, 30))
    assert response.status_code == 409
    assert response.json() == {"detail": "Selected time is no longer available."}


def test_same_slot_double_booking_is_rejected(client: TestClient) -> None:
    start_at = at(future_business_date(13), 14)
    assert create(client, start_at).status_code == 201
    assert create(client, start_at).status_code == 409


def test_database_constraint_is_collision_backstop(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("app.main.ensure_available", lambda *args, **kwargs: None)
    start_at = at(future_business_date(13), 15)
    assert create(client, start_at).status_code == 201
    response = create(client, start_at)
    assert response.status_code == 409
    assert response.json() == {"detail": "Selected time is no longer available."}


def test_cancelled_booking_frees_slot(client: TestClient) -> None:
    start_at = at(future_business_date(14), 15)
    created = create(client, start_at).json()
    assert (
        client.patch(
            f"/api/admin/bookings/{created['id']}/status", json={"status": "cancelled"}
        ).status_code
        == 200
    )
    assert create(client, start_at).status_code == 201


@pytest.mark.parametrize(
    ("initial", "target"),
    [("pending", "confirmed"), ("pending", "cancelled"), ("confirmed", "completed")],
)
def test_valid_status_transitions(
    client: TestClient, session: Session, initial: str, target: str
) -> None:
    booking = Booking(
        service_id=SERVICES[0][0],
        start_at=at(future_business_date(15), 13),
        end_at=at(future_business_date(15), 13, 30),
        customer_name="Morgan Chen",
        email="morgan@example.com",
        status=initial,
    )
    session.add(booking)
    session.commit()
    response = client.patch(f"/api/admin/bookings/{booking.id}/status", json={"status": target})
    assert response.status_code == 200
    assert response.json()["status"] == target


def test_invalid_status_transition(client: TestClient) -> None:
    created = create(client, at(future_business_date(16), 13)).json()
    response = client.patch(
        f"/api/admin/bookings/{created['id']}/status", json={"status": "completed"}
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Booking cannot be modified in its current status."}


def test_unsupported_status_is_validation_error(client: TestClient) -> None:
    created = create(client, at(future_business_date(17), 13)).json()
    response = client.patch(
        f"/api/admin/bookings/{created['id']}/status", json={"status": "archived"}
    )
    assert response.status_code == 422


def test_reschedule_success(client: TestClient) -> None:
    day = future_business_date(18)
    created = create(client, at(day, 13)).json()
    response = client.patch(
        f"/api/admin/bookings/{created['id']}/reschedule",
        json={"start_at": at(day, 16).isoformat()},
    )
    assert response.status_code == 200
    assert response.json()["start_at"].startswith(f"{day.isoformat()}T16:00:00")
    assert response.json()["status"] == "pending"


def test_reschedule_collision_rejected(client: TestClient) -> None:
    day = future_business_date(19)
    first = create(client, at(day, 13)).json()
    assert create(client, at(day, 15)).status_code == 201
    response = client.patch(
        f"/api/admin/bookings/{first['id']}/reschedule",
        json={"start_at": at(day, 15).isoformat()},
    )
    assert response.status_code == 409


@pytest.mark.parametrize("terminal_status", ["cancelled", "completed"])
def test_terminal_booking_cannot_reschedule(
    client: TestClient, session: Session, terminal_status: str
) -> None:
    day = future_business_date(20)
    booking = Booking(
        service_id=SERVICES[0][0],
        start_at=at(day, 13),
        end_at=at(day, 13, 30),
        customer_name="Terminal User",
        email="terminal@example.com",
        status=terminal_status,
    )
    session.add(booking)
    session.commit()
    response = client.patch(
        f"/api/admin/bookings/{booking.id}/reschedule",
        json={"start_at": at(day, 16).isoformat()},
    )
    assert response.status_code == 400


def test_admin_date_filter(client: TestClient) -> None:
    day = future_business_date(21)
    assert create(client, at(day, 13)).status_code == 201
    assert create(client, at(future_business_date(22), 13)).status_code == 201
    response = client.get("/api/admin/bookings", params={"date": day.isoformat()})
    assert response.status_code == 200
    assert all(item["start_at"].startswith(day.isoformat()) for item in response.json())
    assert len(response.json()) == 1


def test_admin_status_filter(client: TestClient) -> None:
    response = client.get("/api/admin/bookings", params={"status": "confirmed"})
    assert response.status_code == 200
    assert response.json()
    assert all(item["status"] == "confirmed" for item in response.json())


def test_admin_detail_and_not_found(client: TestClient) -> None:
    created = create(client, at(future_business_date(23), 13)).json()
    assert client.get(f"/api/admin/bookings/{created['id']}").json()["id"] == created["id"]
    response = client.get("/api/admin/bookings/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    assert response.json() == {"detail": "Booking not found."}


def test_seed_is_idempotent(session: Session) -> None:
    before_services = session.scalar(select(func.count()).select_from(Service))
    before_bookings = session.scalar(select(func.count()).select_from(Booking))
    seed_demo_data(session)
    assert session.scalar(select(func.count()).select_from(Service)) == before_services == 3
    assert session.scalar(select(func.count()).select_from(Booking)) == before_bookings == 3
