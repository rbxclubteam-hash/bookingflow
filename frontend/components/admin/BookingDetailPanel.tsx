"use client";

import { useEffect, useState } from "react";
import { RescheduleModal } from "@/components/admin/RescheduleModal";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApiError, api } from "@/lib/api";
import { formatDateUTC, formatDuration, formatPrice, formatTimeRangeUTC } from "@/lib/format";
import type { Booking, BookingStatusUpdate } from "@/lib/types";

function genericErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export function BookingDetailPanel({
  bookingId,
  onClose,
  onChanged,
}: {
  bookingId: string;
  onClose: () => void;
  onChanged: (updated: Booking) => void;
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<"confirm" | "cancel" | "complete" | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  function load() {
    setIsLoading(true);
    setLoadError(null);
    api
      .adminGetBooking(bookingId)
      .then((data) => setBooking(data))
      .catch((error: unknown) => setLoadError(genericErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [bookingId]);

  function updateStatus(status: BookingStatusUpdate, action: "confirm" | "cancel" | "complete") {
    setActionPending(action);
    setActionError(null);
    api
      .adminUpdateStatus(bookingId, { status })
      .then((updated) => {
        setBooking(updated);
        onChanged(updated);
      })
      .catch((error: unknown) => setActionError(genericErrorMessage(error)))
      .finally(() => setActionPending(null));
  }

  function handleCancel() {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    updateStatus("cancelled", "cancel");
  }

  if (isRescheduling && booking) {
    return (
      <RescheduleModal
        booking={booking}
        onClose={() => setIsRescheduling(false)}
        onRescheduled={(updated) => {
          setBooking(updated);
          onChanged(updated);
          setIsRescheduling(false);
        }}
      />
    );
  }

  return (
    <Modal title="Booking details" onClose={onClose}>
      {isLoading ? <Spinner label="Loading booking" /> : null}
      {!isLoading && loadError ? <ErrorState message={loadError} onRetry={load} /> : null}

      {!isLoading && booking ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-medium text-stone-900">
              {booking.service.name}
            </h3>
            <StatusBadge status={booking.status} />
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-stone-500">Date</dt>
            <dd className="text-stone-900">{formatDateUTC(booking.start_at)}</dd>

            <dt className="text-stone-500">Time</dt>
            <dd className="text-stone-900">
              {formatTimeRangeUTC(booking.start_at, booking.end_at)}
            </dd>

            <dt className="text-stone-500">Duration</dt>
            <dd className="text-stone-700">{formatDuration(booking.service.duration_minutes)}</dd>

            <dt className="text-stone-500">Price</dt>
            <dd className="text-stone-700">
              {formatPrice(booking.service.price_cents, booking.service.currency)}
            </dd>

            <dt className="pt-2 text-stone-500">Customer</dt>
            <dd className="pt-2 text-stone-900">{booking.customer_name}</dd>

            <dt className="text-stone-500">Email</dt>
            <dd className="text-stone-700">{booking.email || "—"}</dd>

            <dt className="text-stone-500">Phone</dt>
            <dd className="text-stone-700">{booking.phone || "—"}</dd>

            {booking.note ? (
              <>
                <dt className="text-stone-500">Note</dt>
                <dd className="text-stone-700">{booking.note}</dd>
              </>
            ) : null}
          </dl>

          {actionError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {actionError}
            </div>
          ) : null}

          {(booking.status === "pending" || booking.status === "confirmed") && (
            <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
              {booking.status === "pending" ? (
                <Button
                  size="sm"
                  isLoading={actionPending === "confirm"}
                  disabled={actionPending !== null}
                  onClick={() => updateStatus("confirmed", "confirm")}
                >
                  Confirm
                </Button>
              ) : null}
              {booking.status === "confirmed" ? (
                <Button
                  size="sm"
                  isLoading={actionPending === "complete"}
                  disabled={actionPending !== null}
                  onClick={() => updateStatus("completed", "complete")}
                >
                  Mark completed
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                disabled={actionPending !== null}
                onClick={() => setIsRescheduling(true)}
              >
                Reschedule
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={actionPending === "cancel"}
                disabled={actionPending !== null}
                onClick={handleCancel}
              >
                Cancel booking
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
