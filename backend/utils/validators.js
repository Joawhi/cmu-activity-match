const { TRANSPORT_METHODS } = require('../constants');

const MAX_LENGTHS = {
  title: 120,
  description: 2000,
  location: 200,
  participationRequirements: 500,
  budgetNote: 300,
  transportNote: 300,
  displayName: 60,
  bio: 500,
  major: 100,
  languages: 300,
  note: 500,
};

function parseRequiredText(raw, field) {
  const maxLength = MAX_LENGTHS[field] || 500;
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { ok: false, error: `${field} is required` };
  }
  const trimmed = raw.trim();
  if (trimmed.length > maxLength) {
    return { ok: false, error: `${field} must be ${maxLength} characters or fewer` };
  }
  return { ok: true, value: trimmed };
}

function parseOptionalText(raw, field) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string') {
    return { ok: false, error: `${field} must be text` };
  }
  const trimmed = raw.trim();
  const maxLength = MAX_LENGTHS[field] || 500;
  if (trimmed.length > maxLength) {
    return { ok: false, error: `${field} must be ${maxLength} characters or fewer` };
  }
  return { ok: true, value: trimmed || null };
}

// Returns { ok: true, value } or { ok: false, error }.
// 0 is a valid budget (a free activity), so only missing, non-numeric or
// negative values are rejected — never a falsy check.
function parseBudgetTotal(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: false, error: 'Estimated budget is required' };
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: 'Estimated budget must be a number of 0 or more' };
  }
  return { ok: true, value };
}

// Group size (max_people) is the TOTAL headcount and includes the organizer,
// so the most applicants that can be accepted is max_people - 1.
// null/0 (legacy rows) means the activity has no limit.
// Must stay in sync with isActivityFull() in frontend/src/lib/helpers.js.
function isActivityFull(maxPeople, acceptedCount) {
  const limit = Number(maxPeople) || 0;
  return limit > 0 && (Number(acceptedCount) || 0) + 1 >= limit;
}

function parseTransportMethod(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string' || !TRANSPORT_METHODS.includes(raw)) {
    return { ok: false, error: `Transport method must be one of: ${TRANSPORT_METHODS.join(', ')}` };
  }
  return { ok: true, value: raw };
}

function parseDurationHours(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 24) {
    return { ok: false, error: 'Estimated duration must be a number of hours between 0 and 24' };
  }
  return { ok: true, value };
}

// Only accepts an absolute instant. A zone-less string like '2026-10-03T18:00'
// would be read in the server's timezone, which silently shifts the cutoff in
// production — reject it so that class of bug cannot reach the database.
function parseApplicationDeadline(raw) {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: null };
  if (typeof raw !== 'string' || !/(Z|[+-]\d{2}:?\d{2})$/.test(raw)) {
    return { ok: false, error: 'Application deadline must include a timezone offset' };
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: 'Application deadline is not a valid date' };
  }
  return { ok: true, value: date };
}

module.exports = {
  parseRequiredText,
  parseOptionalText,
  parseBudgetTotal,
  parseTransportMethod,
  parseDurationHours,
  parseApplicationDeadline,
  isActivityFull,
};