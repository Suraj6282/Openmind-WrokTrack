const Leave = require('../models/Leave');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { startOfDay, endOfDay, differenceInDays, addDays } = require('date-fns');

// Apply for leave
exports.applyLeave = catchAsync(async (req, res, next) => {
  const { type, startDate, endDate, reason, halfDay } = req.body;
  const employeeId = req.user.id;

  // Calculate number of days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = differenceInDays(end, start) + 1;

  // Validate dates
  if (end < start) {
    return next(new AppError('End date must be after start date', 400));
  }

  // Check for overlapping leaves
  const overlapping = await Leave.findOne({
    employee: employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      {
        startDate: { $lte: end },
        endDate: { $gte: start }
      }
    ]
  });

  if (overlapping) {
    return next(new AppError('You already have a leave application for this period', 400));
  }

  // Check leave balance
  const user = await User.findById(employeeId);
  const currentYear = new Date().getFullYear();
  
  const usedLeaves = await Leave.aggregate([
    {
      $match: {
        employee: employeeId,
        type,
        status: 'approved',
        startDate: {
          $gte: new Date(currentYear, 0, 1),
          $lte: new Date(currentYear, 11, 31)
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$days' }
      }
    }
  ]);

  const used = usedLeaves[0]?.total || 0;
  const totalAllowed = type === 'paid' ? 12 : type === 'sick' ? 6 : Infinity;

  if (used + days > totalAllowed) {
    return next(new AppError(`Insufficient ${type} leave balance`, 400));
  }

  // Create leave application
  const leave = await Leave.create({
    employee: employeeId,
    type,
    startDate: start,
    endDate: end,
    days,
    reason,
    halfDay: halfDay || false,
    status: 'pending'
  });

  // Notify admins
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await Notification.create({
      user: admin._id,
      type: 'leave',
      title: 'New Leave Application',
      message: `${req.user.name} has applied for ${days} days ${type} leave`,
      data: { leaveId: leave._id },
      priority: 'medium'
    });
  }

  // Create audit log
  await AuditLog.create({
    user: employeeId,
    action: 'APPLY_LEAVE',
    ipAddress: req.ip,
    details: { leaveId: leave._id, type, days }
  });

  res.status(201).json({
    status: 'success',
    data: { leave }
  });
});

// Get leave balance
exports.getLeaveBalance = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const currentYear = new Date().getFullYear();

  const usedLeaves = await Leave.aggregate([
    {
      $match: {
        employee: employeeId,
        status: 'approved',
        startDate: {
          $gte: new Date(currentYear, 0, 1),
          $lte: new Date(currentYear, 11, 31)
        }
      }
    },
    {
      $group: {
        _id: '$type',
        used: { $sum: '$days' }
      }
    }
  ]);

  const balance = {
    paid: { total: 12, used: 0, remaining: 12 },
    sick: { total: 6, used: 0, remaining: 6 },
    unpaid: { total: Infinity, used: 0, remaining: Infinity }
  };

  usedLeaves.forEach(item => {
    if (balance[item._id]) {
      balance[item._id].used = item.used;
      balance[item._id].remaining = balance[item._id].total - item.used;
    }
  });

  res.status(200).json({
    status: 'success',
    data: balance
  });
});

// Get leave history
exports.getLeaveHistory = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const { year } = req.query;

  const query = { employee: employeeId };
  
  if (year) {
    query.startDate = {
      $gte: new Date(year, 0, 1),
      $lte: new Date(year, 11, 31)
    };
  }

  const leaves = await Leave.find(query)
    .populate('approvedBy', 'name')
    .sort({ startDate: -1 });

  res.status(200).json({
    status: 'success',
    results: leaves.length,
    data: { leaves }
  });
});

// Get my leaves
exports.getMyLeaves = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const { status } = req.query;

  const query = { employee: employeeId };
  if (status) query.status = status;

  const leaves = await Leave.find(query)
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { leaves }
  });
});

