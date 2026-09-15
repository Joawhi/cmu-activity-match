const rateLimit = require('express-rate-limit');

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://cmu-activity-match-alpha.vercel.app',
];

function corsOriginCheck(origin, callback) {
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    return callback(null, true);
  }
  callback(new Error('Not allowed by CORS'));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

module.exports = { corsOriginCheck, apiLimiter, loginLimiter };