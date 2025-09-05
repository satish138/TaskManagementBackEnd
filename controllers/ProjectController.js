const Project = require('../models/project');

// Create new project
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validate input
    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Project title is required' 
      });
    }

    // Check if project with same title already exists
    const existingProject = await Project.findOne({ title: title.trim() });
    if (existingProject) {
      return res.status(409).json({ 
        success: false, 
        message: 'Project with this title already exists' 
      });
    }

    const projectData = {
      title: title.trim(),
      description: description ? description.trim() : ''
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });

  } catch (error) {
    console.error('Create project error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Project with this title already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while creating project' 
    });
  }
};

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .sort({ createdAt: -1 }); // Sort by newest first

    res.json({
      success: true,
      data: projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching projects' 
    });
  }
};

// Get single project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching project' 
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Validate input
    if (!title || title.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Project title is required' 
      });
    }

    // Check if another project with same title exists (excluding current project)
    const existingProject = await Project.findOne({ 
      title: title.trim(), 
      _id: { $ne: req.params.id } 
    });
    
    if (existingProject) {
      return res.status(409).json({ 
        success: false, 
        message: 'Project with this title already exists' 
      });
    }

    // Update fields
    project.title = title.trim();
    project.description = description ? description.trim() : '';
    
    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });

  } catch (error) {
    console.error('Update project error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Project with this title already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while updating project' 
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    await Project.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while deleting project' 
    });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject
};
