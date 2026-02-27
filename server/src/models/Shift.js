const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shift name is required'],
    unique: true,
    trim: true
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
  },
  breakDuration: {
    type: Number,
    default: 60, // minutes
    min: 0
  },
  workingHours: {
    type: Number,
    required: true,
    min: 1
  },
  graceTime: {
    type: Number,
    default: 15, // minutes
    min: 0
  },
  overtimeAllowed: {
    type: Boolean,
    default: true
  },
  maxOvertime: {
    type: Number,
    default: 4, // hours
    min: 0
  },
  applicableDays: [{
    type: Number,
    min: 0,
    max: 6,
    default: [1, 2, 3, 4, 5] // Monday to Friday
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  description: String,
  color: {
    type: String,
    default: '#2563eb'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Validate that end time is after start time
shiftSchema.pre('save', function(next) {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  if (endMinutes <= startMinutes) {
    next(new Error('End time must be after start time'));
  }
  
  // Calculate working hours if not provided
  if (!this.workingHours) {
    this.workingHours = (endMinutes - startMinutes - this.breakDuration) / 60;
  }
  
  next();
});

// Method to check if current time is within shift
shiftSchema.methods.isWithinShift = function(time = new Date()) {
  const currentHours = time.getHours();
  const currentMinutes = time.getMinutes();
  const currentTime = currentHours * 60 + currentMinutes;
  
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return currentTime >= startMinutes && currentTime <= endMinutes;
};

// Method to calculate overtime
shiftSchema.methods.calculateOvertime = function(checkIn, checkOut) {
  if (!this.overtimeAllowed) return 0;
  
  const shiftEnd = new Date(checkOut);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  shiftEnd.setHours(endHour, endMin, 0);
  
  if (checkOut > shiftEnd) {
    const overtimeMs = checkOut - shiftEnd;
    const overtimeHours = overtimeMs / (1000 * 60 * 60);
    return Math.min(overtimeHours, this.maxOvertime);
  }
  
  return 0;
};

// Static method to get active shifts
shiftSchema.statics.getActiveShifts = function() {
  return this.find({ isActive: true }).sort({ startTime: 1 });
};

const Shift = mongoose.model('Shift', shiftSchema);
module.exports = Shift;