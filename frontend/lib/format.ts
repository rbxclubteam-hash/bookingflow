// All API datetimes are RFC3339 UTC. Every formatter here pins timeZone: "UTC"
// so what the user sees always matches what the backend actually stored —
// never the visitor's local timezone.

export function formatPrice(priceCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourLabel = `${hours} hr${hours > 1 ? "s" : ""}`;
  return remainder === 0 ? hourLabel : `${hourLabel} ${remainder} min`;
}

export function formatDateUTC(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatShortDateUTC(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatTimeUTC(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatTimeRangeUTC(startIso: string, endIso: string): string {
  return `${formatTimeUTC(startIso)}–${formatTimeUTC(endIso)} UTC`;
}

export function formatDateTimeUTC(iso: string): string {
  return `${formatShortDateUTC(iso)} · ${formatTimeUTC(iso)} UTC`;
}
