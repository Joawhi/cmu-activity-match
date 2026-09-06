export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-full bg-secondary" />
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-full bg-secondary" />
            <div className="h-2.5 w-16 animate-pulse rounded-full bg-secondary" />
          </div>
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="mt-5 h-6 w-3/4 animate-pulse rounded-full bg-secondary" />
      <div className="mt-2.5 space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="mt-5 flex gap-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-20 animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-28 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-secondary" />
        <div className="h-9 w-36 animate-pulse rounded-full bg-secondary" />
      </div>
    </div>
  );
}