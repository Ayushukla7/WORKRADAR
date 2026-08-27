const express = require('express');
const router = express.Router();
const { getWorkloadOverview, getMyWorkload } = require('../controllers/workloadController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('MANAGER'), getWorkloadOverview);
router.get('/my', getMyWorkload);

module.exports = router;
