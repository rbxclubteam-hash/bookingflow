import { formatDateUTC, formatDuration, formatPrice, formatTimeRangeUTC } from "@/lib/format";
import type { AvailabilitySlot, Service } from "@/lib/types";

export function BookingSummary({
  service,
  slot,
}: {
  service: Service;
  slot: AvailabilitySlot;
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
      <dt className="text-stone-500">Service</dt>
      <dd className="font-medium text-stone-900">{service.name}</dd>

      <dt className="text-stone-500">Date</dt>
      <dd className="font-medium text-stone-900">{formatDateUTC(slot.start_at)}</dd>

      <dt className="text-stone-500">Time</dt>
      <dd className="font-medium text-stone-900">
        {formatTimeRangeUTC(slot.start_at, slot.end_at)}
      </dd>

      <dt className="text-stone-500">Duration</dt>
      <dd className="text-stone-700">{formatDuration(service.duration_minutes)}</dd>

      <dt className="text-stone-500">Price</dt>
      <dd className="text-stone-700">{formatPrice(service.price_cents, service.currency)}</dd>
    </dl>
  );
}
