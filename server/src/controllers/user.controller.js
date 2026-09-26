const bcrypt = require('bcryptjs');
const { idsFrom, BAD_IDS } = require('../utils/bulk');
const userModel = require('../models/userModel');

// GET /api/admin/users?role=teacher|student (admin/teacher) — dùng để tìm học viên theo email khi thêm vào lớp
async function listByRole(req, res) {
  const role = req.query.role;
  if (!['teacher', 'student', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Thiếu hoặc sai tham số role.' });
  }
  const users = await userModel.listByRole(role);
  res.json(users);
}

// POST /api/admin/users (chỉ admin) — tạo tài khoản giáo viên (học viên phải tự đăng ký, không tạo ở đây)
async function createTeacher(req, res) {
  const { username, email, password, fullName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Thiếu tên đăng nhập, email hoặc mật khẩu.' });
  }
  const [existingUsername, existingEmail] = await Promise.all([
    userModel.findByUsername(username),
    userModel.findByEmail(email),
  ]);
  if (existingUsername) return res.status(409).json({ message: 'Tên đăng nhập này đã được sử dụng.' });
  if (existingEmail) return res.status(409).json({ message: 'Email này đã được đăng ký.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ username, email, passwordHash, fullName: fullName || '', role: 'teacher' });
  res.status(201).json(userModel.fromRow(user));
}

const ROLES = ['admin', 'teacher', 'student'];

// GET /api/admin/users/all?search=&role= (chỉ admin) — danh sách toàn bộ người dùng, có tìm kiếm/lọc
async function listAll(req, res) {
  const { search, role } = req.query;
  if (role && !ROLES.includes(role)) {
    return res.status(400).json({ message: 'Sai tham số role.' });
  }
  const users = await userModel.listAll({ search, role });
  res.json(users);
}

// PUT /api/admin/users/:id/role (chỉ admin) — đổi quyền của một người dùng
async function updateRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: 'Sai tham số role.' });
  }
  if (id === req.user.id) {
    return res.status(400).json({ message: 'Không thể tự đổi quyền của chính mình.' });
  }
  const existing = await userModel.findById(id);
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

  const user = await userModel.updateRole(id, role);
  res.json(userModel.fromRow(user));
}

// DELETE /api/admin/users/:id (chỉ admin) — xoá tài khoản
async function remove(req, res) {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ message: 'Không thể tự xoá tài khoản của chính mình.' });
  }
  const existing = await userModel.findById(id);
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

  await userModel.remove(id);
  res.json({ message: 'Đã xoá người dùng.' });
}

// POST /api/admin/users/bulk-delete  body: { ids } (admin) — bỏ qua tài khoản của chính mình
async function removeMany(req, res) {
  const ids = idsFrom(req.body);
  if (!ids) return res.status(400).json(BAD_IDS);
  const targets = ids.filter((id) => id !== req.user.id);
  const deleted = targets.length ? await userModel.removeMany(targets) : 0;
  const skipped = ids.length - targets.length;
  res.json({
    message: `Đã xoá ${deleted} người dùng.${skipped ? ' Bỏ qua tài khoản của chính bạn.' : ''}`,
    deleted,
    skipped,
  });
}

module.exports = { listByRole, createTeacher, listAll, updateRole, remove, removeMany };
