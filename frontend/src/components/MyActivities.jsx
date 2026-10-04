import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppProvider';
import { ActivityCard } from './ActivityCard';
import { EmptyState } from './EmptyState';

export function MyActivities({ onCreate, onEdit, focusActivityId = null, focusSection = null }) {
  const { activities, currentUser } = useApp();
  const [activeSection, setActiveSection] = useState('created');
  const previousStatuses = useRef(new Map());

  const statuses = new Map();
  let becameAccepted = false;
  for (const activity of activities) {
    if (activity.hostId === currentUser.id || !activity.myApplicationStatus) continue;
    if (previousStatuses.current.get(activity.id) === 'pending' && activity.myApplicationStatus === 'accepted') {
      becameAccepted = true;
    }
    statuses.set(activity.id, activity.myApplicationStatus);
  }
  previousStatuses.current = statuses;
  if (becameAccepted && activeSection === 'pending') {
    setActiveSection('joined');
  }

  useEffect(() => {
    if (focusSection) setActiveSection(focusSection);
  }, [focusSection]);

  useEffect(() => {
    if (!focusActivityId) return;
    document.getElementById(`activity-card-${focusActivityId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusActivityId, activeSection]);

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
    { id: 'created', label: 'Hosting', count: sections.created.length },
    { id: 'joined', label: 'Joined', count: sections.joined.length },
    { id: 'pending', label: 'Pending', count: sections.pending.length },
  ];

  const sectionDetails = {
    created: {
      title: 'Hosting',
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          variant={variant}
          showChat={showChat}
          onEdit={onEdit}
          highlighted={activity.id === focusActivityId}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground sm:text-3xl">My Activities</h1>

      <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-secondary p-1.5 sm:w-max">
        {navigation.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSection(item.id)}
            aria-pressed={activeSection === item.id}
            className={`rounded-lg px-6 py-2 text-sm font-semibold whitespace-nowrap transition-all ${activeSection === item.id
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary/80'
              }`}
          >
            {item.label}
            <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">{item.count}</span>
          </button>
        ))}
      </div>

      <section aria-label={sectionDetails[activeSection].title}>
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
  );
}