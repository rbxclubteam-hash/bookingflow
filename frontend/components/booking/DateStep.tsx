import { useMemo } from "react";
import { generateBookingHorizon } from "@/lib/dates";

export function DateStep({
  selectedDate,
  onSelect,
}: {
  selectedDate: string | null;
  onSelect: (iso: string) => void;
}) {
  const dates = useMemo(() => generateBookingHorizon(31), []);

  return (
    <div>
      <p className="mb-3 text-sm text-stone-500">All times shown in UTC.</p>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {dates.map((date) => {
          const isSelected = date.iso === selectedDate;
          return (
            <button
              key={date.iso}
              type="button"
              onClick={() => onSelect(date.iso)}
              aria-pressed={isSelected}
              className={`flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-3 transition-colors ${
                isSelected
                  ? "border-amber-700 bg-amber-700 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
              }`}
            >
              <span
                className={`text-[11px] font-medium uppercase tracking-wide ${
                  isSelected ? "text-amber-100" : "text-stone-400"
                }`}
              >
                {date.weekday}
              </span>
              <span className="text-lg font-semibold">{date.day}</span>
              <span className={`text-[11px] ${isSelected ? "text-amber-100" : "text-stone-400"}`}>
                {date.month}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
