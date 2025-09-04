const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Validation rules for user login
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Validation rules for task creation
const validateCreateTask = [
  body('heading')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Heading must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
];

// Validation rules for task status update
const validateTaskStatus = [
  body('status')
    .isIn(['TO_DO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Status must be TO_DO, IN_PROGRESS, or DONE'),
];

// Middleware to check for validation errors
const handleValidationErrors = (req, res, next) => {
  console.log('Validation middleware - checking for errors...');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors found:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  console.log('Validation passed, proceeding...');
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateTask,
  validateTaskStatus,
  handleValidationErrors
};
