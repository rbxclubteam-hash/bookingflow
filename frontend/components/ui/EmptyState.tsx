export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-stone-300 px-6 py-12 text-center">
      <p className="text-sm font-medium text-stone-700">{title}</p>
      {description ? <p className="text-sm text-stone-500">{description}</p> : null}
    </div>
  );
}
