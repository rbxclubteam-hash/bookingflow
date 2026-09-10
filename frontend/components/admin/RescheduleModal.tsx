"use client";

import { useCallback, useEffect, useState } from "react";
import { DateStep } from "@/components/booking/DateStep";
import { TimeStep } from "@/components/booking/TimeStep";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError, api } from "@/lib/api";
import type { AvailabilitySlot, Booking } from "@/lib/types";

function genericErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export function RescheduleModal({
  booking,
  onClose,
  onRescheduled,
}: {
  booking: Booking;
  onClose: () => void;
  onRescheduled: (updated: Booking) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(booking.start_at.slice(0, 10));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadAvailability = useCallback(
    (date: string) => {
      setIsLoading(true);
      setLoadError(null);
      setSlots([]);
      api
        .getAvailability(booking.service_id, date)
        .then((data) => setSlots(data.slots))
        .catch((error: unknown) => setLoadError(genericErrorMessage(error)))
        .finally(() => setIsLoading(false));
    },
    [booking.service_id],
  );

  useEffect(() => {
    loadAvailability(selectedDate);
  }, [selectedDate, loadAvailability]);

  function handleSelectDate(iso: string) {
    setSelectedDate(iso);
    setSelectedSlot(null);
    setSubmitError(null);
  }

  function handleConfirm() {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    setSubmitError(null);
    api
      .adminReschedule(booking.id, { start_at: selectedSlot.start_at })
      .then((updated) => {
        onRescheduled(updated);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 409) {
          setSubmitError(
            "That time is no longer available. Please choose another time.",
          );
          loadAvailability(selectedDate);
          return;
        }
        setSubmitError(genericErrorMessage(error));
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <Modal title="Reschedule booking" onClose={onClose} widthClassName="max-w-xl">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-stone-500">
          {booking.service.name} · currently{" "}
          <span className="font-medium text-stone-700">{booking.customer_name}</span>
        </p>

        <div>
          <h3 className="mb-2 text-sm font-medium text-stone-800">New date</h3>
          <DateStep selectedDate={selectedDate} onSelect={handleSelectDate} />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-stone-800">New time</h3>
          <TimeStep
            slots={slots}
            isLoading={isLoading}
            error={loadError}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
            onRetry={() => loadAvailability(selectedDate)}
          />
        </div>

        {submitError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {submitError}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} isLoading={isSubmitting} disabled={!selectedSlot}>
            Confirm new time
          </Button>
        </div>
      </div>
    </Modal>
  );
}
