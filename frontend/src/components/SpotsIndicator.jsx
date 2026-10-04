import { cn } from '../lib/utils';
import { hasCapacityLimit, spotsFilled, spotsRemaining, isActivityFull } from '../lib/helpers';

export function SpotsIndicator({ activity, className }) {
  const filled = spotsFilled(activity);

  if (!hasCapacityLimit(activity)) {
    return (
      <span className={cn('text-sm font-semibold text-foreground', className)}>
        {filled} {filled === 1 ? 'person' : 'people'} going
      </span>
    );
  }

  const capacity = Number(activity.capacity);
  const isFull = isActivityFull(activity);
  const remaining = spotsRemaining(activity);
  const pct = Math.min(100, (filled / capacity) * 100);

  return (
    <div className={className}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className={cn('text-sm font-semibold', isFull ? 'text-muted-foreground' : 'text-foreground')}>
          {filled}/{capacity} joined
        </span>
        {isFull ? null : (
          <span className="text-xs font-bold text-primary">
            {remaining === 1 ? '1 spot left' : `${remaining} spots left`}
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" role="presentation">
        <div
          className={cn('h-full rounded-full transition-all', isFull ? 'bg-muted-foreground' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
