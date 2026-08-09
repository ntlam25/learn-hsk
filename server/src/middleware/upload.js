const multer = require('multer');

const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 15);

// Whitelist mime type: ảnh dùng cho trang sách/minh hoạ, audio dùng cho file nghe.
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/x-m4a',
  'audio/mp4',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(), // giữ file trong RAM rồi đẩy thẳng lên Supabase Storage, không ghi ra đĩa
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error(`Định dạng file không được hỗ trợ: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = { upload, MAX_MB };
