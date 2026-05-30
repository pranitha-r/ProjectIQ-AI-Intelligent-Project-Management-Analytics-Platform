const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Project Manager', 'Team Member'],
    default: 'Team Member'
  },
  avatar: {
    type: String,
    default: 'PM'
  },
  capacity: {
    type: Number,
    default: 40 // Maximum weekly hours
  },
  skills: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
