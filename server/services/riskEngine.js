/**
 * WorkRadar Predictive Delay Risk Engine
 * Rules-based mathematical engine evaluating task schedule pace,
 * blockers, dependency completion, time proximity, and priority.
 */

/**
 * Calculates risk score, risk level, risk factors array, and recommended action for a task.
 * @param {Object} task - Mongoose task document or plain object
 * @param {Array} dependencyTasks - Array of populated dependency task objects
 * @param {Number} assigneeWorkloadHours - Total active hours assigned to the user
 * @returns {Object} { riskScore, riskLevel, riskFactors, recommendedAction }
 */
const calculateTaskRisk = (task, dependencyTasks = [], assigneeWorkloadHours = 0) => {
  // Completed tasks have zero risk
  if (task.status === 'COMPLETED') {
    return {
      riskScore: 0,
      riskLevel: 'LOW',
      riskFactors: ['Task completed successfully'],
      recommendedAction: 'No action required',
    };
  }

  let score = 0;
  const factors = [];
  const now = new Date();
  const startDate = new Date(task.startDate || task.createdAt || now);
  const deadline = new Date(task.deadline);

  const totalDurationMs = deadline.getTime() - startDate.getTime();
  const elapsedMs = now.getTime() - startDate.getTime();

  // Total duration in days/hours
  const totalHours = Math.max(1, totalDurationMs / (1000 * 60 * 60));
  const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));
  const remainingHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  // 1. Pace Delta (Expected Progress vs Actual Progress) — Max 40 pts
  const timeElapsedRatio = Math.min(1, Math.max(0, elapsedHours / totalHours));
  const expectedProgress = Math.round(timeElapsedRatio * 100);
  const actualProgress = task.progressPercentage || 0;
  const paceDeficit = expectedProgress - actualProgress;

  if (paceDeficit > 5) {
    const paceScore = Math.min(40, Math.round(paceDeficit * 0.65));
    score += paceScore;
    factors.push(
      `Progress (${actualProgress}%) is ${paceDeficit}% behind expected pace (${expectedProgress}%)`
    );
  }

  // 2. Blocker Status — Max 25 pts
  if (task.isBlocked || task.status === 'BLOCKED') {
    score += 25;
    const reasonText = task.blockerReason ? `: "${task.blockerReason}"` : '';
    factors.push(`Task is actively BLOCKED${reasonText}`);
  }

  // 3. Dependencies Check — Max 20 pts
  if (dependencyTasks && dependencyTasks.length > 0) {
    const incompleteDeps = dependencyTasks.filter((dep) => dep.status !== 'COMPLETED');
    if (incompleteDeps.length > 0) {
      const depScore = Math.min(20, incompleteDeps.length * 10);
      score += depScore;
      const depNames = incompleteDeps.map((d) => d.title).join(', ');
      factors.push(`${incompleteDeps.length} incomplete prerequisite task(s): ${depNames}`);
    }
  }

  // 4. Time Remaining Proximity & Overdue — Max 35 pts
  if (remainingHours <= 0) {
    score += 35;
    factors.push('Task deadline has passed (OVERDUE)');
  } else if (remainingHours < 48 && actualProgress < 60) {
    score += 15;
    const daysLeft = Math.max(1, Math.round(remainingHours / 24));
    factors.push(`Only ${daysLeft} day(s) remain before deadline with < 60% progress`);
  } else if (remainingHours < 96 && actualProgress < 30) {
    score += 10;
    factors.push('Under 4 days remain with minimal progress (< 30%)');
  }

  // 5. Assignee Overload Factor — Max 10 pts
  if (assigneeWorkloadHours > 45) {
    score += 10;
    factors.push(`Assignee is overloaded (${assigneeWorkloadHours} active hours allocated)`);
  } else if (assigneeWorkloadHours > 35) {
    score += 5;
    factors.push(`Assignee has heavy workload (${assigneeWorkloadHours} active hours)`);
  }

  // 6. Priority Weight Multiplier — Max 10 pts
  if (task.priority === 'CRITICAL') {
    score += 10;
    factors.push('Task is classified as CRITICAL priority');
  } else if (task.priority === 'HIGH') {
    score += 7;
    factors.push('Task is classified as HIGH priority');
  } else if (task.priority === 'MEDIUM') {
    score += 3;
  }

  // Cap score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  // Categorize Risk Level
  let riskLevel = 'LOW';
  if (finalScore >= 85) riskLevel = 'CRITICAL';
  else if (finalScore >= 65) riskLevel = 'HIGH';
  else if (finalScore >= 35) riskLevel = 'MEDIUM';

  // Generate Actionable Recommendation
  let recommendedAction = 'Maintain current development pace and monitor updates.';
  if (task.isBlocked || task.status === 'BLOCKED') {
    recommendedAction = `Urgent: Resolve active blocker "${task.blockerReason || 'Unspecified'}" or reassign blocking dependencies.`;
  } else if (factors.some((f) => f.includes('prerequisite'))) {
    recommendedAction = 'Prioritize completing blocking prerequisite tasks before continuing.';
  } else if (paceDeficit > 25 && remainingHours < 72) {
    recommendedAction = 'Pace is severely delayed. Consider extending deadline or reassigning sub-tasks.';
  } else if (assigneeWorkloadHours > 40) {
    recommendedAction = 'Assignee overloaded. Consider reassigning to team members with lower workload.';
  } else if (finalScore >= 65) {
    recommendedAction = 'High delay risk detected. Review task scope and allocate additional support.';
  }

  if (factors.length === 0) {
    factors.push('On track with expected schedule velocity');
  }

  return {
    riskScore: finalScore,
    riskLevel,
    riskFactors: factors,
    recommendedAction,
  };
};

module.exports = {
  calculateTaskRisk,
};
