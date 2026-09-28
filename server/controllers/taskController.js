const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { calculateTaskRisk } = require('../services/riskEngine');
const { getEmployeeWorkload } = require('../services/workloadEngine');

/**
 * Helper to normalize assignedTo input into an array of user IDs
 */
const normalizeAssignees = (assignedTo) => {
  if (Array.isArray(assignedTo)) {
    return assignedTo.filter(Boolean);
  }
  if (assignedTo) {
    return [assignedTo];
  }
  return [];
};

/**
 * @desc    Create a new task (supports multiple co-assignees to split workload)
 * @route   POST /api/tasks
 * @access  Private (Manager only)
 */
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assignedTo,
      priority,
      estimatedHours,
      deadline,
      startDate,
      dependencies,
    } = req.body;

    const assignees = normalizeAssignees(assignedTo);

    if (!title || !projectId || assignees.length === 0 || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, project, at least one assigned employee, and deadline',
      });
    }

    // Verify Project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found',
      });
    }

    // Fetch dependent tasks if specified
    let dependencyTasks = [];
    if (dependencies && dependencies.length > 0) {
      dependencyTasks = await Task.find({ _id: { $in: dependencies } });
    }

    // Fetch assignees' workloads to evaluate overload risk
    const workloads = await Promise.all(assignees.map((id) => getEmployeeWorkload(id)));
    const maxWorkloadHours = workloads.reduce(
      (max, w) => Math.max(max, w ? w.totalEstimatedHours : 0),
      0
    );

    // Create preliminary task object for risk calculation
    const draftTask = {
      title,
      description: description || '',
      projectId,
      assignedTo: assignees,
      priority: priority || 'MEDIUM',
      status: 'TODO',
      progressPercentage: 0,
      estimatedHours: estimatedHours || 8,
      startDate: startDate || Date.now(),
      deadline,
      dependencies: dependencies || [],
      isBlocked: false,
    };

    // Calculate initial risk using max assignee workload
    const riskResult = calculateTaskRisk(draftTask, dependencyTasks, maxWorkloadHours);

    // Save Task to Database
    const task = await Task.create({
      ...draftTask,
      createdBy: req.user._id,
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
      riskFactors: riskResult.riskFactors,
      recommendedAction: riskResult.recommendedAction,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email designation avatarUrl weeklyCapacityHours')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title status riskScore');

    const overloadedMember = workloads.find((w) => w && w.workloadPercentage > 100);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask,
      workloadWarning: overloadedMember
        ? `Warning: ${overloadedMember.user.name} is currently at ${overloadedMember.workloadPercentage}% capacity`
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating task',
    });
  }
};

