import { cn } from '../lib/utils';
import { hasCapacityLimit, spotsFilled, isActivityFull } from '../lib/helpers';

export function SpotsIndicator({ activity, className }) {
  const filled = spotsFilled(activity);

  // Legacy rows have no group size. There is no denominator to draw a bar
  // against, so show the headcount alone rather than an empty "of 0" bar.
  if (!hasCapacityLimit(activity)) {
    return (
      <span className={cn('text-xs font-medium text-muted-foreground', className)}>
        {filled} {filled === 1 ? 'person' : 'people'} going · no limit
      </span>
    );
  }

  const capacity = Number(activity.capacity);
  const isFull = isActivityFull(activity);
  // Clamped: rows accepted under the old organizer-excluded rule can exceed capacity.
  const pct = Math.min(100, (filled / capacity) * 100);

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
