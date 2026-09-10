// Types mirror docs/api-contract.md exactly. Do not add fields the backend
// does not send, and do not rename anything — this is the frozen MVP contract.

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
}

export interface Booking {
  id: string;
  service_id: string;
  service: Service;
  start_at: string;
  end_at: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  status: BookingStatus;
  created_at: string;
}

export interface AvailabilitySlot {
  start_at: string;
  end_at: string;
}

export interface Availability {
  service_id: string;
  date: string;
  slots: AvailabilitySlot[];
}

export interface CreateBookingPayload {
  service_id: string;
  start_at: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
}

export type BookingStatusUpdate = "confirmed" | "cancelled" | "completed";

export interface StatusUpdatePayload {
  status: BookingStatusUpdate;
}

export interface ReschedulePayload {
  start_at: string;
}

export interface AdminBookingsQuery {
  date?: string;
  status?: BookingStatus;
}
