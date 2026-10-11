import rateLimit from 'express-rate-limit';

// Strict limiter for authentication attempts (prevents credential brute-forcing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
});

// Verification queries rate limiter (permits rapid lookups while deterring scraping)
export const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 lookups per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Verification query rate limit reached. Please wait a moment before submitting more queries.',
  },
});

// General application API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'General API rate limit exceeded. Please throttle requests.',
  },
});
