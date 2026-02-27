const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  employeeCount: {
    type: Number,
    default: 0
  },
  budget: {
    type: Number,
    default: 0
  },
  location: String,
  contactEmail: String,
  contactPhone: String,
  isActive: {
    type: Boolean,
    default: true
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

// Virtual for employees
departmentSchema.virtual('employees', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department'
});

// Update employee count
departmentSchema.methods.updateEmployeeCount = async function() {
  const count = await mongoose.model('User').countDocuments({ 
    department: this._id,
    role: 'employee',
    isActive: true 
  });
  this.employeeCount = count;
  await this.save();
  return count;
};

// Static method to get department stats
departmentSchema.statics.getDepartmentStats = async function() {
  const stats = await this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'department',
        as: 'employees'
      }
    },
    {
      $project: {
        name: 1,
        employeeCount: { $size: '$employees' },
        activeEmployees: {
          $size: {
            $filter: {
              input: '$employees',
              as: 'emp',
              cond: { $eq: ['$$emp.isActive', true] }
            }
          }
        }
      }
    }
  ]);
  
  return stats;
};

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;