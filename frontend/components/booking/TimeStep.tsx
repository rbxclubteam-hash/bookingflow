import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { formatTimeUTC } from "@/lib/format";
import type { AvailabilitySlot } from "@/lib/types";

export function TimeStep({
  slots,
  isLoading,
  error,
  selectedSlot,
  onSelect,
  onRetry,
}: {
  slots: AvailabilitySlot[];
  isLoading: boolean;
  error: string | null;
  selectedSlot: AvailabilitySlot | null;
  onSelect: (slot: AvailabilitySlot) => void;
  onRetry: () => void;
}) {
  if (isLoading) return <Spinner label="Loading available times" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (slots.length === 0) {
    return (
      <EmptyState
        title="No times available on this date"
        description="Please choose a different date."
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.start_at === slot.start_at;
        return (
          <button
            key={slot.start_at}
            type="button"
            onClick={() => onSelect(slot)}
            aria-pressed={isSelected}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              isSelected
                ? "border-amber-700 bg-amber-700 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
            }`}
          >
            {formatTimeUTC(slot.start_at)}
          </button>
        );
      })}
    </div>
  );
}
