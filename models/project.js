const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Add virtual id field that returns the _id as a string
projectSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
projectSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Project', projectSchema);
