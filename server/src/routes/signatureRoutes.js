const express = require('express');
const signatureController = require('../controllers/signatureController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules
const signatureValidation = [
  body('employeeId').isMongoId().withMessage('Valid employee ID required'),
  body('payrollId').isMongoId().withMessage('Valid payroll ID required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('type').isIn(['employee', 'admin']).withMessage('Valid signature type required'),
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('ipAddress').optional().isIP()
];

// All routes require authentication
router.use(protect);

// Signature routes
router.post('/save', validate(signatureValidation), signatureController.saveSignature);
router.get('/:id', signatureController.getSignature);
router.get('/user/:userId', signatureController.getUserSignatures);
router.post('/:id/verify', signatureController.verifySignature);

// Admin routes
router.use(restrictTo('admin'));
router.get('/payroll/:payrollId', signatureController.getPayrollSignatures);
router.post('/:id/manual-verify', signatureController.manualVerify);

module.exports = router;