const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules
const locationValidation = [
  body('location.lat').optional().isNumeric(),
  body('location.lng').optional().isNumeric(),
  body('deviceId').optional().isString()
];

// All routes require authentication
router.use(protect);

// Employee routes
router.post('/check-in', validate(locationValidation), attendanceController.checkIn);
router.post('/check-out', validate(locationValidation), attendanceController.checkOut);
router.post('/break/start', validate(locationValidation), attendanceController.startBreak);
router.post('/break/end', validate(locationValidation), attendanceController.endBreak);
router.get('/today', attendanceController.getTodayAttendance);
router.get('/history', attendanceController.getAttendanceHistory);

// Admin routes
router.use(restrictTo('admin'));
router.get('/daily/:date?', attendanceController.getDailyAttendance);
router.post('/:id/verify', attendanceController.verifyAttendance);
router.get('/monthly/:year/:month', attendanceController.getMonthlyAttendance);

module.exports = router;