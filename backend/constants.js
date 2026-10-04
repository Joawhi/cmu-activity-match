const APPLICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
};

const ACTIVITY_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
};

const NOTIFICATION_TYPE = {
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_RECEIVED: 'application_received',
  APPLICATION_ACCEPTED: 'application_accepted',
  APPLICATION_DECLINED: 'application_declined',
  APPLICATION_WITHDRAWN: 'application_withdrawn',
  PARTICIPANT_LEFT: 'participant_left',
  ACTIVITY_UPDATED: 'activity_updated',
  ACTIVITY_CANCELLED: 'activity_cancelled',
  ACTIVITY_DELETED: 'activity_deleted',
  ACTIVITY_FULL: 'activity_full',
  ACTIVITY_REMINDER: 'activity_reminder',
};

const GENDER_RESTRICTION = {
  NONE: 'none',
  MALE: 'male',
  FEMALE: 'female',
};

// Must stay in sync with TRANSPORT_OPTIONS in frontend/src/constants.js.
const TRANSPORT_METHODS = ['walk', 'transit', 'drive', 'rideshare', 'bike'];

// Must stay in sync with SCHOOL_YEARS, LANGUAGES, and SECURITY_QUESTIONS
// in frontend/src/constants.js.
const SCHOOL_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', "Master's", 'PhD', 'Other'];
const LANGUAGES = [
  'English', 'Spanish', 'Mandarin', 'Hindi', 'French',
  'Portuguese', 'Korean', 'Japanese', 'German', 'Other',
];
const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What is your favorite movie?',
  'What was the name of your elementary school?',
  'What is your favorite food?',
];

module.exports = {
  APPLICATION_STATUS,
  ACTIVITY_STATUS,
  GENDER_RESTRICTION,
  TRANSPORT_METHODS,
  SCHOOL_YEARS,
  LANGUAGES,
  SECURITY_QUESTIONS,
  NOTIFICATION_TYPE,
};