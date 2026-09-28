const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  requestCompletion,
  reviewCompletion,
  deleteTask,
} = require('../controllers/taskController');
const { addComment, getTaskComments } = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Protect all task routes

router.route('/')
  .post(authorize('MANAGER'), createTask)
  .get(getTasks);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(authorize('MANAGER'), deleteTask);

// Task Completion Request & Approval Routes
router.route('/:id/request-completion')
  .post(requestCompletion);

router.route('/:id/review-completion')
  .put(authorize('MANAGER'), reviewCompletion);

// Comment nested routes
router.route('/:taskId/comments')
  .post(addComment)
  .get(getTaskComments);

module.exports = router;
