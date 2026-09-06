import { useState, useEffect } from 'react';
import { CalendarDays, ChevronDown, Clock, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import { formatEventDate, relativeTime, photoUrlFrom } from '../lib/helpers';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppProvider';
import { Avatar } from './Avatar';
import { CategoryChip } from './CategoryChip';
import { SpotsIndicator } from './SpotsIndicator';
import { JoinControl } from './JoinControl';
import { RequestList } from './RequestList';

export function ActivityCard({ activity, variant = 'discover', onEdit }) {
  const { deleteActivity, openProfile, getRequestsForActivity, loadRequests } = useApp();
  const [showRequests, setShowRequests] = useState(false);

  const { date, time } = formatEventDate(activity.date);
  const requests = getRequestsForActivity(activity.id);

  useEffect(() => {
    if (showRequests && !requests) {
      loadRequests(activity.id);
    }
  }, [showRequests, requests, activity.id, loadRequests]);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => openProfile(activity.hostId)}
          className="group flex items-center gap-3 rounded-full text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Avatar name={activity.hostName} photoUrl={photoUrlFrom(activity.hostPhoto)} size={40} />
          <span className="leading-tight">
            <span className="block font-sans text-sm font-semibold text-foreground group-hover:underline">
              {activity.hostName}
            </span>
            <span className="block text-xs text-muted-foreground">{relativeTime(activity.createdAt)}</span>
          </span>
        </button>
        <CategoryChip category={activity.category} />
      </div>

      <h3 className="mt-4 font-serif text-2xl leading-snug font-semibold tracking-tight text-balance">
        {activity.title}
      </h3>
      {activity.description && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">{activity.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/80">
        {date && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-muted-foreground" strokeWidth={2} />
            {date}
          </span>
        )}
        {time && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4 text-muted-foreground" strokeWidth={2} />
            {time}
          </span>
        )}
        {activity.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-muted-foreground" strokeWidth={2} />
            {activity.location}
          </span>
        )}
      </div>

      <div className="mt-4">
        <SpotsIndicator filled={activity.acceptedCount} capacity={activity.capacity} />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {variant === 'discover' ? (
          <div className="flex items-center justify-end">
            <JoinControl activity={activity} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowRequests((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full px-1 text-sm font-medium text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-expanded={showRequests}
              >
                <Users className="size-4" strokeWidth={2} />
                View requests
                {activity.applicationCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {activity.applicationCount}
                  </span>
                )}
                <ChevronDown className={cn('size-4 transition-transform', showRequests && 'rotate-180')} strokeWidth={2} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit?.(activity)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px"
                >
                  <Pencil className="size-3.5" strokeWidth={2} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this activity? This cannot be undone.')) {
                      deleteActivity(activity.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:outline-none active:translate-y-px"
                >
                  <Trash2 className="size-3.5" strokeWidth={2} />
                  Delete
                </button>
              </div>
            </div>

            {showRequests ? <RequestList activityId={activity.id} requests={requests} /> : null}
          </div>
        )}
      </div>
    </article>
  );
}