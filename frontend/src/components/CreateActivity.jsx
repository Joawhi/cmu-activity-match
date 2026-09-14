import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CATEGORY_META, formatMoney, perPersonBudget, isoToLocalInput, localInputToIso } from '../lib/helpers';
import { CATEGORIES, TRANSPORT_OPTIONS } from '../constants';
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
  const [budgetTotal, setBudgetTotal] = useState(String(editing?.budgetTotal ?? ''));
  const [budgetNote, setBudgetNote] = useState(editing?.budgetNote ?? '');
  const [durationHours, setDurationHours] = useState(
    editing?.durationHours != null ? String(editing.durationHours) : ''
  );
  const [deadline, setDeadline] = useState(isoToLocalInput(editing?.applicationDeadline));
  const [transportMethod, setTransportMethod] = useState(editing?.transportMethod ?? null);
  const [transportNote, setTransportNote] = useState(editing?.transportNote ?? '');
  const [requirements, setRequirements] = useState(editing?.requirements ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // 0 is allowed (a free activity), so check presence before converting —
  // Number('') and Number(null) both produce 0.
  const budgetNumber = Number(budgetTotal);
  const budgetValid =
    budgetTotal.trim() !== '' && Number.isFinite(budgetNumber) && budgetNumber >= 0;
  const groupSize = Math.max(1, Number(capacity) || 1);

  const canSubmit = title.trim() && category && date && location.trim() && budgetValid;

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
      budget_total: budgetNumber,
      budget_note: budgetNote.trim(),
      duration_hours: durationHours.trim() === '' ? null : Number(durationHours),
      application_deadline: localInputToIso(deadline),
      transport_method: transportMethod,
      transport_note: transportNote.trim(),
      participation_requirements: requirements.trim(),
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

      <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl app-heading">
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
            <p className="mt-1.5 text-xs text-muted-foreground">
              {groupSize === 1
                ? 'Group size 1 means just you — no one else can join.'
                : `Includes you, so ${groupSize - 1} other ${groupSize === 2 ? 'person' : 'people'} can join.`}
            </p>
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="How long will it take? (optional)" htmlFor="durationHours">
            <input
              id="durationHours"
              type="number"
              min={0.5}
              max={24}
              step={0.5}
              inputMode="decimal"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              placeholder="e.g. 2.5"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">In hours. Half hours are fine.</p>
          </Field>
          <Field label="Last day to request a spot (optional)" htmlFor="deadline">
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              After this time, no one can request to join. Uses your local time.
            </p>
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Estimated budget (total, USD)" htmlFor="budgetTotal">
            <input
              id="budgetTotal"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={budgetTotal}
              onChange={(e) => setBudgetTotal(e.target.value)}
              placeholder="e.g. 120"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {budgetValid
                ? `About ${formatMoney(perPersonBudget(budgetNumber, groupSize))} per person, split across ${groupSize} ${groupSize === 1 ? 'person' : 'people'} including you.`
                : 'Enter a total for the whole group. Put 0 if it is free.'}
            </p>
          </Field>
          <Field label="What is the budget mainly for? (optional)" htmlFor="budgetNote">
            <input
              id="budgetNote"
              value={budgetNote}
              onChange={(e) => setBudgetNote(e.target.value)}
              placeholder="e.g. Tickets and snacks"
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

        <Field label="How you'll get there (optional)">
          <div className="flex flex-wrap gap-2">
            {TRANSPORT_OPTIONS.map((opt) => {
              const active = transportMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTransportMethod(active ? null : opt.id)}
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
          <input
            value={transportNote}
            onChange={(e) => setTransportNote(e.target.value)}
            placeholder="Any details? e.g. Meeting at the 61C stop at 5:45"
            aria-label="Transportation details"
            className={cn(inputClass, 'mt-2')}
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

        <Field label="What should people bring or know? (optional)" htmlFor="requirements">
          <textarea
            id="requirements"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={2}
            placeholder="e.g. Bring your own skates, and be comfortable skating for an hour"
            className={cn(inputClass, 'resize-none leading-relaxed')}
          />
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