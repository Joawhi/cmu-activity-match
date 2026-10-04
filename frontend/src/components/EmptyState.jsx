export function EmptyState({ title, description, actionLabel, onAction, className = '' }) {
  return (
    <div className={`col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center ${className}`}>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
