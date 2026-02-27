const rateLimit = require('express-rate-limit');

// Using memory store for rate limiting (simple and works without Redis)
// For production, consider using Redis by uncommenting the code below

// General API limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (relaxed for development)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' // Skip in development
});

// Auth routes limiter (stricter)
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 login attempts per hour (relaxed for development)
  message: 'Too many login attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' // Skip in development
});

// Attendance routes limiter
exports.attendanceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 attendance requests per minute
  message: 'Too many attendance requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false
});

// Payroll routes limiter
exports.payrollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 payroll requests per hour
  message: 'Too many payroll requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Create custom limiter
exports.createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false
  });
};