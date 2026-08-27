const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // Protect all project routes

router.route('/')
  .post(authorize('MANAGER'), createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('MANAGER'), updateProject)
  .delete(authorize('MANAGER'), deleteProject);

module.exports = router;
