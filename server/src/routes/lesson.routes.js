const express = require('express');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/lesson.controller');

const publicRouter = express.Router();
publicRouter.get('/preview', asyncHandler(ctrl.listPreview));
publicRouter.get('/:id', optionalAuth, asyncHandler(ctrl.getById));

const courseLessonsRouter = express.Router({ mergeParams: true });
courseLessonsRouter.get('/', asyncHandler(ctrl.listByCourse));

const adminRouter = express.Router();
adminRouter.use(requireAuth, requireRole('admin', 'teacher'));
adminRouter.get('/', asyncHandler(ctrl.listAdmin));
adminRouter.get('/:id', asyncHandler(ctrl.getAdminById));
adminRouter.post('/', asyncHandler(ctrl.create));
adminRouter.put('/:id', asyncHandler(ctrl.update));
adminRouter.delete('/:id', asyncHandler(ctrl.remove));

module.exports = { publicRouter, courseLessonsRouter, adminRouter };
