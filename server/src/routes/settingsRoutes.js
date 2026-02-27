const express = require('express');
const settingsController = require('../controllers/settingsController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, restrictTo('admin'));

// Settings routes
router.get('/company', settingsController.getCompanySettings);
router.put('/company', settingsController.updateCompanySettings);
router.get('/business-rules', settingsController.getBusinessRules);
router.put('/business-rules', settingsController.updateBusinessRules);
router.get('/holidays', settingsController.getHolidays);
router.post('/holidays', settingsController.addHoliday);
router.delete('/holidays/:id', settingsController.deleteHoliday);
router.get('/departments', settingsController.getDepartments);
router.post('/departments', settingsController.createDepartment);
router.put('/departments/:id', settingsController.updateDepartment);
router.delete('/departments/:id', settingsController.deleteDepartment);
router.get('/shifts', settingsController.getShifts);
router.post('/shifts', settingsController.createShift);
router.put('/shifts/:id', settingsController.updateShift);
router.delete('/shifts/:id', settingsController.deleteShift);

module.exports = router;