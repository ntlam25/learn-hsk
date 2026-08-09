const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/enrollment.controller');

const router = express.Router();
router.use(requireAuth, requireRole('student'));

router.get('/courses', asyncHandler(ctrl.myCourses));

module.exports = router;
