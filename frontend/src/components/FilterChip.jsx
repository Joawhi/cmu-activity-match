import { cn } from '../lib/utils';

export function FilterChip({ label, active, onClick, icon: Icon, activeStyle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={active && activeStyle ? activeStyle : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
        active
          ? 'border-transparent bg-foreground text-background'
          : 'border-border bg-background text-foreground hover:bg-secondary'
      )}
    >
      {Icon ? <Icon className="size-3.5" strokeWidth={2} /> : null}
      {label}
    </button>
  );
}