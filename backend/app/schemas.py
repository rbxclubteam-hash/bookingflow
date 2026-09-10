import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

BookingStatus = Literal["pending", "confirmed", "cancelled", "completed"]
AdminTargetStatus = Literal["confirmed", "cancelled", "completed"]


class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    duration_minutes: int
    price_cents: int
    currency: str


class BookingCreate(BaseModel):
    service_id: uuid.UUID
    start_at: datetime
    customer_name: str = Field(min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    note: str | None = None

    @model_validator(mode="after")
    def require_contact_method(self) -> "BookingCreate":
        if not self.email and not (self.phone and self.phone.strip()):
            raise ValueError("At least one of email or phone is required.")
        return self


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    service_id: uuid.UUID
    service: ServiceResponse
    start_at: datetime
    end_at: datetime
    customer_name: str
    email: str | None
    phone: str | None
    note: str | None
    status: BookingStatus
    created_at: datetime


class AvailabilitySlot(BaseModel):
    start_at: datetime
    end_at: datetime


class AvailabilityResponse(BaseModel):
    service_id: uuid.UUID
    date: date
    slots: list[AvailabilitySlot]


class BookingStatusUpdate(BaseModel):
    status: AdminTargetStatus


class BookingReschedule(BaseModel):
    start_at: datetime
