const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/class.controller');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'teacher'));

router.get('/', asyncHandler(ctrl.list));
router.post('/', asyncHandler(ctrl.create));
router.put('/:classId', asyncHandler(ctrl.update));
router.delete('/:classId', asyncHandler(ctrl.remove));
router.get('/:classId/students', asyncHandler(ctrl.listStudents));
router.post('/:classId/students', asyncHandler(ctrl.addStudent));
router.delete('/:classId/students/:enrollmentId', asyncHandler(ctrl.removeStudent));
router.get('/:classId/report', asyncHandler(ctrl.report));

module.exports = router;
