export function TicketsLoadError({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-[14px]">{message}</p>
    </div>
  );
}

export function TicketsPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-48 rounded-md bg-stone-200/80" />
      <div className="h-4 w-72 rounded-md bg-stone-200/70" />
      <div className="h-64 rounded-lg border border-stone-200 bg-white" />
    </div>
  );
}
