const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  createProject, 
  getAllProjects, 
  getProjectById, 
  updateProject, 
  deleteProject 
} = require('../controllers/ProjectController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Project routes
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
