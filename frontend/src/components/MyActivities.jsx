import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppProvider';
import { ActivityCard } from './ActivityCard';
import { EmptyState } from './EmptyState';

export function MyActivities({ onCreate, onEdit }) {
  const { activities, currentUser } = useApp();

  const mine = useMemo(
    () =>
      activities
        .filter((a) => a.hostId === currentUser.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [activities, currentUser]
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl app-heading">
            My activities
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage what you are hosting and review who wants to join.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">New activity</span>
        </button>
      </header>

      {mine.length === 0 ? (
        <EmptyState
          title="You are not hosting anything yet"
          description="Hosting is the fastest way to meet people. Pick something you would do anyway and invite others along."
          actionLabel="Create your first activity"
          onAction={onCreate}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {mine.map((a) => (
            <ActivityCard key={a.id} activity={a} variant="host" onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}