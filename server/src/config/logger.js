const winston = require('winston');

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        consoleFormat
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Stream for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Log with context
logger.logWithContext = (level, message, context = {}) => {
  logger.log(level, message, {
    ...context,
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
};

// Audit logger
logger.audit = (action, user, details = {}) => {
  logger.info('AUDIT', {
    action,
    user: user?._id || user,
    email: user?.email,
    ...details,
    type: 'audit'
  });
};

// Performance logger
logger.performance = (operation, duration, metadata = {}) => {
  logger.info('PERFORMANCE', {
    operation,
    duration,
    ...metadata,
    type: 'performance'
  });
};

// Security logger
logger.security = (event, user, details = {}) => {
  logger.warn('SECURITY', {
    event,
    user: user?._id || user,
    email: user?.email,
    ...details,
    type: 'security'
  });
};

module.exports = logger;