import { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { SCHOOL_YEARS, LANGUAGES, LANGUAGE_FLAGS } from '../constants';
import { cmuEmailSuggestion, validateEmail, validateName, validatePassword } from '../lib/account';
import { cn } from '../lib/utils';

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none';

export function LoginScreen() {
  const { login, register } = useApp();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [major, setMajor] = useState('');
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailSuggestionDismissed, setEmailSuggestionDismissed] = useState(false);

  const emailSuggestion = emailSuggestionDismissed ? '' : cmuEmailSuggestion(email);

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const nameError = validateName(name);
  const confirmError = confirmPassword
    ? (confirmPassword === password ? '' : 'Passwords do not match')
    : 'Confirm your password';

  const show = (value, message) => (submitted || value ? message : '');

  const canLogin = !emailError && !passwordError;
  const canRegister = canLogin && !nameError && !confirmError;

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSubmitted(false);
  };

  const toggleLanguage = (language) => {
    setLanguages((current) => (
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language]
    ));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (mode === 'login' ? !canLogin : !canRegister) return;

    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(email.trim().toLowerCase(), password);
      } else {
        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          display_name: displayName.trim(),
          bio: bio.trim(),
          school_year: schoolYear,
          major: major.trim(),
          languages: languages.join(','),
        });
      }
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
          <h1 className="text-center text-3xl font-bold tracking-tight text-balance app-heading">
            {mode === 'login' ? 'Log in' : 'Create an account'}
          </h1>
          <p className="mx-auto mt-2.5 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
            {mode === 'login'
              ? 'Use your CMU email and password.'
              : 'Your name, email, and password are required. The rest of your profile can wait.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            {mode === 'register' && (
              <>
                <Field label="Name" htmlFor="name" error={show(name, nameError)}>
                  <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Jordan Lee"
                    autoComplete="name"
                    className={inputClass}
                  />
                </Field>
                <Field label="Display name" htmlFor="display-name" hint="Optional">
                  <input
                    id="display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="How you want to appear"
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            <Field label="CMU email" htmlFor="cmu-email" error={show(email, emailError)}>
              <input
                id="cmu-email"
                type="text"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailSuggestionDismissed(false);
                }}
                onKeyDown={(event) => {
                  if (!emailSuggestion) return;
                  if (event.key === 'Escape') {
                    setEmailSuggestionDismissed(true);
                    return;
                  }
                  if (event.key === 'Tab' || event.key === 'Enter' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    setEmail(emailSuggestion);
                    setEmailSuggestionDismissed(false);
                  }
                }}
                placeholder="you@andrew.cmu.edu"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-autocomplete="list"
                aria-expanded={Boolean(emailSuggestion)}
                aria-controls="cmu-email-suggestion"
                className={inputClass}
              />
              {emailSuggestion ? (
                <button
                  id="cmu-email-suggestion"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setEmail(emailSuggestion)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2 text-left text-sm text-foreground hover:border-foreground"
                >
                  {emailSuggestion}
                </button>
              ) : null}
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              error={show(password, passwordError)}
              hint={mode === 'register' && !show(password, passwordError) ? 'At least 8 characters, with a letter and a number.' : ''}
            >
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputClass}
              />
            </Field>

            {mode === 'register' && (
              <>
                <Field label="Confirm password" htmlFor="confirm-password" error={submitted || confirmPassword ? confirmError : ''}>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </Field>

                <Field label="School year" htmlFor="school-year" hint="Optional">
                  <select
                    id="school-year"
                    value={schoolYear}
                    onChange={(event) => setSchoolYear(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select</option>
                    {SCHOOL_YEARS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Major" htmlFor="major" hint="Optional">
                  <input
                    id="major"
                    value={major}
                    onChange={(event) => setMajor(event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Bio" htmlFor="bio" hint="Optional">
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    rows={3}
                    className={cn(inputClass, 'resize-none leading-relaxed')}
                  />
                </Field>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Languages <span className="font-normal text-muted-foreground">Optional</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((language) => {
                      const active = languages.includes(language);
                      return (
                        <button
                          key={language}
                          type="button"
                          onClick={() => toggleLanguage(language)}
                          aria-pressed={active}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            active
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border bg-background text-foreground hover:border-foreground'
                          )}
                        >
                          {LANGUAGE_FLAGS[language]} {language}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading || (submitted && (mode === 'login' ? !canLogin : !canRegister))}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-cmu-dark focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === 'login' ? 'New here?' : 'Already registered?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-bold text-primary hover:underline"
            >
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
