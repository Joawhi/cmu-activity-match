import { useState, useEffect } from 'react';
import { Ban, ChevronDown, Hourglass, MapPin, MessageCircle, Pencil, Route, Timer, Trash2, Users, Wallet } from 'lucide-react';
import { formatEventDate, photoUrlFrom, formatMoney, perPersonBudget, transportLabel, isDeadlinePassed, isSameDay } from '../lib/helpers';
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
  const isToday = isSameDay(activity.date, new Date());
  const requests = getRequestsForActivity(activity.id);
  const perPerson = perPersonBudget(activity.budgetTotal, activity.capacity);

  useEffect(() => {
    if (showRequests && !requests) {
      loadRequests(activity.id);
    }
  }, [showRequests, requests, activity.id, loadRequests]);

  return (
    <article
      id={`activity-card-${activity.id}`}
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-2xl border border-border shadow-sm transition-shadow',
        cancelled ? 'bg-secondary' : 'bg-card hover:shadow-md',
        highlighted && 'ring-2 ring-primary'
      )}
    >
      <div className={cn('flex flex-1 flex-col p-5', cancelled && 'opacity-80')}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <CategoryChip category={activity.category} />
          {(date || time) && (
            <span
              className={cn(
                'shrink-0 rounded px-2 py-1 text-xs font-semibold',
                isToday ? 'bg-cmu-soft text-primary' : 'bg-secondary text-muted-foreground'
              )}
            >
              {isToday ? 'Today' : date}
              {time ? ` · ${time}` : ''}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-foreground">{activity.title}</h3>

        <button
          type="button"
          onClick={() => openProfile(activity.hostId)}
          className="mt-2 inline-flex items-center gap-2 self-start text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none"
        >
          <Avatar name={activity.hostName} photoUrl={photoUrlFrom(activity.hostPhoto)} size={22} />
          {activity.hostName}
        </button>

        {activity.location && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <MapPin className="size-4 shrink-0" strokeWidth={2} />
            {activity.location}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <MetaChip muted={cancelled}>
            <Wallet className="size-3.5" strokeWidth={2} />
            {formatMoney(perPerson)} / person
          </MetaChip>
          {activity.durationHours != null && (
            <MetaChip muted={cancelled}>
              <Hourglass className="size-3.5" strokeWidth={2} />
              {activity.durationHours} {activity.durationHours === 1 ? 'hour' : 'hours'}
            </MetaChip>
          )}
          {activity.transportMethod && (
            <MetaChip muted={cancelled}>
              <Route className="size-3.5" strokeWidth={2} />
              {transportLabel(activity.transportMethod)}
            </MetaChip>
          )}
          {activity.applicationDeadline && (
            <MetaChip muted={cancelled}>
              <Timer className="size-3.5" strokeWidth={2} />
              {isDeadlinePassed(activity.applicationDeadline)
                ? 'Applications closed'
                : `Apply by ${formatEventDate(activity.applicationDeadline).label}`}
            </MetaChip>
          )}
        </div>

        {activity.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{activity.description}</p>
        )}

        {cancelled && (
          <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
            <Ban className="size-3.5" strokeWidth={2} />
            Cancelled
          </p>
        )}

        {activity.budgetNote && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Budget covers: {activity.budgetNote}</p>
        )}
        {activity.transportNote && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Getting there: {activity.transportNote}</p>
        )}
        {activity.requirements && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Requirements: {activity.requirements}</p>
        )}

        <div className="mt-auto border-t border-border pt-4">
          <SpotsIndicator activity={activity} />

          {variant === 'discover' ? (
            <div className="mt-4 flex flex-col gap-2">
              {showChat && (
                <button
                  type="button"
                  onClick={() => openChat(activity.id)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <MessageCircle className="size-4" strokeWidth={2} />
                  Chat
                </button>
              )}
              <JoinControl activity={activity} />
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequests((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-none"
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

                <div className="flex flex-wrap items-center gap-2">
                  {showChat && (
                    <button
                      type="button"
                      onClick={() => openChat(activity.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                    >
                      <MessageCircle className="size-3.5" strokeWidth={2} />
                      Chat
                    </button>
                  )}
                  {!cancelled && (
                    <button
                      type="button"
                      onClick={() => onEdit?.(activity)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
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
                      className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 px-3.5 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
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
                      className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 px-3.5 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
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
      </div>
    </article>
  );
}

function MetaChip({ children, muted }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
        muted ? 'bg-border text-foreground' : 'bg-secondary text-muted-foreground'
      )}
    >
      {children}
    </span>
  );
}
