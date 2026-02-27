const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } = require('date-fns');

// Get dashboard statistics
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);

  // Get total employees
  const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });

  // Get today's attendance
  const todayAttendance = await Attendance.find({
    date: { $gte: startToday, $lte: endToday }
  });

  const presentToday = todayAttendance.filter(a => 
    a.status === 'present' || a.status === 'late'
  ).length;

  const lateToday = todayAttendance.filter(a => a.isLate).length;

  // Get employees on leave today
  const onLeave = await Leave.countDocuments({
    status: 'approved',
    startDate: { $lte: today },
    endDate: { $gte: today }
  });

  // Get monthly stats
  const monthlyAttendance = await Attendance.find({
    date: { $gte: startMonth, $lte: endMonth }
  });

  const totalWorkingDays = monthlyAttendance.length;
  const totalPresent = monthlyAttendance.filter(a => 
    a.status === 'present' || a.status === 'late'
  ).length;

  const attendanceRate = totalWorkingDays > 0 
    ? Math.round((totalPresent / (totalEmployees * totalWorkingDays)) * 100) 
    : 0;

  // Get pending leaves
  const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

  // Get unverified attendance
  const unverifiedAttendance = await Attendance.countDocuments({ 
    verifiedBy: { $exists: false },
    checkOut: { $exists: true }
  });

  // Get monthly payroll
  const monthlyPayroll = await Payroll.aggregate([
    {
      $match: {
        month: today.getMonth() + 1,
        year: today.getFullYear()
      }
    },
    {
      $group: {
        _id: null,
        totalSalary: { $sum: '$netPayable' },
        totalOvertime: { $sum: '$overtime.hours' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Get department distribution
  const departmentDistribution = await User.aggregate([
    {
      $match: { role: 'employee', isActive: true }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'dept'
      }
    },
    {
      $unwind: {
        path: '$dept',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$dept.name',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        department: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  // Get recent activity
  const recentActivity = await AuditLog.find()
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
    .limit(10);

  const stats = {
    totalEmployees,
    presentToday,
    absentToday: totalEmployees - presentToday - onLeave,
    lateToday,
    onLeave,
    attendanceRate,
    pendingLeaves,
    unverifiedAttendance,
    monthlyPayroll: monthlyPayroll[0] || { totalSalary: 0, totalOvertime: 0 },
    departmentDistribution,
    recentActivity: recentActivity.map(log => ({
      user: log.user?.name,
      action: log.action,
      time: log.timestamp,
      type: log.action.toLowerCase().includes('check') ? 'attendance' : 'system'
    }))
  };

  res.status(200).json({
    status: 'success',
    data: stats
  });
});

// Get attendance trends
exports.getAttendanceTrends = catchAsync(async (req, res, next) => {
  const { period = 'month' } = req.query;
  const today = new Date();
  
  let startDate, endDate, groupFormat;
  
  switch (period) {
    case 'week':
      startDate = subDays(today, 7);
      endDate = today;
      groupFormat = '%Y-%m-%d';
      break;
    case 'month':
      startDate = subDays(today, 30);
      endDate = today;
      groupFormat = '%Y-%m-%d';
      break;
    case 'year':
      startDate = subDays(today, 365);
      endDate = today;
      groupFormat = '%Y-%m';
      break;
    default:
      startDate = subDays(today, 30);
      endDate = today;
      groupFormat = '%Y-%m-%d';
  }

  const trends = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: groupFormat, date: '$date' }
        },
        present: {
          $sum: {
            $cond: [
              { $in: ['$status', ['present', 'late']] },
              1,
              0
            ]
          }
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        },
        late: {
          $sum: { $cond: ['$isLate', 1, 0] }
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
      labels: trends.map(t => t._id),
      datasets: [
        {
          label: 'Present',
          data: trends.map(t => t.present),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
          label: 'Late',
          data: trends.map(t => t.late),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)'
        },
        {
          label: 'Absent',
          data: trends.map(t => t.absent),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)'
        }
      ]
    }
  });
});

