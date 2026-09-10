import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateUTC, formatTimeRangeUTC } from "@/lib/format";
import type { Booking } from "@/lib/types";

export function SuccessCard({ booking, onBookAnother }: { booking: Booking; onBookAnother: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
          <path
            d="M5 12.5 9.5 17 19 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="max-w-md">
        <h2 className="font-display text-2xl font-medium text-stone-900">
          Your booking request has been received.
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          We&apos;ll be in touch to confirm. Hold on to this summary for your records.
        </p>
      </div>

      <dl className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 text-left text-sm">
        <div className="mb-3 flex items-center justify-between">
          <dt className="text-stone-500">Status</dt>
          <dd>
            <StatusBadge status={booking.status} />
          </dd>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5">
          <dt className="text-stone-500">Service</dt>
          <dd className="text-right font-medium text-stone-900">{booking.service.name}</dd>

          <dt className="text-stone-500">Date</dt>
          <dd className="text-right font-medium text-stone-900">
            {formatDateUTC(booking.start_at)}
          </dd>

          <dt className="text-stone-500">Time</dt>
          <dd className="text-right font-medium text-stone-900">
            {formatTimeRangeUTC(booking.start_at, booking.end_at)}
          </dd>

          <dt className="text-stone-500">Name</dt>
          <dd className="text-right text-stone-700">{booking.customer_name}</dd>
        </div>
      </dl>

      <Button onClick={onBookAnother} variant="secondary">
        Book another appointment
      </Button>
    </div>
  );
}
