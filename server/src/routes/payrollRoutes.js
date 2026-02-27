const express = require('express');
const payrollController = require('../controllers/payrollController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules
const payrollCalculationValidation = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month required'),
  body('year').isInt().withMessage('Valid year required')
];

const signatureValidation = [
  body('signatureId').isMongoId().withMessage('Valid signature ID required'),
  body('type').isIn(['employee', 'admin']).withMessage('Valid signature type required')
];

// All routes require authentication
router.use(protect);

// Employee routes
router.get('/history', payrollController.getPayrollHistory);
router.get('/slips', payrollController.getSalarySlips);
router.get('/slip/:id', payrollController.getSalarySlipById);
router.post('/:id/generate-slip', payrollController.generateSalarySlip);
router.post('/:id/add-signature', validate(signatureValidation), payrollController.addSignature);

// Admin routes
router.use(restrictTo('admin'));
router.post('/calculate', validate(payrollCalculationValidation), payrollController.calculateMonthlyPayroll);
router.get('/monthly/:year/:month', payrollController.getMonthlyPayrolls);
router.post('/:id/lock', payrollController.lockPayroll);
router.put('/:id/approve', payrollController.approvePayroll);
router.post('/bulk-calculate', payrollController.bulkCalculatePayroll);

module.exports = router;