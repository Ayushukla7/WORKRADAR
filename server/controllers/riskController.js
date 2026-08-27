const Task = require('../models/Task');
const { calculateTaskRisk } = require('../services/riskEngine');
const { getEmployeeWorkload } = require('../services/workloadEngine');

/**
 * @desc    Get aggregate risk summary statistics across all tasks
 * @route   GET /api/risk/summary
 * @access  Private (Manager)
 */
const getRiskSummary = async (req, res) => {
  try {
    const tasks = await Task.find({ status: { $ne: 'COMPLETED' } })
      .populate('dependencies')
      .populate('assignedTo', '_id');

    // Recalculate risk to ensure fresh figures
    const evaluatedTasks = await Promise.all(
      tasks.map(async (task) => {
        const workloadInfo = await getEmployeeWorkload(task.assignedTo?._id);
        const workloadHours = workloadInfo ? workloadInfo.totalEstimatedHours : 0;
        const risk = calculateTaskRisk(task, task.dependencies || [], workloadHours);

        task.riskScore = risk.riskScore;
        task.riskLevel = risk.riskLevel;
        return task;
      })
    );

    const totalActive = evaluatedTasks.length;
    const criticalCount = evaluatedTasks.filter((t) => t.riskLevel === 'CRITICAL').length;
    const highCount = evaluatedTasks.filter((t) => t.riskLevel === 'HIGH').length;
    const mediumCount = evaluatedTasks.filter((t) => t.riskLevel === 'MEDIUM').length;
    const lowCount = evaluatedTasks.filter((t) => t.riskLevel === 'LOW').length;
    const blockedCount = evaluatedTasks.filter((t) => t.status === 'BLOCKED' || t.isBlocked).length;

    const averageRiskScore =
      totalActive > 0
        ? Math.round(evaluatedTasks.reduce((sum, t) => sum + t.riskScore, 0) / totalActive)
        : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalActive,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        blockedCount,
        averageRiskScore,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching risk summary',
    });
  }
};

/**
 * @desc    Get detailed list of tasks sorted by highest risk score (Risk Center)
 * @route   GET /api/risk/tasks
 * @access  Private (Manager)
 */
const getAtRiskTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ status: { $ne: 'COMPLETED' } })
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email designation avatarUrl')
      .populate('dependencies', 'title status riskScore')
      .sort({ riskScore: -1, deadline: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching at-risk tasks',
    });
  }
};

module.exports = {
  getRiskSummary,
  getAtRiskTasks,
};
