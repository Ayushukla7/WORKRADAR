const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Notification = require('./models/Notification');
const Comment = require('./models/Comment');
const DeadlineExtensionRequest = require('./models/DeadlineExtensionRequest');
const { calculateTaskRisk } = require('./services/riskEngine');

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('[Seed Script] Connecting to database...');
    await connectDB();

    console.log('[Seed Script] Clearing old database records...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});
    await Comment.deleteMany({});
    await DeadlineExtensionRequest.deleteMany({});

    console.log('[Seed Script] Creating Realistic Users (1 Manager, 3 Developers)...');
    
    // Create Manager (Pooja Sharma)
    const manager = await User.create({
      name: 'Pooja Sharma',
      email: 'manager@workradar.io',
      password: 'Password123!',
      role: 'MANAGER',
      designation: 'VP of Engineering',
      weeklyCapacityHours: 40,
    });

    // Create Developers (Ayush, Rahul, Priya)
    const devAyush = await User.create({
      name: 'Ayush',
      email: 'ayush@workradar.io',
      password: 'Password123!',
      role: 'EMPLOYEE',
      designation: 'Senior Full-Stack Developer',
      weeklyCapacityHours: 40,
    });

    const devRahul = await User.create({
      name: 'Rahul',
      email: 'rahul@workradar.io',
      password: 'Password123!',
      role: 'EMPLOYEE',
      designation: 'Backend Specialist',
      weeklyCapacityHours: 35,
    });

    const devPriya = await User.create({
      name: 'Priya',
      email: 'priya@workradar.io',
      password: 'Password123!',
      role: 'EMPLOYEE',
      designation: 'Frontend UI/UX Engineer',
      weeklyCapacityHours: 40,
    });

    console.log('[Seed Script] Creating 2 Primary Projects...');
    const projectFintech = await Project.create({
      name: 'Fintech Payment Gateway Platform',
      description: 'Production payment integration supporting Stripe, PayPal, multi-currency processing, and automatic reconciliation.',
      createdById: manager._id,
      teamMembers: [devAyush._id, devRahul._id, devPriya._id],
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      targetEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days left
      status: 'ACTIVE',
    });

    const projectRadar = await Project.create({
      name: 'WorkRadar AI Workforce Portal',
      description: 'Predictive delay risk forecasting system with workload balancing and real-time team diagnostic alerts.',
      createdById: manager._id,
      teamMembers: [devAyush._id, devRahul._id],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      targetEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days left
      status: 'ACTIVE',
    });

    console.log('[Seed Script] Creating Prerequisite Core Tasks...');

    // Prerequisite Task 1 (Completed)
    const taskAuth = await Task.create({
      title: 'OAuth2 Authentication & JWT Auth Infrastructure',
      description: 'Setup password hashing with bcrypt, JWT token signing, and role authorization middlewares.',
      projectId: projectFintech._id,
      assignedTo: devRahul._id,
      createdBy: manager._id,
      priority: 'HIGH',
      status: 'COMPLETED',
      progressPercentage: 100,
      estimatedHours: 12,
      startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      riskScore: 0,
      riskLevel: 'LOW',
      riskFactors: ['Task completed successfully'],
      recommendedAction: 'No action required',
    });

    // Prerequisite Task 2 (In Progress - API Dependency)
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

    console.log('[Seed Script] Creating High Risk & Blocked Demo Scenario Tasks...');

    // DEMO SCENARIO TASK: "Build Payment Module" (HIGH RISK / BLOCKED)
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
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days remain
      dependencies: [taskApiDep._id],
      isBlocked: true,
      blockerReason: 'Waiting for Stripe Webhook API Integration endpoint completion from backend team.',
      blockerCategory: 'DEPENDENCY',
    });

    // Calculate Risk for Payment Module Task
    const paymentRisk = calculateTaskRisk(
      taskPaymentModule,
      [taskApiDep],
      48 // Ayush is overloaded at 48 hrs
    );
    taskPaymentModule.riskScore = paymentRisk.riskScore;
    taskPaymentModule.riskLevel = paymentRisk.riskLevel;
    taskPaymentModule.riskFactors = paymentRisk.riskFactors;
    taskPaymentModule.recommendedAction = paymentRisk.recommendedAction;
    await taskPaymentModule.save();

    // Additional Tasks
    const taskRiskEngine = await Task.create({
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

    const taskWorkloadChart = await Task.create({
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

    const taskRateLimiter = await Task.create({
      title: 'API Rate Limiting & Security Hardening',
      description: 'Add express-rate-limit and sanitize header inputs.',
      projectId: projectFintech._id,
      assignedTo: devRahul._id,
      createdBy: manager._id,
      priority: 'HIGH',
      status: 'BLOCKED',
      progressPercentage: 15,
      estimatedHours: 14,
      startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day remaining!
      isBlocked: true,
      blockerReason: 'Waiting for DevOps team to provision Redis staging cluster credentials.',
      blockerCategory: 'EXTERNAL',
    });

    const rateLimitRisk = calculateTaskRisk(taskRateLimiter, [], 30);
    taskRateLimiter.riskScore = rateLimitRisk.riskScore;
    taskRateLimiter.riskLevel = rateLimitRisk.riskLevel;
    taskRateLimiter.riskFactors = rateLimitRisk.riskFactors;
    taskRateLimiter.recommendedAction = rateLimitRisk.recommendedAction;
    await taskRateLimiter.save();

    console.log('[Seed Script] Creating Realistic Notifications & Extension Requests...');

    // Extension Request
    await DeadlineExtensionRequest.create({
      taskId: taskPaymentModule._id,
      requestedBy: devAyush._id,
      currentDeadline: taskPaymentModule.deadline,
      requestedDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      reason: 'Progress delayed due to unresolved Stripe webhook dependency blocker.',
      status: 'PENDING',
    });

    // In-app Notifications
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
        recipientId: manager._id,
        title: '📌 Extension Request from Ayush',
        message: 'Requested 3 additional days for "Build Payment Processing Checkout Module".',
        type: 'EXTENSION_REQUEST',
        relatedTaskId: taskPaymentModule._id,
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

    console.log('====================================================');
    console.log('✅ WORKRADAR DATABASE SEEDED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('DEMO LOGIN CREDENTIALS:');
    console.log('----------------------------------------------------');
    console.log('1. Manager (Pooja Sharma):');
    console.log('   Email:    manager@workradar.io');
    console.log('   Password: Password123!');
    console.log('');
    console.log('2. Employee / Developer 1 (Ayush):');
    console.log('   Email:    ayush@workradar.io');
    console.log('   Password: Password123!');
    console.log('');
    console.log('3. Employee / Developer 2 (Rahul):');
    console.log('   Email:    rahul@workradar.io');
    console.log('   Password: Password123!');
    console.log('');
    console.log('4. Employee / Developer 3 (Priya):');
    console.log('   Email:    priya@workradar.io');
    console.log('   Password: Password123!');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
