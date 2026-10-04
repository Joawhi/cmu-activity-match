import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CATEGORY_META, isSameDay } from '../lib/helpers';
import { CATEGORIES } from '../constants';
import { useApp } from '../context/AppProvider';
import { ActivityCard } from './ActivityCard';
import { FilterChip } from './FilterChip';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';

const WHO_OPTIONS = [
  { id: 'any', label: 'Anyone' },
  { id: 'male', label: 'Male only' },
  { id: 'female', label: 'Female only' },
];

export function DiscoverFeed({ onCreate, focusActivityId = null }) {
  const { activities, loading, currentUser } = useApp();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState(new Set());
  const [dateFilter, setDateFilter] = useState('any');
  const [who, setWho] = useState('any');

  const toggleCategory = (id) =>
    setCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearFilters = () => {
    setQuery('');
    setCategories(new Set());
    setDateFilter('any');
    setWho('any');
  };

  const filtersActive = query.trim() || categories.size > 0 || dateFilter !== 'any' || who !== 'any';

  const filtered = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(now.getDate() + 7);

    return activities
      .filter((a) => a.hostId !== currentUser.id)
      .filter((a) => a.status !== 'cancelled')
      .filter((a) => {
        if (categories.size && !categories.has(a.category)) return false;
        if (who !== 'any' && a.whoCanJoin !== 'none' && a.whoCanJoin !== who) return false;
        if (dateFilter === 'today' && !isSameDay(a.date, now)) return false;
        if (dateFilter === 'week') {
          const d = new Date(a.date);
          if (d < now || d > weekAhead) return false;
        }
        if (query.trim()) {
          const q = query.toLowerCase();
          const hit =
            a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.location.toLowerCase().includes(q);
          if (!hit) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [activities, categories, who, dateFilter, query, currentUser]);

  const visible = useMemo(() => {
    if (!focusActivityId || filtered.some((activity) => activity.id === focusActivityId)) return filtered;
    const focused = activities.find((activity) => activity.id === focusActivityId && activity.hostId !== currentUser.id);
    return focused ? [focused, ...filtered] : filtered;
  }, [filtered, focusActivityId, activities, currentUser]);

  useEffect(() => {
    if (!focusActivityId || loading) return;
    document.getElementById(`activity-card-${focusActivityId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusActivityId, loading, visible]);

  return (
    <div>
      <div className="sticky top-16 z-30 border-b border-border bg-card px-4 pt-6 pb-4 shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <div className="group relative mb-5 w-full max-w-3xl">
            <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activities..."
              className="w-full rounded-full border border-border bg-card py-3 pr-6 pl-12 text-base shadow-sm transition hover:shadow-md focus-visible:border-primary focus-visible:shadow-md focus-visible:outline-none"
            />
          </div>

          <div className="no-scrollbar flex w-full snap-x gap-2 overflow-x-auto px-1 pb-2 sm:justify-center sm:gap-3">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <FilterChip
                  key={cat}
                  label={cat}
                  icon={meta.icon}
                  active={categories.has(cat)}
                  onClick={() => toggleCategory(cat)}
                />
              );
            })}
          </div>

          <div className="no-scrollbar mt-2 flex w-full items-center gap-2 overflow-x-auto px-1 pb-1 sm:justify-center">
            <FilterChip label="Any day" active={dateFilter === 'any'} onClick={() => setDateFilter('any')} />
            <FilterChip label="Today" active={dateFilter === 'today'} onClick={() => setDateFilter('today')} />
            <FilterChip label="This week" active={dateFilter === 'week'} onClick={() => setDateFilter('week')} />
            <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
            {WHO_OPTIONS.map((opt) => (
              <FilterChip key={opt.id} label={opt.label} active={who === opt.id} onClick={() => setWho(opt.id)} />
            ))}
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-1 shrink-0 text-xs font-bold text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : visible.length === 0 ? (
          <EmptyState
            title="No activities match your filters"
            description="Try adjusting your category, date, or audience filters."
            actionLabel={filtersActive ? 'Clear all filters' : 'Create an activity'}
            onAction={filtersActive ? clearFilters : onCreate}
          />
        ) : (
          visible.map((a) => (
            <ActivityCard key={a.id} activity={a} highlighted={a.id === focusActivityId} />
          ))
        )}
      </div>
    </div>
  );
}
