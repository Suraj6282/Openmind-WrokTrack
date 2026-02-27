const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee',
    index: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  position: String,
  basicSalary: {
    type: Number,
    min: 0
  },
  avatar: String,
  
  // Device management
  deviceId: {
    type: String,
    unique: true,
    sparse: true
  },
  deviceRegisteredAt: Date,
  trustedDevices: [{
    deviceId: String,
    deviceName: String,
    trustedAt: Date,
    lastUsed: Date,
    userAgent: String
  }],
  deviceActivity: [{
    deviceId: String,
    timestamp: Date,
    action: String,
    ipAddress: String,
    userAgent: String
  }],
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  backupCodes: [String],
  
  // Account status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Login tracking
  lastLogin: Date,
  lastLoginIP: String,
  loginHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    success: Boolean
  }],
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Password management
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'light' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' }
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for employee profile
userSchema.virtual('profile', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'trustedDevices.deviceId': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = Date.now() - 1000;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password changed after JWT issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 }; // Lock for 1 hour
  }
  
  return this.updateOne(updates);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Add login history
userSchema.methods.addLoginHistory = function(ipAddress, userAgent, deviceId, success) {
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    deviceId,
    success
  });
  
  // Keep only last 50 entries
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
};

// Add trusted device
userSchema.methods.addTrustedDevice = function(deviceId, deviceName, userAgent) {
  const existing = this.trustedDevices.find(d => d.deviceId === deviceId);
  
  if (existing) {
    existing.lastUsed = new Date();
  } else {
    this.trustedDevices.push({
      deviceId,
      deviceName,
      trustedAt: new Date(),
      lastUsed: new Date(),
      userAgent
    });
  }
  
  // Keep only last 10 devices
  if (this.trustedDevices.length > 10) {
    this.trustedDevices = this.trustedDevices.slice(-10);
  }
};

// Remove trusted device
userSchema.methods.removeTrustedDevice = function(deviceId) {
  this.trustedDevices = this.trustedDevices.filter(d => d.deviceId !== deviceId);
};

// Generate backup codes for 2FA
userSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  this.backupCodes = codes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );
  return codes;
};

// Verify backup code
userSchema.methods.verifyBackupCode = function(code) {
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
  const index = this.backupCodes.indexOf(hashedCode);
  if (index > -1) {
    this.backupCodes.splice(index, 1);
    return true;
  }
  return false;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to get active employees count
userSchema.statics.getActiveEmployeesCount = async function() {
  return this.countDocuments({ role: 'employee', isActive: true });
};

const User = mongoose.model('User', userSchema);
module.exports = User; 