const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'info',
      'success',
      'warning',
      'error',
      'attendance',
      'leave',
      'payroll',
      'signature',
      'system'
    ],
    default: 'info'
  },
  title: {
    type: String,
    required: [true, 'Notification title is required']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required']
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  link: String,
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  action: {
    type: {
      type: String,
      enum: ['view', 'approve', 'reject', 'download', 'none']
    },
    url: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: Date,
  delivered: {
    type: Boolean,
    default: false
  },
  deliveryMethods: [{
    type: String,
    enum: ['in-app', 'email', 'sms', 'push'],
    default: ['in-app']
  }]
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Mark as delivered
notificationSchema.methods.markAsDelivered = async function() {
  this.delivered = true;
  await this.save();
  return this;
};

// Static method to create system notification
notificationSchema.statics.createSystemNotification = async function(userId, title, message, data = {}) {
  return this.create({
    user: userId,
    type: 'system',
    title,
    message,
    data,
    priority: 'medium'
  });
};

// Static method to create bulk notifications
notificationSchema.statics.createBulk = async function(users, notificationData) {
  const notifications = users.map(userId => ({
    user: userId,
    ...notificationData
  }));
  
  return this.insertMany(notifications);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    user: userId,
    read: false
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { 
      $set: { 
        read: true, 
        readAt: new Date() 
      }
    }
  );
};

// Static method to clean old notifications
notificationSchema.statics.cleanOldNotifications = async function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    read: true
  });
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;