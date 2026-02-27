const Attendance = require('../models/Attendance');
const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { calculateDistance } = require('../utils/haversine');
const { startOfDay, endOfDay, differenceInMinutes, differenceInHours } = require('date-fns');

// Check-in
exports.checkIn = catchAsync(async (req, res, next) => {
  const { location, deviceId } = req.body;
  const employeeId = req.user.id;
  const ipAddress = req.ip;

  // Check if already checked in today
  const today = new Date();
  const existingAttendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: startOfDay(today),
      $lte: endOfDay(today)
    }
  });

  if (existingAttendance?.checkIn) {
    return next(new AppError('Already checked in today', 400));
  }

  // Get company settings
  const settings = await CompanySettings.findOne();
  if (!settings) {
    return next(new AppError('Company settings not found', 404));
  }

  // Verify geo-fence if enabled
  if (settings.geoFence.enabled && location) {
    const distance = calculateDistance(
      { lat: location.lat, lng: location.lng },
      settings.geoFence.companyLocation
    );

    if (distance > settings.geoFence.radius) {
      return next(new AppError(`You are outside the geo-fence. Distance: ${Math.round(distance)}m`, 400));
    }
  }

  // Get shift timings
  const user = await User.findById(employeeId).populate('shift');
  const shift = user.shift || { startTime: '09:00', endTime: '18:00', graceTime: 15 };

  // Check for late arrival
  const checkInTime = new Date();
  const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number);
  const shiftStart = new Date();
  shiftStart.setHours(shiftHour, shiftMinute, 0);

  let isLate = false;
  let lateMinutes = 0;

  if (checkInTime > shiftStart) {
    lateMinutes = differenceInMinutes(checkInTime, shiftStart);
    if (lateMinutes > (shift.graceTime || 15)) {
      isLate = true;
    }
  }

  // Create or update attendance
  let attendance;
  if (existingAttendance) {
    attendance = existingAttendance;
  } else {
    attendance = new Attendance({
      employee: employeeId,
      date: today
    });
  }

  attendance.checkIn = {
    time: checkInTime,
    location,
    ipAddress,
    deviceId
  };

  attendance.isLate = isLate;
  attendance.lateMinutes = isLate ? lateMinutes : 0;
  attendance.status = isLate ? 'late' : 'present';

  // Add to logs
  attendance.ipLogs.push({ ip: ipAddress, timestamp: checkInTime, action: 'CHECK_IN' });
  if (location) {
    attendance.locationLogs.push({ ...location, timestamp: checkInTime, action: 'CHECK_IN' });
  }

  await attendance.save();

  // Create notification
  await Notification.create({
    user: employeeId,
    type: 'attendance',
    title: isLate ? 'Late Check-in' : 'Check-in Successful',
    message: isLate 
      ? `You checked in ${lateMinutes} minutes late today`
      : 'You have successfully checked in',
    priority: isLate ? 'medium' : 'low'
  });

  // Create audit log
  await AuditLog.create({
    user: employeeId,
    action: 'CHECK_IN',
    ipAddress,
    deviceId,
    details: { location, isLate, lateMinutes }
  });

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Check-out
exports.checkOut = catchAsync(async (req, res, next) => {
  const { location, deviceId } = req.body;
  const employeeId = req.user.id;
  const ipAddress = req.ip;

  // Find today's attendance
  const today = new Date();
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: startOfDay(today),
      $lte: endOfDay(today)
    }
  });

  if (!attendance) {
    return next(new AppError('No check-in found for today', 404));
  }

  if (attendance.checkOut) {
    return next(new AppError('Already checked out today', 400));
  }

  // Get company settings
  const settings = await CompanySettings.findOne();

  // Verify geo-fence for check-out if enabled
  if (settings?.geoFence.enabled && location) {
    const distance = calculateDistance(
      { lat: location.lat, lng: location.lng },
      settings.geoFence.companyLocation
    );

    if (distance > settings.geoFence.radius) {
      return next(new AppError(`You are outside the geo-fence. Distance: ${Math.round(distance)}m`, 400));
    }
  }

  const checkOutTime = new Date();
  attendance.checkOut = {
    time: checkOutTime,
    location,
    ipAddress,
    deviceId
  };

  // Calculate total working hours
  const checkInTime = new Date(attendance.checkIn.time);
  const totalMinutes = differenceInMinutes(checkOutTime, checkInTime);
  const workingHours = (totalMinutes - (attendance.totalBreakDuration || 0)) / 60;
  
  attendance.totalWorkingHours = Math.max(0, workingHours);

  // Calculate overtime
  const user = await User.findById(employeeId).populate('shift');
  const shift = user.shift || { endTime: '18:00', workingHours: 8 };
  
  const [shiftHour, shiftMinute] = shift.endTime.split(':').map(Number);
  const shiftEnd = new Date();
  shiftEnd.setHours(shiftHour, shiftMinute, 0);

  if (checkOutTime > shiftEnd) {
    const overtimeHours = differenceInHours(checkOutTime, shiftEnd);
    attendance.overtime = Math.max(0, overtimeHours);
  }

  // Determine final status
  if (attendance.totalWorkingHours >= (shift.workingHours || 8)) {
    attendance.status = 'present';
  } else if (attendance.totalWorkingHours >= 4) {
    attendance.status = 'half-day';
  } else {
    attendance.status = 'absent';
  }

  // Add to logs
  attendance.ipLogs.push({ ip: ipAddress, timestamp: checkOutTime, action: 'CHECK_OUT' });
  if (location) {
    attendance.locationLogs.push({ ...location, timestamp: checkOutTime, action: 'CHECK_OUT' });
  }

  await attendance.save();

  // Create notification
  await Notification.create({
    user: employeeId,
    type: 'attendance',
    title: 'Check-out Successful',
    message: `You worked for ${attendance.totalWorkingHours.toFixed(1)} hours today`,
    priority: 'low'
  });

  // Create audit log
  await AuditLog.create({
    user: employeeId,
    action: 'CHECK_OUT',
    ipAddress,
    deviceId,
    details: { 
      location, 
      totalWorkingHours: attendance.totalWorkingHours,
      status: attendance.status,
      overtime: attendance.overtime
    }
  });

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Start break
exports.startBreak = catchAsync(async (req, res, next) => {
  const { location } = req.body;
  const employeeId = req.user.id;

  const today = new Date();
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: startOfDay(today),
      $lte: endOfDay(today)
    }
  });

  if (!attendance || !attendance.checkIn || attendance.checkOut) {
    return next(new AppError('No active shift found', 400));
  }

  // Check if already on break
  const activeBreak = attendance.breaks.find(b => !b.endTime);
  if (activeBreak) {
    return next(new AppError('Already on break', 400));
  }

  // Check maximum breaks per day
  const settings = await CompanySettings.findOne();
  const maxBreaks = settings?.attendanceRules?.breakRules?.breaksPerDay || 2;
  
  if (attendance.breaks.length >= maxBreaks) {
    return next(new AppError(`Maximum ${maxBreaks} breaks allowed per day`, 400));
  }

  attendance.breaks.push({
    startTime: new Date(),
    location
  });

  await attendance.save();

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// End break
exports.endBreak = catchAsync(async (req, res, next) => {
  const { location } = req.body;
  const employeeId = req.user.id;

  const today = new Date();
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: startOfDay(today),
      $lte: endOfDay(today)
    }
  });

  if (!attendance) {
    return next(new AppError('No active shift found', 400));
  }

  const activeBreak = attendance.breaks.find(b => !b.endTime);
  if (!activeBreak) {
    return next(new AppError('No active break found', 400));
  }

  activeBreak.endTime = new Date();
  activeBreak.duration = differenceInMinutes(activeBreak.endTime, activeBreak.startTime);
  activeBreak.location = location;

  // Update total break duration
  attendance.totalBreakDuration = attendance.breaks.reduce((total, b) => {
    return total + (b.duration || 0);
  }, 0);

  await attendance.save();

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Get today's attendance
exports.getTodayAttendance = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;

  const today = new Date();
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: startOfDay(today),
      $lte: endOfDay(today)
    }
  });

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Get attendance history
exports.getAttendanceHistory = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const { startDate, endDate, limit = 30 } = req.query;

  const query = { employee: employeeId };
  
  if (startDate && endDate) {
    query.date = {
      $gte: startOfDay(new Date(startDate)),
      $lte: endOfDay(new Date(endDate))
    };
  }

  const attendance = await Attendance.find(query)
    .sort({ date: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    status: 'success',
    results: attendance.length,
    data: { attendance }
  });
});

