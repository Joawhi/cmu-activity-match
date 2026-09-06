import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CATEGORY_META } from '../lib/helpers';
import { CATEGORIES } from '../constants';
import { useApp } from '../context/AppProvider';
import { cn } from '../lib/utils';

const WHO_OPTIONS = [
  { id: 'none', label: 'Everyone' },
  { id: 'male', label: 'Male only' },
  { id: 'female', label: 'Female only' },
];

const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none';

export function CreateActivity({ editing, onDone }) {
  const { createActivity, updateActivity } = useApp();
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [category, setCategory] = useState(editing?.category ?? null);
  const [date, setDate] = useState(editing?.date ?? '');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [capacity, setCapacity] = useState(String(editing?.capacity ?? 4));
  const [whoCanJoin, setWhoCanJoin] = useState(editing?.whoCanJoin ?? 'none');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = title.trim() && category && date && location.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      datetime: date,
      location: location.trim(),
      max_people: Math.max(1, Number(capacity) || 1),
      gender_restriction: whoCanJoin,
    };

    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateActivity(editing.id, payload);
      } else {
        await createActivity(payload);
      }
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 sm:py-8">
      <button
        type="button"
        onClick={onDone}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Back
      </button>

      <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {editing ? 'Edit activity' : 'Start an activity'}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Give people a reason to say yes. Keep it warm and specific.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Field label="What are you doing?" htmlFor="title">
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dumpling crawl through Squirrel Hill"
            className={inputClass}
          />
        </Field>

        <Field label="Tell them a little more" htmlFor="description">
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What's the plan, the vibe, anything to bring?"
            className={cn(inputClass, 'resize-none leading-relaxed')}
          />
        </Field>

        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={active}
                  style={active ? { backgroundColor: meta.bg, color: meta.fg, borderColor: 'transparent' } : undefined}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                    active ? 'border-transparent' : 'border-border bg-background text-foreground hover:bg-secondary'
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={2} />
                  {cat}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="When" htmlFor="date">
            <input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Group size" htmlFor="capacity">
            <input
              id="capacity"
              type="number"
              min={1}
              max={50}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Where" htmlFor="location">
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. The Strip District, Pittsburgh"
            className={inputClass}
          />
        </Field>

        <Field label="Who can join">
          <div className="flex flex-wrap gap-2">
            {WHO_OPTIONS.map((opt) => {
              const active = whoCanJoin === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWhoCanJoin(opt.id)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                    active ? 'border-transparent bg-foreground text-background' : 'border-border bg-background text-foreground hover:bg-secondary'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create activity'}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block font-sans text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}