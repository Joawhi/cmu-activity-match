const APPLICATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
};

const GENDER_RESTRICTION = {
  NONE: 'none',
  MALE: 'male',
  FEMALE: 'female',
};

// Must stay in sync with TRANSPORT_OPTIONS in frontend/src/constants.js.
const TRANSPORT_METHODS = ['walk', 'transit', 'drive', 'rideshare', 'bike'];

module.exports = { APPLICATION_STATUS, GENDER_RESTRICTION, TRANSPORT_METHODS };