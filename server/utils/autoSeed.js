const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const DeadlineExtensionRequest = require('../models/DeadlineExtensionRequest');
const { calculateTaskRisk } = require('../services/riskEngine');

/**
 * Auto-seeds demo data if database is currently empty.
 * Ensures demo credentials work 100% of the time on server start.
 */
const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[Auto-Seed] Database already contains ${userCount} users. Skipping auto-seed.`);
      return;
    }

    console.log('[Auto-Seed] Database is empty. Seeding realistic demo managers, developers, and projects...');

    // Create Manager
    const manager = await User.create({
      name: 'Sarah Connor',
      email: 'manager@workradar.io',
      password: 'Password123!',
      role: 'MANAGER',
      designation: 'VP of Engineering',
      weeklyCapacityHours: 40,
    });

    // Create Developers
    const devAyush = await User.create({
      name: 'Ayush Sharma',
      email: 'ayush@workradar.io',
      password: 'Password123!',
      role: 'EMPLOYEE',
      designation: 'Senior Full-Stack Developer',
      weeklyCapacityHours: 40,
    });

    const devRahul = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@workradar.io',
      password: 'Password123!',
      role: 'EMPLOYEE',
      designation: 'Backend Specialist',
      weeklyCapacityHours: 35,
    });

    const devPriya = await User.create({
      name: 'Priya Patel',
      email: 'priya@workradar.io',
      password: 'Password123!',
      role: 'EMPLOYEE',
      designation: 'Frontend UI/UX Engineer',
      weeklyCapacityHours: 40,
    });

    // Projects
    const projectFintech = await Project.create({
      name: 'Fintech Payment Gateway Platform',
      description: 'Production payment integration supporting Stripe, PayPal, multi-currency processing, and automatic reconciliation.',
      createdById: manager._id,
      teamMembers: [devAyush._id, devRahul._id, devPriya._id],
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      targetEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
    });

    const projectRadar = await Project.create({
      name: 'WorkRadar AI Workforce Portal',
      description: 'Predictive delay risk forecasting system with workload balancing and real-time team diagnostic alerts.',
      createdById: manager._id,
      teamMembers: [devAyush._id, devRahul._id],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      targetEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
    });

    // Prerequisite Task
    const taskApiDep = await Task.create({
      title: 'Stripe Webhook API Integration Endpoint',
      description: 'Build backend REST endpoint to handle asynchronous Stripe payment event callbacks.',
      projectId: projectFintech._id,
      assignedTo: devRahul._id,
      createdBy: manager._id,
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      progressPercentage: 35,
      estimatedHours: 16,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    // High Risk Task
    const taskPaymentModule = await Task.create({
      title: 'Build Payment Processing Checkout Module',
      description: 'Integrate client checkout form with Stripe SDK and handle response tokenization.',
      projectId: projectFintech._id,
      assignedTo: devAyush._id,
      createdBy: manager._id,
      priority: 'CRITICAL',
      status: 'BLOCKED',
      progressPercentage: 30,
      estimatedHours: 24,
      startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      dependencies: [taskApiDep._id],
      isBlocked: true,
      blockerReason: 'Waiting for Stripe Webhook API Integration endpoint completion from backend team.',
      blockerCategory: 'DEPENDENCY',
    });

    const paymentRisk = calculateTaskRisk(taskPaymentModule, [taskApiDep], 48);
    taskPaymentModule.riskScore = paymentRisk.riskScore;
    taskPaymentModule.riskLevel = paymentRisk.riskLevel;
    taskPaymentModule.riskFactors = paymentRisk.riskFactors;
    taskPaymentModule.recommendedAction = paymentRisk.recommendedAction;
    await taskPaymentModule.save();

    // Additional Tasks
    await Task.create({
      title: 'Delay Risk Formula Scoring Engine',
      description: 'Implement rule-based engine evaluating pace delta, blockers, and workload pressure.',
      projectId: projectRadar._id,
      assignedTo: devAyush._id,
      createdBy: manager._id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progressPercentage: 60,
      estimatedHours: 18,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    });

    await Task.create({
      title: 'Workload Capacity Bar Charts & Analytics',
      description: 'Create Recharts visualization for team workload distribution.',
      projectId: projectRadar._id,
      assignedTo: devPriya._id,
      createdBy: manager._id,
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      progressPercentage: 45,
      estimatedHours: 10,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    });

    // Extension Request
    await DeadlineExtensionRequest.create({
      taskId: taskPaymentModule._id,
      requestedBy: devAyush._id,
      currentDeadline: taskPaymentModule.deadline,
      requestedDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      reason: 'Progress delayed due to unresolved Stripe webhook dependency blocker.',
      status: 'PENDING',
    });

    // Notifications
    await Notification.create([
      {
        recipientId: manager._id,
        title: '⚠️ High Risk Warning: Build Payment Processing Checkout Module',
        message: `Task is at ${paymentRisk.riskScore}/100 HIGH RISK due to API dependency blocker.`,
        type: 'RISK_ALERT',
        relatedTaskId: taskPaymentModule._id,
        relatedProjectId: projectFintech._id,
      },
      {
        recipientId: devAyush._id,
        title: '⏰ Payment Module Task Assigned',
        message: 'Manager assigned you "Build Payment Processing Checkout Module" due in 3 days.',
        type: 'TASK_ASSIGNED',
        relatedTaskId: taskPaymentModule._id,
      },
    ]);

    // Comments
    await Comment.create([
      {
        taskId: taskPaymentModule._id,
        authorId: devAyush._id,
        text: 'I have built the frontend UI component, but we need the webhook endpoint live before tokenization can be tested.',
      },
      {
        taskId: taskPaymentModule._id,
        authorId: manager._id,
        text: 'Checking with Rahul to prioritize the webhook endpoint today.',
      },
    ]);

    console.log('[Auto-Seed] ✅ Auto-seeding completed successfully! Demo accounts are ready.');
  } catch (error) {
    console.error('[Auto-Seed Error]:', error.message);
  }
};

module.exports = autoSeedIfEmpty;
