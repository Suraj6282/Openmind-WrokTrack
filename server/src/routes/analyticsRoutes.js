const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee analytics
router.get('/my-stats', analyticsController.getMyStats);
router.get('/my-trends', analyticsController.getMyTrends);

// Admin analytics
router.use(restrictTo('admin'));
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/attendance-trends', analyticsController.getAttendanceTrends);
router.get('/payroll-summary', analyticsController.getPayrollSummary);
router.get('/leave-analytics', analyticsController.getLeaveAnalytics);
router.get('/department-performance', analyticsController.getDepartmentPerformance);
router.get('/employee-ranking', analyticsController.getEmployeeRanking);
router.get('/audit-summary', analyticsController.getAuditSummary);
router.get('/export', analyticsController.exportAnalytics);

module.exports = router;