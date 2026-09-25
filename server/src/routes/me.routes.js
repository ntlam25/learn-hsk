const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/enrollment.controller');

const router = express.Router();
router.use(requireAuth, requireRole('student'));

router.get('/courses', asyncHandler(ctrl.myCourses));
router.get('/courses/:courseId', asyncHandler(ctrl.myCourseDetail));
router.post('/classes/join', asyncHandler(ctrl.joinClass));

module.exports = router;
