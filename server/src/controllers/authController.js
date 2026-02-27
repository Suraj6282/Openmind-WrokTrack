const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { promisify } = require('util');
const crypto = require('crypto');
const sendEmail = require('../services/emailService');

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Create and send token response
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Register new user
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, name, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400));
  }

  // Create user
  const user = await User.create({
    email,
    password,
    name,
    phone,
    role: 'employee'
  });

  // Generate employee ID
  user.employeeId = `EMP${String(user._id).slice(-6).toUpperCase()}`;
  await user.save();

  // Create audit log
  await AuditLog.create({
    user: user._id,
    action: 'REGISTER',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success'
  });

  // Send welcome email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Welcome to OpenMind WorkTrack',
      message: `Hello ${user.name},\n\nWelcome to OpenMind WorkTrack. Your account has been created successfully.\n\nYour Employee ID: ${user.employeeId}\n\nPlease login to complete your profile.`
    });
  } catch (error) {
    console.error('Welcome email failed:', error);
  }

  createSendToken(user, 201, req, res);
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password, deviceId } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    // Create audit log for failed attempt
    await AuditLog.create({
      user: user?._id,
      action: 'LOGIN_FAILED',
      ipAddress: req.ip,
      deviceId,
      userAgent: req.get('user-agent'),
      status: 'failure'
    });

    return next(new AppError('Incorrect email or password', 401));
  }

  // Check if account is locked
  if (user.isLocked()) {
    return next(new AppError('Account is locked. Please try again later.', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact admin.', 401));
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  
  // Update last login
  user.lastLogin = new Date();
  user.lastLoginIP = req.ip;
  
  // Register device if not already registered
  if (deviceId && !user.deviceId) {
    user.deviceId = deviceId;
  } else if (deviceId && user.deviceId && user.deviceId !== deviceId) {
    // Log unauthorized device attempt
    await AuditLog.create({
      user: user._id,
      action: 'UNAUTHORIZED_DEVICE_ATTEMPT',
      ipAddress: req.ip,
      deviceId,
      userAgent: req.get('user-agent'),
      status: 'failure',
      details: { expectedDeviceId: user.deviceId }
    });
    
    return next(new AppError('Unauthorized device. Please use your registered device.', 401));
  }

  await user.save();

  // Create audit log
  await AuditLog.create({
    user: user._id,
    action: 'LOGIN',
    ipAddress: req.ip,
    deviceId,
    userAgent: req.get('user-agent'),
    status: 'success'
  });

  // Create notification
  await Notification.create({
    user: user._id,
    type: 'info',
    title: 'New Login',
    message: `New login detected from ${req.ip}`,
    priority: 'low'
  });

  createSendToken(user, 200, req, res);
});

// Logout user
exports.logout = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // Add token to blacklist (implement with Redis)
    // await redisClient.set(`blacklist:${token}`, 'true', 'EX', 86400);
  }

  // Create audit log
  if (req.user) {
    await AuditLog.create({
      user: req.user._id,
      action: 'LOGOUT',
      ipAddress: req.ip,
      deviceId: req.body.deviceId,
      userAgent: req.get('user-agent'),
      status: 'success'
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('department')
    .populate('shift');

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Create audit log
  await AuditLog.create({
    user: user._id,
    action: 'PASSWORD_CHANGE',
    ipAddress: req.ip,
    deviceId: req.body.deviceId,
    userAgent: req.get('user-agent'),
    status: 'success'
  });

  createSendToken(user, 200, req, res);
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // Send email
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `Hello ${user.name},\n\nYou requested a password reset. Please click the link below to reset your password:\n\n${resetURL}\n\nThis link will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return next(new AppError('Error sending email. Please try again later.', 500));
  }
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Create audit log
  await AuditLog.create({
    user: user._id,
    action: 'PASSWORD_RESET',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success'
  });

  createSendToken(user, 200, req, res);
});

// Verify email
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully'
  });
});

// Refresh token
exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Please provide refresh token', 400));
  }

  try {
    const decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const newToken = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token: newToken
    });
  } catch (error) {
    return next(new AppError('Invalid refresh token', 401));
  }
});