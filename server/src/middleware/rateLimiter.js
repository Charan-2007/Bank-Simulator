import { rateLimit, MemoryStore, ipKeyGenerator } from 'express-rate-limit';
import { normalizeIndianPhone } from '../../../shared/phoneUtils.js';

const activeStores = [];

function createStore() {
  const store = new MemoryStore();
  activeStores.push(store);
  return store;
}

export function resetRateLimiters() {
  for (const store of activeStores) {
    if (typeof store.resetAll === 'function') {
      store.resetAll();
    }
  }
}

function rateLimitHandler(messageText) {
  return (req, res, next, options) => {
    const retryHeader = res.getHeader('Retry-After');
    const retryAfter = retryHeader ? parseInt(retryHeader, 10) : Math.ceil(options.windowMs / 1000);
    res.status(429).json({
      error: {
        message: `Too many attempts. Try again in ${retryAfter} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter
      }
    });
  };
}

export const generalLimiter = rateLimit({
  store: createStore(),
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many requests, please try again later.')
});

export const authLimiter = rateLimit({
  store: createStore(),
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const rawPhone = req.body?.phone || req.user?.phone;
    const phone = rawPhone ? normalizeIndianPhone(rawPhone) : null;
    return phone || ipKeyGenerator(req.ip);
  },
  handler: rateLimitHandler('Too many login or registration attempts. Please slow down.')
});

export const otpLimiter = rateLimit({
  store: createStore(),
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const rawPhone = req.body?.phone || req.user?.phone;
    const phone = rawPhone ? normalizeIndianPhone(rawPhone) : null;
    return `${req.baseUrl || ''}${req.path}:${phone || ipKeyGenerator(req.ip)}`;
  },
  handler: rateLimitHandler('Too many OTP attempts. Please wait.')
});

export const transferLimiter = rateLimit({
  store: createStore(),
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const rawPhone = req.user?.phone || req.body?.recipientPhone;
    const phone = rawPhone ? normalizeIndianPhone(rawPhone) : null;
    return phone || req.userId || ipKeyGenerator(req.ip);
  },
  handler: rateLimitHandler('Too many transfer attempts. Please slow down.')
});
