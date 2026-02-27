const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules
const userValidation = [
  body('name').optional().isLength({ min: 2 }),
  body('email').optional().isEmail(),
  body('phone').optional().isMobilePhone(),
  body('department').optional().isMongoId(),
  body('shift').optional().isMongoId(),
  body('position').optional().isString(),
  body('basicSalary').optional().isNumeric()
];

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', userController.getProfile);
router.patch('/profile', validate(userValidation), userController.updateProfile);

// Admin routes
router.use(restrictTo('admin'));
router.get('/', userController.getAllUsers);
router.get('/employees', userController.getEmployees);
router.post('/', validate(userValidation), userController.createUser);
router.get('/:id', userController.getUser);
router.patch('/:id', validate(userValidation), userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/:id/deactivate', userController.deactivateUser);
router.post('/:id/activate', userController.activateUser);
router.get('/department/:departmentId', userController.getUsersByDepartment);

module.exports = router;