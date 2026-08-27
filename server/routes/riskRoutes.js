const express = require('express');
const router = express.Router();
const { getRiskSummary, getAtRiskTasks } = require('../controllers/riskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('MANAGER'));

router.get('/summary', getRiskSummary);
router.get('/tasks', getAtRiskTasks);

module.exports = router;