/**
 * @desc    Get all tasks with optional filters
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res) => {
  try {
    const { projectId, assignedTo, status, riskLevel, search, completionRequested } = req.query;

    let query = {};

    // Filter by project
    if (projectId) query.projectId = projectId;

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // If logged in user is Employee and no specific assignedTo requested, restrict to their tasks
    if (req.user.role === 'EMPLOYEE' && !assignedTo) {
      query.assignedTo = req.user._id;
    }

    // Filter by status
    if (status) query.status = status;

    // Filter by completion requested
    if (completionRequested === 'true') {
      query.completionRequested = true;
    }

    // Filter by risk level
    if (riskLevel) query.riskLevel = riskLevel;

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name status')
      .populate('assignedTo', 'name email designation avatarUrl weeklyCapacityHours')
      .populate('createdBy', 'name email')
      .populate('completionReviewedBy', 'name email')
      .populate('dependencies', 'title status riskScore')
      .sort({ deadline: 1 });

    // Recalculate risk on the fly to keep scores 100% current
    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        if (task.status === 'COMPLETED') {
          return task;
        }

        let dependencyTasks = [];
        if (task.dependencies && task.dependencies.length > 0) {
          dependencyTasks = task.dependencies;
        }

        // Evaluate max assignee workload
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
        let maxWorkload = 0;
        for (const emp of assignees) {
          const empId = emp._id || emp;
          const w = await getEmployeeWorkload(empId);
          if (w && w.totalEstimatedHours > maxWorkload) {
            maxWorkload = w.totalEstimatedHours;
          }
        }

        const riskResult = calculateTaskRisk(task, dependencyTasks, maxWorkload);

        // Update database if risk attributes changed
        if (task.riskScore !== riskResult.riskScore || task.riskLevel !== riskResult.riskLevel) {
          task.riskScore = riskResult.riskScore;
          task.riskLevel = riskResult.riskLevel;
          task.riskFactors = riskResult.riskFactors;
          task.recommendedAction = riskResult.recommendedAction;
          await task.save();
        }

        return task;
      })
    );

    res.status(200).json({
      success: true,
      count: updatedTasks.length,
      tasks: updatedTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching tasks',
    });
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'name description targetEndDate')
      .populate('assignedTo', 'name email designation avatarUrl weeklyCapacityHours')
      .populate('createdBy', 'name email designation')
      .populate('completionReviewedBy', 'name email')
      .populate('dependencies', 'title status progressPercentage riskScore deadline');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.status !== 'COMPLETED') {
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
      let maxWorkload = 0;
      let primaryWorkloadInfo = null;
      for (const emp of assignees) {
        const empId = emp._id || emp;
        const w = await getEmployeeWorkload(empId);
        if (!primaryWorkloadInfo) primaryWorkloadInfo = w;
        if (w && w.totalEstimatedHours > maxWorkload) {
          maxWorkload = w.totalEstimatedHours;
        }
      }

      const riskResult = calculateTaskRisk(task, task.dependencies || [], maxWorkload);

      task.riskScore = riskResult.riskScore;
      task.riskLevel = riskResult.riskLevel;
      task.riskFactors = riskResult.riskFactors;
      task.recommendedAction = riskResult.recommendedAction;
      await task.save();

      return res.status(200).json({
        success: true,
        task,
        assigneeWorkload: primaryWorkloadInfo,
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching task details',
    });
  }
};

/**
 * @desc    Update task details / progress / blocker state / assignees
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const {
      title,
      description,
      assignedTo,
      priority,
      status,
      progressPercentage,
      estimatedHours,
      deadline,
      dependencies,
      isBlocked,
      blockerReason,
      blockerCategory,
    } = req.body;

    // Attribute updates
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) {
      task.assignedTo = normalizeAssignees(assignedTo);
    }
    if (priority) task.priority = priority;
    if (estimatedHours) task.estimatedHours = estimatedHours;
    if (deadline) task.deadline = deadline;
    if (dependencies) task.dependencies = dependencies;

    // Progress updates
    if (progressPercentage !== undefined) {
      task.progressPercentage = Number(progressPercentage);
      if (task.progressPercentage === 100) {
        task.status = 'COMPLETED';
        task.isBlocked = false;
        task.completionRequested = false;
        task.riskScore = 0;
        task.riskLevel = 'LOW';
      }
    }

    // Status updates
    if (status) {
      task.status = status;
      if (status === 'COMPLETED') {
        task.progressPercentage = 100;
        task.isBlocked = false;
        task.completionRequested = false;
        task.riskScore = 0;
        task.riskLevel = 'LOW';
      } else if (status === 'BLOCKED') {
        task.isBlocked = true;
      }
    }

    // Blocker updates
    if (isBlocked !== undefined) {
      task.isBlocked = Boolean(isBlocked);
      if (task.isBlocked) {
        task.status = 'BLOCKED';
      }
    }

    if (blockerReason !== undefined) task.blockerReason = blockerReason;
    if (blockerCategory) task.blockerCategory = blockerCategory;

    // Recalculate Risk Score
    let dependencyTasks = [];
    if (task.dependencies && task.dependencies.length > 0) {
      dependencyTasks = await Task.find({ _id: { $in: task.dependencies } });
    }

    const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
    let maxWorkload = 0;
    for (const emp of assignees) {
      const empId = emp._id || emp;
      const w = await getEmployeeWorkload(empId);
      if (w && w.totalEstimatedHours > maxWorkload) {
        maxWorkload = w.totalEstimatedHours;
      }
    }

    const riskResult = calculateTaskRisk(task, dependencyTasks, maxWorkload);

    if (task.status !== 'COMPLETED') {
      task.riskScore = riskResult.riskScore;
      task.riskLevel = riskResult.riskLevel;
      task.riskFactors = riskResult.riskFactors;
      task.recommendedAction = riskResult.recommendedAction;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email designation avatarUrl weeklyCapacityHours')
      .populate('createdBy', 'name')
      .populate('dependencies', 'title status riskScore');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating task',
    });
  }
};

/**
 * @desc    Request task completion approval from manager
 * @route   POST /api/tasks/:id/request-completion
 * @access  Private (Employee / Assignee)
 */
const requestCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { completionNote } = req.body;

    task.status = 'IN_REVIEW';
    task.completionRequested = true;
    task.completionNote = completionNote || 'Task completed by developer. Awaiting manager review.';
    task.completionRequestedAt = new Date();
    task.progressPercentage = 100;
    task.isBlocked = false;

    await task.save();

    // Send notification to task creator / manager
    if (task.createdBy) {
      await Notification.create({
        recipientId: task.createdBy,
        title: 'Task Completion Request',
        message: `${req.user.name} finished "${task.title}" and requested completion approval.`,
        type: 'COMPLETION_REQUEST',
        relatedTaskId: task._id,
        relatedProjectId: task.projectId,
      });
    }

    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email designation avatarUrl')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Task completion request sent to your manager for approval.',
      task: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error requesting completion approval',
    });
  }
};

/**
 * @desc    Manager review task completion (Approve or Reject/Request Changes)
 * @route   PUT /api/tasks/:id/review-completion
 * @access  Private (Manager only)
 */
const reviewCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { approved, feedback } = req.body;

    if (approved) {
      task.status = 'COMPLETED';
      task.progressPercentage = 100;
      task.isBlocked = false;
      task.completionRequested = false;
      task.riskScore = 0;
      task.riskLevel = 'LOW';
      task.completionReviewedBy = req.user._id;
      task.completionFeedback = feedback || 'Approved by manager';

      await task.save();

      // Notify all assignees
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
      for (const aId of assignees) {
        await Notification.create({
          recipientId: aId._id || aId,
          title: 'Task Completion Approved',
          message: `Manager ${req.user.name} approved completion for "${task.title}". Great work!`,
          type: 'COMPLETION_RESPONSE',
          relatedTaskId: task._id,
          relatedProjectId: task.projectId,
        });
      }
    } else {
      task.status = 'IN_PROGRESS';
      task.completionRequested = false;
      task.completionReviewedBy = req.user._id;
      task.completionFeedback = feedback || 'Changes requested by manager';

      await task.save();

      // Notify all assignees
      const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
      for (const aId of assignees) {
        await Notification.create({
          recipientId: aId._id || aId,
          title: 'Task Changes Requested',
          message: `Manager ${req.user.name} reviewed "${task.title}" and requested updates: "${feedback || 'Please review requirements.'}"`,
          type: 'COMPLETION_RESPONSE',
          relatedTaskId: task._id,
          relatedProjectId: task.projectId,
        });
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email designation avatarUrl')
      .populate('createdBy', 'name email')
      .populate('completionReviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: approved ? 'Task completion approved successfully.' : 'Task returned to in-progress with feedback.',
      task: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error reviewing task completion',
    });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private (Manager only)
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting task',
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  requestCompletion,
  reviewCompletion,
  deleteTask,
};
