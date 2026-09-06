import { cn } from '../lib/utils';

export function SpotsIndicator({ filled, capacity, className }) {
  const isFull = capacity > 0 && filled >= capacity;
  const pct = capacity === 0 ? 0 : Math.min(100, (filled / capacity) * 100);

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary" role="presentation">
        <div
          className={cn('h-full rounded-full transition-all', isFull ? 'bg-destructive' : 'bg-success')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {isFull ? 'Full' : `${filled} of ${capacity} spots`}
      </span>
    </div>
  );
}