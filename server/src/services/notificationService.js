const Notification = require('../models/Notification');
const User = require('../models/User');
const { io } = require('../index');
const sendEmail = require('./emailService');

// Create notification
exports.createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    
    // Emit real-time notification
    if (io) {
      io.to(`user-${data.user}`).emit('notification', notification);
    }
    
    // Send email if enabled
    if (data.deliveryMethods.includes('email')) {
      const user = await User.findById(data.user);
      if (user) {
        await sendEmail({
          email: user.email,
          subject: data.title,
          html: data.message
        });
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    return null;
  }
};

// Create bulk notifications
exports.createBulkNotifications = async (users, notificationData) => {
  const notifications = [];
  
  for (const userId of users) {
    const notification = await exports.createNotification({
      user: userId,
      ...notificationData
    });
    notifications.push(notification);
  }
  
  return notifications;
};

// Send attendance reminder
exports.sendAttendanceReminder = async (userId) => {
  return exports.createNotification({
    user: userId,
    type: 'attendance',
    title: 'Attendance Reminder',
    message: 'Don\'t forget to mark your attendance today',
    priority: 'medium',
    deliveryMethods: ['in-app', 'push']
  });
};

// Send leave notification
exports.sendLeaveNotification = async (leave, action) => {
  const messages = {
    applied: {
      title: 'Leave Application Submitted',
      message: `Your leave application for ${leave.days} days has been submitted`
    },
    approved: {
      title: 'Leave Approved',
      message: `Your leave application for ${leave.days} days has been approved`
    },
    rejected: {
      title: 'Leave Rejected',
      message: `Your leave application for ${leave.days} days has been rejected`
    }
  };

  return exports.createNotification({
    user: leave.employee,
    type: 'leave',
    title: messages[action].title,
    message: messages[action].message,
    data: { leaveId: leave._id },
    priority: 'high',
    deliveryMethods: ['in-app', 'email', 'push']
  });
};

// Send payroll notification
exports.sendPayrollNotification = async (payroll, action) => {
  const messages = {
    generated: {
      title: 'Payroll Generated',
      message: `Your payroll for ${payroll.month} ${payroll.year} has been generated`
    },
    locked: {
      title: 'Payroll Locked',
      message: `Your salary for ${payroll.month} ${payroll.year} has been locked`
    },
    paid: {
      title: 'Salary Credited',
      message: `Your salary for ${payroll.month} ${payroll.year} has been credited`
    }
  };

  return exports.createNotification({
    user: payroll.employee,
    type: 'payroll',
    title: messages[action].title,
    message: messages[action].message,
    data: { payrollId: payroll._id },
    priority: 'high',
    deliveryMethods: ['in-app', 'email', 'push']
  });
};

// Send signature notification
exports.sendSignatureNotification = async (signature, type) => {
  const messages = {
    employee: {
      title: 'Signature Required',
      message: 'Please sign your salary slip digitally'
    },
    admin: {
      title: 'Admin Signature Required',
      message: 'Please review and sign the salary slip'
    },
    completed: {
      title: 'Signatures Complete',
      message: 'All signatures have been added to the salary slip'
    }
  };

  return exports.createNotification({
    user: type === 'employee' ? signature.employee : signature.admin,
    type: 'signature',
    title: messages[type].title,
    message: messages[type].message,
    data: { signatureId: signature._id },
    priority: 'high',
    deliveryMethods: ['in-app', 'email']
  });
};

// Send system alert
exports.sendSystemAlert = async (message, level = 'warning') => {
  const admins = await User.find({ role: 'admin' });
  
  return exports.createBulkNotifications(
    admins.map(a => a._id),
    {
      type: 'system',
      title: `System ${level.charAt(0).toUpperCase() + level.slice(1)}`,
      message,
      priority: level === 'urgent' ? 'urgent' : 'high',
      deliveryMethods: ['in-app', 'email', 'push']
    }
  );
};

// Get user notifications
exports.getUserNotifications = async (userId, filters = {}) => {
  const query = { user: userId };
  
  if (filters.type) query.type = filters.type;
  if (filters.read !== undefined) query.read = filters.read;
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50);
  
  const unreadCount = await Notification.getUnreadCount(userId);
  
  return {
    notifications,
    unreadCount,
    total: notifications.length
  };
};

// Mark notification as read
exports.markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId
  });
  
  if (notification) {
    await notification.markAsRead();
  }
  
  return notification;
};

// Mark all as read
exports.markAllAsRead = async (userId) => {
  return Notification.markAllAsRead(userId);
};

// Delete notification
exports.deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({
    _id: notificationId,
    user: userId
  });
};

// Clean old notifications
exports.cleanOldNotifications = async () => {
  return Notification.cleanOldNotifications();
};