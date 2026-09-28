const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Workload Analysis Engine
 * Calculates active task counts, total estimated effort hours (split equally among assignees),
 * capacity workload percentages, and overload warnings for team members.
 */

const getEmployeeWorkload = async (userId) => {
  if (!userId) return null;
  const user = await User.findById(userId).select('-password');
  if (!user) return null;

  // Active tasks are non-completed tasks where userId is in assignedTo
  const activeTasks = await Task.find({
    assignedTo: userId,
    status: { $ne: 'COMPLETED' },
  })
    .populate('projectId', 'name')
    .populate('assignedTo', 'name email designation');

  const totalActiveTasks = activeTasks.length;

  // Split estimated effort hours among co-assignees to reduce workload
  const totalEstimatedHours = activeTasks.reduce((sum, task) => {
    let assigneeCount = 1;
    if (Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
      assigneeCount = task.assignedTo.length;
    }
    const allocatedHours = (task.estimatedHours || 8) / assigneeCount;
    return sum + allocatedHours;
  }, 0);

  const roundedHours = Math.round(totalEstimatedHours * 10) / 10;
  const weeklyCapacity = user.weeklyCapacityHours || 40;

  const workloadPercentage = Math.round((roundedHours / weeklyCapacity) * 100);

  let status = 'OPTIMAL';
  if (workloadPercentage > 130) {
    status = 'OVERLOADED';
  } else if (workloadPercentage > 100) {
    status = 'HIGH';
  } else if (workloadPercentage < 50) {
    status = 'UNDERLOADED';
  }

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      avatarUrl: user.avatarUrl,
    },
    totalActiveTasks,
    totalEstimatedHours: roundedHours,
    weeklyCapacityHours: weeklyCapacity,
    workloadPercentage,
    status,
    activeTasks,
  };
};

const getTeamWorkloadOverview = async () => {
  const employees = await User.find({ role: 'EMPLOYEE' }).select('-password');

  const teamWorkloads = await Promise.all(
    employees.map(async (emp) => {
      return await getEmployeeWorkload(emp._id);
    })
  );

  return teamWorkloads;
};

module.exports = {
  getEmployeeWorkload,
  getTeamWorkloadOverview,
};
