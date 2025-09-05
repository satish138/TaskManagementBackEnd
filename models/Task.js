const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['TO_DO', 'IN_PROGRESS', 'DONE'],
    default: 'TO_DO'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  inProgressDate: {
    type: Date,
    default: null
  },
  completionDate: {
    type: Date,
    default: null
  }
});

// Middleware to update dates when status changes
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'IN_PROGRESS' && !this.inProgressDate) {
      this.inProgressDate = new Date();
    } else if (this.status === 'DONE' && !this.completionDate) {
      this.completionDate = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
