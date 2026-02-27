const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  nationality: String,
  
  // Contact Information
  personalEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  workEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  personalPhone: String,
  workPhone: String,
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  
  // Address
  currentAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  permanentAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Employment Details
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  position: String,
  jobTitle: String,
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  joinDate: Date,
  confirmationDate: Date,
  exitDate: Date,
  resignationDate: Date,
  terminationReason: String,
  
  // Compensation
  basicSalary: {
    type: Number,
    min: 0
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  allowances: {
    houseRent: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    special: { type: Number, default: 0 }
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    ifscCode: String,
    branch: String
  },
  
  // Tax Information
  panNumber: String,
  aadharNumber: String,
  uanNumber: String,
  pfNumber: String,
  esiNumber: String,
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['resume', 'offerLetter', 'contract', 'idProof', 'addressProof', 'education', 'other']
    },
    name: String,
    url: String,
    uploadedAt: Date
  }],
  
  // Skills & Education
  skills: [String],
  education: [{
    degree: String,
    institution: String,
    year: Number,
    percentage: Number
  }],
  experience: [{
    company: String,
    position: String,
    from: Date,
    to: Date,
    responsibilities: String
  }],
  
  // System fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
employeeSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for years of service
employeeSchema.virtual('yearsOfService').get(function() {
  if (!this.joinDate) return 0;
  const today = new Date();
  const join = new Date(this.joinDate);
  const years = (today - join) / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(years);
});

// Indexes
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ 'bankDetails.accountNumber': 1 });

// Pre-save middleware
employeeSchema.pre('save', function(next) {
  // Generate employee ID if not provided
  if (!this.employeeId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.employeeId = `EMP${year}${random}`;
  }
  next();
});

// Method to get full profile
employeeSchema.methods.getFullProfile = async function() {
  await this.populate('user', 'email role isActive lastLogin')
               .populate('department', 'name manager')
               .populate('shift', 'name startTime endTime')
               .execPopulate();
  return this;
};

// Static method to get employees by department
employeeSchema.statics.getByDepartment = async function(departmentId) {
  return this.find({ department: departmentId })
    .populate('user', 'email')
    .populate('shift', 'name');
};

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;