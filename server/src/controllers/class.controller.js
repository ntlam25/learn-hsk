const classModel = require('../models/classModel');
const enrollmentModel = require('../models/enrollmentModel');
const userModel = require('../models/userModel');
const lessonModel = require('../models/lessonModel');
const progressModel = require('../models/progressModel');
const submissionModel = require('../models/submissionModel');
const flashcardModel = require('../models/flashcardModel');

// GET /api/admin/classes — admin thấy tất cả, giáo viên chỉ thấy lớp mình dạy
async function list(req, res) {
  const teacherId = req.user.role === 'teacher' ? req.user.id : undefined;
  const classes = await classModel.list({ teacherId });
  res.json(classes);
}

async function create(req, res) {
  const { courseId, name } = req.body;
  if (!courseId || !name) return res.status(400).json({ message: 'Thiếu khoá học hoặc tên lớp.' });
  const teacherId = req.user.role === 'teacher' ? req.user.id : req.body.teacherId || req.user.id;
  const klass = await classModel.create({ courseId, teacherId, name });
  res.status(201).json(klass);
}

async function assertOwnClass(req, res) {
  const klass = await classModel.getById(req.params.classId);
  if (!klass) {
    res.status(404).json({ message: 'Không tìm thấy lớp học.' });
    return null;
  }
  if (req.user.role === 'teacher' && klass.teacherId !== req.user.id) {
    res.status(403).json({ message: 'Bạn không phụ trách lớp này.' });
    return null;
  }
  return klass;
}

async function update(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const updated = await classModel.update(klass.id, req.body);
  res.json(updated);
}

async function remove(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  await classModel.remove(klass.id);
  res.json({ message: 'Đã xoá.' });
}

// GET /api/admin/classes/:classId/students
async function listStudents(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const enrollments = await enrollmentModel.listByClass(klass.id);
  res.json(enrollments);
}

// POST /api/admin/classes/:classId/students  body: { email }
// Học viên phải tự đăng ký trước — ở đây chỉ tìm theo email và thêm vào lớp, không tạo tài khoản mới.
async function addStudent(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc email học viên.' });

  const user = await userModel.findByIdentifier(identifier);
  if (!user || user.role !== 'student') {
    return res
      .status(404)
      .json({ message: 'Không tìm thấy học viên với tên đăng nhập/email này (học viên phải tự đăng ký trước).' });
  }

  try {
    const enrollment = await enrollmentModel.create({ classId: klass.id, studentId: user.id, enrolledBy: req.user.id });
    res.status(201).json(enrollment);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Học viên đã có trong lớp này.' });
    throw err;
  }
}

async function removeStudent(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  await enrollmentModel.remove(req.params.enrollmentId);
  res.json({ message: 'Đã xoá học viên khỏi lớp.' });
}

// GET /api/admin/classes/:classId/report — tiến độ + điểm + % flashcard đã thuộc của từng học viên
async function report(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;

  const [enrollments, lessons] = await Promise.all([
    enrollmentModel.listByClass(klass.id),
    lessonModel.listAdminByCourse(klass.courseId),
  ]);
  const lessonIds = lessons.map((l) => l.id);

  const rows = await Promise.all(
    enrollments.map(async (e) => {
      const [progress, quiz, flashcards] = await Promise.all([
        progressModel.summaryForStudentLessons(e.studentId, lessonIds),
        submissionModel.summaryForStudentLessons(e.studentId, lessonIds),
        flashcardModel.knownRatioForStudentLessons(e.studentId, lessonIds),
      ]);
      return {
        student: e.student,
        lessonsCompleted: progress.completed,
        lessonsTotal: progress.total,
        quizPoints: quiz.totalPoints,
        quizCorrectCount: quiz.correctCount,
        quizSubmittedCount: quiz.submittedCount,
        flashcardKnown: flashcards.known,
        flashcardTotal: flashcards.total,
      };
    })
  );

  res.json({ class: klass, students: rows });
}

module.exports = { list, create, update, remove, listStudents, addStudent, removeStudent, report };
