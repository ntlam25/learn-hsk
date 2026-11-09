const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/birthday.controller');

const publicRouter = express.Router();
publicRouter.get('/pages/:slug', asyncHandler(ctrl.getPage));
publicRouter.post('/wishes', asyncHandler(ctrl.addWish));
publicRouter.delete('/wishes/:id', asyncHandler(ctrl.removeWish));

const adminRouter = express.Router();
adminRouter.use(requireAuth, requireRole('admin'));
adminRouter.put('/pages/:slug', asyncHandler(ctrl.savePage));
adminRouter.get('/wishes', asyncHandler(ctrl.listWishes));

module.exports = { publicRouter, adminRouter };
