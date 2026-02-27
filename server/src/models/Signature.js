const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payroll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payroll',
    required: true
  },
  type: {
    type: String,
    enum: ['employee', 'admin'],
    required: true
  },
  image: {
    type: String,
    required: [true, 'Signature image is required']
  },
  hash: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  location: {
    lat: Number,
    lng: Number
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationMethod: {
    type: String,
    enum: ['auto', 'manual', 'biometric']
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
signatureSchema.index({ user: 1, createdAt: -1 });
signatureSchema.index({ payroll: 1 });
signatureSchema.index({ hash: 1 }, { unique: true });

// Generate hash from signature data
signatureSchema.pre('save', async function(next) {
  if (this.isModified('image')) {
    const crypto = require('crypto');
    this.hash = crypto
      .createHash('sha256')
      .update(this.image + this.user + this.timestamp)
      .digest('hex');
  }
  next();
});

// Verify signature integrity
signatureSchema.methods.verifyIntegrity = function() {
  const crypto = require('crypto');
  const calculatedHash = crypto
    .createHash('sha256')
    .update(this.image + this.user + this.createdAt)
    .digest('hex');
  
  return calculatedHash === this.hash;
};

// Mark as verified
signatureSchema.methods.verify = async function(verifierId, method = 'auto') {
  this.verified = true;
  this.verifiedBy = verifierId;
  this.verifiedAt = new Date();
  this.verificationMethod = method;
  await this.save();
  return this;
};

// Static method to verify signature
signatureSchema.statics.verifySignature = async function(signatureId) {
  const signature = await this.findById(signatureId);
  if (!signature) {
    throw new Error('Signature not found');
  }
  
  return signature.verifyIntegrity();
};

// Static method to get signatures for payroll
signatureSchema.statics.getForPayroll = async function(payrollId) {
  return this.find({ payroll: payrollId }).populate('user', 'name email');
};

// Static method to get user signatures
signatureSchema.statics.getUserSignatures = async function(userId) {
  return this.find({ user: userId })
    .populate('payroll', 'month year')
    .sort({ createdAt: -1 });
};

const Signature = mongoose.model('Signature', signatureSchema);
module.exports = Signature;