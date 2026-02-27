const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const PDFService = require('../services/pdfService');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } = require('date-fns');

// Get attendance report
exports.getAttendanceReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, department, employeeId } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError('Please provide start and end dates', 400));
  }

  const query = {
    date: {
      $gte: startOfDay(new Date(startDate)),
      $lte: endOfDay(new Date(endDate))
    }
  };

  // Build employee filter
  const employeeFilter = {};
  if (department) {
    const users = await User.find({ department }).distinct('_id');
    employeeFilter.employee = { $in: users };
  }
  if (employeeId) {
    employeeFilter.employee = employeeId;
  }

  const attendance = await Attendance.find({ ...query, ...employeeFilter })
    .populate('employee', 'name email employeeId department')
    .sort({ date: 1, 'employee.name': 1 });

  // Group by employee
  const byEmployee = {};
  attendance.forEach(record => {
    const empId = record.employee._id.toString();
    if (!byEmployee[empId]) {
      byEmployee[empId] = {
        employee: record.employee,
        present: 0,
        late: 0,
        absent: 0,
        halfDay: 0,
        totalHours: 0,
        overtime: 0,
        records: []
      };
    }
    
    if (record.status === 'present') byEmployee[empId].present++;
    else if (record.status === 'late') byEmployee[empId].late++;
    else if (record.status === 'absent') byEmployee[empId].absent++;
    else if (record.status === 'half-day') byEmployee[empId].halfDay++;
    
    byEmployee[empId].totalHours += record.totalWorkingHours || 0;
    byEmployee[empId].overtime += record.overtime || 0;
    byEmployee[empId].records.push(record);
  });

  // Summary statistics
  const summary = {
    totalRecords: attendance.length,
    totalEmployees: Object.keys(byEmployee).length,
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    halfDay: attendance.filter(a => a.status === 'half-day').length,
    totalHours: attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0),
    totalOvertime: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
  };

  res.status(200).json({
    status: 'success',
    data: {
      period: { startDate, endDate },
      summary,
      byEmployee: Object.values(byEmployee)
    }
  });
});

// Get payroll report
exports.getPayrollReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, department, status } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError('Please provide start and end dates', 400));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const query = {
    year: { $gte: start.getFullYear(), $lte: end.getFullYear() },
    month: { $gte: start.getMonth() + 1, $lte: end.getMonth() + 1 }
  };

  if (status) query.status = status;

  let payrolls = await Payroll.find(query)
    .populate('employee', 'name email employeeId department')
    .sort({ year: 1, month: 1 });

  // Filter by department if specified
  if (department) {
    payrolls = payrolls.filter(p => 
      p.employee.department?.toString() === department
    );
  }

  // Group by month
  const byMonth = {};
  payrolls.forEach(payroll => {
    const key = `${payroll.year}-${payroll.month}`;
    if (!byMonth[key]) {
      byMonth[key] = {
        year: payroll.year,
        month: payroll.month,
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeeCount: 0,
        records: []
      };
    }
    
    byMonth[key].totalGross += payroll.grossPay || 0;
    byMonth[key].totalDeductions += payroll.deductions?.total || 0;
    byMonth[key].totalNet += payroll.netPayable || 0;
    byMonth[key].employeeCount++;
    byMonth[key].records.push(payroll);
  });

  // Summary statistics
  const summary = {
    totalPayrolls: payrolls.length,
    totalGross: payrolls.reduce((sum, p) => sum + (p.grossPay || 0), 0),
    totalDeductions: payrolls.reduce((sum, p) => sum + (p.deductions?.total || 0), 0),
    totalNet: payrolls.reduce((sum, p) => sum + (p.netPayable || 0), 0),
    totalOvertime: payrolls.reduce((sum, p) => sum + (p.overtime?.hours || 0), 0),
    locked: payrolls.filter(p => p.isLocked).length,
    pending: payrolls.filter(p => !p.isLocked).length
  };

  res.status(200).json({
    status: 'success',
    data: {
      period: { startDate, endDate },
      summary,
      byMonth: Object.values(byMonth)
    }
  });
});

// Get leave report
exports.getLeaveReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, department, status } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError('Please provide start and end dates', 400));
  }

  const query = {
    startDate: { $gte: new Date(startDate) },
    endDate: { $lte: new Date(endDate) }
  };

  if (status) query.status = status;

  let leaves = await Leave.find(query)
    .populate('employee', 'name email employeeId department')
    .populate('approvedBy', 'name')
    .sort({ startDate: 1 });

  // Filter by department if specified
  if (department) {
    leaves = leaves.filter(l => 
      l.employee.department?.toString() === department
    );
  }

  // Group by type
  const byType = {
    paid: { count: 0, days: 0 },
    unpaid: { count: 0, days: 0 },
    sick: { count: 0, days: 0 }
  };

  leaves.forEach(leave => {
    if (byType[leave.type]) {
      byType[leave.type].count++;
      byType[leave.type].days += leave.days;
    }
  });

  // Group by month
  const byMonth = {};
  leaves.forEach(leave => {
    const month = leave.startDate.getMonth() + 1;
    const year = leave.startDate.getFullYear();
    const key = `${year}-${month}`;
    
    if (!byMonth[key]) {
      byMonth[key] = {
        year,
        month,
        totalLeaves: 0,
        totalDays: 0,
        byType: { paid: 0, unpaid: 0, sick: 0 }
      };
    }
    
    byMonth[key].totalLeaves++;
    byMonth[key].totalDays += leave.days;
    byMonth[key].byType[leave.type] += leave.days;
  });

  // Summary statistics
  const summary = {
    totalLeaves: leaves.length,
    totalDays: leaves.reduce((sum, l) => sum + l.days, 0),
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    byType
  };

  res.status(200).json({
    status: 'success',
    data: {
      period: { startDate, endDate },
      summary,
      byMonth: Object.values(byMonth),
      leaves
    }
  });
});

