import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppProvider';
import { ActivityCard } from './ActivityCard';
import { EmptyState } from './EmptyState';

export function MyActivities({ onCreate, onEdit }) {
  const { activities, currentUser } = useApp();
  const [activeSection, setActiveSection] = useState('created');

  const sections = useMemo(() => {
    const sortByDate = (items) => items.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      created: sortByDate(activities.filter((a) => a.hostId === currentUser.id)),
      joined: sortByDate(
        activities.filter((a) => a.hostId !== currentUser.id && a.myApplicationStatus === 'accepted')
      ),
      pending: sortByDate(
        activities.filter((a) => a.hostId !== currentUser.id && a.myApplicationStatus === 'pending')
      ),
    };
  }, [activities, currentUser]);

  const navigation = [
    { id: 'created', label: 'Created by me', count: sections.created.length },
    { id: 'joined', label: 'Joined', count: sections.joined.length },
    { id: 'pending', label: 'Pending', count: sections.pending.length },
  ];

  const sectionDetails = {
    created: {
      title: 'Created by me',
      description: 'Manage your activities and review join requests.',
      emptyTitle: 'You are not hosting anything yet',
      emptyDescription:
        'Hosting is the fastest way to meet people. Pick something you would do anyway and invite others along.',
      emptyAction: 'Create your first activity',
      variant: 'host',
    },
    joined: {
      title: 'Joined',
      description: 'Activities where your spot has been accepted.',
      emptyTitle: 'You have not joined an activity yet',
      emptyDescription: 'Browse activities to find something you would enjoy doing with other students.',
      variant: 'discover',
    },
    pending: {
      title: 'Pending applications',
      description: 'Requests waiting for the activity host to respond.',
      emptyTitle: 'No pending applications',
      emptyDescription: 'When you request to join an activity, it will appear here until the host responds.',
      variant: 'discover',
    },
  };

  const renderCards = (items, variant, showChat) => (
    <div className="flex flex-col gap-4">
      {items.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} variant={variant} showChat={showChat} onEdit={onEdit} />
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
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

      <div className="mb-6 overflow-x-auto border-b border-border pb-2 lg:hidden">
        <nav aria-label="My activities sections" className="flex min-w-max gap-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              aria-pressed={activeSection === item.id}
              className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${activeSection === item.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </nav>
      </div>

      <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start">
        <aside className="sticky top-24 hidden lg:block">
          <nav aria-label="My activities sections" className="border-l border-border">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-pressed={activeSection === item.id}
                className={`-ml-px flex w-full items-center justify-between border-l-2 px-4 py-2.5 text-left text-sm font-medium transition-colors ${activeSection === item.id
                  ? 'border-primary bg-secondary/60 text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-primary hover:bg-secondary/60 hover:text-foreground'
                  }`}
              >
                <span>{item.label}</span>
                <span className="text-xs tabular-nums">{item.count}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-10">
          <section aria-labelledby={`${activeSection}-heading`}>
            <div className="mb-4">
              <h2 id={`${activeSection}-heading`} className="font-serif text-2xl font-semibold tracking-tight">
                {sectionDetails[activeSection].title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{sectionDetails[activeSection].description}</p>
            </div>
            {sections[activeSection].length === 0 ? (
              <EmptyState
                title={sectionDetails[activeSection].emptyTitle}
                description={sectionDetails[activeSection].emptyDescription}
                actionLabel={sectionDetails[activeSection].emptyAction}
                onAction={sectionDetails[activeSection].emptyAction ? onCreate : undefined}
              />
            ) : (
              renderCards(
                sections[activeSection],
                sectionDetails[activeSection].variant,
                activeSection === 'created' || activeSection === 'joined'
              )
            )}
          </section>
        </div>
      </div>
    </div>
  );
}