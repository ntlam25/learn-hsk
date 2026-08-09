const courseModel = require('../models/courseModel');

// GET /api/courses (public) — chỉ course đã publish, nhóm theo hskLevel ở frontend
async function listPublic(req, res) {
  const courses = await courseModel.listPublic();
  res.json(courses);
}

// GET /api/admin/courses (teacher/admin) — tất cả course kể cả chưa publish
async function listAdmin(req, res) {
  const courses = await courseModel.listAdmin();
  res.json(courses);
}

async function getById(req, res) {
  const course = await courseModel.getById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khoá học.' });
  res.json(course);
}

async function create(req, res) {
  const payload = { ...req.body, createdBy: req.user.id };
  if (!payload.title) return res.status(400).json({ message: 'Thiếu tên khoá học.' });
  const course = await courseModel.create(payload);
  res.status(201).json(course);
}

async function update(req, res) {
  const course = await courseModel.update(req.params.id, req.body);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khoá học.' });
  res.json(course);
}

async function remove(req, res) {
  const course = await courseModel.remove(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khoá học.' });
  res.json({ message: 'Đã xoá.' });
}

module.exports = { listPublic, listAdmin, getById, create, update, remove };
