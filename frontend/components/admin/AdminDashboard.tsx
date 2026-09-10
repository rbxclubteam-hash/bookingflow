"use client";

import { useCallback, useEffect, useState } from "react";
import { BookingDetailPanel } from "@/components/admin/BookingDetailPanel";
import { BookingsList } from "@/components/admin/BookingsList";
import { Filters } from "@/components/admin/Filters";
import { ApiError, api } from "@/lib/api";
import type { Booking, BookingStatus } from "@/lib/types";

function genericErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");

  const [openBookingId, setOpenBookingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api
      .adminListBookings({
        date: filterDate || undefined,
        status: filterStatus === "all" ? undefined : filterStatus,
      })
      .then((data) => setBookings(data))
      .catch((err: unknown) => setError(genericErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [filterDate, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      <Filters
        date={filterDate}
        status={filterStatus}
        onDateChange={setFilterDate}
        onStatusChange={setFilterStatus}
      />

      <BookingsList
        bookings={bookings}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        onOpen={(booking) => setOpenBookingId(booking.id)}
      />

      {openBookingId ? (
        <BookingDetailPanel
          bookingId={openBookingId}
          onClose={() => setOpenBookingId(null)}
          onChanged={load}
        />
      ) : null}
    </div>
  );
}
