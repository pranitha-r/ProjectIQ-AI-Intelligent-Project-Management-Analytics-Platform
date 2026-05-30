const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  plannedEnd: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'on_hold', 'completed'],
    default: 'active'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  budget: {
    type: Number,
    default: 0
  },
  spent: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
