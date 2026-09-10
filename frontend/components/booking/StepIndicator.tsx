const STEPS = ["Service", "Date", "Time", "Details"] as const;

export function StepIndicator({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((label, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isComplete
                    ? "bg-stone-900 text-white"
                    : isCurrent
                      ? "bg-amber-700 text-white"
                      : "bg-stone-200 text-stone-500"
                }`}
              >
                {isComplete ? (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
                    <path
                      d="M2.5 6.2 4.8 8.5 9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isCurrent ? "text-stone-900" : "text-stone-500"
                }`}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <span aria-hidden className="h-px w-4 bg-stone-300 sm:w-8" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
