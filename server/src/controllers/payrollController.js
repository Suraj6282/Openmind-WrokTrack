const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const CompanySettings = require('../models/CompanySettings');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const Signature = require('../models/Signature');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const SalaryCalculationService = require('../services/salaryCalculationService');
const PDFService = require('../services/pdfService');
const { startOfMonth, endOfMonth, eachDayOfInterval } = require('date-fns');

// Calculate monthly payroll
exports.calculateMonthlyPayroll = catchAsync(async (req, res, next) => {
  const { month, year } = req.body;
  const adminId = req.user.id;

  // Validate month and year
  if (month < 1 || month > 12) {
    return next(new AppError('Invalid month', 400));
  }

  // Get all active employees
  const employees = await User.find({ 
    role: 'employee', 
    isActive: true 
  }).populate('department shift');

  const results = [];
  const errors = [];

  // Get company settings
  const settings = await CompanySettings.findOne();
  if (!settings) {
    return next(new AppError('Company settings not found', 404));
  }

  for (const employee of employees) {
    try {
      // Check if payroll already exists
      const existingPayroll = await Payroll.findOne({
        employee: employee._id,
        month,
        year
      });

      if (existingPayroll && existingPayroll.status !== 'draft') {
        errors.push(`${employee.name}: Payroll already ${existingPayroll.status}`);
        continue;
      }

      // Calculate salary
      const salaryData = await SalaryCalculationService.calculateMonthlySalary(
        employee._id,
        month,
        year,
        settings
      );

      // Create or update payroll
      let payroll;
      if (existingPayroll) {
        payroll = await Payroll.findByIdAndUpdate(
          existingPayroll._id,
          salaryData,
          { new: true }
        );
      } else {
        payroll = await Payroll.create(salaryData);
      }

      results.push({
        employee: employee.name,
        payrollId: payroll._id,
        netPayable: payroll.netPayable
      });

    } catch (error) {
      errors.push(`${employee.name}: ${error.message}`);
    }
  }

  // Create audit log
  await AuditLog.create({
    user: adminId,
    action: 'CALCULATE_PAYROLL',
    ipAddress: req.ip,
    details: { 
      month, 
      year, 
      totalProcessed: results.length,
      totalErrors: errors.length,
      errors 
    }
  });

  // Notify employees
  for (const result of results) {
    await Notification.create({
      user: result.employeeId,
      type: 'payroll',
      title: 'Payroll Generated',
      message: `Your payroll for ${month}/${year} has been generated`,
      priority: 'medium'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      results,
      errors,
      summary: {
        totalProcessed: results.length,
        totalErrors: errors.length,
        totalPayroll: results.reduce((sum, r) => sum + r.netPayable, 0)
      }
    }
  });
});

// Get payroll history
exports.getPayrollHistory = catchAsync(async (req, res, next) => {
  const employeeId = req.user.role === 'admin' && req.params.employeeId 
    ? req.params.employeeId 
    : req.user.id;

  const { year, month, status } = req.query;

  const query = { employee: employeeId };
  
  if (year) query.year = parseInt(year);
  if (month) query.month = parseInt(month);
  if (status) query.status = status;

  const payrolls = await Payroll.find(query)
    .populate('employee', 'name email employeeId department')
    .sort({ year: -1, month: -1 });

  res.status(200).json({
    status: 'success',
    results: payrolls.length,
    data: { payrolls }
  });
});

// Generate salary slip
exports.generateSalarySlip = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const payroll = await Payroll.findById(id)
    .populate('employee', 'name email employeeId department position panNumber')
    .populate('salarySlip.employeeSignature')
    .populate('salarySlip.adminSignature');

  if (!payroll) {
    return next(new AppError('Payroll not found', 404));
  }

  // Get company settings for company details
  const settings = await CompanySettings.findOne();

  // Generate PDF
  const pdfBuffer = await PDFService.generateSalarySlipPDF(
    payroll,
    payroll.employee,
    settings
  );

  // If salary slip already generated, return PDF
  if (payroll.salarySlip.generated) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${payroll.employee.employeeId}-${payroll.month}-${payroll.year}.pdf`);
    return res.send(pdfBuffer);
  }

  // Mark as generated
  payroll.salarySlip.generated = true;
  payroll.salarySlip.generatedAt = new Date();
  payroll.salarySlip.url = `/uploads/salary-slips/${payroll._id}.pdf`;
  await payroll.save();

  // Create audit log
  await AuditLog.create({
    user: userId,
    action: 'GENERATE_SALARY_SLIP',
    ipAddress: req.ip,
    details: { payrollId: id }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${payroll.employee.employeeId}-${payroll.month}-${payroll.year}.pdf`);
  res.send(pdfBuffer);
});

// Get salary slip by ID
exports.getSalarySlipById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const payroll = await Payroll.findById(id)
    .populate('employee', 'name email employeeId department position panNumber aadharNumber bankName bankAccount ifscCode')
    .populate('salarySlip.employeeSignature')
    .populate('salarySlip.adminSignature');

  if (!payroll) {
    return next(new AppError('Salary slip not found', 404));
  }

  // Check authorization
  if (req.user.role !== 'admin' && payroll.employee._id.toString() !== userId) {
    return next(new AppError('You are not authorized to view this salary slip', 403));
  }

  res.status(200).json({
    status: 'success',
    data: { payroll }
  });
});

// Get all salary slips for user
exports.getSalarySlips = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const payrolls = await Payroll.find({ employee: userId })
    .populate('employee', 'name employeeId')
    .populate('salarySlip.employeeSignature')
    .populate('salarySlip.adminSignature')
    .sort({ year: -1, month: -1 });

  res.status(200).json({
    status: 'success',
    data: { payrolls }
  });
});

