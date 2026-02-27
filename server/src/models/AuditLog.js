const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'CHECK_IN',
      'CHECK_OUT',
      'BREAK_START',
      'BREAK_END',
      'APPLY_LEAVE',
      'APPROVE_LEAVE',
      'REJECT_LEAVE',
      'CALCULATE_PAYROLL',
      'GENERATE_SALARY_SLIP',
      'LOCK_PAYROLL',
      'ADD_SIGNATURE',
      'VERIFY_SIGNATURE',
      'UPDATE_SETTINGS',
      'CREATE_EMPLOYEE',
      'UPDATE_EMPLOYEE',
      'DELETE_EMPLOYEE',
      'UNAUTHORIZED_DEVICE_ATTEMPT',
      'PASSWORD_CHANGE',
      'PROFILE_UPDATE'
    ]
  },
  ipAddress: {
    type: String,
    required: true
  },
  deviceId: String,
  userAgent: String,
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index for automatic deletion after 1 year
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    user: userId,
    timestamp: { $gte: cutoffDate }
  }).sort({ timestamp: -1 });
};

// Static method to get system activity summary
auditLogSchema.statics.getActivitySummary = async function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const summary = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': -1, count: -1 }
    }
  ]);
  
  return summary;
};

// Static method to get unique IPs for a user
auditLogSchema.statics.getUserIPs = async function(userId) {
  return this.distinct('ipAddress', { user: userId });
};

// Method to create audit log entry
auditLogSchema.statics.createLog = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;