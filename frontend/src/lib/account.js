export function validateName(raw) {
  const name = raw.trim();
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (name.length > 80) return 'Name must be 80 characters or fewer';
  return '';
}

const ANDREW_DOMAIN = 'andrew.cmu.edu';

export function cmuEmailSuggestion(raw) {
  const at = raw.indexOf('@');
  if (at < 0 || raw.indexOf('@', at + 1) !== -1) return '';
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1).toLowerCase();
  if (!ANDREW_DOMAIN.startsWith(domain) || domain === ANDREW_DOMAIN) return '';
  return `${local}@${ANDREW_DOMAIN}`;
}

export function validateEmail(raw) {
  const email = raw.trim().toLowerCase();
  if (!email) return 'Email is required';
  if (email.length > 254) return 'Email is too long';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  if (!/^[^\s@]+@(andrew\.cmu\.edu|cmu\.edu)$/.test(email)) {
    return 'Use your @andrew.cmu.edu or @cmu.edu email';
  }
  return '';
}

export function validateSecurityAnswer(raw) {
  const answer = raw.trim().replace(/\s+/g, ' ');
  if (!answer) return 'Security answer is required';
  if (answer.length < 2) return 'Security answer must be at least 2 characters';
  if (answer.length > 80) return 'Security answer must be 80 characters or fewer';
  return '';
}

export function validatePassword(raw) {
  if (!raw) return 'Password is required';
  if (raw.length < 8) return 'Password must be at least 8 characters';
  if (raw.length > 72) return 'Password must be 72 characters or fewer';
  if (!/[A-Za-z]/.test(raw) || !/[0-9]/.test(raw)) {
    return 'Password must include a letter and a number';
  }
  return '';
}
