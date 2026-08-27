const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetEndDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
