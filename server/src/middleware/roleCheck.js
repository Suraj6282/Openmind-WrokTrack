const AppError = require('../utils/AppError');

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('This resource is only available to administrators', 403));
  }
  next();
};

// Check if user is employee
exports.isEmployee = (req, res, next) => {
  if (req.user.role !== 'employee') {
    return next(new AppError('This resource is only available to employees', 403));
  }
  next();
};

// Check if user is manager (admin or department manager)
exports.isManager = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user is department manager
  const { departmentId } = req.params;
  if (departmentId && req.user.department?.toString() === departmentId) {
    return next();
  }

  return next(new AppError('You do not have manager privileges', 403));
});

// Check if user owns the resource or is admin
exports.isOwnerOrAdmin = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceOwnerId = req.params[resourceField] || req.body[resourceField];
    
    if (req.user.role === 'admin' || req.user.id === resourceOwnerId) {
      return next();
    }
    
    return next(new AppError('You do not have permission to access this resource', 403));
  };
};

// Check if user has required permissions
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    // This would check against a permissions system
    // For now, only admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check employee permissions
    const employeePermissions = {
      'view_own_attendance': true,
      'mark_attendance': true,
      'apply_leave': true,
      'view_own_payroll': true,
      'sign_salary_slip': true,
      'view_own_profile': true
    };

    if (employeePermissions[permission]) {
      return next();
    }

    return next(new AppError(`You don't have permission: ${permission}`, 403));
  };
};

// Check if user can access employee data
exports.canAccessEmployeeData = (req, res, next) => {
  const targetUserId = req.params.id || req.body.employeeId;
  
  // Admin can access any employee data
  if (req.user.role === 'admin') {
    return next();
  }

  // Employees can only access their own data
  if (req.user.id === targetUserId) {
    return next();
  }

  // Check if user is manager of the employee's department
  if (req.user.role === 'manager') {
    // This would need department lookup
    return next();
  }

  return next(new AppError('You cannot access this employee\'s data', 403));
};

// Role-based rate limiting
exports.roleBasedRateLimit = (limits = { admin: 1000, manager: 500, employee: 100 }) => {
  return (req, res, next) => {
    const limit = limits[req.user.role] || limits.employee;
    
    // Implement rate limiting logic here
    // This would typically use Redis
    
    next();
  };
};

// Check if user can perform action on payroll
exports.canAccessPayroll = (req, res, next) => {
  const payrollId = req.params.id;
  
  // Admin can access all payrolls
  if (req.user.role === 'admin') {
    return next();
  }

  // Employees can only access their own payrolls
  // This would need to check if payroll belongs to user
  
  next();
};

// Check if user can approve requests
exports.canApprove = (req, res, next) => {
  // Only admin and managers can approve
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    return next();
  }
  
  return next(new AppError('You do not have approval权限', 403));
};

// Department-based access
exports.restrictToDepartment = (req, res, next) => {
  const departmentId = req.params.departmentId || req.body.departmentId;
  
  // Admin can access all departments
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user belongs to the department
  if (req.user.department?.toString() === departmentId) {
    return next();
  }

  return next(new AppError('You can only access your own department', 403));
};