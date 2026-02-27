const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getDeviceFingerprint } = require('../utils/deviceFingerprint');

// Verify device binding
exports.verifyDevice = catchAsync(async (req, res, next) => {
  const { deviceId } = req.body;
  const userId = req.user.id;

  if (!deviceId) {
    return next(new AppError('Device ID is required', 400));
  }

  // Get user
  const user = await User.findById(userId);

  // If device is not registered, register it
  if (!user.deviceId) {
    user.deviceId = deviceId;
    user.deviceRegisteredAt = new Date();
    await user.save();

    // Log device registration
    await AuditLog.create({
      user: userId,
      action: 'DEVICE_REGISTERED',
      ipAddress: req.ip,
      deviceId,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    return next();
  }

  // Check if device matches
  if (user.deviceId !== deviceId) {
    // Log unauthorized device attempt
    await AuditLog.create({
      user: userId,
      action: 'UNAUTHORIZED_DEVICE_ATTEMPT',
      ipAddress: req.ip,
      deviceId,
      userAgent: req.get('user-agent'),
      status: 'failure',
      details: { expectedDeviceId: user.deviceId }
    });

    return next(new AppError('Unauthorized device. Please use your registered device.', 401));
  }

  next();
});

// Optional device check (doesn't error)
exports.optionalDeviceCheck = catchAsync(async (req, res, next) => {
  const { deviceId } = req.body;
  
  if (deviceId && req.user) {
    const user = await User.findById(req.user.id);
    
    if (!user.deviceId) {
      user.deviceId = deviceId;
      user.deviceRegisteredAt = new Date();
      await user.save();
    }
  }
  
  next();
});

// Get device fingerprint from request
exports.getDeviceInfo = (req) => {
  const deviceId = req.body.deviceId || req.headers['device-id'];
  const userAgent = req.get('user-agent');
  const ip = req.ip;
  
  return {
    deviceId,
    userAgent,
    ip,
    fingerprint: getDeviceFingerprint(userAgent, ip)
  };
};

// Check if device is trusted
exports.isDeviceTrusted = catchAsync(async (req, res, next) => {
  const { deviceId } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  
  if (!user.trustedDevices) {
    user.trustedDevices = [];
  }

  const isTrusted = user.trustedDevices.some(d => d.deviceId === deviceId);

  if (!isTrusted && user.deviceId !== deviceId) {
    // Send verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code (implement with Redis)
    // await redisClient.setex(`verify:${userId}:${deviceId}`, 300, verificationCode);
    
    // Send verification email/SMS
    // await sendVerificationCode(user.email, verificationCode);

    return res.status(403).json({
      status: 'fail',
      message: 'Device not trusted. Verification code sent.',
      requiresVerification: true
    });
  }

  next();
});

// Verify device with code
exports.verifyDeviceCode = catchAsync(async (req, res, next) => {
  const { deviceId, code } = req.body;
  const userId = req.user.id;

  // Verify code (implement with Redis)
  // const storedCode = await redisClient.get(`verify:${userId}:${deviceId}`);
  
  // if (storedCode !== code) {
  //   return next(new AppError('Invalid verification code', 400));
  // }

  // Add to trusted devices
  await User.findByIdAndUpdate(userId, {
    $push: {
      trustedDevices: {
        deviceId,
        trustedAt: new Date(),
        userAgent: req.get('user-agent')
      }
    }
  });

  // Delete verification code
  // await redisClient.del(`verify:${userId}:${deviceId}`);

  next();
});

// Log device activity
exports.logDeviceActivity = catchAsync(async (req, res, next) => {
  const originalSend = res.json;
  
  res.json = function(data) {
    setImmediate(async () => {
      try {
        if (req.user && req.body.deviceId) {
          await User.findByIdAndUpdate(req.user.id, {
            $push: {
              deviceActivity: {
                deviceId: req.body.deviceId,
                timestamp: new Date(),
                action: req.method + ' ' + req.originalUrl,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
              }
            }
          });
        }
      } catch (error) {
        console.error('Device activity log error:', error);
      }
    });
    
    return originalSend.call(this, data);
  };
  
  next();
});