// Get payroll summary
exports.getPayrollSummary = catchAsync(async (req, res, next) => {
  const { year, month } = req.query;
  const query = {};
  
  if (year) query.year = parseInt(year);
  if (month) query.month = parseInt(month);

  const summary = await Payroll.aggregate([
    {
      $match: query
    },
    {
      $group: {
        _id: {
          year: '$year',
          month: '$month'
        },
        totalGrossPay: { $sum: '$grossPay' },
        totalDeductions: { $sum: '$deductions.total' },
        totalNetPayable: { $sum: '$netPayable' },
        totalOvertime: { $sum: '$overtime.hours' },
        employeeCount: { $sum: 1 },
        lockedCount: {
          $sum: { $cond: ['$isLocked', 1, 0] }
        }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    }
  ]);

  const departmentWise = await Payroll.aggregate([
    {
      $match: query
    },
    {
      $lookup: {
        from: 'users',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeInfo'
      }
    },
    {
      $unwind: '$employeeInfo'
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'employeeInfo.department',
        foreignField: '_id',
        as: 'department'
      }
    },
    {
      $unwind: {
        path: '$department',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$department.name',
        totalPayroll: { $sum: '$netPayable' },
        employeeCount: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      summary: summary[0] || {},
      departmentWise
    }
  });
});

// Get leave analytics
exports.getLeaveAnalytics = catchAsync(async (req, res, next) => {
  const { year } = req.query;
  const targetYear = parseInt(year) || new Date().getFullYear();

  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31);

  const leaveStats = await Leave.aggregate([
    {
      $match: {
        startDate: { $gte: startDate, $lte: endDate },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          month: { $month: '$startDate' }
        },
        count: { $sum: 1 },
        totalDays: { $sum: '$days' }
      }
    },
    {
      $sort: { '_id.month': 1 }
    }
  ]);

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    paid: 0,
    unpaid: 0,
    sick: 0
  }));

  leaveStats.forEach(stat => {
    const monthIndex = stat._id.month - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyData[monthIndex][stat._id.type] = stat.totalDays;
    }
  });

  const byType = await Leave.aggregate([
    {
      $match: {
        startDate: { $gte: startDate, $lte: endDate },
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$type',
        totalLeaves: { $sum: 1 },
        totalDays: { $sum: '$days' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      monthly: monthlyData,
      byType,
      totalLeaves: leaveStats.reduce((sum, stat) => sum + stat.count, 0),
      totalDays: leaveStats.reduce((sum, stat) => sum + stat.totalDays, 0)
    }
  });
});

// Get department performance
exports.getDepartmentPerformance = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);

  const performance = await User.aggregate([
    {
      $match: { role: 'employee', isActive: true }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'dept'
      }
    },
    {
      $unwind: {
        path: '$dept',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'attendances',
        let: { employeeId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$employee', '$$employeeId'] },
                  { $gte: ['$date', startMonth] },
                  { $lte: ['$date', endMonth] }
                ]
              }
            }
          }
        ],
        as: 'attendances'
      }
    },
    {
      $addFields: {
        attendanceRate: {
          $multiply: [
            {
              $divide: [
                {
                  $size: {
                    $filter: {
                      input: '$attendances',
                      as: 'att',
                      cond: { $in: ['$$att.status', ['present', 'late']] }
                    }
                             }
                },
                { $max: [{ $size: '$attendances' }, 1] }
              ]
            },
            100
          ]
        }
      }
    },
    {
      $group: {
        _id: '$dept.name',
        employeeCount: { $sum: 1 },
        avgAttendance: { $avg: '$attendanceRate' },
        employees: { $push: { name: '$name', attendanceRate: '$attendanceRate' } }
      }
    },
    {
      $project: {
        department: '$_id',
        employeeCount: 1,
        avgAttendance: { $round: ['$avgAttendance', 2] },
        topPerformers: {
          $slice: [
            {
              $sortArray: {
                input: '$employees',
                sortBy: { attendanceRate: -1 }
              }
            },
            3
          ]
        }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: performance
  });
});

// Get employee ranking
exports.getEmployeeRanking = catchAsync(async (req, res, next) => {
  const { criteria = 'attendance' } = req.query;
  const today = new Date();
  const startMonth = startOfMonth(today);

  let ranking = [];

  switch (criteria) {
    case 'attendance':
      ranking = await User.aggregate([
        {
          $match: { role: 'employee', isActive: true }
        },
        {
          $lookup: {
            from: 'attendances',
            let: { employeeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employee', '$$employeeId'] },
                      { $gte: ['$date', startMonth] }
                    ]
                  }
                }
              }
            ],
            as: 'attendances'
          }
        },
        {
          $addFields: {
            totalPresent: {
              $size: {
                $filter: {
                  input: '$attendances',
                  as: 'att',
                  cond: { $in: ['$$att.status', ['present', 'late']] }
                }
              }
            },
            totalDays: { $size: '$attendances' },
            totalOvertime: { $sum: '$attendances.overtime' }
          }
        },
        {
          $addFields: {
            attendanceRate: {
              $multiply: [
                { $divide: ['$totalPresent', { $max: ['$totalDays', 1] }] },
                100
              ]
            }
          }
        },
        {
          $sort: { attendanceRate: -1, totalOvertime: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: 1,
            email: 1,
            employeeId: 1,
            attendanceRate: { $round: ['$attendanceRate', 2] },
            totalOvertime: 1,
            department: 1
          }
        }
      ]);
      break;

    case 'overtime':
      ranking = await User.aggregate([
        {
          $match: { role: 'employee', isActive: true }
        },
        {
          $lookup: {
            from: 'attendances',
            let: { employeeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employee', '$$employeeId'] },
                      { $gte: ['$date', startMonth] }
                    ]
                  }
                }
              }
            ],
            as: 'attendances'
          }
        },
        {
          $addFields: {
            totalOvertime: { $sum: '$attendances.overtime' }
          }
        },
        {
          $sort: { totalOvertime: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: 1,
            email: 1,
            employeeId: 1,
            totalOvertime: 1,
            department: 1
          }
        }
      ]);
      break;

    case 'leave':
      ranking = await User.aggregate([
        {
          $match: { role: 'employee', isActive: true }
        },
        {
          $lookup: {
            from: 'leaves',
            let: { employeeId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$employee', '$$employeeId'] },
                      { $gte: ['$startDate', startMonth] },
                      { $eq: ['$status', 'approved'] }
                    ]
                  }
                }
              }
            ],
            as: 'leaves'
          }
        },
        {
          $addFields: {
            totalLeaves: { $sum: '$leaves.days' }
          }
        },
        {
          $sort: { totalLeaves: 1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: 1,
            email: 1,
            employeeId: 1,
            totalLeaves: 1,
            department: 1
          }
        }
      ]);
      break;
  }

  res.status(200).json({
    status: 'success',
    data: ranking
  });
});

