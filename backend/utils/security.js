const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

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

// A CMU classroom shares one public IP, and open tabs keep polling.
// This cap fits that burst. Password guessing is limited separately below.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const loginWindowMs = 15 * 60 * 1000;
const loginMessage = { error: 'Too many login attempts. Please try again later.' };

function accountKey(req) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (email) return `email:${email}`;
  return ipKeyGenerator(req.ip);
}

// Successful sign-ins do not spend the budget, so a class can register together.
// Failures still count, per IP and per email.
const loginIpLimiter = rateLimit({
  windowMs: loginWindowMs,
  max: 120,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: loginMessage,
});

const loginAccountLimiter = rateLimit({
  windowMs: loginWindowMs,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: accountKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: loginMessage,
});

module.exports = { corsOriginCheck, apiLimiter, loginIpLimiter, loginAccountLimiter };