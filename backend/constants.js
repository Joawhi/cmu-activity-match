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

module.exports = {
  APPLICATION_STATUS,
  ACTIVITY_STATUS,
  GENDER_RESTRICTION,
  TRANSPORT_METHODS,
  NOTIFICATION_TYPE,
};