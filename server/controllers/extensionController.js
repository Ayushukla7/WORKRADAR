const DeadlineExtensionRequest = require('../models/DeadlineExtensionRequest');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

/**
 * @desc    Create a deadline extension request
 * @route   POST /api/extensions
 * @access  Private (Employee)
 */
const createExtensionRequest = async (req, res) => {
  try {
    const { taskId, requestedDeadline, reason } = req.body;

    if (!taskId || !requestedDeadline || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task ID, requested deadline, and reason',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const request = await DeadlineExtensionRequest.create({
      taskId,
      requestedBy: req.user._id,
      currentDeadline: task.deadline,
      requestedDeadline,
      reason,
      status: 'PENDING',
    });

    // Notify task creator / manager
    await Notification.create({
      recipientId: task.createdBy,
      title: '📌 Deadline Extension Request',
      message: `${req.user.name} requested an extension for "${task.title}" to ${new Date(requestedDeadline).toLocaleDateString()}`,
      type: 'EXTENSION_REQUEST',
      relatedTaskId: task._id,
      relatedProjectId: task.projectId,
    });

    const populatedRequest = await DeadlineExtensionRequest.findById(request._id)
      .populate('taskId', 'title deadline')
      .populate('requestedBy', 'name email designation');

    res.status(201).json({
      success: true,
      message: 'Extension request submitted to manager',
      request: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating extension request',
    });
  }
};

/**
 * @desc    Get extension requests
 * @route   GET /api/extensions
 * @access  Private
 */
const getExtensionRequests = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'EMPLOYEE') {
      query = { requestedBy: req.user._id };
    }

    const requests = await DeadlineExtensionRequest.find(query)
      .populate('taskId', 'title deadline priority status')
      .populate('requestedBy', 'name email designation avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching extension requests',
    });
  }
};

/**
 * @desc    Approve or Reject extension request
 * @route   PUT /api/extensions/:id/review
 * @access  Private (Manager only)
 */
const reviewExtensionRequest = async (req, res) => {
  try {
    const { status, managerComment } = req.body; // status: 'APPROVED' or 'REJECTED'

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be APPROVED or REJECTED',
      });
    }

    const request = await DeadlineExtensionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Extension request not found',
      });
    }

    request.status = status;
    if (managerComment !== undefined) request.managerComment = managerComment;
    await request.save();

    // If approved, update task's deadline!
    const task = await Task.findById(request.taskId);
    if (task && status === 'APPROVED') {
      task.deadline = request.requestedDeadline;
      await task.save();
    }

    // Send notification back to employee
    if (task) {
      await Notification.create({
        recipientId: request.requestedBy,
        title: status === 'APPROVED' ? '✅ Extension Approved' : '❌ Extension Declined',
        message: `Your extension request for "${task.title}" was ${status.toLowerCase()} by manager.${managerComment ? ` Note: ${managerComment}` : ''}`,
        type: 'EXTENSION_RESPONSE',
        relatedTaskId: task._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Extension request ${status.toLowerCase()} successfully`,
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error reviewing extension request',
    });
  }
};

module.exports = {
  createExtensionRequest,
  getExtensionRequests,
  reviewExtensionRequest,
};
