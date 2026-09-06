import { Check, X } from 'lucide-react';
import { useApp } from '../context/AppProvider';
import { Avatar } from './Avatar';
import { photoUrlFrom } from '../lib/helpers';

export function RequestList({ activityId, requests }) {
  const { acceptRequest, declineRequest, openProfile } = useApp();

  if (!requests) {
    return <p className="text-sm text-muted-foreground">Loading requests…</p>;
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
        No requests yet. Share your activity and they will show up here.
      </p>
    );
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const decided = requests.filter((r) => r.status !== 'pending');

  return (
    <ul className="flex flex-col gap-3">
      {[...pending, ...decided].map((req) => {
        const name = req.applicant_display_name || req.applicant_name;
        return (
          <li
            key={req.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => openProfile(req.user_id)}
                className="rounded-full focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Avatar name={name} photoUrl={photoUrlFrom(req.applicant_photo)} size={40} />
              </button>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => openProfile(req.user_id)}
                  className="font-serif text-base font-semibold text-foreground hover:underline"
                >
                  {name}
                </button>
                {req.applicant_school_year && (
                  <p className="text-xs text-muted-foreground">{req.applicant_school_year}</p>
                )}
                {req.note ? <p className="mt-1 text-sm text-foreground/80">"{req.note}"</p> : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
              {req.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => acceptRequest(activityId, req.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-success px-3.5 py-1.5 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 focus-visible:ring-2 focus-visible:ring-success/40 focus-visible:outline-none active:translate-y-px"
                  >
                    <Check className="size-3.5" strokeWidth={2.5} />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => declineRequest(activityId, req.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-3.5 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:outline-none active:translate-y-px"
                  >
                    <X className="size-3.5" strokeWidth={2.5} />
                    Decline
                  </button>
                </>
              ) : req.status === 'accepted' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3.5 py-1.5 text-sm font-semibold text-success">
                  <Check className="size-3.5" strokeWidth={2.5} />
                  Accepted
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
                  Declined
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}