// Lock payroll
exports.lockPayroll = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const payroll = await Payroll.findById(id);
  if (!payroll) {
    return next(new AppError('Payroll not found', 404));
  }

  if (payroll.isLocked) {
    return next(new AppError('Payroll is already locked', 400));
  }

  // Check if both signatures are present
  if (!payroll.salarySlip.employeeSignature || !payroll.salarySlip.adminSignature) {
    return next(new AppError('Both signatures are required before locking', 400));
  }

  payroll.isLocked = true;
  payroll.lockedAt = new Date();
  payroll.lockedBy = adminId;
  payroll.status = 'locked';

  payroll.auditTrail.push({
    action: 'LOCK_PAYROLL',
    performedBy: adminId,
    timestamp: new Date(),
    ipAddress: req.ip
  });

  await payroll.save();

  // Notify employee
  await Notification.create({
    user: payroll.employee,
    type: 'payroll',
    title: 'Payroll Locked',
    message: `Your salary for ${payroll.month}/${payroll.year} has been locked`,
    priority: 'high'
  });

  // Create audit log
  await AuditLog.create({
    user: adminId,
    action: 'LOCK_PAYROLL',
    ipAddress: req.ip,
    details: { payrollId: id }
  });

  res.status(200).json({
    status: 'success',
    data: { payroll }
  });
});

// Add signature to payroll
exports.addSignature = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { signatureId, type } = req.body;
  const userId = req.user.id;

  const payroll = await Payroll.findById(id);
  if (!payroll) {
    return next(new AppError('Payroll not found', 404));
  }

  if (payroll.isLocked) {
    return next(new AppError('Payroll is locked, cannot add signature', 400));
  }

  const signature = await Signature.findById(signatureId);
  if (!signature) {
    return next(new AppError('Signature not found', 404));
  }

  // Verify signature belongs to correct user
  if (type === 'employee' && signature.user.toString() !== payroll.employee.toString()) {
    return next(new AppError('Invalid employee signature', 400));
  }

  if (type === 'employee') {
    payroll.salarySlip.employeeSignature = signatureId;
  } else {
    payroll.salarySlip.adminSignature = signatureId;
  }

  payroll.salarySlip.signedAt = new Date();

  payroll.auditTrail.push({
    action: 'ADD_SIGNATURE',
    performedBy: userId,
    timestamp: new Date(),
    ipAddress: req.ip,
    details: { signatureType: type }
  });

  await payroll.save();

  res.status(200).json({
    status: 'success',
    data: { payroll }
  });
});

// Admin: Approve payroll
exports.approvePayroll = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const payroll = await Payroll.findById(id);
  if (!payroll) {
    return next(new AppError('Payroll not found', 404));
  }

  if (payroll.status !== 'calculated') {
    return next(new AppError('Payroll must be in calculated state to approve', 400));
  }

  payroll.status = 'approved';
  payroll.approvedAt = new Date();
  payroll.approvedBy = adminId;

  payroll.auditTrail.push({
    action: 'APPROVE_PAYROLL',
    performedBy: adminId,
    timestamp: new Date(),
    ipAddress: req.ip
  });

  await payroll.save();

  // Create audit log
  await AuditLog.create({
    user: adminId,
    action: 'APPROVE_PAYROLL',
    ipAddress: req.ip,
    details: { payrollId: id }
  });

  res.status(200).json({
    status: 'success',
    data: { payroll }
  });
});

// Admin: Get monthly payrolls
exports.getMonthlyPayrolls = catchAsync(async (req, res, next) => {
  const { year, month } = req.params;

  const payrolls = await Payroll.find({ 
    year: parseInt(year), 
    month: parseInt(month) 
  })
  .populate('employee', 'name email employeeId department')
  .sort({ 'employee.name': 1 });

  // Calculate totals
  const totals = payrolls.reduce((acc, p) => ({
    totalGross: acc.totalGross + (p.grossPay || 0),
    totalDeductions: acc.totalDeductions + (p.deductions?.total || 0),
    totalNet: acc.totalNet + (p.netPayable || 0),
    totalOvertime: acc.totalOvertime + (p.overtime?.hours || 0)
  }), { totalGross: 0, totalDeductions: 0, totalNet: 0, totalOvertime: 0 });

  res.status(200).json({
    status: 'success',
    data: {
      payrolls,
      summary: {
        totalEmployees: payrolls.length,
        ...totals,
        locked: payrolls.filter(p => p.isLocked).length,
        pending: payrolls.filter(p => !p.isLocked).length
      }
    }
  });
});

// Admin: Bulk calculate payroll
exports.bulkCalculatePayroll = catchAsync(async (req, res, next) => {
  const { month, year, employeeIds } = req.body;
  const adminId = req.user.id;

  const employees = employeeIds 
    ? await User.find({ _id: { $in: employeeIds }, role: 'employee' })
    : await User.find({ role: 'employee', isActive: true });

  const settings = await CompanySettings.findOne();
  const results = [];

  for (const employee of employees) {
    try {
      const salaryData = await SalaryCalculationService.calculateMonthlySalary(
        employee._id,
        month,
        year,
        settings
      );

      const payroll = await Payroll.findOneAndUpdate(
        { employee: employee._id, month, year },
        salaryData,
        { upsert: true, new: true }
      );

      results.push({
        employee: employee.name,
        success: true,
        payrollId: payroll._id
      });
    } catch (error) {
      results.push({
        employee: employee.name,
        success: false,
        error: error.message
      });
    }
  }

  // Create audit log
  await AuditLog.create({
    user: adminId,
    action: 'BULK_CALCULATE_PAYROLL',
    ipAddress: req.ip,
    details: { month, year, totalProcessed: results.length }
  });

  res.status(200).json({
    status: 'success',
    data: { results }
  });
});