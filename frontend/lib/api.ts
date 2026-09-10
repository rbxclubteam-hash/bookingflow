import type {
  AdminBookingsQuery,
  Availability,
  Booking,
  CreateBookingPayload,
  ReschedulePayload,
  Service,
  StatusUpdatePayload,
} from "./types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

/** Thrown for every non-2xx response and for network failures. `status` is 0
 * when the request never reached the server (offline, DNS, CORS, etc.). */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface FastApiValidationDetail {
  loc?: Array<string | number>;
  msg: string;
  type?: string;
}

interface FastApiErrorBody {
  detail?: string | FastApiValidationDetail[];
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as FastApiErrorBody;
    if (typeof body.detail === "string" && body.detail.trim().length > 0) {
      return body.detail;
    }
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      return body.detail.map((item) => item.msg).join(" ");
    }
  } catch {
    // Response body wasn't JSON (or was empty) — fall through to a generic message.
  }
  return "Something went wrong. Please try again.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export const api = {
  getServices(): Promise<Service[]> {
    return request<Service[]>("/api/services");
  },

  getAvailability(serviceId: string, date: string): Promise<Availability> {
    return request<Availability>(
      `/api/availability${query({ service_id: serviceId, date })}`,
    );
  },

  createBooking(payload: CreateBookingPayload): Promise<Booking> {
    return request<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  adminListBookings(params: AdminBookingsQuery = {}): Promise<Booking[]> {
    return request<Booking[]>(
      `/api/admin/bookings${query({ date: params.date, status: params.status })}`,
    );
  },

  adminGetBooking(id: string): Promise<Booking> {
    return request<Booking>(`/api/admin/bookings/${id}`);
  },

  adminUpdateStatus(id: string, payload: StatusUpdatePayload): Promise<Booking> {
    return request<Booking>(`/api/admin/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  adminReschedule(id: string, payload: ReschedulePayload): Promise<Booking> {
    return request<Booking>(`/api/admin/bookings/${id}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