// Get monthly attendance
exports.getMonthlyAttendance = catchAsync(async (req, res, next) => {
  const { year, month } = req.params;
  const employeeId = req.user.id;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const attendance = await Attendance.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  // Calculate summary
  const summary = {
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    halfDay: attendance.filter(a => a.status === 'half-day').length,
    totalWorkingHours: attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0),
    totalOvertime: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
  };

  res.status(200).json({
    status: 'success',
    data: {
      attendance,
      summary
    }
  });
});

// Admin: Get daily attendance
exports.getDailyAttendance = catchAsync(async (req, res, next) => {
  const { date } = req.params;
  const targetDate = date ? new Date(date) : new Date();

  const attendance = await Attendance.find({
    date: {
      $gte: startOfDay(targetDate),
      $lte: endOfDay(targetDate)
    }
  }).populate('employee', 'name email employeeId department');

  // Group by department
  const byDepartment = attendance.reduce((acc, record) => {
    const dept = record.employee?.department?.name || 'Unassigned';
    if (!acc[dept]) {
      acc[dept] = { present: 0, late: 0, absent: 0, total: 0 };
    }
    
    if (record.status === 'present' || record.status === 'late') {
      acc[dept].present++;
    } else if (record.status === 'absent') {
      acc[dept].absent++;
    }
    acc[dept].total++;
    
    return acc;
  }, {});

  res.status(200).json({
    status: 'success',
    data: {
      attendance,
      summary: {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        late: attendance.filter(a => a.status === 'late').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        byDepartment
      }
    }
  });
});

