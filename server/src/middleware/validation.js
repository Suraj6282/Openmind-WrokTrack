const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Validate request
exports.validate = (validations) => {
  return async (req, res, next) => {
    // Run validations
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    // Check for errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));

    return next(new AppError('Validation failed', 400, formattedErrors));
  };
};

// Sanitize input
exports.sanitize = (fields) => {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = req.body[field].trim();
      }
    });
    next();
  };
};

// Validate MongoDB ID
exports.validateId = (req, res, next) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new AppError('Invalid ID format', 400));
  }
  next();
};

// Validate date range
exports.validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }
    
    if (end < start) {
      return next(new AppError('End date must be after start date', 400));
    }
  }
  
  next();
};

// Validate pagination
exports.validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) req.query.page = 1;
  if (limit < 1) req.query.limit = 10;
  if (limit > 100) req.query.limit = 100;
  
  next();
};