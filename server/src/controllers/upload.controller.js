const crypto = require('crypto');
const path = require('path');
const { supabase, BUCKET } = require('../config/supabase');

const ALLOWED_FOLDERS = new Set(['images', 'audio', 'book-pages', 'documents']);

function safeFolder(folder) {
  return ALLOWED_FOLDERS.has(folder) ? folder : 'images';
}

// POST /api/admin/uploads  (multipart/form-data, field "file", field "folder" tuỳ chọn)
async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Chưa chọn file để tải lên (field "file").' });
  }

  const folder = safeFolder(req.body.folder);
  const ext = path.extname(req.file.originalname || '').toLowerCase();
  const key = `${folder}/${Date.now()}-${crypto.randomUUID()}${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(key, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false,
  });

  if (uploadError) {
    return res.status(500).json({ message: 'Upload lên Supabase Storage thất bại: ' + uploadError.message });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);

  return res.status(201).json({
    path: key,
    url: data.publicUrl,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });
}

// GET /api/admin/uploads?folder=images  — liệt kê file đã tải lên (để chọn lại/quản lý)
async function listFiles(req, res) {
  const folder = safeFolder(req.query.folder || 'images');
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) return res.status(500).json({ message: 'Không lấy được danh sách file: ' + error.message });

  const files = (data || [])
    .filter((f) => f.name) // bỏ qua "placeholder" thư mục rỗng
    .map((f) => {
      const key = `${folder}/${f.name}`;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
      return { path: key, url: pub.publicUrl, name: f.name, size: f.metadata?.size, updatedAt: f.updated_at };
    });

  res.json(files);
}

// DELETE /api/admin/uploads  body: { path: "images/xxx.png" }
async function deleteFile(req, res) {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ message: 'Thiếu "path" của file cần xoá.' });

  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) return res.status(500).json({ message: 'Xoá file thất bại: ' + error.message });

  res.json({ message: 'Đã xoá.' });
}

module.exports = { uploadFile, listFiles, deleteFile };