// Admin: Get pending leaves
exports.getPendingLeaves = catchAsync(async (req, res, next) => {
  const leaves = await Leave.find({ status: 'pending' })
    .populate('employee', 'name email employeeId department')
    .sort({ createdAt: 1 });

  res.status(200).json({
    status: 'success',
    results: leaves.length,
    data: { leaves }
  });
});

// Admin: Approve leave
exports.approveLeave = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const leave = await Leave.findById(id).populate('employee');
  if (!leave) {
    return next(new AppError('Leave application not found', 404));
  }

  if (leave.status !== 'pending') {
    return next(new AppError('Leave application already processed', 400));
  }

  leave.status = 'approved';
  leave.approvedBy = adminId;
  leave.approvedAt = new Date();
  await leave.save();

  // Notify employee
  await Notification.create({
    user: leave.employee._id,
    type: 'leave',
    title: 'Leave Approved',
    message: `Your leave application for ${leave.days} days has been approved`,
    data: { leaveId: leave._id },
    priority: 'high'
  });

  // Create audit log
  await AuditLog.create({
    user: adminId,
    action: 'APPROVE_LEAVE',
    ipAddress: req.ip,
    details: { leaveId: id, employee: leave.employee.email }
  });

  res.status(200).json({
    status: 'success',
    data: { leave }
  });
});

// Admin: Reject leave
exports.rejectLeave = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  const leave = await Leave.findById(id).populate('employee');
  if (!leave) {
    return next(new AppError('Leave application not found', 404));
  }

  if (leave.status !== 'pending') {
    return next(new AppError('Leave application already processed', 400));
  }

  leave.status = 'rejected';
  leave.rejectionReason = reason;
  leave.approvedBy = adminId;
  leave.approvedAt = new Date();
  await leave.save();

  // Notify employee
  await Notification.create({
    user: leave.employee._id,
    type: 'leave',
    title: 'Leave Rejected',
    message: `Your leave application has been rejected${reason ? ': ' + reason : ''}`,
    data: { leaveId: leave._id },
    priority: 'high'
  });

  // Create audit log
  await AuditLog.create({
    user: adminId,
    action: 'REJECT_LEAVE',
    ipAddress: req.ip,
    details: { leaveId: id, employee: leave.employee.email, reason }
  });

  res.status(200).json({
    status: 'success',
    data: { leave }
  });
});

// Admin: Get all leaves
exports.getAllLeaves = catchAsync(async (req, res, next) => {
  const { status, startDate, endDate, department } = req.query;

  const query = {};
  
  if (status) query.status = status;
  
  if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate) };
    query.endDate = { $lte: new Date(endDate) };
  }

  let leaves = await Leave.find(query)
    .populate({
      path: 'employee',
      select: 'name email employeeId department',
      populate: { path: 'department', select: 'name' }
    })
    .sort({ createdAt: -1 });

  // Filter by department if specified
  if (department) {
    leaves = leaves.filter(l => l.employee.department?._id.toString() === department);
  }

  // Calculate statistics
  const stats = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    totalDays: leaves.reduce((sum, l) => sum + l.days, 0)
  };

  res.status(200).json({
    status: 'success',
    data: {
      leaves,
      stats
    }
  });
});

// Cancel leave
exports.cancelLeave = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const leave = await Leave.findOne({ _id: id, employee: userId });
  if (!leave) {
    return next(new AppError('Leave application not found', 404));
  }

  if (leave.status !== 'pending') {
    return next(new AppError('Cannot cancel leave that is already processed', 400));
  }

  leave.status = 'cancelled';
  await leave.save();

  // Create audit log
  await AuditLog.create({
    user: userId,
    action: 'CANCEL_LEAVE',
    ipAddress: req.ip,
    details: { leaveId: id }
  });

  res.status(200).json({
    status: 'success',
    data: { leave }
  });
});