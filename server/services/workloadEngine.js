const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Workload Analysis Engine
 * Calculates active task counts, total estimated effort hours,
 * capacity workload percentages, and overload warnings for team members.
 */

const getEmployeeWorkload = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) return null;

  // Active tasks are non-completed tasks assigned to this user
  const activeTasks = await Task.find({
    assignedTo: userId,
    status: { $ne: 'COMPLETED' },
  }).populate('projectId', 'name');

  const totalActiveTasks = activeTasks.length;
  const totalEstimatedHours = activeTasks.reduce((sum, task) => sum + (task.estimatedHours || 8), 0);
  const weeklyCapacity = user.weeklyCapacityHours || 40;

  const workloadPercentage = Math.round((totalEstimatedHours / weeklyCapacity) * 100);

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
    totalEstimatedHours,
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
