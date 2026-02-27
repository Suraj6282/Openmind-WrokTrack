const Signature = require('../models/Signature');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

// Save signature
exports.saveSignature = catchAsync(async (req, res, next) => {
  const { employeeId, payrollId, signature, type, deviceId, ipAddress, location } = req.body;
  const userId = req.user.id;

  // Verify authorization
  if (type === 'employee' && userId !== employeeId) {
    return next(new AppError('You can only sign your own salary slip', 403));
  }

  // Check if payroll exists
  const payroll = await Payroll.findById(payrollId);
  if (!payroll) {
    return next(new AppError('Payroll not found', 404));
  }

  if (payroll.isLocked) {
    return next(new AppError('Payroll is locked, cannot add signature', 400));
  }

  // Check if signature already exists
  const existingSignature = await Signature.findOne({
    user: type === 'employee' ? employeeId : userId,
    payroll: payrollId,
    type
  });

  if (existingSignature) {
    return next(new AppError('Signature already exists for this payroll', 400));
  }

  // Generate hash
  const hash = crypto
    .createHash('sha256')
    .update(signature + employeeId + payrollId + Date.now())
    .digest('hex');

  // Create signature
  const newSignature = await Signature.create({
    user: type === 'employee' ? employeeId : userId,
    payroll: payrollId,
    type,
    image: signature,
    hash,
    deviceId,
    ipAddress,
    location,
    userAgent: req.get('user-agent')
  });

  // Update payroll with signature
  if (type === 'employee') {
    payroll.salarySlip.employeeSignature = newSignature._id;
  } else {
    payroll.salarySlip.adminSignature = newSignature._id;
  }
  payroll.salarySlip.signedAt = new Date();
  await payroll.save();

  // Notify relevant parties
  if (type === 'employee') {
    // Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        type: 'signature',
        title: 'Employee Signature Added',
        message: `Employee has signed salary slip for ${payroll.month}/${payroll.year}`,
        data: { payrollId: payroll._id },
        priority: 'medium'
      });
    }
  } else {
    // Notify employee
    await Notification.create({
      user: payroll.employee,
      type: 'signature',
      title: 'Admin Signature Added',
      message: `Admin has signed your salary slip for ${payroll.month}/${payroll.year}`,
      data: { payrollId: payroll._id },
      priority: 'high'
    });
  }

  // Create audit log
  await AuditLog.create({
    user: userId,
    action: 'ADD_SIGNATURE',
    ipAddress: req.ip,
    deviceId,
    details: { 
      signatureId: newSignature._id,
      payrollId,
      type 
    }
  });

  res.status(201).json({
    status: 'success',
    data: { signature: newSignature }
  });
});

// Get signature by ID
exports.getSignature = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const signature = await Signature.findById(id)
    .populate('user', 'name email')
    .populate('payroll', 'month year')
    .populate('verifiedBy', 'name');

  if (!signature) {
    return next(new AppError('Signature not found', 404));
  }

  // Check authorization
  if (req.user.role !== 'admin' && signature.user._id.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to view this signature', 403));
  }

  res.status(200).json({
    status: 'success',
    data: { signature }
  });
});

// Get user signatures
exports.getUserSignatures = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  // Check authorization
  if (req.user.role !== 'admin' && req.user.id !== userId) {
    return next(new AppError('You are not authorized to view these signatures', 403));
  }

  const signatures = await Signature.find({ user: userId })
    .populate('payroll', 'month year')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { signatures }
  });
});

// Verify signature
exports.verifySignature = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const signature = await Signature.findById(id);
  if (!signature) {
    return next(new AppError('Signature not found', 404));
  }

  // Verify integrity
  const isValid = signature.verifyIntegrity();

  res.status(200).json({
    status: 'success',
    data: {
      verified: isValid,
      signature
    }
  });
});

// Get payroll signatures
exports.getPayrollSignatures = catchAsync(async (req, res, next) => {
  const { payrollId } = req.params;

  const signatures = await Signature.find({ payroll: payrollId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { signatures }
  });
});

// Manual verify (admin only)
exports.manualVerify = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const signature = await Signature.findById(id);
  if (!signature) {
    return next(new AppError('Signature not found', 404));
  }

  await signature.verify(adminId, 'manual');

  // Create audit log
  await AuditLog.create({
    user: adminId,
    action: 'VERIFY_SIGNATURE',
    ipAddress: req.ip,
    details: { signatureId: id }
  });

  res.status(200).json({
    status: 'success',
    data: { signature }
  });
});