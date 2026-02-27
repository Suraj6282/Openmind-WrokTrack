const CompanySettings = require('../models/CompanySettings');
const Department = require('../models/Department');
const Shift = require('../models/Shift');
const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get company settings
exports.getCompanySettings = catchAsync(async (req, res, next) => {
  let settings = await CompanySettings.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = await CompanySettings.create({
      companyName: 'OpenMind Technologies',
      companyEmail: 'info@openmind.com',
      companyPhone: '+1234567890',
      companyAddress: {
        street: '123 Business Park',
        city: 'Tech City',
        state: 'Tech State',
        country: 'Country',
        zipCode: '123456'
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: settings
  });
});

// Update company settings
exports.updateCompanySettings = catchAsync(async (req, res, next) => {
  const settings = await CompanySettings.findOne();
  
  if (!settings) {
    return next(new AppError('Company settings not found', 404));
  }

  Object.assign(settings, req.body);
  await settings.save();

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'UPDATE_SETTINGS',
    ipAddress: req.ip,
    details: { updatedFields: Object.keys(req.body) }
  });

  res.status(200).json({
    status: 'success',
    data: settings
  });
});

// Get business rules
exports.getBusinessRules = catchAsync(async (req, res, next) => {
  const settings = await CompanySettings.findOne();
  
  if (!settings) {
    return next(new AppError('Company settings not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      attendance: settings.attendanceRules,
      payroll: settings.payrollRules,
      leave: settings.leaveRules,
      geoFence: settings.geoFence
    }
  });
});

// Update business rules
exports.updateBusinessRules = catchAsync(async (req, res, next) => {
  const settings = await CompanySettings.findOne();
  
  if (!settings) {
    return next(new AppError('Company settings not found', 404));
  }

  const { attendance, payroll, leave, geoFence } = req.body;

  if (attendance) {
    settings.attendanceRules = { ...settings.attendanceRules, ...attendance };
  }
  if (payroll) {
    settings.payrollRules = { ...settings.payrollRules, ...payroll };
  }
  if (leave) {
    settings.leaveRules = { ...settings.leaveRules, ...leave };
  }
  if (geoFence) {
    settings.geoFence = { ...settings.geoFence, ...geoFence };
  }

  await settings.save();

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'UPDATE_BUSINESS_RULES',
    ipAddress: req.ip,
    details: { updatedRules: Object.keys(req.body) }
  });

  res.status(200).json({
    status: 'success',
    data: settings
  });
});

// Get holidays
exports.getHolidays = catchAsync(async (req, res, next) => {
  const { year } = req.query;
  const settings = await CompanySettings.findOne();
  
  if (!settings) {
    return next(new AppError('Company settings not found', 404));
  }

  let holidays = settings.holidays;
  
  if (year) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    holidays = holidays.filter(h => 
      h.date >= startOfYear && h.date <= endOfYear
    );
  }

  res.status(200).json({
    status: 'success',
    data: holidays
  });
});

// Add holiday
exports.addHoliday = catchAsync(async (req, res, next) => {
  const settings = await CompanySettings.findOne();
  
  if (!settings) {
    return next(new AppError('Company settings not found', 404));
  }

  const { name, date, type, recurring } = req.body;

  // Check if holiday already exists on this date
  const existing = settings.holidays.find(h => 
    new Date(h.date).toDateString() === new Date(date).toDateString()
  );

  if (existing) {
    return next(new AppError('Holiday already exists on this date', 400));
  }

  settings.holidays.push({
    name,
    date: new Date(date),
    type: type || 'company',
    recurring: recurring || false
  });

  await settings.save();

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'ADD_HOLIDAY',
    ipAddress: req.ip,
    details: { name, date }
  });

  res.status(201).json({
    status: 'success',
    data: settings.holidays
  });
});

