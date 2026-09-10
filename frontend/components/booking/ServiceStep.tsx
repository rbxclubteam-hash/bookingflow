import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

export function ServiceStep({
  services,
  isLoading,
  error,
  selectedServiceId,
  onSelect,
  onRetry,
}: {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  selectedServiceId: string | null;
  onSelect: (service: Service) => void;
  onRetry: () => void;
}) {
  if (isLoading) return <Spinner label="Loading services" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (services.length === 0) {
    return (
      <EmptyState
        title="No services are available right now"
        description="Please check back soon."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((service) => {
        const isSelected = service.id === selectedServiceId;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            aria-pressed={isSelected}
            className={`flex flex-col gap-2 rounded-2xl border p-5 text-left transition-all ${
              isSelected
                ? "border-amber-700 bg-amber-50/60 ring-1 ring-amber-700"
                : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-medium text-stone-900">
                {service.name}
              </h3>
              <span
                className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
                  isSelected
                    ? "border-amber-700 bg-amber-700"
                    : "border-stone-300 bg-white"
                }`}
                aria-hidden
              />
            </div>
            <p className="text-sm leading-relaxed text-stone-600">{service.description}</p>
            <div className="mt-auto flex items-center gap-3 pt-2 text-sm text-stone-500">
              <span>{formatDuration(service.duration_minutes)}</span>
              <span aria-hidden>·</span>
              <span className="font-medium text-stone-900">
                {formatPrice(service.price_cents, service.currency)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
