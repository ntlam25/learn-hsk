const crypto = require('crypto');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { supabase, BUCKET } = require('../config/supabase');

const { USERNAME_RE } = require('../utils/accounts');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    role: user.role,
  };
}

// POST /api/auth/register — học viên tự đăng ký, luôn tạo role 'student'.
// Đăng ký xong CHƯA vào course/lớp nào — học viên nhập mã lớp (/join/MÃ) hoặc chờ giáo viên thêm vào lớp.
async function register(req, res) {
  const { username, email, password, fullName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Thiếu tên đăng nhập, email hoặc mật khẩu.' });
  }
  const normalizedUsername = username.trim().toLowerCase();
  if (!USERNAME_RE.test(normalizedUsername)) {
    return res.status(400).json({
      message: 'Tên đăng nhập phải dài 3-32 ký tự, chỉ gồm chữ thường, số, dấu chấm và gạch dưới.',
    });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  const [existingUsername, existingEmail] = await Promise.all([
    userModel.findByUsername(normalizedUsername),
    userModel.findByEmail(email),
  ]);
  if (existingUsername) return res.status(409).json({ message: 'Tên đăng nhập này đã được sử dụng.' });
  if (existingEmail) return res.status(409).json({ message: 'Email này đã được đăng ký.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ username: normalizedUsername, email, passwordHash, fullName: fullName || '', role: 'student' });

  const token = signToken(user);
  return res.status(201).json({ token, user: publicUser(user) });
}

// POST /api/auth/login — identifier có thể là username hoặc email.
async function login(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Thiếu tên đăng nhập/email hoặc mật khẩu.' });
  }

  const user = await userModel.findByIdentifier(identifier);
  if (!user) {
    return res.status(401).json({ message: 'Sai tên đăng nhập/email hoặc mật khẩu.' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ message: 'Sai tên đăng nhập/email hoặc mật khẩu.' });
  }

  const token = signToken(user);
  return res.json({ token, user: publicUser(user) });
}

async function me(req, res) {
  const user = await userModel.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  return res.json({ user: publicUser(user) });
}

// PUT /api/auth/me — người dùng tự cập nhật họ tên của chính mình.
async function updateMe(req, res) {
  const { fullName } = req.body;
  const updated = await userModel.updateProfile(req.user.id, { fullName });
  return res.json({ user: publicUser(updated) });
}

// POST /api/auth/me/avatar — người dùng tự tải ảnh đại diện lên (bất kỳ role nào đã đăng nhập).
async function uploadMyAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Chưa chọn ảnh đại diện (field "file").' });
  }
  const ext = path.extname(req.file.originalname || '').toLowerCase();
  const key = `avatars/${req.user.id}-${crypto.randomUUID()}${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(key, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false,
  });
  if (uploadError) {
    return res.status(500).json({ message: 'Upload ảnh đại diện thất bại: ' + uploadError.message });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  const updated = await userModel.updateProfile(req.user.id, { avatarUrl: data.publicUrl });
  return res.status(201).json({ user: publicUser(updated) });
}

module.exports = { register, login, me, updateMe, uploadMyAvatar };
