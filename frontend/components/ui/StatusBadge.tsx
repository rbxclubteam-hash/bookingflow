import type { BookingStatus } from "@/lib/types";

const styles: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  cancelled: "bg-stone-100 text-stone-500 ring-1 ring-inset ring-stone-200",
  completed: "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200",
};

const labels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
