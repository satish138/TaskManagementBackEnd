// const express = require('express');
// const { auth, adminAuth } = require('../middleware/auth');
// const {
//   validateCreateTask,
//   validateTaskStatus,
//   handleValidationErrors
// } = require('../middleware/validation');
// const {
//   getAllTasks,
//   getTaskById,
//   createTask,
//   updateTaskStatus,
//   updateTask,
//   deleteTask,
//   getTaskStats,
//   getTaskUsers,
//   updateTaskAssignee
// } = require('../controllers/taskController');

// const router = express.Router();

// // All routes require authentication
// router.use(auth);

// // Task routes
// router.get('/', getAllTasks);
// router.get('/stats', getTaskStats);
// router.get('/users', getTaskUsers);
// router.get('/:id', getTaskById);
// router.post('/', validateCreateTask, handleValidationErrors, createTask);
// router.patch('/:id/status', validateTaskStatus, handleValidationErrors, updateTaskStatus);
// // Project update can be part of admin updateTask (PUT), leaving as-is

// // Admin only routes
// router.put('/:id', adminAuth, updateTask);
// router.patch('/:id/assignee', adminAuth, updateTaskAssignee);
// router.delete('/:id', adminAuth, deleteTask);

// module.exports = router;

const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  validateCreateTask,
  validateTaskStatus,
  handleValidationErrors
} = require('../middleware/validation');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTaskStats,
  getTaskUsers,
  updateTaskAssignee
} = require('../controllers/taskController');

const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Task routes
router.get('/', getAllTasks);
router.get('/stats', getTaskStats);
router.get('/users', getTaskUsers);
router.get('/:id', getTaskById);

// ✅ Add file upload middleware here
router.post('/', upload.single("file"), validateCreateTask, handleValidationErrors, createTask);

router.patch('/:id/status', validateTaskStatus, handleValidationErrors, updateTaskStatus);

// Admin only routes
router.put('/:id', adminAuth, upload.single("file"), updateTask);
router.patch('/:id/assignee', adminAuth, updateTaskAssignee);
router.delete('/:id', adminAuth, deleteTask);

module.exports = router;
