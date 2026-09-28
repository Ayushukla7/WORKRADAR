const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

/**
 * @desc    Add comment to a task
 * @route   POST /api/tasks/:taskId/comments
 * @access  Private
 */
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { taskId } = req.params;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const comment = await Comment.create({
      taskId,
      authorId: req.user._id,
      text,
    });

    // Notify task assignees and creator
    const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
    const recipients = new Set();

    if (task.createdBy && task.createdBy.toString() !== req.user._id.toString()) {
      recipients.add(task.createdBy.toString());
    }

    for (const assigneeId of assignees) {
      const aStr = (assigneeId._id || assigneeId).toString();
      if (aStr !== req.user._id.toString()) {
        recipients.add(aStr);
      }
    }

    for (const recipientId of recipients) {
      await Notification.create({
        recipientId,
        title: '💬 New Task Comment',
        message: `${req.user.name} commented on "${task.title}": "${text.substring(0, 40)}..."`,
        type: 'TASK_UPDATED',
        relatedTaskId: task._id,
      });
    }

    const populatedComment = await Comment.findById(comment._id).populate(
      'authorId',
      'name email designation avatarUrl role'
    );

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding comment',
    });
  }
};

/**
 * @desc    Get comments for a task
 * @route   GET /api/tasks/:taskId/comments
 * @access  Private
 */
const getTaskComments = async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.taskId })
      .populate('authorId', 'name email designation avatarUrl role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching comments',
    });
  }
};

module.exports = {
  addComment,
  getTaskComments,
};
