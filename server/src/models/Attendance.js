const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
    index: true
  },
  checkIn: {
    time: {
      type: Date,
      required: [true, 'Check-in time is required']
    },
    location: {
      lat: Number,
      lng: Number
    },
    ipAddress: String,
    deviceId: String,
    photo: String
  },
  checkOut: {
    time: Date,
    location: {
      lat: Number,
      lng: Number
    },
    ipAddress: String,
    deviceId: String,
    photo: String
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    location: {
      lat: Number,
      lng: Number
    }
  }],
  totalBreakDuration: {
    type: Number,
    default: 0, // in minutes
    min: 0
  },
  totalWorkingHours: {
    type: Number,
    default: 0, // in hours
    min: 0
  },
  overtime: {
    type: Number,
    default: 0, // in hours
    min: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'holiday', 'leave'],
    default: 'absent',
    index: true
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  earlyCheckout: {
    type: Boolean,
    default: false
  },
  earlyCheckoutMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationMethod: {
    type: String,
    enum: ['auto', 'manual', 'geo', 'device', 'face']
  },
  verifiedAt: Date,
  ipLogs: [{
    ip: String,
    timestamp: Date,
    action: String
  }],
  locationLogs: [{
    lat: Number,
    lng: Number,
    timestamp: Date,
    action: String
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient queries
attendanceSchema.index({ employee: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ 'checkIn.deviceId': 1 });

// Calculate total working hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn.time).getTime();
    const checkOutTime = new Date(this.checkOut.time).getTime();
    const totalMinutes = (checkOutTime - checkInTime) / (1000 * 60);
    
    this.totalWorkingHours = (totalMinutes - this.totalBreakDuration) / 60;
    this.totalWorkingHours = Math.max(0, this.totalWorkingHours);
    
    // Calculate overtime (assuming 8 hours is standard)
    this.overtime = Math.max(0, this.totalWorkingHours - 8);
  }
  next();
});

// Method to check if attendance is tampered
attendanceSchema.methods.checkTampering = function() {
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn.time);
    const checkOutTime = new Date(this.checkOut.time);
    
    if (checkOutTime <= checkInTime) {
      return true;
    }
    
    for (const breakItem of this.breaks) {
      if (breakItem.endTime && breakItem.startTime) {
        if (new Date(breakItem.endTime) <= new Date(breakItem.startTime)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Method to get total break time
attendanceSchema.methods.getTotalBreakTime = function() {
  return this.breaks.reduce((total, b) => {
    if (b.duration) return total + b.duration;
    if (b.endTime && b.startTime) {
      return total + (new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60);
    }
    return total;
  }, 0);
};

// Method to check if currently on break
attendanceSchema.methods.isOnBreak = function() {
  return this.breaks.some(b => !b.endTime);
};

// Static method to get attendance for date range
attendanceSchema.statics.getForDateRange = async function(employeeId, startDate, endDate) {
  return this.find({
    employee: employeeId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });
};

// Static method to get monthly summary
attendanceSchema.statics.getMonthlySummary = async function(employeeId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const records = await this.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate }
  });

  return {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    halfDay: records.filter(r => r.status === 'half-day').length,
    totalHours: records.reduce((sum, r) => sum + (r.totalWorkingHours || 0), 0),
    totalOvertime: records.reduce((sum, r) => sum + (r.overtime || 0), 0)
  };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;