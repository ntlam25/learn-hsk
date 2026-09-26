const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/course.controller');

const publicRouter = express.Router();
publicRouter.get('/', asyncHandler(ctrl.listPublic));
publicRouter.get('/:id', asyncHandler(ctrl.getById));

const adminRouter = express.Router();
adminRouter.use(requireAuth, requireRole('admin', 'teacher'));
adminRouter.get('/', asyncHandler(ctrl.listAdmin));
adminRouter.get('/:id', asyncHandler(ctrl.getById));
adminRouter.get('/:id/overview', asyncHandler(ctrl.overview));
adminRouter.post('/', asyncHandler(ctrl.create));
adminRouter.post('/bulk-delete', requireRole('admin'), asyncHandler(ctrl.removeMany));
adminRouter.put('/:id', asyncHandler(ctrl.update));
adminRouter.post('/:id/lessons', asyncHandler(ctrl.addLessons));
adminRouter.post('/:id/lessons/bulk-remove', asyncHandler(ctrl.removeLessons));
adminRouter.delete('/:id/lessons/:lessonId', asyncHandler(ctrl.removeLesson));
adminRouter.delete('/:id', requireRole('admin'), asyncHandler(ctrl.remove));

module.exports = { publicRouter, adminRouter };
