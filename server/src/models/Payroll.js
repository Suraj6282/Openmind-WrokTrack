const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required'],
    index: true
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12,
    index: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    index: true
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: 0
  },
  perDaySalary: {
    type: Number,
    required: true,
    min: 0
  },
  workingDays: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  presentDays: {
    type: Number,
    default: 0,
    min: 0
  },
  absentDays: {
    type: Number,
    default: 0,
    min: 0
  },
  leaves: {
    paid: { type: Number, default: 0, min: 0 },
    unpaid: { type: Number, default: 0, min: 0 },
    sick: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  overtime: {
    hours: { type: Number, default: 0, min: 0 },
    rate: { type: Number, default: 1.5, min: 1 },
    amount: { type: Number, default: 0, min: 0 }
  },
  deductions: {
    latePenalty: { type: Number, default: 0, min: 0 },
    halfDayPenalty: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    providentFund: { type: Number, default: 0, min: 0 },
    otherDeductions: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  allowances: {
    houseRent: { type: Number, default: 0, min: 0 },
    conveyance: { type: Number, default: 0, min: 0 },
    medical: { type: Number, default: 0, min: 0 },
    special: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  grossPay: {
    type: Number,
    default: 0,
    min: 0
  },
  netPayable: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'approved', 'locked', 'paid'],
    default: 'draft',
    index: true
  },
  isLocked: {
    type: Boolean,
    default: false,
    index: true
  },
  lockedAt: Date,
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: Date,
  paymentMethod: {
    type: String,
    enum: ['bank', 'cash', 'cheque'],
    default: 'bank'
  },
  paymentReference: String,
  paymentDetails: {
    transactionId: String,
    bankName: String,
    accountNumber: String,
    chequeNumber: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  salarySlip: {
    generated: { type: Boolean, default: false },
    generatedAt: Date,
    url: String,
    employeeSignature: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signature'
    },
    adminSignature: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signature'
    },
    signedAt: Date
  },
  notes: String,
  auditTrail: [{
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'CALCULATE', 'APPROVE', 'LOCK', 'PAY', 'SIGN']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    ipAddress: String,
    details: mongoose.Schema.Types.Mixed
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

// Compound unique index for employee+month+year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Calculate totals before saving
payrollSchema.pre('save', function(next) {
  // Calculate per day salary
  if (this.workingDays > 0) {
    this.perDaySalary = this.basicSalary / this.workingDays;
  }

  // Calculate leave total
  this.leaves.total = this.leaves.paid + this.leaves.unpaid + this.leaves.sick;

  // Calculate allowances total
  this.allowances.total = this.allowances.houseRent + 
                          this.allowances.conveyance + 
                          this.allowances.medical + 
                          this.allowances.special;

  // Calculate overtime amount
  this.overtime.amount = this.overtime.hours * this.overtime.rate * this.perDaySalary;

  // Calculate gross pay
  this.grossPay = this.basicSalary + this.allowances.total + this.overtime.amount;

  // Calculate deductions total
  this.deductions.total = this.deductions.latePenalty + 
                          this.deductions.halfDayPenalty + 
                          this.deductions.tax + 
                          this.deductions.providentFund + 
                          this.deductions.otherDeductions;

  // Calculate net payable
  const unpaidLeaveAmount = this.leaves.unpaid * this.perDaySalary;
  this.netPayable = this.grossPay - unpaidLeaveAmount - this.deductions.total;

  next();
});

// Method to lock payroll
payrollSchema.methods.lock = async function(userId, ipAddress) {
  if (this.isLocked) {
    throw new Error('Payroll is already locked');
  }

  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockedBy = userId;
  this.status = 'locked';

  this.auditTrail.push({
    action: 'LOCK',
    performedBy: userId,
    timestamp: new Date(),
    ipAddress,
    details: { message: 'Payroll locked' }
  });

  await this.save();
  return this;
};

// Method to approve payroll
payrollSchema.methods.approve = async function(userId, ipAddress) {
  if (this.status !== 'calculated') {
    throw new Error('Payroll must be in calculated state to approve');
  }

  this.status = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = userId;

  this.auditTrail.push({
    action: 'APPROVE',
    performedBy: userId,
    timestamp: new Date(),
    ipAddress,
    details: { message: 'Payroll approved' }
  });

  await this.save();
  return this;
};

// Method to mark as paid
payrollSchema.methods.markAsPaid = async function(paymentDetails, userId, ipAddress) {
  if (this.status !== 'approved' && this.status !== 'locked') {
    throw new Error('Payroll must be approved or locked to mark as paid');
  }

  this.status = 'paid';
  this.paidAt = new Date();
  this.paymentDetails = { ...paymentDetails, processedBy: userId };

  this.auditTrail.push({
    action: 'PAY',
    performedBy: userId,
    timestamp: new Date(),
    ipAddress,
    details: { paymentMethod: paymentDetails.method }
  });

  await this.save();
  return this;
};

// Method to add signature
payrollSchema.methods.addSignature = async function(signatureId, type, userId) {
  if (type === 'employee') {
    this.salarySlip.employeeSignature = signatureId;
  } else if (type === 'admin') {
    this.salarySlip.adminSignature = signatureId;
  }

  this.salarySlip.signedAt = new Date();

  this.auditTrail.push({
    action: 'SIGN',
    performedBy: userId,
    timestamp: new Date(),
    details: { signatureType: type }
  });

  await this.save();
  return this;
};

// Static method to get monthly summary
payrollSchema.statics.getMonthlySummary = async function(year, month) {
  const result = await this.aggregate([
    {
      $match: { year, month }
    },
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        totalGrossPay: { $sum: '$grossPay' },
        totalDeductions: { $sum: '$deductions.total' },
        totalNetPayable: { $sum: '$netPayable' },
        totalOvertime: { $sum: '$overtime.hours' },
        lockedCount: {
          $sum: { $cond: ['$isLocked', 1, 0] }
        },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        }
      }
    }
  ]);

  return result[0] || {
    totalEmployees: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPayable: 0,
    totalOvertime: 0,
    lockedCount: 0,
    paidCount: 0
  };
};

// Static method to get employee yearly summary
payrollSchema.statics.getYearlySummary = async function(employeeId, year) {
  return this.find({
    employee: employeeId,
    year
  }).sort({ month: 1 });
};

const Payroll = mongoose.model('Payroll', payrollSchema);
module.exports = Payroll;