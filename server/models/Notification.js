const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'RISK_ALERT',
        'TASK_ASSIGNED',
        'DEADLINE_APPROACHING',
        'EXTENSION_REQUEST',
        'EXTENSION_RESPONSE',
        'COMPLETION_REQUEST',
        'COMPLETION_RESPONSE',
        'BLOCKER_LOGGED',
        'TASK_UPDATED',
      ],
      default: 'TASK_UPDATED',
    },
    relatedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    relatedProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
