const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } = require('date-fns');

class SalaryCalculationService {
  constructor() {
    this.settings = null;
  }

  async initialize() {
    if (!this.settings) {
      this.settings = await CompanySettings.findOne();
    }
    return this.settings;
  }

  // Calculate monthly salary for an employee
  async calculateMonthlySalary(employeeId, month, year, settings = null) {
    if (!settings) {
      settings = await this.initialize();
    }

    // Get employee details
    const employee = await User.findById(employeeId)
      .populate('department')
      .populate('shift');

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get date range
    const startDate = startOfMonth(new Date(year, month - 1, 1));
    const endDate = endOfMonth(startDate);

    // Get attendance records
    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Get leave records
    const leaves = await Leave.find({
      employee: employeeId,
      status: 'approved',
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    // Calculate working days
    const workingDays = await this.calculateWorkingDays(year, month, settings);
    
    // Calculate attendance summary
    const attendanceSummary = this.calculateAttendanceSummary(attendance);
    
    // Calculate leave summary
    const leaveSummary = this.calculateLeaveSummary(leaves, startDate, endDate);

    // Calculate overtime
    const overtime = this.calculateOvertime(attendance, settings);

    // Calculate per day salary
    const perDaySalary = employee.basicSalary / workingDays;

    // Calculate deductions
    const deductions = this.calculateDeductions(
      attendance, 
      leaveSummary, 
      perDaySalary, 
      settings
    );

    // Calculate allowances
    const allowances = this.calculateAllowances(employee.basicSalary, settings);

    // Calculate gross pay
    const grossPay = employee.basicSalary + allowances.total + overtime.amount;

    // Calculate net payable
    const netPayable = grossPay - deductions.total;

    return {
      employee: employeeId,
      month,
      year,
      basicSalary: employee.basicSalary,
      perDaySalary,
      workingDays,
      presentDays: attendanceSummary.present,
      absentDays: attendanceSummary.absent,
      leaves: leaveSummary,
      overtime,
      deductions,
      allowances,
      grossPay,
      netPayable,
      status: 'calculated'
    };
  }

  // Calculate working days in month
  async calculateWorkingDays(year, month, settings) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    let workingDays = 0;
    
    for (const day of days) {
      // Skip weekends if configured
      if (!settings.attendanceRules?.includeWeekends && isWeekend(day)) {
        continue;
      }

      // Skip holidays
      const isHoliday = settings.holidays?.some(h => 
        new Date(h.date).toDateString() === day.toDateString()
      );

      if (!isHoliday) {
        workingDays++;
      }
    }

    return workingDays;
  }

  // Calculate attendance summary
  calculateAttendanceSummary(attendance) {
    return {
      total: attendance.length,
      present: attendance.filter(a => 
        a.status === 'present' || a.status === 'late'
      ).length,
      late: attendance.filter(a => a.isLate).length,
      absent: attendance.filter(a => a.status === 'absent').length,
      halfDay: attendance.filter(a => a.status === 'half-day').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0),
      totalOvertime: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
    };
  }

  // Calculate leave summary
  calculateLeaveSummary(leaves, startDate, endDate) {
    const summary = {
      paid: 0,
      unpaid: 0,
      sick: 0,
      total: 0
    };

    leaves.forEach(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      // Calculate days within the month
      const start = leaveStart < startDate ? startDate : leaveStart;
      const end = leaveEnd > endDate ? endDate : leaveEnd;
      
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      summary[leave.type] += days;
      summary.total += days;
    });

