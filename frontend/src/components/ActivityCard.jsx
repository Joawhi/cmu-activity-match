import { useState, useEffect } from 'react';
import { CalendarDays, ChevronDown, Clock, Ban, Hourglass, MapPin, MessageCircle, Pencil, Route, Timer, Trash2, Users, Wallet } from 'lucide-react';
import { formatEventDate, relativeTime, photoUrlFrom, formatMoney, perPersonBudget, transportLabel, isDeadlinePassed } from '../lib/helpers';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppProvider';
import { Avatar } from './Avatar';
import { CategoryChip } from './CategoryChip';
import { SpotsIndicator } from './SpotsIndicator';
import { JoinControl } from './JoinControl';
import { RequestList } from './RequestList';

export function ActivityCard({ activity, variant = 'discover', onEdit, showChat = false, highlighted = false }) {
  const { cancelActivity, deleteActivity, openProfile, openChat, getRequestsForActivity, loadRequests } = useApp();
  const [showRequests, setShowRequests] = useState(false);
  const cancelled = activity.status === 'cancelled';

  const { date, time } = formatEventDate(activity.date);
  const requests = getRequestsForActivity(activity.id);

  useEffect(() => {
    if (showRequests && !requests) {
      loadRequests(activity.id);
    }
  }, [showRequests, requests, activity.id, loadRequests]);

  return (
    <article
      id={`activity-card-${activity.id}`}
      className={cn(
        'rounded-2xl border border-border bg-card p-5 sm:p-6',
        highlighted && 'ring-2 ring-primary'
      )}
    >
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
      {cancelled && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
          <Ban className="size-3.5" strokeWidth={2} />
          Cancelled
        </p>
      )}
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
        <span className="inline-flex items-center gap-1.5">
          <Wallet className="size-4 text-muted-foreground" strokeWidth={2} />
          {formatMoney(activity.budgetTotal)} total
          <span className="text-muted-foreground">·</span>
          {formatMoney(perPersonBudget(activity.budgetTotal, activity.capacity))}/person
        </span>
        {activity.durationHours != null && (
          <span className="inline-flex items-center gap-1.5">
            <Hourglass className="size-4 text-muted-foreground" strokeWidth={2} />
            {activity.durationHours} {activity.durationHours === 1 ? 'hour' : 'hours'}
          </span>
        )}
        {activity.transportMethod && (
          <span className="inline-flex items-center gap-1.5">
            <Route className="size-4 text-muted-foreground" strokeWidth={2} />
            {transportLabel(activity.transportMethod)}
          </span>
        )}
        {activity.applicationDeadline && (
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-4 text-muted-foreground" strokeWidth={2} />
            {isDeadlinePassed(activity.applicationDeadline)
              ? 'Applications closed'
              : `Apply by ${formatEventDate(activity.applicationDeadline).label}`}
          </span>
        )}
      </div>

      {activity.budgetNote && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
          Budget covers: {activity.budgetNote}
        </p>
      )}

      {activity.transportNote && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
          Getting there: {activity.transportNote}
        </p>
      )}

      {activity.requirements && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
          Requirements: {activity.requirements}
        </p>
      )}

      <div className="mt-4">
        <SpotsIndicator activity={activity} />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {variant === 'discover' ? (
          <div className="flex items-center justify-end gap-2">
            {showChat && (
              <button
                type="button"
                onClick={() => openChat(activity.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <MessageCircle className="size-3.5" strokeWidth={2} />
                Chat
              </button>
            )}
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
                {showChat && (
                  <button
                    type="button"
                    onClick={() => openChat(activity.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <MessageCircle className="size-3.5" strokeWidth={2} />
                    Chat
                  </button>
                )}
                {!cancelled && (
                  <button
                    type="button"
                    onClick={() => onEdit?.(activity)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px"
                  >
                    <Pencil className="size-3.5" strokeWidth={2} />
                    Edit
                  </button>
                )}
                {!cancelled && activity.acceptedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Cancel this activity? People who joined will be notified.')) {
                        cancelActivity(activity.id);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:outline-none active:translate-y-px"
                  >
                    <Ban className="size-3.5" strokeWidth={2} />
                    Cancel
                  </button>
                )}
                {!cancelled && activity.acceptedCount === 0 && (
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
                )}
              </div>
            </div>

            {showRequests ? (
              <RequestList activityId={activity.id} capacity={activity.capacity} requests={requests} />
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}