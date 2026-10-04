export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-6 w-20 animate-pulse rounded-md bg-secondary" />
        <div className="h-6 w-24 animate-pulse rounded bg-secondary" />
      </div>
      <div className="mt-4 h-6 w-3/4 animate-pulse rounded-full bg-secondary" />
      <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-secondary" />
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-md bg-secondary" />
        <div className="h-6 w-16 animate-pulse rounded-md bg-secondary" />
        <div className="h-6 w-20 animate-pulse rounded-md bg-secondary" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <div className="h-2 w-full animate-pulse rounded-full bg-secondary" />
        <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-secondary" />
      </div>
    </div>
  );
}
