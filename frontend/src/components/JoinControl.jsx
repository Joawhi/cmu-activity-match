import { useState } from 'react';
import { Check, LogOut, Send } from 'lucide-react';
import { useApp } from '../context/AppProvider';
import { isDeadlinePassed, isActivityFull } from '../lib/helpers';

const primaryButton =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-cmu-dark focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50';

const quietButton =
  'inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50';

const statusButton =
  'inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-secondary py-2.5 text-sm font-bold text-muted-foreground';

export function JoinControl({ activity }) {
  const { sendJoinRequest, withdrawJoinRequest } = useApp();
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');

  const handleWithdraw = async (confirmText) => {
    if (!window.confirm(confirmText)) return;
    setWithdrawing(true);
    setError('');
    try {
      await withdrawJoinRequest(activity.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const isFull = isActivityFull(activity);
  const deadlinePassed = isDeadlinePassed(activity.applicationDeadline);

  if (activity.status === 'cancelled') {
    return <span className={statusButton}>Cancelled</span>;
  }

  if (activity.myApplicationStatus === 'accepted') {
    return (
      <div className="flex w-full flex-col gap-2">
        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/10 py-2.5 text-sm font-bold text-success">
          <Check className="size-4" strokeWidth={2.5} />
          You're in
        </span>
        <button
          type="button"
          onClick={() => handleWithdraw('Leave this activity? Your spot will open up for someone else.')}
          disabled={withdrawing}
          className={quietButton}
        >
          <LogOut className="size-3.5" strokeWidth={2} />
          {withdrawing ? 'Leaving…' : 'Leave'}
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (activity.myApplicationStatus === 'pending') {
    return (
      <div className="flex w-full flex-col gap-2">
        <span className={statusButton}>Request sent</span>
        <button
          type="button"
          onClick={() => handleWithdraw('Withdraw your request? You can send a new one later.')}
          disabled={withdrawing}
          className={quietButton}
        >
          {withdrawing ? 'Withdrawing…' : 'Withdraw'}
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (activity.myApplicationStatus === 'declined') {
    return <span className={statusButton}>Not this time</span>;
  }

  if (deadlinePassed) {
    return <span className={statusButton}>Applications closed</span>;
  }

  if (isFull) {
    return <span className={statusButton}>Full</span>;
  }

  if (!composing) {
    return (
      <button type="button" onClick={() => setComposing(true)} className={primaryButton}>
        Request to join
      </button>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await sendJoinRequest(activity.id, note.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
      <label htmlFor={`note-${activity.id}`} className="sr-only">Add a note for the host</label>
      <input
        id={`note-${activity.id}`}
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a quick note for the host…"
        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setComposing(false)} className={quietButton}>
          Cancel
        </button>
        <button type="submit" disabled={sending} className={primaryButton}>
          <Send className="size-3.5" strokeWidth={2.5} />
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  );
}