// Delete holiday
exports.deleteHoliday = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const settings = await CompanySettings.findOne();
  
  if (!settings) {
    return next(new AppError('Company settings not found', 404));
  }

  const holidayIndex = settings.holidays.findIndex(h => h._id.toString() === id);
  
  if (holidayIndex === -1) {
    return next(new AppError('Holiday not found', 404));
  }

  const deletedHoliday = settings.holidays[holidayIndex];
  settings.holidays.splice(holidayIndex, 1);
  await settings.save();

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'DELETE_HOLIDAY',
    ipAddress: req.ip,
    details: { holiday: deletedHoliday.name }
  });

  res.status(200).json({
    status: 'success',
    data: null
  });
});

// Get departments
exports.getDepartments = catchAsync(async (req, res, next) => {
  const departments = await Department.find()
    .populate('manager', 'name email')
    .sort({ name: 1 });

  // Get employee count for each department
  const departmentsWithCount = await Promise.all(
    departments.map(async (dept) => {
      const deptObj = dept.toObject();
      deptObj.employeeCount = await dept.updateEmployeeCount();
      return deptObj;
    })
  );

  res.status(200).json({
    status: 'success',
    data: departmentsWithCount
  });
});

// Create department
exports.createDepartment = catchAsync(async (req, res, next) => {
  const { name, description, manager, budget, location } = req.body;

  const existingDept = await Department.findOne({ name });
  if (existingDept) {
    return next(new AppError('Department with this name already exists', 400));
  }

  const department = await Department.create({
    name,
    description,
    manager,
    budget,
    location
  });

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'CREATE_DEPARTMENT',
    ipAddress: req.ip,
    details: { departmentId: department._id, name }
  });

  res.status(201).json({
    status: 'success',
    data: department
  });
});

// Update department
exports.updateDepartment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const department = await Department.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );

  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'UPDATE_DEPARTMENT',
    ipAddress: req.ip,
    details: { departmentId: id, updates }
  });

  res.status(200).json({
    status: 'success',
    data: department
  });
});

// Delete department
exports.deleteDepartment = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Check if department has employees
  const employeeCount = await User.countDocuments({ department: id });
  if (employeeCount > 0) {
    return next(new AppError('Cannot delete department with assigned employees', 400));
  }

  const department = await Department.findByIdAndDelete(id);

  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'DELETE_DEPARTMENT',
    ipAddress: req.ip,
    details: { departmentId: id, name: department.name }
  });

  res.status(200).json({
    status: 'success',
    data: null
  });
});

// Get shifts
exports.getShifts = catchAsync(async (req, res, next) => {
  const shifts = await Shift.find().sort({ startTime: 1 });

  res.status(200).json({
    status: 'success',
    data: shifts
  });
});

// Create shift
exports.createShift = catchAsync(async (req, res, next) => {
  const { name, startTime, endTime, breakDuration, workingHours, graceTime, overtimeAllowed, applicableDays } = req.body;

  const existingShift = await Shift.findOne({ name });
  if (existingShift) {
    return next(new AppError('Shift with this name already exists', 400));
  }

  const shift = await Shift.create({
    name,
    startTime,
    endTime,
    breakDuration,
    workingHours,
    graceTime,
    overtimeAllowed,
    applicableDays
  });

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'CREATE_SHIFT',
    ipAddress: req.ip,
    details: { shiftId: shift._id, name }
  });

  res.status(201).json({
    status: 'success',
    data: shift
  });
});

// Update shift
exports.updateShift = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const shift = await Shift.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );

  if (!shift) {
    return next(new AppError('Shift not found', 404));
  }

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'UPDATE_SHIFT',
    ipAddress: req.ip,
    details: { shiftId: id, updates }
  });

  res.status(200).json({
    status: 'success',
    data: shift
  });
});

// Delete shift
exports.deleteShift = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Check if shift is assigned to employees
  const employeeCount = await User.countDocuments({ shift: id });
  if (employeeCount > 0) {
    return next(new AppError('Cannot delete shift assigned to employees', 400));
  }

  const shift = await Shift.findByIdAndDelete(id);

  if (!shift) {
    return next(new AppError('Shift not found', 404));
  }

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'DELETE_SHIFT',
    ipAddress: req.ip,
    details: { shiftId: id, name: shift.name }
  });

  res.status(200).json({
    status: 'success',
    data: null
  });
});