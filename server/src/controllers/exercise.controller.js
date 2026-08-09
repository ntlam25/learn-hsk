const exerciseItemModel = require('../models/exerciseItemModel');
const submissionModel = require('../models/submissionModel');
const flashcardModel = require('../models/flashcardModel');
const progressModel = require('../models/progressModel');
const enrollmentModel = require('../models/enrollmentModel');
const lessonModel = require('../models/lessonModel');

// So sánh đáp án dạng jsonb bất kỳ (số, chuỗi, mảng, object) không quan tâm thứ tự khoá.
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

async function assertCanAccessLesson(req, lesson) {
  if (lesson.isPreview) return true;
  if (req.user.role === 'admin' || req.user.role === 'teacher') return true;
  return enrollmentModel.isStudentEnrolledInCourse(req.user.id, lesson.courseId);
}

// POST /api/lessons/:lessonId/exercise-items/:itemId/submit  (student) — chấm điểm quiz
async function submit(req, res) {
  const item = await exerciseItemModel.getById(req.params.itemId);
  if (!item || item.lessonId !== req.params.lessonId || item.kind !== 'quiz') {
    return res.status(404).json({ message: 'Không tìm thấy câu hỏi.' });
  }
  const lesson = await lessonModel.getFullById(req.params.lessonId);
  if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  if (!(await assertCanAccessLesson(req, lesson))) {
    return res.status(403).json({ message: 'Bạn chưa được thêm vào lớp học của khoá này.' });
  }

  const answer = req.body.answer;
  const isCorrect = deepEqual(answer, item.correctAnswer);
  const score = isCorrect ? item.points : 0;

  const submission = await submissionModel.create({ exerciseItemId: item.id, studentId: req.user.id, answer, isCorrect, score });
  await progressModel.upsert({ studentId: req.user.id, lessonId: req.params.lessonId, status: 'in_progress' });

  res.status(201).json(submission);
}

// POST /api/lessons/:lessonId/exercise-items/:itemId/review  (student) — flashcard tự đánh giá thuộc/chưa thuộc
async function review(req, res) {
  const item = await exerciseItemModel.getById(req.params.itemId);
  if (!item || item.lessonId !== req.params.lessonId || item.kind !== 'flashcard') {
    return res.status(404).json({ message: 'Không tìm thấy thẻ từ vựng.' });
  }
  const status = req.body.status;
  if (!['known', 'unknown'].includes(status)) {
    return res.status(400).json({ message: 'status phải là "known" hoặc "unknown".' });
  }
  const lesson = await lessonModel.getFullById(req.params.lessonId);
  if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  if (!(await assertCanAccessLesson(req, lesson))) {
    return res.status(403).json({ message: 'Bạn chưa được thêm vào lớp học của khoá này.' });
  }

  const reviewRow = await flashcardModel.upsertReview({ exerciseItemId: item.id, studentId: req.user.id, status });
  res.status(201).json(reviewRow);
}

// GET /api/lessons/:lessonId/flashcard-reviews  (student) — trạng thái review hiện tại của học viên cho bài này
async function myReviews(req, res) {
  const reviews = await flashcardModel.reviewsForStudentInLesson(req.user.id, req.params.lessonId);
  res.json(reviews);
}

// POST /api/lessons/:lessonId/progress  (student) — đánh dấu đã xem/hoàn thành bài học (tab Bài khóa)
async function markProgress(req, res) {
  const status = req.body.status || 'completed';
  if (!['not_started', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'status không hợp lệ.' });
  }
  const progress = await progressModel.upsert({ studentId: req.user.id, lessonId: req.params.lessonId, status });
  res.json(progress);
}

module.exports = { submit, review, myReviews, markProgress };
