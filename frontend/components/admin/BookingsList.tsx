import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTimeUTC } from "@/lib/format";
import type { Booking } from "@/lib/types";

export function BookingsList({
  bookings,
  isLoading,
  error,
  onRetry,
  onOpen,
}: {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (booking: Booking) => void;
}) {
  if (isLoading) return <Spinner label="Loading bookings" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="No bookings match these filters"
        description="Try a different date or status."
      />
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <button
              type="button"
              onClick={() => onOpen(booking)}
              className="w-full rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-stone-900">
                  {formatDateTimeUTC(booking.start_at)}
                </p>
                <StatusBadge status={booking.status} />
              </div>
              <p className="mt-2 truncate text-sm text-stone-700">{booking.service.name}</p>
              <p className="mt-0.5 truncate text-sm text-stone-500">{booking.customer_name}</p>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: table. The outer div keeps the rounded border styling; the inner
          div is the actual horizontal scroll container, so on narrower desktop/tablet
          widths (e.g. 768px) the Status column scrolls into view instead of being
          clipped and made unreachable. */}
      <div className="hidden rounded-2xl border border-stone-200 bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date &amp; time</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => onOpen(booking)}
                  className="cursor-pointer transition-colors hover:bg-stone-50"
                >
                  <td className="px-4 py-3.5 whitespace-nowrap text-stone-700">
                    {formatDateTimeUTC(booking.start_at)}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3.5 font-medium text-stone-900">
                    {booking.customer_name}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3.5 text-stone-700">
                    {booking.service.name}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3.5 text-stone-500">
                    {booking.email || booking.phone || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
