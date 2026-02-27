const User = require('../models/User');
const Department = require('../models/Department');
const Shift = require('../models/Shift');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Get all users
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const { role, department, isActive } = req.query;
  
  const query = {};
  if (role) query.role = role;
  if (department) query.department = department;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const users = await User.find(query)
    .populate('department', 'name')
    .populate('shift', 'name startTime endTime')
    .select('-password')
    .sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

// Get employees
exports.getEmployees = catchAsync(async (req, res, next) => {
  const { department, isActive } = req.query;
  
  const query = { role: 'employee' };
  if (department) query.department = department;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const employees = await User.find(query)
    .populate('department', 'name')
    .populate('shift', 'name startTime endTime')
    .select('-password')
    .sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: { employees }
  });
});

// Get user by ID
exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .populate('department', 'name manager')
    .populate('shift', 'name startTime endTime')
    .select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Create user
exports.createUser = catchAsync(async (req, res, next) => {
  const { email, password, name, phone, role, employeeId, department, shift, position, basicSalary } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Check if employee ID is unique
  if (employeeId) {
    const existingEmpId = await User.findOne({ employeeId });
    if (existingEmpId) {
      return next(new AppError('Employee ID already exists', 400));
    }
  }

  const user = await User.create({
    email,
    password,
    name,
    phone,
    role: role || 'employee',
    employeeId,
    department,
    shift,
    position,
    basicSalary
  });

  // Create notification for new user
  await Notification.create({
    user: user._id,
    type: 'system',
    title: 'Welcome to OpenMind WorkTrack',
    message: `Welcome ${user.name}! Your account has been created successfully.`,
    priority: 'high'
  });

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'CREATE_EMPLOYEE',
    ipAddress: req.ip,
    details: { userId: user._id, email: user.email }
  });

  user.password = undefined;

  res.status(201).json({
    status: 'success',
    data: { user }
  });
});

// Update user
exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove sensitive fields
  delete updates.password;
  delete updates.role;

  const user = await User.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'UPDATE_EMPLOYEE',
    ipAddress: req.ip,
    details: { userId: id, updates: Object.keys(updates) }
  });

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Soft delete by deactivating
  user.isActive = false;
  await user.save();

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'DELETE_EMPLOYEE',
    ipAddress: req.ip,
    details: { userId: id, email: user.email }
  });

  res.status(200).json({
    status: 'success',
    data: null
  });
});

// Deactivate user
exports.deactivateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Create notification
  await Notification.create({
    user: user._id,
    type: 'system',
    title: 'Account Deactivated',
    message: 'Your account has been deactivated. Please contact admin for more information.',
    priority: 'high'
  });

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'DEACTIVATE_USER',
    ipAddress: req.ip,
    details: { userId: id }
  });

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Activate user
exports.activateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Create notification
  await Notification.create({
    user: user._id,
    type: 'system',
    title: 'Account Activated',
    message: 'Your account has been activated. You can now login.',
    priority: 'high'
  });

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'ACTIVATE_USER',
    ipAddress: req.ip,
    details: { userId: id }
  });

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Get users by department
exports.getUsersByDepartment = catchAsync(async (req, res, next) => {
  const { departmentId } = req.params;

  const users = await User.find({ department: departmentId, role: 'employee' })
    .select('name email employeeId position')
    .sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    data: { users }
  });
});

// Get profile
exports.getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('department', 'name manager')
    .populate('shift', 'name startTime endTime')
    .select('-password');

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Update profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  const updates = req.body;
  
  // Don't allow updating sensitive fields
  delete updates.role;
  delete updates.employeeId;
  delete updates.department;
  delete updates.shift;
  delete updates.basicSalary;
  delete updates.isActive;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  )
  .populate('department', 'name')
  .populate('shift', 'name')
  .select('-password');

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'PROFILE_UPDATE',
    ipAddress: req.ip,
    details: { updates: Object.keys(updates) }
  });

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Upload avatar
exports.uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file', 400));
  }

  const user = await User.findById(req.user.id);
  
  // Process image
  const filename = `avatar-${user._id}-${Date.now()}.jpg`;
  const filepath = path.join(__dirname, '../../uploads/avatars', filename);

  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Resize and save image
  await sharp(req.file.buffer)
    .resize(200, 200)
    .jpeg({ quality: 90 })
    .toFile(filepath);

  // Delete old avatar if exists
  if (user.avatar) {
    const oldPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatar));
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  // Update user
  user.avatar = `/uploads/avatars/${filename}`;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: { avatar: user.avatar }
  });
});

// Change user role (admin only)
exports.changeUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'employee'].includes(role)) {
    return next(new AppError('Invalid role', 400));
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Create audit log
  await AuditLog.create({
    user: req.user.id,
    action: 'CHANGE_ROLE',
    ipAddress: req.ip,
    details: { userId: id, newRole: role }
  });

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Assign department
exports.assignDepartment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { departmentId } = req.body;

  const department = await Department.findById(departmentId);
  if (!department) {
    return next(new AppError('Department not found', 404));
  }

  const user = await User.findByIdAndUpdate(
    id,
    { department: departmentId },
    { new: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update department employee count
  await department.updateEmployeeCount();

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Assign shift
exports.assignShift = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { shiftId } = req.body;

  const shift = await Shift.findById(shiftId);
  if (!shift) {
    return next(new AppError('Shift not found', 404));
  }

  const user = await User.findByIdAndUpdate(
    id,
    { shift: shiftId },
    { new: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

// Get user statistics
exports.getUserStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Get attendance stats
  const attendanceStats = await Attendance.aggregate([
    {
      $match: { employee: user._id }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
        },
        late: { $sum: { $cond: ['$isLate', 1, 0] } },
        totalHours: { $sum: '$totalWorkingHours' },
        totalOvertime: { $sum: '$overtime' }
      }
    }
  ]);

  // Get leave stats
  const leaveStats = await Leave.aggregate([
    {
      $match: { employee: user._id, status: 'approved' }
    },
    {
      $group: {
        _id: '$type',
        totalDays: { $sum: '$days' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      attendance: attendanceStats[0] || {
        totalDays: 0,
        present: 0,
        late: 0,
        totalHours: 0,
        totalOvertime: 0
      },
      leaves: leaveStats
    }
  });
});