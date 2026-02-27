const AuditLog = require('../models/AuditLog');

// Log user action
exports.logAction = (action) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.json;
    
    // Override json function
    res.json = function(data) {
      // Log after response is sent
      setImmediate(async () => {
        try {
          if (req.user) {
            await AuditLog.create({
              user: req.user._id,
              action,
              ipAddress: req.ip,
              deviceId: req.body.deviceId || req.headers['device-id'],
              userAgent: req.get('user-agent'),
              status: res.statusCode < 400 ? 'success' : 'failure',
              details: {
                method: req.method,
                url: req.originalUrl,
                body: req.body,
                response: data
              }
            });
          }
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Log sensitive actions
exports.logSensitiveAction = (action) => {
  return async (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      setImmediate(async () => {
        try {
          if (req.user) {
            await AuditLog.create({
              user: req.user._id,
              action,
              ipAddress: req.ip,
              deviceId: req.body.deviceId || req.headers['device-id'],
              userAgent: req.get('user-agent'),
              status: res.statusCode < 400 ? 'success' : 'failure',
              details: {
                method: req.method,
                url: req.originalUrl,
                params: req.params,
                query: req.query
                // Don't log body for sensitive actions
              }
            });
          }
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};