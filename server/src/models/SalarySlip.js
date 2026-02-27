const mongoose = require('mongoose');

const salarySlipSchema = new mongoose.Schema({
  payroll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payroll',
    required: true,
    unique: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  slipNumber: {
    type: String,
    required: true,
    unique: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Employee details (snapshot at time of generation)
  employeeDetails: {
    name: String,
    employeeId: String,
    department: String,
    designation: String,
    panNumber: String,
    bankName: String,
    bankAccount: String,
    ifscCode: String
  },
  
  // Company details
  companyDetails: {
    name: String,
    address: String,
    email: String,
    phone: String,
    gstNumber: String,
    panNumber: String
  },
  
  // Earnings breakdown
  earnings: {
    basic: { type: Number, required: true },
    houseRent: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    special: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  
  // Deductions breakdown
  deductions: {
    providentFund: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    latePenalty: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  
  // Attendance summary
  attendance: {
    workingDays: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    absentDays: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 }
  },
  
  // Financial summary
  grossPay: { type: Number, required: true },
  netPayable: { type: Number, required: true },
  amountInWords: String,
  
  // Signatures
  signatures: {
    employee: {
      signed: { type: Boolean, default: false },
      signatureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signature' },
      signedAt: Date,
      ipAddress: String,
      deviceId: String
    },
    admin: {
      signed: { type: Boolean, default: false },
      signatureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signature' },
      signedAt: Date,
      ipAddress: String,
      deviceId: String,
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  },
  
  // PDF storage
  pdfUrl: String,
  pdfGeneratedAt: Date,
  
  // Status
  isLocked: {
    type: Boolean,
    default: false
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  downloadedAt: Date,
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
salarySlipSchema.index({ employee: 1, year: -1, month: -1 });
salarySlipSchema.index({ slipNumber: 1 });
salarySlipSchema.index({ 'signatures.employee.signed': 1 });
salarySlipSchema.index({ 'signatures.admin.signed': 1 });

// Generate slip number before saving
salarySlipSchema.pre('save', async function(next) {
  if (!this.slipNumber) {
    const year = this.year.toString().slice(-2);
    const month = this.month.toString().padStart(2, '0');
    const count = await this.constructor.countDocuments() + 1;
    this.slipNumber = `SLIP${year}${month}${count.toString().padStart(4, '0')}`;
  }
  next();
});

// Convert amount to words before saving
salarySlipSchema.pre('save', function(next) {
  this.amountInWords = numberToWords(this.netPayable);
  next();
});

// Method to add employee signature
salarySlipSchema.methods.addEmployeeSignature = async function(signatureId, ipAddress, deviceId) {
  this.signatures.employee = {
    signed: true,
    signatureId,
    signedAt: new Date(),
    ipAddress,
    deviceId
  };
  await this.save();
  return this;
};

// Method to add admin signature
salarySlipSchema.methods.addAdminSignature = async function(signatureId, adminId, ipAddress, deviceId) {
  this.signatures.admin = {
    signed: true,
    signatureId,
    signedAt: new Date(),
    ipAddress,
    deviceId,
    adminId
  };
  await this.save();
  return this;
};

// Method to lock slip
salarySlipSchema.methods.lock = async function() {
  this.isLocked = true;
  await this.save();
  return this;
};

// Method to mark as downloaded
salarySlipSchema.methods.markDownloaded = async function() {
  this.isDownloaded = true;
  this.downloadedAt = new Date();
  await this.save();
  return this;
};

// Static method to get pending signatures
salarySlipSchema.statics.getPendingSignatures = async function() {
  return this.find({
    $or: [
      { 'signatures.employee.signed': false },
      { 'signatures.admin.signed': false }
    ],
    isLocked: false
  }).populate('employee', 'name email');
};

// Helper function to convert number to words
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let words = numToWords(rupees) + ' Rupees';
  if (paise > 0) {
    words += ' and ' + numToWords(paise) + ' Paise';
  }
  
  return words;
}

const SalarySlip = mongoose.model('SalarySlip', salarySlipSchema);
module.exports = SalarySlip;