    return summary;
  }

  // Calculate overtime
  calculateOvertime(attendance, settings) {
    let totalHours = 0;
    
    attendance.forEach(record => {
      if (record.overtime) {
        totalHours += record.overtime;
      }
    });

    const rate = settings.payrollRules?.overtimeRate || 1.5;

    return {
      hours: totalHours,
      rate,
      amount: totalHours * rate * (settings.payrollRules?.overtimePayRate || 100)
    };
  }

  // Calculate deductions
  calculateDeductions(attendance, leaveSummary, perDaySalary, settings) {
    let latePenalty = 0;
    let halfDayPenalty = 0;

    attendance.forEach(record => {
      if (record.isLate) {
        latePenalty += settings.payrollRules?.latePenalty || 100;
      }
      
      if (record.status === 'half-day') {
        halfDayPenalty += perDaySalary / 2;
      }
    });

    // Smart rule: 3 late = 1 half day
    if (settings.payrollRules?.smartLateRule) {
      const lateCount = attendance.filter(a => a.isLate).length;
      const latesForHalfDay = settings.payrollRules?.latesForHalfDay || 3;
      const extraHalfDays = Math.floor(lateCount / latesForHalfDay);
      
      if (extraHalfDays > 0) {
        halfDayPenalty += extraHalfDays * (perDaySalary / 2);
      }
    }

    // Tax deduction
    const tax = this.calculateTax(attendance, leaveSummary, perDaySalary, settings);

    // Provident Fund
    const providentFund = settings.payrollRules?.taxRules?.providentFund 
      ? (attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0) * 
         settings.payrollRules.taxRules.pfPercentage / 100)
      : 0;

    return {
      latePenalty,
      halfDayPenalty,
      tax,
      providentFund,
      otherDeductions: 0,
      total: latePenalty + halfDayPenalty + tax + providentFund
    };
  }

  // Calculate tax
  calculateTax(attendance, leaveSummary, perDaySalary, settings) {
    if (!settings.payrollRules?.taxRules?.taxDeduction) {
      return 0;
    }

    const taxableIncome = attendance.reduce((sum, a) => 
      sum + (a.totalWorkingHours || 0) * perDaySalary, 0
    ) - (leaveSummary.unpaid * perDaySalary);

    return taxableIncome * (settings.payrollRules.taxRules.taxPercentage / 100);
  }

  // Calculate allowances
  calculateAllowances(basicSalary, settings) {
    // Default allowances (can be customized in settings)
    const houseRent = basicSalary * 0.4; // 40% HRA
    const conveyance = 1600; // Fixed
    const medical = 1250; // Fixed

    return {
      houseRent,
      conveyance,
      medical,
      special: 0,
      total: houseRent + conveyance + medical
    };
  }

  // Calculate salary for all employees
  async calculateAllEmployees(month, year) {
    await this.initialize();

    const employees = await User.find({ 
      role: 'employee', 
      isActive: true 
    });

    const results = [];
    const errors = [];

    for (const employee of employees) {
      try {
        const salary = await this.calculateMonthlySalary(
          employee._id, 
          month, 
          year, 
          this.settings
        );
        
        // Save or update payroll
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          month,
          year
        });

        let payroll;
        if (existingPayroll) {
          payroll = await Payroll.findByIdAndUpdate(
            existingPayroll._id,
            salary,
            { new: true }
          );
        } else {
          payroll = await Payroll.create(salary);
        }

        results.push({
          employee: employee.name,
          payrollId: payroll._id,
          netPayable: payroll.netPayable
        });
      } catch (error) {
        errors.push({
          employee: employee.name,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  // Calculate yearly summary
  async calculateYearlySummary(employeeId, year) {
    const payrolls = await Payroll.find({
      employee: employeeId,
      year
    }).sort({ month: 1 });

    const summary = {
      year,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      totalOvertime: 0,
      monthly: []
    };

    payrolls.forEach(payroll => {
      summary.totalGross += payroll.grossPay || 0;
      summary.totalDeductions += payroll.deductions?.total || 0;
      summary.totalNet += payroll.netPayable || 0;
      summary.totalOvertime += payroll.overtime?.hours || 0;
      
      summary.monthly.push({
        month: payroll.month,
        grossPay: payroll.grossPay,
        deductions: payroll.deductions?.total,
        netPayable: payroll.netPayable
      });
    });

    return summary;
  }

  // Validate salary calculation
  validateCalculation(payroll) {
    const errors = [];

    if (payroll.netPayable < 0) {
      errors.push('Net payable cannot be negative');
    }

    if (payroll.deductions.total > payroll.grossPay) {
      errors.push('Deductions cannot exceed gross pay');
    }

    if (payroll.workingDays < payroll.presentDays) {
      errors.push('Present days cannot exceed working days');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new SalaryCalculationService();