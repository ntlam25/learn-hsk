const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/exercise.controller');

// mounted tại /api/lessons/:lessonId/... — chỉ học viên đã đăng nhập mới nộp bài/review được
const router = express.Router({ mergeParams: true });
router.use(requireAuth, requireRole('student'));

router.post('/exercise-items/:itemId/submit', asyncHandler(ctrl.submit));
router.post('/exercise-items/:itemId/review', asyncHandler(ctrl.review));
router.get('/flashcard-reviews', asyncHandler(ctrl.myReviews));
router.post('/progress', asyncHandler(ctrl.markProgress));

module.exports = router;
