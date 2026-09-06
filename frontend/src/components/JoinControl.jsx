import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { useApp } from '../context/AppProvider';

export function JoinControl({ activity }) {
  const { sendJoinRequest } = useApp();
  const [composing, setComposing] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const isFull = activity.capacity > 0 && activity.acceptedCount >= activity.capacity;

  if (activity.myApplicationStatus === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-4 py-2 text-sm font-semibold text-success">
        <Check className="size-4" strokeWidth={2.5} />
        You're in!
      </span>
    );
  }

  if (activity.myApplicationStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
        Request sent
      </span>
    );
  }

  if (activity.myApplicationStatus === 'declined') {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
        Not this time
      </span>
    );
  }

  if (isFull) {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
        Activity full
      </span>
    );
  }

  if (!composing) {
    return (
      <button
        type="button"
        onClick={() => setComposing(true)}
        className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px"
      >
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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor={`note-${activity.id}`} className="sr-only">Add a note for the host</label>
        <input
          id={`note-${activity.id}`}
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a quick note for the host…"
          className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px disabled:opacity-50"
      >
        <Send className="size-3.5" strokeWidth={2.5} />
        {sending ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}