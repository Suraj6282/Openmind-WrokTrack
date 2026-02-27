const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  companyEmail: {
    type: String,
    required: [true, 'Company email is required'],
    lowercase: true,
    trim: true
  },
  companyPhone: {
    type: String,
    required: [true, 'Company phone is required']
  },
  companyAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  companyLogo: {
    type: String,
    default: 'https://via.placeholder.com/200'
  },
  companyWebsite: String,
  taxId: String,
  registrationNumber: String,
  
  // Geo-fence settings
  geoFence: {
    enabled: {
      type: Boolean,
      default: true
    },
    radius: {
      type: Number,
      default: 100, // meters
      min: 10
    },
    companyLocation: {
      lat: {
        type: Number,
        required: true,
        default: 23.032546
      },
      lng: {
        type: Number,
        required: true,
        default: 72.5030202
      }
    },
    restrictedZones: [{
      name: String,
      location: {
        lat: Number,
        lng: Number
      },
      radius: Number
    }]
  },
  
  // Attendance rules
  attendanceRules: {
    graceTime: {
      type: Number,
      default: 15, // minutes
      min: 0
    },
    earlyCheckout: {
      type: Boolean,
      default: true
    },
    halfDayThreshold: {
      type: Number,
      default: 4, // hours
      min: 1
    },
    overtimeThreshold: {
      type: Number,
      default: 8, // hours
      min: 1
    },
    allowRemoteCheckIn: {
      type: Boolean,
      default: false
    },
    requirePhoto: {
      type: Boolean,
      default: false
    },
    breakRules: {
      minBreakDuration: {
        type: Number,
        default: 30, // minutes
        min: 0
      },
      maxBreakDuration: {
        type: Number,
        default: 60, // minutes
        min: 0
      },
      breaksPerDay: {
        type: Number,
        default: 2,
        min: 0
      }
    }
  },
  
  // Payroll rules
  payrollRules: {
    overtimeRate: {
      type: Number,
      default: 1.5,
      min: 1
    },
    latePenalty: {
      type: Number,
      default: 100,
      min: 0
    },
    halfDayPenalty: {
      type: Number,
      default: 0.5, // half day salary deduction
      min: 0
    },
    smartLateRule: {
      type: Boolean,
      default: true
    },
    latesForHalfDay: {
      type: Number,
      default: 3,
      min: 1
    },
    salaryLockAfterApproval: {
      type: Boolean,
      default: true
    },
    autoGenerateSalary: {
      type: Boolean,
      default: false
    },
    salaryGenerationDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 31
    },
    currency: {
      type: String,
      default: 'INR'
    },
    taxRules: {
      taxDeduction: {
        type: Boolean,
        default: false
      },
      taxPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      providentFund: {
        type: Boolean,
        default: false
      },
      pfPercentage: {
        type: Number,
        default: 12,
        min: 0,
        max: 100
      }
    }
  },
  
  // Leave rules
  leaveRules: {
    paidLeavesPerYear: {
      type: Number,
      default: 12,
      min: 0
    },
    sickLeavesPerYear: {
      type: Number,
      default: 6,
      min: 0
    },
    unpaidLeavesAllowed: {
      type: Boolean,
      default: true
    },
    carryForward: {
      type: Boolean,
      default: true
    },
    maxCarryForward: {
      type: Number,
      default: 5,
      min: 0
    },
    minDaysBeforeApply: {
      type: Number,
      default: 2,
      min: 0
    },
    maxConsecutiveLeaves: {
      type: Number,
      default: 15,
      min: 1
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    approvalLevels: {
      type: Number,
      default: 1,
      min: 1,
      max: 3
    }
  },
  
  // Holiday settings
  holidays: [{
    name: String,
    date: Date,
    type: {
      type: String,
      enum: ['national', 'company', 'optional'],
      default: 'company'
    },
    recurring: {
      type: Boolean,
      default: false
    }
  }],
  
  // Notification settings
  notifications: {
    email: {
      enabled: { type: Boolean, default: true },
      smtpHost: String,
      smtpPort: Number,
      smtpUser: String,
      smtpPass: String
    },
    sms: {
      enabled: { type: Boolean, default: false },
      provider: String,
      apiKey: String
    },
    push: {
      enabled: { type: Boolean, default: true },
      vapidPublicKey: String,
      vapidPrivateKey: String
    }
  },
  
  // Security settings
  security: {
    twoFactorAuth: {
      enabled: { type: Boolean, default: false }
    },
    sessionTimeout: {
      type: Number,
      default: 30, // minutes
      min: 5
    },
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: true },
      expiryDays: { type: Number, default: 90 }
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 30 // minutes
    }
  },
  
  // Business hours
  businessHours: {
    monday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      isWorking: { type: Boolean, default: true }
    },
    tuesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      isWorking: { type: Boolean, default: true }
    },
    wednesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      isWorking: { type: Boolean, default: true }
    },
    thursday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      isWorking: { type: Boolean, default: true }
    },
    friday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      isWorking: { type: Boolean, default: true }
    },
    saturday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      isWorking: { type: Boolean, default: false }
    },
    sunday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
      isWorking: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
companySettingsSchema.pre('save', async function(next) {
  const count = await this.constructor.countDocuments();
  if (count > 0 && this.isNew) {
    next(new Error('Only one company settings document can exist'));
  }
  next();
});

// Method to get business hours for a specific day
companySettingsSchema.methods.getBusinessHours = function(day) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return this.businessHours[days[day]] || { isWorking: false };
};

// Method to check if a date is a holiday
companySettingsSchema.methods.isHoliday = function(date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return this.holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate.getTime() === checkDate.getTime();
  });
};

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);
module.exports = CompanySettings;