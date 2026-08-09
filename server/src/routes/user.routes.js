const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/user.controller');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'teacher'));

router.get('/all', requireRole('admin'), asyncHandler(ctrl.listAll));
router.get('/', asyncHandler(ctrl.listByRole));
router.post('/', requireRole('admin'), asyncHandler(ctrl.createTeacher));
router.put('/:id/role', requireRole('admin'), asyncHandler(ctrl.updateRole));
router.delete('/:id', requireRole('admin'), asyncHandler(ctrl.remove));

module.exports = router;
