// Small date-strip helpers for the public booking flow. Dates are generated
// against UTC (matching the backend's UTC business hours), formatted as plain
// YYYY-MM-DD strings — the wire format the availability endpoint expects.

export interface DateOption {
  iso: string;
  weekday: string;
  day: number;
  month: string;
  isToday: boolean;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today through +30 days (inclusive), matching the booking horizon in the
 * API contract. The backend remains the final authority on real availability. */
export function generateBookingHorizon(days = 31): DateOption[] {
  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(startOfToday);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      iso: toIsoDate(date),
      weekday: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
        date,
      ),
      day: date.getUTCDate(),
      month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date),
      isToday: index === 0,
    };
  });
}
