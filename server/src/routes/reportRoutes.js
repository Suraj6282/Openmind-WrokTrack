const express = require('express');
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, restrictTo('admin'));

// Report routes
router.get('/attendance', reportController.getAttendanceReport);
router.get('/payroll', reportController.getPayrollReport);
router.get('/leave', reportController.getLeaveReport);
router.get('/summary', reportController.getSummaryReport);
router.get('/export/attendance', reportController.exportAttendanceReport);
router.get('/export/payroll', reportController.exportPayrollReport);
router.get('/export/leave', reportController.exportLeaveReport);
router.get('/dashboard', reportController.getDashboardStats);

module.exports = router;