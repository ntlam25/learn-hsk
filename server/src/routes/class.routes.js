const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/class.controller');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'teacher'));

router.get('/', asyncHandler(ctrl.list));
router.post('/', asyncHandler(ctrl.create));
router.get('/:classId', asyncHandler(ctrl.getOne));
router.put('/:classId', asyncHandler(ctrl.update));
router.delete('/:classId', asyncHandler(ctrl.remove));
router.post('/:classId/join-code', asyncHandler(ctrl.regenerateJoinCode));

router.get('/:classId/students', asyncHandler(ctrl.listStudents));
router.post('/:classId/students', asyncHandler(ctrl.addStudent));
router.post('/:classId/students/bulk', asyncHandler(ctrl.bulkAddStudents));
router.post('/:classId/students/accounts', asyncHandler(ctrl.createStudentAccounts));
router.delete('/:classId/students/:enrollmentId', asyncHandler(ctrl.removeStudent));

router.get('/:classId/lessons', asyncHandler(ctrl.listLessons));
router.put('/:classId/lessons', asyncHandler(ctrl.setLessons));

router.get('/:classId/report', asyncHandler(ctrl.report));

module.exports = router;
