const lessonModel = require('../models/lessonModel');
const enrollmentModel = require('../models/enrollmentModel');

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

// GET /api/lessons/:id — public nếu is_preview=true, ngược lại cần đăng nhập + đã enroll course chứa bài này
async function getById(req, res) {
  const lesson = await lessonModel.getFullById(req.params.id);
  if (!lesson || !lesson.published) return res.status(404).json({ message: 'Không tìm thấy bài học.' });

  if (lesson.isPreview) return res.json(lesson);

  if (!req.user) return res.status(401).json({ message: 'Cần đăng nhập để xem bài học này.' });
  if (req.user.role === 'admin' || req.user.role === 'teacher') return res.json(lesson);

  const enrolled = await enrollmentModel.isStudentEnrolledInCourse(req.user.id, lesson.courseId);
  if (!enrolled) {
    return res.status(403).json({ message: 'Bạn chưa được thêm vào lớp học của khoá này.' });
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
