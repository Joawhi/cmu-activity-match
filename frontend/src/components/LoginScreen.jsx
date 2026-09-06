import { useState } from 'react';
import { useApp } from '../context/AppProvider';

export function LoginScreen() {
  const { login } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailOk = /@(andrew\.)?cmu\.edu$/i.test(email.trim());
  const canSubmit = name.trim().length > 1 && emailOk;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await login(name.trim(), email.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
            Carnegie Mellon
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 sm:p-9">
          <h1 className="text-center font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Welcome to CMU Activity Match
          </h1>
          <p className="mx-auto mt-2.5 max-w-sm text-center text-sm leading-relaxed text-muted-foreground text-pretty">
            Meet other Tartans over dinners, museum visits, game nights, and weekends exploring Pittsburgh.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-foreground">Your name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Lee"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-foreground">CMU email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@andrew.cmu.edu"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
              />
              {email.trim() && !emailOk ? (
                <p className="mt-1.5 text-xs text-destructive">Please use your @andrew.cmu.edu email.</p>
              ) : null}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Continuing…' : 'Continue'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          For Carnegie Mellon students only. We verify your .edu email.
        </p>
      </div>
    </main>
  );
}