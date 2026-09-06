import { useMemo, useState } from 'react';
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

export function DiscoverFeed({ onCreate }) {
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

  const filtered = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(now.getDate() + 7);

    return activities
      .filter((a) => a.hostId !== currentUser.id)
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Discover activities
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Find people to spend your evening with — no strangers stay strangers for long.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dinners, museums, game nights…"
          className="w-full rounded-full border border-border bg-card py-3 pr-4 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
        />
      </div>

      <div className="mt-4 space-y-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <FilterChip
                key={cat}
                label={cat}
                icon={meta.icon}
                active={categories.has(cat)}
                onClick={() => toggleCategory(cat)}
                activeStyle={{ backgroundColor: meta.bg, color: meta.fg }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip label="Any day" active={dateFilter === 'any'} onClick={() => setDateFilter('any')} />
          <FilterChip label="Today" active={dateFilter === 'today'} onClick={() => setDateFilter('today')} />
          <FilterChip label="This week" active={dateFilter === 'week'} onClick={() => setDateFilter('week')} />
          <span className="mx-1 self-center text-border" aria-hidden="true">|</span>
          {WHO_OPTIONS.map((opt) => (
            <FilterChip key={opt.id} label={opt.label} active={who === opt.id} onClick={() => setWho(opt.id)} />
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No activities match your filters"
            description="Try clearing a filter or two — or be the one who starts something. Someone out there is hoping you will."
            actionLabel="Create an activity"
            onAction={onCreate}
          />
        ) : (
          filtered.map((a) => <ActivityCard key={a.id} activity={a} />)
        )}
      </div>
    </div>
  );
}