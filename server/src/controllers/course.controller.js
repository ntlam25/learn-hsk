const courseModel = require('../models/courseModel');
const lessonModel = require('../models/lessonModel');
const classModel = require('../models/classModel');
const { supabase } = require('../config/supabase');
const { idsFrom, BAD_IDS } = require('../utils/bulk');

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

// GET /api/admin/courses/:id/overview (teacher/admin) — trang chi tiết khoá học: thông tin, danh sách bài
// (kèm số từ / quiz / flashcard / file nghe / trang sách), các lớp dùng khoá (GV chỉ thấy lớp mình dạy), số liệu tổng.
async function overview(req, res) {
  const course = await courseModel.getById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khoá học.' });

  const [lessons, classes] = await Promise.all([
    lessonModel.listAdminByCourse(course.id),
    classModel.list({ courseId: course.id, teacherId: req.user.role === 'teacher' ? req.user.id : undefined }),
  ]);
  const ids = lessons.map((l) => l.id);
  const [vocab, media, items] = await Promise.all([
    lessonModel.vocabCounts(ids),
    lessonModel.mediaCounts(ids),
    lessonModel.exerciseItemsFor(ids),
  ]);

  let studentCount = 0;
  if (classes.length) {
    const { data, error } = await supabase.from('enrollments').select('student_id').in('class_id', classes.map((c) => c.id));
    if (error) throw error;
    studentCount = new Set(data.map((r) => r.student_id)).size; // học viên ở nhiều lớp chỉ tính 1 lần
  }

  const rows = lessons.map((l) => ({
    ...l,
    vocabCount: vocab[l.id] || 0,
    quizCount: items.filter((i) => i.lessonId === l.id && i.kind === 'quiz').length,
    flashcardCount: items.filter((i) => i.lessonId === l.id && i.kind === 'flashcard').length,
    audioCount: media[l.id]?.audio || 0,
    pageCount: media[l.id]?.pages || 0,
  }));

  res.json({
    course,
    lessons: rows,
    classes,
    stats: {
      lessonCount: rows.length,
      publishedCount: rows.filter((l) => l.published).length,
      previewCount: rows.filter((l) => l.isPreview).length,
      vocabCount: rows.reduce((s, l) => s + l.vocabCount, 0),
      quizCount: rows.reduce((s, l) => s + l.quizCount, 0),
      classCount: classes.length,
      studentCount,
    },
  });
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

// Xoá khoá: các bài của khoá KHÔNG bị xoá — chỉ gỡ liên kết (bài còn ở khoá khác, hoặc thành bài độc lập)
async function remove(req, res) {
  const course = await courseModel.remove(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khoá học.' });
  res.json({ message: 'Đã xoá.' });
}

// POST /api/admin/courses/bulk-delete  body: { ids } (admin) — xoá nhiều khoá; bài học không bị xoá
async function removeMany(req, res) {
  const ids = idsFrom(req.body);
  if (!ids) return res.status(400).json(BAD_IDS);
  const deleted = await courseModel.removeMany(ids);
  res.json({ message: `Đã xoá ${deleted} khoá học.`, deleted });
}

// POST /api/admin/courses/:id/lessons/bulk-remove  body: { lessonIds } — gỡ nhiều bài khỏi khoá (bài vẫn còn)
async function removeLessons(req, res) {
  const ids = idsFrom(req.body, 'lessonIds');
  if (!ids) return res.status(400).json(BAD_IDS);
  const removed = await lessonModel.removeManyFromCourse(req.params.id, ids);
  res.json({ message: `Đã gỡ ${removed} bài khỏi khoá.`, removed });
}

// POST /api/admin/courses/:id/lessons  body: { lessonIds: [...] } — thêm bài có sẵn (dùng chung) vào khoá
async function addLessons(req, res) {
  const course = await courseModel.getById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khoá học.' });
  const lessonIds = Array.isArray(req.body.lessonIds) ? [...new Set(req.body.lessonIds.filter((x) => typeof x === 'string'))] : [];
  if (!lessonIds.length) return res.status(400).json({ message: 'Chưa chọn bài nào.' });
  await lessonModel.addToCourse(course.id, lessonIds);
  res.json({ message: `Đã thêm ${lessonIds.length} bài vào khoá.`, added: lessonIds.length });
}

// DELETE /api/admin/courses/:id/lessons/:lessonId — gỡ bài khỏi khoá (bài vẫn còn trong thư viện / các khoá khác)
async function removeLesson(req, res) {
  const removed = await lessonModel.removeFromCourse(req.params.id, req.params.lessonId);
  if (!removed) return res.status(404).json({ message: 'Bài không thuộc khoá này.' });
  res.json({ message: 'Đã gỡ bài khỏi khoá.' });
}

module.exports = { listPublic, listAdmin, getById, overview, create, update, remove, removeMany, addLessons, removeLesson, removeLessons };
