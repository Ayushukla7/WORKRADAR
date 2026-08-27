const Project = require('../models/Project');
const Task = require('../models/Task');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Manager only)
 */
const createProject = async (req, res) => {
  try {
    const { name, description, teamMembers, startDate, targetEndDate } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a project name',
      });
    }

    const project = await Project.create({
      name,
      description: description || '',
      createdById: req.user._id,
      teamMembers: teamMembers || [],
      startDate: startDate || Date.now(),
      targetEndDate: targetEndDate || null,
      status: 'ACTIVE',
    });

    const populatedProject = await Project.findById(project._id)
      .populate('createdById', 'name email designation')
      .populate('teamMembers', 'name email designation avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: populatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating project',
    });
  }
};

/**
 * @desc    Get all projects (filtered by user role)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    let query = {};
    
    // If employee, return projects where they are in teamMembers
    if (req.user.role === 'EMPLOYEE') {
      query = { teamMembers: req.user._id };
    }

    const projects = await Project.find(query)
      .populate('createdById', 'name email designation')
      .populate('teamMembers', 'name email designation avatarUrl')
      .sort({ createdAt: -1 });

    // Calculate task summary metrics for each project
    const projectsWithMetrics = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ projectId: project._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
        const atRiskTasks = tasks.filter((t) => t.riskScore >= 65 && t.status !== 'COMPLETED').length;
        const overdueTasks = tasks.filter((t) => t.status === 'OVERDUE' || (new Date(t.deadline) < new Date() && t.status !== 'COMPLETED')).length;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project.toObject(),
          totalTasks,
          completedTasks,
          atRiskTasks,
          overdueTasks,
          completionPercentage,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projectsWithMetrics.length,
      projects: projectsWithMetrics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching projects',
    });
  }
};

/**
 * @desc    Get single project details by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdById', 'name email designation')
      .populate('teamMembers', 'name email designation avatarUrl');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const tasks = await Task.find({ projectId: project._id })
      .populate('assignedTo', 'name email designation avatarUrl')
      .populate('createdBy', 'name')
      .populate('dependencies', 'title status riskScore')
      .sort({ deadline: 1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const atRiskTasks = tasks.filter((t) => t.riskScore >= 65 && t.status !== 'COMPLETED').length;
    const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED' || t.isBlocked).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        totalTasks,
        completedTasks,
        atRiskTasks,
        blockedTasks,
        completionPercentage,
      },
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching project details',
    });
  }
};

/**
 * @desc    Update project details
 * @route   PUT /api/projects/:id
 * @access  Private (Manager only)
 */
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const { name, description, teamMembers, status, targetEndDate } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (teamMembers) project.teamMembers = teamMembers;
    if (status) project.status = status;
    if (targetEndDate) project.targetEndDate = targetEndDate;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdById', 'name email designation')
      .populate('teamMembers', 'name email designation avatarUrl');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating project',
    });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Manager only)
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Delete associated tasks
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project and associated tasks deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting project',
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
