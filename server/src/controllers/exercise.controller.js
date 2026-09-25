const exerciseItemModel = require('../models/exerciseItemModel');
const submissionModel = require('../models/submissionModel');
const flashcardModel = require('../models/flashcardModel');
const progressModel = require('../models/progressModel');
const { lessonAccessFor, DENY_MESSAGE } = require('../models/accessModel');
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

// Nạp bài + kiểm tra quyền của học viên. needSubmit: thao tác ghi (nộp quiz, lưu tiến độ) — lớp đã kết thúc thì chặn.
// Trả về lesson, hoặc null khi đã gửi lỗi.
async function loadLessonFor(req, res, { needSubmit = true } = {}) {
  const lesson = await lessonModel.getFullById(req.params.lessonId);
  if (!lesson || !lesson.published) {
    res.status(404).json({ message: 'Không tìm thấy bài học.' });
    return null;
  }
  const access = await lessonAccessFor(req.user, lesson);
  if (!access.canView || (needSubmit && !access.canSubmit)) {
    res.status(403).json({ message: DENY_MESSAGE[access.reason] || 'Bạn không có quyền với bài học này.', reason: access.reason });
    return null;
  }
  return lesson;
}

// POST /api/lessons/:lessonId/exercise-items/:itemId/submit  (student) — chấm điểm quiz
async function submit(req, res) {
  const item = await exerciseItemModel.getById(req.params.itemId);
  if (!item || item.lessonId !== req.params.lessonId || item.kind !== 'quiz') {
    return res.status(404).json({ message: 'Không tìm thấy câu hỏi.' });
  }
  const lesson = await loadLessonFor(req, res);
  if (!lesson) return;

  const answer = req.body.answer;
  const isCorrect = deepEqual(answer, item.correctAnswer);
  const score = isCorrect ? item.points : 0;

  const submission = await submissionModel.create({ exerciseItemId: item.id, studentId: req.user.id, answer, isCorrect, score });
  await progressModel.touch(req.user.id, lesson.id);
  const progress = isCorrect ? await progressModel.maybeAutoComplete(req.user.id, lesson) : null;

  res.status(201).json({ ...submission, lessonStatus: progress?.status });
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
  const lesson = await loadLessonFor(req, res);
  if (!lesson) return;

  const reviewRow = await flashcardModel.upsertReview({ exerciseItemId: item.id, studentId: req.user.id, status });
  res.status(201).json(reviewRow);
}

// GET /api/lessons/:lessonId/flashcard-reviews  (student) — trạng thái review hiện tại của học viên cho bài này
async function myReviews(req, res) {
  const reviews = await flashcardModel.reviewsForStudentInLesson(req.user.id, req.params.lessonId);
  res.json(reviews);
}

// POST /api/lessons/:lessonId/progress  (student)
//  • không có status / 'in_progress' khi vừa mở bài: chỉ ghi lần xem (không hạ bài đã hoàn thành)
//  • 'completed': nút "Hoàn thành bài"; { status: 'in_progress', undo: true }: bỏ đánh dấu hoàn thành
async function markProgress(req, res) {
  const { status, undo } = req.body;
  if (status && !['in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'status không hợp lệ.' });
  }
  const lesson = await loadLessonFor(req, res, { needSubmit: status === 'completed' || !!undo });
  if (!lesson) return;
  const progress =
    status === 'completed' || undo
      ? await progressModel.upsert({ studentId: req.user.id, lessonId: lesson.id, status: status === 'completed' ? 'completed' : 'in_progress' })
      : await progressModel.touch(req.user.id, lesson.id);
  res.json(progress);
}

// GET /api/lessons/:lessonId/progress  (student) — trạng thái bài + các từ đã đánh dấu "đã thuộc" + quyền nộp bài
async function myProgress(req, res) {
  const lesson = await loadLessonFor(req, res, { needSubmit: false });
  if (!lesson) return;
  const [progress, access] = await Promise.all([
    progressModel.getForStudent(req.user.id, lesson.id),
    lessonAccessFor(req.user, lesson),
  ]);
  res.json({
    ...(progress || { lessonId: lesson.id, status: 'not_started', knownVocab: [] }),
    canSubmit: access.canSubmit,
  });
}

// PUT /api/lessons/:lessonId/progress/vocab  (student) — body { knownVocab: ['book-l1-1', ...] }
async function saveKnownVocab(req, res) {
  const { knownVocab } = req.body;
  if (!Array.isArray(knownVocab) || knownVocab.length > 1000 || knownVocab.some((k) => typeof k !== 'string' || k.length > 100)) {
    return res.status(400).json({ message: 'knownVocab phải là mảng khoá từ (chuỗi).' });
  }
  const lesson = await loadLessonFor(req, res);
  if (!lesson) return;
  await progressModel.setKnownVocab({ studentId: req.user.id, lessonId: lesson.id, knownVocab: [...new Set(knownVocab)] });
  await progressModel.touch(req.user.id, lesson.id);
  const progress = await progressModel.maybeAutoComplete(req.user.id, lesson);
  res.json(progress);
}

module.exports = { submit, review, myReviews, markProgress, myProgress, saveKnownVocab };
