const Task = require('../models/Task');
const User = require('../models/User');

// Get tasks for a specific user (admin only)
const getUserTasks = async (req, res) => {
  try {
    // Only admins can view other users' tasks
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const userId = req.params.userId;
    
    // Validate user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find tasks where the user is assigned
    const tasks = await Task.find({ assignedTo: userId })
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('projectId', 'title description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });

  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching user tasks' 
    });
  }
};

// Get all tasks (admin sees all, users see only their own)
const getAllTasks = async (req, res) => {
  try {
    let tasks;
    const query = {};

    // Filter by user role
    if (req.user.role !== 'admin') {
      // Users should see tasks they created OR tasks assigned to them
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Add project filter if provided (legacy string project)
    if (req.query.project) {
      query.project = req.query.project;
    }

    // Add projectId filter if provided (preferred)
    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }

    // Add search filter if provided
    if (req.query.search) {
      const searchQuery = {
        $or: [
          { heading: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      };
      
      // If we already have a query with $or (user role filter), use $and to combine
      // IMPORTANT: wrap the existing $or array in an object, otherwise the query is invalid
      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchQuery];
        delete query.$or;
      } else {
        query.$or = searchQuery.$or;
      }
    }

    tasks = await Task.find(query)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('projectId', 'title description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching tasks' 
    });
  }
};

// Get distinct users involved in tasks visible to the requester
const getTaskUsers = async (req, res) => {
  try {
    const query = {};
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    const tasks = await Task.find(query).select('createdBy assignedTo');
    const userIds = new Set();
    tasks.forEach((t) => {
      if (t.createdBy) userIds.add(String(t.createdBy));
      if (t.assignedTo) userIds.add(String(t.assignedTo));
    });
    const ids = Array.from(userIds);
    const users = ids.length ? await User.find({ _id: { $in: ids } }).select('username email') : [];
    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    console.error('Get task users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while fetching task users' });
  }
};

// Update task assignee (admin only)
const updateTaskAssignee = async (req, res) => {
  try {
    const { assigneeId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    // Only admin route should call this; validation layer enforces admin
    task.assignedTo = assigneeId || null;
    await task.save();
    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email');
    res.json({ success: true, message: 'Task assignee updated successfully', data: populatedTask });
  } catch (error) {
    console.error('Update task assignee error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while updating task assignee' });
  }
};

// Get single task
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email');
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Check if user has permission to view this task
    // Users can view tasks they created OR tasks assigned to them
    if (req.user.role !== 'admin' && 
        task.createdBy._id.toString() !== req.user._id.toString() && 
        task.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching task' 
    });
  }
};

// Create new task
// Create new task
const createTask = async (req, res) => {
  try {
    const { heading, description, assignedTo, projectId } = req.body;

    if (!heading || heading.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Heading is required'
      });
    }

    const taskData = {
      heading: heading.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user._id,
      projectId: projectId || null,
      assignedTo: null,
      file: req.file ? req.file.path : null   // ✅ store file path if uploaded
    };

    if (assignedTo && req.user.role === 'admin') {
      taskData.assignedTo = assignedTo;
    }

    const task = new Task(taskData);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('projectId', 'title description');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating task'
    });
  }
};


// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { status, projectId } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Check if user has permission to update this task
    // Users can update tasks they created OR tasks assigned to them
    if (req.user.role !== 'admin' && 
        task.createdBy.toString() !== req.user._id.toString() && 
        task.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Validate status
    if (!['TO_DO', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be TO_DO, IN_PROGRESS, or DONE' 
      });
    }

    task.status = status;
    
    // Preserve projectId if provided
    if (projectId !== undefined) {
      task.projectId = projectId;
    }
    
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('projectId', 'title description');

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while updating task status' 
    });
  }
};

// Update task (admin only)
const updateTask = async (req, res) => {
  try {
    const { heading, description, assignedTo, status, projectId } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (status && !['TO_DO', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be TO_DO, IN_PROGRESS, or DONE'
      });
    }

    if (heading !== undefined) task.heading = heading.trim();
    if (description !== undefined) task.description = description.trim();
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (status !== undefined) task.status = status;
    if (projectId !== undefined) task.projectId = projectId || null;

    // ✅ update file if new file uploaded
    if (req.file) {
      task.file = req.file.path;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .populate('projectId', 'title description');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating task'
    });
  }
};


// Delete task (admin only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    await Task.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while deleting task' 
    });
  }
};

// Get task statistics
const getTaskStats = async (req, res) => {
  try {
    const query = {};
    
    // Filter by user role
    if (req.user.role !== 'admin') {
      // Users should see tasks they created OR tasks assigned to them
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    const totalTasks = await Task.countDocuments(query);
    const todoTasks = await Task.countDocuments({ ...query, status: 'TO_DO' });
    const inProgressTasks = await Task.countDocuments({ ...query, status: 'IN_PROGRESS' });
    const doneTasks = await Task.countDocuments({ ...query, status: 'DONE' });

    const stats = {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      done: doneTasks,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching task statistics' 
    });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTaskStats,
  getTaskUsers,
  updateTaskAssignee,
  getUserTasks
};
