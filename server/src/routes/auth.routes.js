const express = require('express');
const { register, login, me, updateMe, uploadMyAvatar } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.put('/me', requireAuth, asyncHandler(updateMe));
router.post('/me/avatar', requireAuth, upload.single('file'), asyncHandler(uploadMyAvatar));

module.exports = router;
