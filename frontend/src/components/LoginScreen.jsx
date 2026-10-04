import { useLayoutEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../context/AppProvider';
import { SCHOOL_YEARS, LANGUAGES, LANGUAGE_FLAGS, SECURITY_QUESTIONS } from '../constants';
import { cmuEmailSuggestion, validateEmail, validateName, validatePassword, validateSecurityAnswer } from '../lib/account';
import { cn } from '../lib/utils';

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none';

const GUIDELINES = [
  'Use your own CMU email and your real name. One account per person, and don\'t sign in as someone else.',
  'Be respectful. Harassment, hate, or pressure to join an activity is not allowed.',
  'Only post activities you actually plan to host, with honest details about time, place, cost, and who can join.',
  'No scams, illegal activity, or anything that puts other students at risk.',
  'Hosts are responsible for the safety of their activity and for accepting or declining requests.',
  'What you share on your profile and in an activity can be seen by other students on this app.',
  'If you can\'t make it, withdraw or cancel instead of leaving people waiting.',
];

export function LoginScreen() {
  const { login, register } = useApp();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [resetQuestion, setResetQuestion] = useState('');
  const [notice, setNotice] = useState('');
  const [bio, setBio] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [major, setMajor] = useState('');
  const [languages, setLanguages] = useState([]);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const emailInputRef = useRef(null);
  const pendingEmailSelection = useRef(null);

  useLayoutEffect(() => {
    const range = pendingEmailSelection.current;
    const input = emailInputRef.current;
    if (!range || !input) return;
    input.setSelectionRange(range.start, range.end);
    pendingEmailSelection.current = null;
  });

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const nameError = validateName(name);
  const confirmError = confirmPassword
    ? (confirmPassword === password ? '' : 'Passwords do not match')
    : 'Confirm your password';
  const questionError = SECURITY_QUESTIONS.includes(securityQuestion) ? '' : 'Choose a security question';
  const answerError = validateSecurityAnswer(securityAnswer);

  const show = (value, message) => (submitted || value ? message : '');

  const canLogin = !emailError && !passwordError;
  const canRegister = canLogin && !nameError && !confirmError && !questionError && !answerError && acceptedGuidelines;
  const canReset = !emailError && !answerError && !passwordError && !confirmError;
  const needsConfirm = mode === 'register' || (mode === 'reset' && resetQuestion);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
    setSubmitted(false);
    setResetQuestion('');
    setAcceptedGuidelines(false);
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
    setNotice('');
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === 'login' && !canLogin) return;
    if (mode === 'register' && !canRegister) return;
    if (mode === 'reset' && (resetQuestion ? !canReset : emailError)) return;

    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(normalizedEmail, password);
      } else if (mode === 'register') {
        await register({
          name: name.trim(),
          email: normalizedEmail,
          password,
          security_question: securityQuestion,
          security_answer: securityAnswer,
          display_name: displayName.trim(),
          bio: bio.trim(),
          school_year: schoolYear,
          major: major.trim(),
          languages: languages.join(','),
        });
      } else if (!resetQuestion) {
        const result = await api.securityQuestion(normalizedEmail);
        setResetQuestion(result.question);
        setSubmitted(false);
      } else {
        await api.resetPassword(normalizedEmail, securityAnswer, password);
        setPassword('');
        setConfirmPassword('');
        setSecurityAnswer('');
        setResetQuestion('');
        setSubmitted(false);
        setMode('login');
        setNotice('Password updated. Log in with your new password.');
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
            {mode === 'login' ? 'Log in' : mode === 'register' ? 'Create an account' : 'Reset your password'}
          </h1>
          <p className="mx-auto mt-2.5 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
            {mode === 'login'
              ? 'Use your CMU email and password.'
              : mode === 'register'
                ? 'Your name, email, password, and security question are required. The rest of your profile can wait.'
                : resetQuestion
                  ? 'Answer the question you chose when you registered.'
                  : 'Enter the CMU email on your account.'}
          </p>
          {notice && (
            <p className="mt-4 text-center text-sm text-foreground" role="status">{notice}</p>
          )}

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
                ref={emailInputRef}
                id="cmu-email"
                type="text"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  const next = event.target.value;
                  const suggestion = cmuEmailSuggestion(next);
                  const replacedSuggestion = email.length - next.length > 1
                    && email.startsWith(next.slice(0, Math.max(0, next.length - 1)));
                  setResetQuestion('');
                  if (suggestion && (next.length > email.length || replacedSuggestion)) {
                    pendingEmailSelection.current = { start: next.length, end: suggestion.length };
                    setEmail(suggestion);
                    return;
                  }
                  pendingEmailSelection.current = null;
                  setEmail(next);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Escape' && event.key !== 'Backspace') return;
                  const input = event.currentTarget;
                  const start = input.selectionStart ?? 0;
                  const end = input.selectionEnd ?? 0;
                  if (end !== email.length || start >= end) return;
                  const typed = email.slice(0, start);
                  if (cmuEmailSuggestion(typed) !== email) return;
                  event.preventDefault();
                  pendingEmailSelection.current = { start: typed.length, end: typed.length };
                  setEmail(typed);
                }}
                placeholder="you@andrew.cmu.edu"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-autocomplete="inline"
                className={inputClass}
              />
            </Field>

            {mode === 'reset' && resetQuestion && (
              <>
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">Security question</p>
                  <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">{resetQuestion}</p>
                </div>
                <Field
                  label="Security answer"
                  htmlFor="reset-answer"
                  error={show(securityAnswer, answerError)}
                  hint={show(securityAnswer, answerError) ? '' : 'Answers are not case-sensitive.'}
                >
                  <input
                    id="reset-answer"
                    value={securityAnswer}
                    onChange={(event) => setSecurityAnswer(event.target.value)}
                    autoComplete="off"
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            {(mode !== 'reset' || resetQuestion) && (
              <Field
                label={mode === 'reset' ? 'New password' : 'Password'}
                htmlFor="password"
                error={show(password, passwordError)}
                hint={mode !== 'login' && !show(password, passwordError) ? 'At least 8 characters, with a letter and a number.' : ''}
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
            )}

            {needsConfirm && (
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
              </>
            )}

            {mode === 'register' && (
              <>
                <Field label="Security question" htmlFor="security-question" error={show(securityQuestion, questionError)}>
                  <select
                    id="security-question"
                    value={securityQuestion}
                    onChange={(event) => setSecurityQuestion(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a question</option>
                    {SECURITY_QUESTIONS.map((question) => (
                      <option key={question} value={question}>{question}</option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Security answer"
                  htmlFor="security-answer"
                  error={show(securityAnswer, answerError)}
                  hint={show(securityAnswer, answerError) ? '' : 'You will need this if you forget your password. It is not case-sensitive.'}
                >
                  <input
                    id="security-answer"
                    value={securityAnswer}
                    onChange={(event) => setSecurityAnswer(event.target.value)}
                    autoComplete="off"
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

            {mode === 'register' && (
              <div className="rounded-xl border border-border bg-muted px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Guidelines</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                  {GUIDELINES.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <label className="mt-3 flex items-start gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={acceptedGuidelines}
                    onChange={(event) => setAcceptedGuidelines(event.target.checked)}
                    className="mt-1 accent-primary"
                  />
                  <span>I agree to the guidelines.</span>
                </label>
                {submitted && !acceptedGuidelines && (
                  <p className="mt-1.5 text-xs text-destructive">Accept the guidelines to create an account.</p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading || (submitted && (
                mode === 'login' ? !canLogin : mode === 'register' ? !canRegister : resetQuestion ? !canReset : Boolean(emailError)
              ))}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-cmu-dark focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Log in'
                  : mode === 'register'
                    ? 'Create account'
                    : resetQuestion
                      ? 'Save new password'
                      : 'Continue'}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-center text-sm font-bold text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}
          </form>

          <p className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? 'New here?' : mode === 'register' ? 'Already registered?' : 'Remembered it?'}{' '}
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