// Get my stats (for employee)
exports.getMyStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const today = new Date();
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);

  // Get today's attendance
  const todayAttendance = await Attendance.findOne({
    employee: userId,
    date: {
      $gte: startOfDay(today),
      $lte: endOfDay(today)
    }
  });

  // Get monthly attendance
  const monthlyAttendance = await Attendance.find({
    employee: userId,
    date: { $gte: startMonth, $lte: endMonth }
  });

  const totalPresent = monthlyAttendance.filter(a => 
    a.status === 'present' || a.status === 'late'
  ).length;

  const totalLate = monthlyAttendance.filter(a => a.isLate).length;
  const totalOvertime = monthlyAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0);

  // Get leave balance
  const leaveBalance = await Leave.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(userId),
        status: 'approved',
        year: today.getFullYear()
      }
    },
    {
      $group: {
        _id: '$type',
        used: { $sum: '$days' }
      }
    }
  ]);

  // Get upcoming leaves
  const upcomingLeaves = await Leave.find({
    employee: userId,
    status: 'approved',
    startDate: { $gt: today }
  })
  .sort({ startDate: 1 })
  .limit(5);

  res.status(200).json({
    status: 'success',
    data: {
      today: {
        checkedIn: !!todayAttendance?.checkIn,
        checkedOut: !!todayAttendance?.checkOut,
        status: todayAttendance?.status,
        workingHours: todayAttendance?.totalWorkingHours || 0,
        isLate: todayAttendance?.isLate || false
      },
      monthly: {
        present: totalPresent,
        absent: monthlyAttendance.length - totalPresent,
        late: totalLate,
        overtime: totalOvertime
      },
      leaveBalance,
      upcomingLeaves
    }
  });
});

// Get my trends
exports.getMyTrends = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { period = 'month' } = req.query;
  
  let startDate, groupFormat;
  const today = new Date();

  switch (period) {
    case 'week':
      startDate = subDays(today, 7);
      groupFormat = '%Y-%m-%d';
      break;
    case 'month':
      startDate = subDays(today, 30);
      groupFormat = '%Y-%m-%d';
      break;
    case 'year':
      startDate = subDays(today, 365);
      groupFormat = '%Y-%m';
      break;
    default:
      startDate = subDays(today, 30);
      groupFormat = '%Y-%m-%d';
  }

  const trends = await Attendance.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: today }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: groupFormat, date: '$date' }
        },
        workingHours: { $sum: '$totalWorkingHours' },
        overtime: { $sum: '$overtime' },
        status: { $first: '$status' }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      labels: trends.map(t => t._id),
      workingHours: trends.map(t => t.workingHours),
      overtime: trends.map(t => t.overtime)
    }
  });
});

// Get audit summary
exports.getAuditSummary = catchAsync(async (req, res, next) => {
  const { days = 7 } = req.query;
  const startDate = subDays(new Date(), parseInt(days));

  const summary = await AuditLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
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
      $sort: { '_id.date': -1 }
    }
  ]);

  const byAction = await AuditLog.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      summary,
      byAction,
      totalLogs: summary.reduce((sum, item) => sum + item.count, 0)
    }
  });
});

// Export analytics data
exports.exportAnalytics = catchAsync(async (req, res, next) => {
  const { type = 'attendance', format = 'json', startDate, endDate } = req.query;
  
  const filter = {};
  if (startDate) filter.date = { $gte: new Date(startDate) };
  if (endDate) {
    filter.date = filter.date || {};
    filter.date.$lte = new Date(endDate);
  }

  let data;
  
  switch (type) {
    case 'attendance':
      data = await Attendance.find(filter)
        .populate('employee', 'name email employeeId')
        .sort({ date: -1 })
        .lean();
      break;
      
    case 'payroll':
      data = await Payroll.find(filter)
        .populate('employee', 'name email employeeId')
        .sort({ year: -1, month: -1 })
        .lean();
      break;
      
    case 'leave':
      data = await Leave.find(filter)
        .populate('employee', 'name email employeeId')
        .sort({ startDate: -1 })
        .lean();
      break;
      
    default:
      return next(new AppError('Invalid export type', 400));
  }

  if (format === 'csv') {
    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
    
    // Simple CSV conversion (you may want to use a library like json2csv)
    const csv = convertToCSV(data);
    return res.send(csv);
  }

  res.status(200).json({
    status: 'success',
    count: data.length,
    data
  });
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'object' ? JSON.stringify(val) : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}