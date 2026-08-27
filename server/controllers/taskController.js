const Task = require('../models/Task');
const Project = require('../models/Project');
const { calculateTaskRisk } = require('../services/riskEngine');
const { getEmployeeWorkload } = require('../services/workloadEngine');

/**
 * @desc    Create a new task
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

    if (!title || !projectId || !assignedTo || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, project, assigned employee, and deadline',
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

    // Fetch assignee workload
    const workloadInfo = await getEmployeeWorkload(assignedTo);
    const assigneeWorkloadHours = workloadInfo ? workloadInfo.totalEstimatedHours : 0;

    // Create preliminary task object for risk calculation
    const draftTask = {
      title,
      description: description || '',
      projectId,
      assignedTo,
      priority: priority || 'MEDIUM',
      status: 'TODO',
      progressPercentage: 0,
      estimatedHours: estimatedHours || 8,
      startDate: startDate || Date.now(),
      deadline,
      dependencies: dependencies || [],
      isBlocked: false,
    };

    // Calculate initial risk
    const riskResult = calculateTaskRisk(draftTask, dependencyTasks, assigneeWorkloadHours);

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
      .populate('assignedTo', 'name email designation avatarUrl')
      .populate('createdBy', 'name email')
      .populate('dependencies', 'title status riskScore');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask,
      workloadWarning: workloadInfo && workloadInfo.workloadPercentage > 100
        ? `Warning: ${workloadInfo.user.name} is currently at ${workloadInfo.workloadPercentage}% capacity`
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
    const { projectId, assignedTo, status, riskLevel, search } = req.query;

    let query = {};

    // Filter by project
    if (projectId) query.projectId = projectId;

    // Filter by assigned user
    if (assignedTo) query.assignedTo = assignedTo;

    // If logged in user is Employee and no specific assignedTo requested, restrict to their tasks
    if (req.user.role === 'EMPLOYEE' && !assignedTo) {
      query.assignedTo = req.user._id;
    }

    // Filter by status
    if (status) query.status = status;

    // Filter by risk level
    if (riskLevel) query.riskLevel = riskLevel;

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name status')
      .populate('assignedTo', 'name email designation avatarUrl')
      .populate('createdBy', 'name')
      .populate('dependencies', 'title status riskScore')
      .sort({ deadline: 1 });

    // Recalculate risk on the fly to keep scores 100% current
    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        let dependencyTasks = [];
        if (task.dependencies && task.dependencies.length > 0) {
          dependencyTasks = task.dependencies;
        }

        const workloadInfo = await getEmployeeWorkload(task.assignedTo?._id);
        const workloadHours = workloadInfo ? workloadInfo.totalEstimatedHours : 0;

        const riskResult = calculateTaskRisk(task, dependencyTasks, workloadHours);

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
      .populate('dependencies', 'title status progressPercentage riskScore deadline');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Recalculate Risk Score
    const workloadInfo = await getEmployeeWorkload(task.assignedTo?._id);
    const workloadHours = workloadInfo ? workloadInfo.totalEstimatedHours : 0;

    const riskResult = calculateTaskRisk(task, task.dependencies || [], workloadHours);

    task.riskScore = riskResult.riskScore;
    task.riskLevel = riskResult.riskLevel;
    task.riskFactors = riskResult.riskFactors;
    task.recommendedAction = riskResult.recommendedAction;
    await task.save();

    res.status(200).json({
      success: true,
      task,
      assigneeWorkload: workloadInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching task details',
    });
  }
};

/**
 * @desc    Update task details / progress / blocker state
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
    if (assignedTo) task.assignedTo = assignedTo;
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
      }
    }

    // Status updates
    if (status) {
      task.status = status;
      if (status === 'COMPLETED') {
        task.progressPercentage = 100;
        task.isBlocked = false;
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

    const workloadInfo = await getEmployeeWorkload(task.assignedTo);
    const workloadHours = workloadInfo ? workloadInfo.totalEstimatedHours : 0;

    const riskResult = calculateTaskRisk(task, dependencyTasks, workloadHours);

    task.riskScore = riskResult.riskScore;
    task.riskLevel = riskResult.riskLevel;
    task.riskFactors = riskResult.riskFactors;
    task.recommendedAction = riskResult.recommendedAction;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email designation avatarUrl')
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
  deleteTask,
};
