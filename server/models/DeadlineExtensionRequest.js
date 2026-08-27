const mongoose = require('mongoose');

const deadlineExtensionRequestSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentDeadline: {
      type: Date,
      required: true,
    },
    requestedDeadline: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the deadline extension'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    managerComment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const DeadlineExtensionRequest = mongoose.model(
  'DeadlineExtensionRequest',
  deadlineExtensionRequestSchema
);

module.exports = DeadlineExtensionRequest;
