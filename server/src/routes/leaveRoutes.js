const express = require('express');
const leaveController = require('../controllers/leaveController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules
const leaveValidation = [
  body('type').isIn(['paid', 'unpaid', 'sick']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('reason').isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
  body('halfDay').optional().isBoolean()
];

// All routes require authentication
router.use(protect);

// Employee routes
router.post('/apply', validate(leaveValidation), leaveController.applyLeave);
router.get('/balance', leaveController.getLeaveBalance);
router.get('/history', leaveController.getLeaveHistory);
router.get('/my-leaves', leaveController.getMyLeaves);

// Admin routes
router.use(restrictTo('admin'));
router.get('/pending', leaveController.getPendingLeaves);
router.put('/:id/approve', leaveController.approveLeave);
router.put('/:id/reject', leaveController.rejectLeave);
router.get('/all', leaveController.getAllLeaves);

module.exports = router;