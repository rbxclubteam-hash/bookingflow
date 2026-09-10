"use client";

import { useState } from "react";
import { DateStep } from "@/components/booking/DateStep";
import { formatShortDateUTC } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

const STATUS_OPTIONS: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export function Filters({
  date,
  status,
  onDateChange,
  onStatusChange,
}: {
  date: string;
  status: BookingStatus | "all";
  onDateChange: (date: string) => void;
  onStatusChange: (status: BookingStatus | "all") => void;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {STATUS_OPTIONS.map((option) => {
          const isActive = option.value === status;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPickerOpen((open) => !open)}
            aria-expanded={isPickerOpen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:border-stone-400"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-stone-400" fill="none" aria-hidden>
              <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M2 6.5h12M5 2v2.5M11 2v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            {date ? formatShortDateUTC(`${date}T00:00:00Z`) : "All dates"}
          </button>
          {date ? (
            <button
              type="button"
              onClick={() => onDateChange("")}
              className="text-xs font-medium text-stone-500 hover:text-stone-800"
            >
              Clear
            </button>
          ) : null}
        </div>

        {isPickerOpen ? (
          <div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-3 shadow-lg">
            <DateStep
              selectedDate={date || null}
              onSelect={(iso) => {
                onDateChange(iso);
                setIsPickerOpen(false);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
