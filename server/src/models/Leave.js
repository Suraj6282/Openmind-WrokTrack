const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['paid', 'unpaid', 'sick'],
    required: [true, 'Leave type is required'],
    index: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  days: {
    type: Number,
    required: [true, 'Number of days is required'],
    min: 0.5
  },
  halfDay: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  documents: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  contactDuringLeave: {
    phone: String,
    email: String,
    address: String
  },
  handoverNotes: String,
  workReliever: {
    name: String,
    position: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
leaveSchema.index({ employee: 1, startDate: -1 });
leaveSchema.index({ status: 1, startDate: 1 });

// Validate dates
leaveSchema.pre('validate', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Calculate days before saving
leaveSchema.pre('save', function(next) {
  if (!this.days) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.days = this.halfDay ? diffDays - 0.5 : diffDays;
  }
  next();
});

// Method to check if leave is overlapping
leaveSchema.methods.isOverlapping = async function() {
  const overlapping = await this.constructor.findOne({
    employee: this.employee,
    status: { $in: ['pending', 'approved'] },
    _id: { $ne: this._id },
    $or: [
      {
        startDate: { $lte: this.endDate },
        endDate: { $gte: this.startDate }
      }
    ]
  });
  return !!overlapping;
};

// Method to approve leave
leaveSchema.methods.approve = async function(approverId) {
  this.status = 'approved';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  await this.save();
  return this;
};

// Method to reject leave
leaveSchema.methods.reject = async function(approverId, reason) {
  this.status = 'rejected';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
  return this;
};

// Static method to get pending leaves count
leaveSchema.statics.getPendingCount = async function() {
  return this.countDocuments({ status: 'pending' });
};

// Static method to get leave balance
leaveSchema.statics.getBalance = async function(employeeId, year) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  
  const leaves = await this.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        status: 'approved',
        startDate: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$days' }
      }
    }
  ]);

  const balance = {
    paid: { total: 12, used: 0, remaining: 12 },
    sick: { total: 6, used: 0, remaining: 6 },
    unpaid: { total: Infinity, used: 0, remaining: Infinity }
  };

  leaves.forEach(item => {
    if (balance[item._id]) {
      balance[item._id].used = item.total;
      balance[item._id].remaining = balance[item._id].total - item.total;
    }
  });

  return balance;
};

// Static method to get upcoming leaves
leaveSchema.statics.getUpcoming = async function(days = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return this.find({
    status: 'approved',
    startDate: { $gte: today, $lte: futureDate }
  })
  .populate('employee', 'name email department')
  .sort({ startDate: 1 });
};

const Leave = mongoose.model('Leave', leaveSchema);
module.exports = Leave;