// Admin: Verify attendance
exports.verifyAttendance = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    return next(new AppError('Attendance record not found', 404));
  }

  attendance.verifiedBy = adminId;
  attendance.verificationMethod = 'manual';
  await attendance.save();

  // Create notification
  await Notification.create({
    user: attendance.employee,
    type: 'attendance',
    title: 'Attendance Verified',
    message: 'Your attendance has been verified by admin',
    priority: 'low'
  });

  // Create audit log
  await AuditLog.create({
    user: adminId,
    action: 'VERIFY_ATTENDANCE',
    ipAddress: req.ip,
    details: { attendanceId: id }
  });

  res.status(200).json({
    status: 'success',
    data: { attendance }
  });
});

// Admin: Get attendance report
exports.getAttendanceReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, department } = req.query;

  const query = {
    date: {
      $gte: startOfDay(new Date(startDate)),
      $lte: endOfDay(new Date(endDate))
    }
  };

  if (department) {
    const users = await User.find({ department }).distinct('_id');
    query.employee = { $in: users };
  }

  const attendance = await Attendance.find(query)
    .populate('employee', 'name email employeeId department')
    .sort({ date: 1 });

  // Generate report data
  const report = {
    period: { startDate, endDate },
    total: attendance.length,
    byDate: {},
    byEmployee: {},
    summary: {
      present: 0,
      late: 0,
      absent: 0,
      halfDay: 0,
      totalHours: 0,
      totalOvertime: 0
    }
  };

  attendance.forEach(record => {
    // By date
    const dateStr = record.date.toISOString().split('T')[0];
    if (!report.byDate[dateStr]) {
      report.byDate[dateStr] = { present: 0, late: 0, absent: 0, total: 0 };
    }
    
    if (record.status === 'present') report.byDate[dateStr].present++;
    else if (record.status === 'late') report.byDate[dateStr].late++;
    else if (record.status === 'absent') report.byDate[dateStr].absent++;
    report.byDate[dateStr].total++;

    // By employee
    const empId = record.employee._id.toString();
    if (!report.byEmployee[empId]) {
      report.byEmployee[empId] = {
        name: record.employee.name,
        employeeId: record.employee.employeeId,
        present: 0,
        late: 0,
        absent: 0,
        halfDay: 0,
        hours: 0,
        overtime: 0
      };
    }
    
    if (record.status === 'present') report.byEmployee[empId].present++;
    else if (record.status === 'late') report.byEmployee[empId].late++;
    else if (record.status === 'absent') report.byEmployee[empId].absent++;
    else if (record.status === 'half-day') report.byEmployee[empId].halfDay++;
    
    report.byEmployee[empId].hours += record.totalWorkingHours || 0;
    report.byEmployee[empId].overtime += record.overtime || 0;

    // Summary
    if (record.status === 'present') report.summary.present++;
    else if (record.status === 'late') report.summary.late++;
    else if (record.status === 'absent') report.summary.absent++;
    else if (record.status === 'half-day') report.summary.halfDay++;
    
    report.summary.totalHours += record.totalWorkingHours || 0;
    report.summary.totalOvertime += record.overtime || 0;
  });

  res.status(200).json({
    status: 'success',
    data: report
  });
});