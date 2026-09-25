const lessonModel = require('../models/lessonModel');
const { lessonAccessFor, DENY_MESSAGE } = require('../models/accessModel');

// GET /api/courses/:courseId/lessons (public) — danh sách rút gọn, chỉ bài đã publish
async function listByCourse(req, res) {
  const lessons = await lessonModel.listPublicByCourse(req.params.courseId);
  res.json(lessons);
}

// GET /api/lessons/preview (public) — các bài admin cho xem trước, ai cũng xem được
async function listPreview(req, res) {
  const lessons = await lessonModel.listPreview();
  res.json(lessons);
}

// GET /api/lessons/:id — bài preview ai cũng xem; còn lại cần là học viên của 1 lớp thuộc khoá VÀ lớp đó đã mở bài
// (admin/GV xem được mọi bài). Bị chặn thì trả 401/403 kèm `reason` để client hiện thông báo phù hợp.
async function getById(req, res) {
  const lesson = await lessonModel.getFullById(req.params.id);
  if (!lesson || !lesson.published) return res.status(404).json({ message: 'Không tìm thấy bài học.' });

  const access = await lessonAccessFor(req.user, lesson);
  if (!access.canView) {
    return res.status(access.reason === 'login' ? 401 : 403).json({
      message: DENY_MESSAGE[access.reason],
      reason: access.reason,
      releaseAt: access.releaseAt,
      courseId: lesson.courseId,
    });
  }
  return res.json(lesson);
}

// GET /api/admin/lessons?courseId=... (teacher/admin) — tất cả bài, kể cả chưa publish
async function listAdmin(req, res) {
  const lessons = req.query.courseId
    ? await lessonModel.listAdminByCourse(req.query.courseId)
    : await lessonModel.listAdmin();
  res.json(lessons);
}

async function getAdminById(req, res) {
  const lesson = await lessonModel.getFullById(req.params.id);
  if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  res.json(lesson);
}

async function create(req, res) {
  try {
    const payload = { ...req.body, createdBy: req.user.id };
    if (!payload.courseId) return res.status(400).json({ message: 'Thiếu khoá học (courseId).' });
    if (!payload.lessonNumber || Number.isNaN(Number(payload.lessonNumber))) {
      return res.status(400).json({ message: 'Thiếu hoặc sai số bài (lessonNumber).' });
    }
    const exists = await lessonModel.findByNumber(payload.courseId, Number(payload.lessonNumber));
    if (exists) {
      return res.status(409).json({ message: `Bài số ${payload.lessonNumber} đã tồn tại trong khoá này.` });
    }
    const lesson = await lessonModel.create(payload);
    res.status(201).json(lesson);
  } catch (err) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ: ' + err.message });
  }
}

async function update(req, res) {
  try {
    const lesson = await lessonModel.update(req.params.id, req.body);
    if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
    res.json(lesson);
  } catch (err) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ: ' + err.message });
  }
}

async function remove(req, res) {
  const lesson = await lessonModel.remove(req.params.id);
  if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  res.json({ message: 'Đã xoá.' });
}

module.exports = { listByCourse, listPreview, getById, listAdmin, getAdminById, create, update, remove };