// Get summary report
exports.getSummaryReport = catchAsync(async (req, res, next) => {
  const { date } = req.query;
  const reportDate = date ? new Date(date) : new Date();
  const startMonth = startOfMonth(reportDate);
  const endMonth = endOfMonth(reportDate);

  // Get employee count
  const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });

  // Get attendance summary
  const attendanceSummary = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: startMonth, $lte: endMonth }
      }
    },
    {
      $group: {
        _id: null,
        present: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
        },
        late: { $sum: { $cond: ['$isLate', 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } },
        totalHours: { $sum: '$totalWorkingHours' },
        totalOvertime: { $sum: '$overtime' }
      }
    }
  ]);

  // Get leave summary
  const leaveSummary = await Leave.aggregate([
    {
      $match: {
        startDate: { $gte: startMonth, $lte: endMonth },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        days: { $sum: '$days' }
      }
    }
  ]);

  // Get payroll summary
  const payrollSummary = await Payroll.aggregate([
    {
      $match: {
        year: reportDate.getFullYear(),
        month: reportDate.getMonth() + 1
      }
    },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$grossPay' },
        totalDeductions: { $sum: '$deductions.total' },
        totalNet: { $sum: '$netPayable' },
        totalOvertime: { $sum: '$overtime.hours' },
        employeeCount: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      date: reportDate,
      employees: {
        total: totalEmployees
      },
      attendance: attendanceSummary[0] || {
        present: 0,
        late: 0,
        absent: 0,
        halfDay: 0,
        totalHours: 0,
        totalOvertime: 0
      },
      leaves: leaveSummary,
      payroll: payrollSummary[0] || {
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalOvertime: 0,
        employeeCount: 0
      }
    }
  });
});

// Export attendance report
exports.exportAttendanceReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, format = 'pdf' } = req.query;

  const reportData = await exports.getAttendanceReport(req, res, next);
  
  if (format === 'pdf') {
    const pdfBuffer = await PDFService.generateReportPDF(
      reportData.data,
      'Attendance Report'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${startDate}-to-${endDate}.pdf`);
    return res.send(pdfBuffer);
  } else if (format === 'csv') {
    // Generate CSV
    const csv = generateCSV(reportData.data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${startDate}-to-${endDate}.csv`);
    return res.send(csv);
  }

  res.status(200).json(reportData);
});

// Export payroll report
exports.exportPayrollReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, format = 'pdf' } = req.query;

  const reportData = await exports.getPayrollReport(req, res, next);

  if (format === 'pdf') {
    const pdfBuffer = await PDFService.generateReportPDF(
      reportData.data,
      'Payroll Report'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payroll-report-${startDate}-to-${endDate}.pdf`);
    return res.send(pdfBuffer);
  }

  res.status(200).json(reportData);
});

// Export leave report
exports.exportLeaveReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, format = 'pdf' } = req.query;

  const reportData = await exports.getLeaveReport(req, res, next);

  if (format === 'pdf') {
    const pdfBuffer = await PDFService.generateReportPDF(
      reportData.data,
      'Leave Report'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=leave-report-${startDate}-to-${endDate}.pdf`);
    return res.send(pdfBuffer);
  }

  res.status(200).json(reportData);
});

// Get dashboard stats
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);
  const lastWeek = subDays(today, 7);

  // Get today's attendance
  const todayAttendance = await Attendance.find({
    date: { $gte: startToday, $lte: endToday }
  }).populate('employee', 'name department');

  // Get pending leaves
  const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

  // Get unverified attendance
  const unverifiedAttendance = await Attendance.countDocuments({
    verifiedBy: { $exists: false },
    checkOut: { $exists: true }
  });

  // Get recent activity
  const recentActivity = await AuditLog.find()
    .populate('user', 'name')
    .sort({ timestamp: -1 })
    .limit(10);

  // Get attendance trend
  const trend = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: lastWeek, $lte: today }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        present: {
          $sum: {
            $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
          }
        },
        total: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      today: {
        total: todayAttendance.length,
        present: todayAttendance.filter(a => a.status === 'present').length,
        late: todayAttendance.filter(a => a.status === 'late').length,
        absent: todayAttendance.filter(a => a.status === 'absent').length,
        records: todayAttendance.slice(0, 5)
      },
      pending: {
        leaves: pendingLeaves,
        attendance: unverifiedAttendance
      },
      recentActivity: recentActivity.map(log => ({
        user: log.user?.name,
        action: log.action,
        time: log.timestamp
      })),
      trend: {
        labels: trend.map(t => t._id),
        present: trend.map(t => t.present),
        total: trend.map(t => t.total)
      }
    }
  });
});

// Helper function to generate CSV
function generateCSV(data) {
  let csv = '';
  
  // Add headers
  if (data.byEmployee) {
    csv = 'Employee,Present,Late,Absent,Half Day,Total Hours,Overtime\n';
    data.byEmployee.forEach(emp => {
      csv += `${emp.employee.name},${emp.present},${emp.late},${emp.absent},${emp.halfDay},${emp.totalHours.toFixed(2)},${emp.overtime.toFixed(2)}\n`;
    });
  }
  
  return csv;
}