export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <EmptyIllustration />
      <h3 className="mt-6 font-serif text-xl font-semibold text-foreground text-balance">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function EmptyIllustration() {
  return (
    <svg width="112" height="96" viewBox="0 0 112 96" fill="none" aria-hidden="true" className="text-accent">
      <rect x="18" y="24" width="64" height="54" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <path d="M18 40h64" stroke="currentColor" strokeWidth="2.5" />
      <path d="M34 18v10M66 18v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="82" cy="66" r="16" fill="var(--background)" />
      <circle cx="82" cy="66" r="15" stroke="var(--color-primary)" strokeWidth="2.5" />
      <path d="M82 60v12M76 66h12" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="34" cy="56" r="3.5" fill="currentColor" />
      <circle cx="50" cy="56" r="3.5" fill="currentColor" />
    </svg>
  );
}