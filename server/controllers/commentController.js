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

    // Notify task assignee or creator if comment is by another user
    const recipientId =
      task.assignedTo.toString() === req.user._id.toString()
        ? task.createdBy
        : task.assignedTo;

    if (recipientId.toString() !== req.user._id.toString()) {
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
