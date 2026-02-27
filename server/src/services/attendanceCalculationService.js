const Attendance = require('../models/Attendance');
const CompanySettings = require('../models/CompanySettings');
const { differenceInMinutes, differenceInHours, isWeekend } = require('date-fns');

class AttendanceCalculationService {
  constructor() {
    this.settings = null;
  }

  async initialize() {
    if (!this.settings) {
      this.settings = await CompanySettings.findOne();
    }
    return this.settings;
  }

  // Calculate working hours
  calculateWorkingHours(checkIn, checkOut, breaks = []) {
    if (!checkIn || !checkOut) return 0;

    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = new Date(checkOut).getTime();
    
    const totalMinutes = (checkOutTime - checkInTime) / (1000 * 60);
    const breakMinutes = this.calculateTotalBreakMinutes(breaks);
    
    return Math.max(0, (totalMinutes - breakMinutes) / 60);
  }

  // Calculate total break minutes
  calculateTotalBreakMinutes(breaks) {
    return breaks.reduce((total, breakItem) => {
      if (breakItem.endTime && breakItem.startTime) {
        return total + differenceInMinutes(
          new Date(breakItem.endTime),
          new Date(breakItem.startTime)
        );
      }
      return total;
    }, 0);
  }

  // Check if late
  checkLate(checkInTime, shiftStartTime, graceTime = 15) {
    const checkIn = new Date(checkInTime);
    const shiftStart = new Date(shiftStartTime);
    
    const minutesLate = differenceInMinutes(checkIn, shiftStart);
    return {
      isLate: minutesLate > graceTime,
      lateMinutes: Math.max(0, minutesLate)
    };
  }

  // Check if early checkout
  checkEarlyCheckout(checkOutTime, shiftEndTime, graceTime = 15) {
    const checkOut = new Date(checkOutTime);
    const shiftEnd = new Date(shiftEndTime);
    
    const minutesEarly = differenceInMinutes(shiftEnd, checkOut);
    return {
      isEarly: minutesEarly > graceTime,
      earlyMinutes: Math.max(0, minutesEarly)
    };
  }

  // Calculate overtime
  calculateOvertime(workingHours, standardHours = 8) {
    return Math.max(0, workingHours - standardHours);
  }

  // Determine attendance status
  determineStatus(workingHours, isLate, isHoliday, isLeave, halfDayThreshold = 4) {
    if (isHoliday) return 'holiday';
    if (isLeave) return 'leave';
    if (workingHours >= 8) return isLate ? 'late' : 'present';
    if (workingHours >= halfDayThreshold) return 'half-day';
    return 'absent';
  }

  // Calculate monthly summary
  async calculateMonthlySummary(employeeId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    const summary = {
      total: records.length,
      present: 0,
      late: 0,
      absent: 0,
      halfDay: 0,
      holiday: 0,
      leave: 0,
      totalHours: 0,
      totalOvertime: 0,
      byWeek: {}
    };

    records.forEach(record => {
      // Count by status
      switch (record.status) {
        case 'present':
          summary.present++;
          break;
        case 'late':
          summary.late++;
          break;
        case 'absent':
          summary.absent++;
          break;
        case 'half-day':
          summary.halfDay++;
          break;
        case 'holiday':
          summary.holiday++;
          break;
        case 'leave':
          summary.leave++;
          break;
      }

      // Sum hours
      summary.totalHours += record.totalWorkingHours || 0;
      summary.totalOvertime += record.overtime || 0;

      // Group by week
      const weekNumber = this.getWeekNumber(record.date);
      if (!summary.byWeek[weekNumber]) {
        summary.byWeek[weekNumber] = {
          present: 0,
          late: 0,
          absent: 0,
          hours: 0
        };
      }
      
      if (record.status === 'present' || record.status === 'late') {
        summary.byWeek[weekNumber].present++;
      } else if (record.status === 'absent') {
        summary.byWeek[weekNumber].absent++;
      }
      summary.byWeek[weekNumber].hours += record.totalWorkingHours || 0;
    });

    return summary;
  }

  // Calculate attendance percentage
  calculateAttendancePercentage(records, workingDays) {
    const present = records.filter(r => 
      r.status === 'present' || r.status === 'late'
    ).length;
    
    return workingDays > 0 ? (present / workingDays) * 100 : 0;
  }

  // Calculate late count with smart rule
  calculateLatePenalty(lateRecords, rule = '3 late = 1 half day') {
    const lateCount = lateRecords.length;
    const halfDayEquivalent = Math.floor(lateCount / 3);
    
    return {
      lateCount,
      halfDayEquivalent,
      penaltyDays: halfDayEquivalent * 0.5
    };
  }

  // Get week number from date
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Validate attendance record
  validateAttendance(attendance) {
    const errors = [];

    if (attendance.checkIn && attendance.checkOut) {
      if (new Date(attendance.checkOut.time) <= new Date(attendance.checkIn.time)) {
        errors.push('Check-out time must be after check-in time');
      }
    }

    if (attendance.breaks) {
      attendance.breaks.forEach((breakItem, index) => {
        if (breakItem.startTime && breakItem.endTime) {
          if (new Date(breakItem.endTime) <= new Date(breakItem.startTime)) {
            errors.push(`Break #${index + 1}: End time must be after start time`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check for duplicate attendance
  async checkDuplicate(employeeId, date) {
    const existing = await Attendance.findOne({
      employee: employeeId,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lte: new Date(date).setHours(23, 59, 59, 999)
      }
    });

    return !!existing;
  }

  // Calculate working days in month (excluding weekends and holidays)
  async calculateWorkingDays(year, month) {
    await this.initialize();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const workingDays = [];
    const holidays = this.settings?.holidays || [];

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip weekends if configured
      if (!this.settings?.attendanceRules?.includeWeekends && isWeekend(date)) {
        continue;
      }

      // Skip holidays
      const isHoliday = holidays.some(h => 
        new Date(h.date).toDateString() === date.toDateString()
      );

      if (!isHoliday) {
        workingDays.push(new Date(date));
      }
    }

    return workingDays.length;
  }
}

module.exports = new AttendanceCalculationService();