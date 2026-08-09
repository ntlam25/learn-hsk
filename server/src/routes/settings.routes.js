const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/settings.controller');

const publicRouter = express.Router();
publicRouter.get('/', asyncHandler(ctrl.getMood));

const adminRouter = express.Router();
adminRouter.use(requireAuth, requireRole('admin'));
adminRouter.put('/mood', asyncHandler(ctrl.setMood));

module.exports = { publicRouter, adminRouter };
