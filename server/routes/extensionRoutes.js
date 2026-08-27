const express = require('express');
const router = express.Router();
const {
  createExtensionRequest,
  getExtensionRequests,
  reviewExtensionRequest,
} = require('../controllers/extensionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createExtensionRequest)
  .get(getExtensionRequests);

router.put('/:id/review', authorize('MANAGER'), reviewExtensionRequest);

module.exports = router;
