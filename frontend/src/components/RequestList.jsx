import { useState } from 'react';
import { Check, LogOut, X } from 'lucide-react';
import { useApp } from '../context/AppProvider';
import { Avatar } from './Avatar';
import { photoUrlFrom, spotsFilled, hasCapacityLimit, isActivityFull } from '../lib/helpers';

const SECTION_HEADING = 'text-xs font-semibold tracking-wide text-muted-foreground uppercase';

export function RequestList({ activityId, capacity, requests }) {
  const { acceptRequest, declineRequest, openProfile } = useApp();
  const [error, setError] = useState('');

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

  const confirmed = requests.filter((r) => r.status === 'accepted');
  const pending = requests.filter((r) => r.status === 'pending');
  const declined = requests.filter((r) => r.status === 'declined');
  const withdrawn = requests.filter((r) => r.status === 'withdrawn');

  // Derived from the rows on screen, so the gate can never disagree with the
  // list. Recomputed every render: declining someone frees the spot at once.
  const counts = { capacity, acceptedCount: confirmed.length };
  const full = isActivityFull(counts);
  const filled = spotsFilled(counts);

  const respond = async (action, requestId) => {
    setError('');
    try {
      await action(activityId, requestId);
    } catch (err) {
      setError(err.message);
    }
  };

  const sections = [
    { key: 'confirmed', label: 'Confirmed', rows: confirmed },
    { key: 'pending', label: 'Pending', rows: pending },
    { key: 'declined', label: 'Declined', rows: declined },
    { key: 'withdrawn', label: 'Withdrawn', rows: withdrawn },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-secondary/60 px-4 py-2.5 text-sm text-muted-foreground">
        {!hasCapacityLimit(counts)
          ? `${filled} going, including you. No group size set.`
          : full
            ? `Full — ${filled} of ${capacity} spots, including you. A spot opens up if someone leaves.`
            : `${filled} of ${capacity} spots filled, including you.`}
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {sections
        .filter((section) => section.rows.length > 0)
        .map((section) => (
          <section key={section.key} className="flex flex-col gap-2">
            <h4 className={SECTION_HEADING}>
              {section.label} ({section.rows.length})
            </h4>
            <ul className="flex flex-col gap-3">
              {section.rows.map((req) => (
                <RequestRow
                  key={req.id}
                  req={req}
                  disableAccept={full}
                  onAccept={() => respond(acceptRequest, req.id)}
                  onDecline={() => respond(declineRequest, req.id)}
                  onOpenProfile={() => openProfile(req.user_id)}
                />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function RequestRow({ req, disableAccept, onAccept, onDecline, onOpenProfile }) {
  const name = req.applicant_display_name || req.applicant_name;

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="rounded-full focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Avatar name={name} photoUrl={photoUrlFrom(req.applicant_photo)} size={40} />
        </button>
        <div className="min-w-0">
          <button
            type="button"
            onClick={onOpenProfile}
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
              onClick={onAccept}
              disabled={disableAccept}
              title={disableAccept ? 'This activity is full. A spot opens up if someone leaves.' : undefined}
              className="inline-flex items-center gap-1.5 rounded-full bg-success px-3.5 py-1.5 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 focus-visible:ring-2 focus-visible:ring-success/40 focus-visible:outline-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-success"
            >
              <Check className="size-3.5" strokeWidth={2.5} />
              Accept
            </button>
            <button
              type="button"
              onClick={onDecline}
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
        ) : req.status === 'withdrawn' ? (
          // Outline + verb, so it never reads as a decision the organizer made.
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
            <LogOut className="size-3.5" strokeWidth={2} />
            Withdrew
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
            Declined
          </span>
        )}
      </div>
    </li>
  );
}
