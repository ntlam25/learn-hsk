const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/upload.controller');

const router = express.Router();

router.use(requireAuth, requireRole('admin', 'teacher')); // toàn bộ API upload chỉ dành cho admin/giáo viên đã đăng nhập

router.get('/', asyncHandler(ctrl.listFiles));
router.post('/', upload.single('file'), asyncHandler(ctrl.uploadFile));
router.delete('/', asyncHandler(ctrl.deleteFile));

// Bắt lỗi riêng của multer (vd. quá dung lượng, sai định dạng) để trả JSON gọn gàng
router.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ message: 'Lỗi upload: ' + err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = router;
