const bcrypt = require('bcryptjs');
const classModel = require('../models/classModel');
const enrollmentModel = require('../models/enrollmentModel');
const userModel = require('../models/userModel');
const lessonModel = require('../models/lessonModel');
const progressModel = require('../models/progressModel');
const { supabase } = require('../config/supabase');
const { idsFrom, BAD_IDS } = require('../utils/bulk');
const { USERNAME_RE, generateJoinCode, generateTempPassword } = require('../utils/accounts');

const MAX_BATCH = 200;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/admin/classes — admin thấy tất cả, giáo viên chỉ thấy lớp mình dạy
async function list(req, res) {
  const teacherId = req.user.role === 'teacher' ? req.user.id : undefined;
  const classes = await classModel.list({ teacherId });
  res.json(classes);
}

// Chỉ nhận các trường được phép sửa; teacherId chỉ admin mới đổi được
function pickClassPayload(req) {
  const b = req.body;
  const payload = {};
  ['courseId', 'name', 'joinEnabled', 'archived'].forEach((k) => b[k] !== undefined && (payload[k] = b[k]));
  ['startDate', 'endDate'].forEach((k) => {
    if (b[k] !== undefined) payload[k] = b[k] && DATE_RE.test(b[k]) ? b[k] : null;
  });
  if (req.user.role === 'admin' && b.teacherId !== undefined) payload.teacherId = b.teacherId || null;
  return payload;
}

function validDates(payload, current = {}) {
  const start = payload.startDate !== undefined ? payload.startDate : current.startDate;
  const end = payload.endDate !== undefined ? payload.endDate : current.endDate;
  return !(start && end && end < start);
}

async function create(req, res) {
  const payload = pickClassPayload(req);
  if (!payload.courseId || !payload.name?.trim()) return res.status(400).json({ message: 'Thiếu khoá học hoặc tên lớp.' });
  if (!validDates(payload)) return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu.' });
  if (req.user.role === 'teacher' || !payload.teacherId) payload.teacherId = req.user.id;
  payload.name = payload.name.trim();
  // Lớp mới: chưa mở bài nào — giáo viên tự mở theo tiến độ ở tab "Bài học"
  const klass = await classModel.create(payload);
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

// GET /api/admin/classes/:classId
async function getOne(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  res.json(klass);
}

async function update(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const payload = pickClassPayload(req);
  if (payload.name !== undefined && !String(payload.name).trim()) return res.status(400).json({ message: 'Tên lớp không được trống.' });
  if (!validDates(payload, klass)) return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu.' });
  const updated = await classModel.update(klass.id, payload);
  res.json(updated);
}

async function remove(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  await classModel.remove(klass.id);
  res.json({ message: 'Đã xoá.' });
}

// POST /api/admin/classes/bulk-delete  body: { ids } — giáo viên chỉ xoá được lớp mình phụ trách
async function removeMany(req, res) {
  const ids = idsFrom(req.body);
  if (!ids) return res.status(400).json(BAD_IDS);
  const deleted = await classModel.removeMany(ids, { teacherId: req.user.role === 'teacher' ? req.user.id : undefined });
  const skipped = ids.length - deleted;
  res.json({ message: `Đã xoá ${deleted} lớp.${skipped ? ` Bỏ qua ${skipped} lớp không thuộc quyền của bạn.` : ''}`, deleted, skipped });
}

// POST /api/admin/classes/:classId/join-code — đổi mã mời (mã cũ hết hiệu lực)
async function regenerateJoinCode(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const updated = await classModel.update(klass.id, { joinCode: generateJoinCode() });
      return res.json(updated);
    } catch (err) {
      if (err.code !== '23505') throw err; // trùng mã thì thử mã khác
    }
  }
  return res.status(500).json({ message: 'Không tạo được mã lớp mới, vui lòng thử lại.' });
}

// ---------------------------------------------------------------- học viên

// GET /api/admin/classes/:classId/students
async function listStudents(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const enrollments = await enrollmentModel.listByClass(klass.id);
  res.json(enrollments);
}

// Thêm 1 học viên đã có tài khoản vào lớp → 'added' | 'exists' | 'not_found' | 'not_student'
async function enrollIdentifier(klass, identifier, enrolledBy) {
  const user = await userModel.findByIdentifier(identifier);
  if (!user) return { status: 'not_found' };
  if (user.role !== 'student') return { status: 'not_student' };
  try {
    const enrollment = await enrollmentModel.create({ classId: klass.id, studentId: user.id, enrolledBy });
    return { status: 'added', enrollment };
  } catch (err) {
    if (err.code === '23505') return { status: 'exists' };
    throw err;
  }
}

// POST /api/admin/classes/:classId/students  body: { identifier }
async function addStudent(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const identifier = String(req.body.identifier || '').trim();
  if (!identifier) return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc email học viên.' });

  const result = await enrollIdentifier(klass, identifier, req.user.id);
  if (result.status === 'added') return res.status(201).json(result.enrollment);
  if (result.status === 'exists') return res.status(409).json({ message: 'Học viên đã có trong lớp này.' });
  return res.status(404).json({
    message:
      result.status === 'not_student'
        ? 'Tài khoản này không phải học viên.'
        : 'Không tìm thấy học viên với tên đăng nhập/email này. Bạn có thể tạo tài khoản ở mục "Tạo tài khoản".',
  });
}

// POST /api/admin/classes/:classId/students/bulk  body: { identifiers: ['an.nguyen', 'b@mail.com', …] }
async function bulkAddStudents(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const identifiers = [
    ...new Set((Array.isArray(req.body.identifiers) ? req.body.identifiers : []).map((s) => String(s).trim()).filter(Boolean)),
  ];
  if (!identifiers.length) return res.status(400).json({ message: 'Danh sách trống.' });
  if (identifiers.length > MAX_BATCH) return res.status(400).json({ message: `Tối đa ${MAX_BATCH} dòng mỗi lần.` });

  const results = [];
  for (const identifier of identifiers) {
    const r = await enrollIdentifier(klass, identifier, req.user.id);
    results.push({ identifier, status: r.status });
  }
  res.json({ results });
}

// POST /api/admin/classes/:classId/students/accounts  body: { accounts: [{ username, fullName, email? }] }
// Tạo tài khoản học viên với mật khẩu tạm rồi ghi danh vào lớp. Mật khẩu tạm chỉ trả về MỘT lần ở đây.
async function createStudentAccounts(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const accounts = Array.isArray(req.body.accounts) ? req.body.accounts : [];
  if (!accounts.length) return res.status(400).json({ message: 'Danh sách trống.' });
  if (accounts.length > MAX_BATCH) return res.status(400).json({ message: `Tối đa ${MAX_BATCH} tài khoản mỗi lần.` });

  const results = [];
  for (const acc of accounts) {
    const username = String(acc.username || '').trim().toLowerCase();
    const email = String(acc.email || '').trim().toLowerCase() || null;
    const fullName = String(acc.fullName || '').trim();
    const row = { username, fullName, email };
    if (!USERNAME_RE.test(username)) {
      results.push({ ...row, status: 'invalid', message: '3-32 ký tự: chữ thường, số, dấu chấm, gạch dưới.' });
      continue;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ ...row, status: 'invalid', message: 'Email không hợp lệ.' });
      continue;
    }
    const [byUsername, byEmail] = await Promise.all([
      userModel.findByUsername(username),
      email ? userModel.findByEmail(email) : null,
    ]);
    if (byUsername) {
      results.push({ ...row, status: 'taken', message: 'Tên đăng nhập đã tồn tại — dùng "Thêm hàng loạt" để thêm tài khoản này.' });
      continue;
    }
    if (byEmail) {
      results.push({ ...row, status: 'taken', message: 'Email đã được dùng cho tài khoản khác.' });
      continue;
    }
    const password = generateTempPassword();
    const user = await userModel.create({
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      fullName,
      role: 'student',
    });
    await enrollmentModel.create({ classId: klass.id, studentId: user.id, enrolledBy: req.user.id });
    results.push({ ...row, status: 'created', password });
  }
  res.status(201).json({ results });
}

async function removeStudent(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  await enrollmentModel.remove(req.params.enrollmentId, klass.id);
  res.json({ message: 'Đã xoá học viên khỏi lớp.' });
}

// POST /api/admin/classes/:classId/students/bulk-remove  body: { enrollmentIds }
async function removeStudents(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const ids = idsFrom(req.body, 'enrollmentIds');
  if (!ids) return res.status(400).json(BAD_IDS);
  const removed = await enrollmentModel.removeMany(ids, klass.id);
  res.json({ message: `Đã xoá ${removed} học viên khỏi lớp.`, removed });
}

// ---------------------------------------------------------------- bài học của lớp

// GET /api/admin/classes/:classId/lessons — mọi bài của khoá + trạng thái mở với lớp này
async function listLessons(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const [lessons, states] = await Promise.all([lessonModel.listAdminByCourse(klass.courseId), classModel.lessonStates([klass.id])]);
  const byLesson = Object.fromEntries(states.map((s) => [s.lessonId, s]));
  res.json(
    lessons.map((l) => ({
      id: l.id,
      lessonNumber: l.lessonNumber,
      titleZh: l.titleZh,
      titleVi: l.titleVi,
      published: l.published,
      released: !!byLesson[l.id]?.released,
      releaseAt: byLesson[l.id]?.releaseAt || null,
      open: !!byLesson[l.id]?.open,
    }))
  );
}

// PUT /api/admin/classes/:classId/lessons  body: { items: [{ lessonId, released, releaseAt }] }
async function setLessons(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const lessons = await lessonModel.listAdminByCourse(klass.courseId);
  const ids = new Set(lessons.map((l) => l.id));
  if (items.some((it) => !ids.has(it.lessonId))) return res.status(400).json({ message: 'Có bài không thuộc khoá của lớp này.' });
  if (items.some((it) => it.releaseAt && Number.isNaN(Date.parse(it.releaseAt)))) {
    return res.status(400).json({ message: 'Ngày mở bài không hợp lệ.' });
  }
  await classModel.setLessonStates(klass.id, items);
  return listLessons(req, res);
}

// ---------------------------------------------------------------- báo cáo

// GET /api/admin/classes/:classId/report — ma trận học viên × bài + các cột tổng
async function report(req, res) {
  const klass = await assertOwnClass(req, res);
  if (!klass) return;

  const [enrollments, allLessons, states] = await Promise.all([
    enrollmentModel.listByClass(klass.id),
    lessonModel.listAdminByCourse(klass.courseId),
    classModel.lessonStates([klass.id]),
  ]);
  const lessons = allLessons.filter((l) => l.published);
  const lessonIds = lessons.map((l) => l.id);
  const studentIds = enrollments.map((e) => e.studentId);
  const openById = Object.fromEntries(states.map((s) => [s.lessonId, s.open]));

  const [vocabCounts, items, progressRows] = await Promise.all([
    lessonModel.vocabCounts(lessonIds),
    lessonModel.exerciseItemsFor(lessonIds),
    progressModel.listFor(studentIds, lessonIds),
  ]);
  const quizItems = items.filter((i) => i.kind === 'quiz');
  const flashItems = items.filter((i) => i.kind === 'flashcard');
  const itemById = Object.fromEntries(items.map((i) => [i.id, i]));

  async function fetchRows(table, columns, itemIds) {
    if (!itemIds.length || !studentIds.length) return [];
    const { data, error } = await supabase.from(table).select(columns).in('student_id', studentIds).in('exercise_item_id', itemIds);
    if (error) throw error;
    return data;
  }
  const [submissions, reviews] = await Promise.all([
    fetchRows('submissions', 'student_id, exercise_item_id, is_correct, submitted_at', quizItems.map((i) => i.id)),
    fetchRows('flashcard_reviews', 'student_id, exercise_item_id, status', flashItems.map((i) => i.id)),
  ]);

  const quizTotalByLesson = {};
  quizItems.forEach((i) => (quizTotalByLesson[i.lessonId] = (quizTotalByLesson[i.lessonId] || 0) + 1));

  const students = enrollments.map((e) => {
    const sid = e.studentId;
    const cells = {};
    lessons.forEach((l) => (cells[l.id] = { status: 'not_started', knownCount: 0, quizCorrect: 0, quizAttempted: 0, lastViewedAt: null }));
    let lastActiveAt = null;
    const bump = (t) => t && (!lastActiveAt || t > lastActiveAt) && (lastActiveAt = t);

    progressRows
      .filter((p) => p.studentId === sid)
      .forEach((p) => {
        Object.assign(cells[p.lessonId], {
          status: p.status,
          knownCount: Math.min(new Set(p.knownVocab).size, vocabCounts[p.lessonId] || 0),
          lastViewedAt: p.lastViewedAt,
          completedAt: p.completedAt,
        });
        bump(p.lastViewedAt);
      });

    // Mỗi câu chỉ tính 1 lần: đúng nếu có ít nhất 1 lượt nộp đúng
    const attempted = new Set();
    const correct = new Set();
    submissions
      .filter((s) => s.student_id === sid)
      .forEach((s) => {
        attempted.add(s.exercise_item_id);
        if (s.is_correct) correct.add(s.exercise_item_id);
        bump(s.submitted_at);
      });
    attempted.forEach((id) => cells[itemById[id].lessonId] && cells[itemById[id].lessonId].quizAttempted++);
    correct.forEach((id) => cells[itemById[id].lessonId] && cells[itemById[id].lessonId].quizCorrect++);

    return {
      enrollmentId: e.id,
      student: e.student,
      lastActiveAt,
      lessonsCompleted: Object.values(cells).filter((c) => c.status === 'completed').length,
      lessonsOpen: lessons.filter((l) => openById[l.id]).length,
      quizPoints: [...correct].reduce((sum, id) => sum + (itemById[id].points || 0), 0),
      quizCorrect: correct.size,
      quizTotal: quizItems.length,
      flashcardKnown: reviews.filter((r) => r.student_id === sid && r.status === 'known').length,
      flashcardTotal: flashItems.length,
      cells,
    };
  });

  res.json({
    class: klass,
    lessons: lessons.map((l) => ({
      id: l.id,
      lessonNumber: l.lessonNumber,
      titleZh: l.titleZh,
      titleVi: l.titleVi,
      open: !!openById[l.id],
      vocabTotal: vocabCounts[l.id] || 0,
      quizTotal: quizTotalByLesson[l.id] || 0,
    })),
    students,
  });
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  removeMany,
  regenerateJoinCode,
  listStudents,
  addStudent,
  bulkAddStudents,
  createStudentAccounts,
  removeStudent,
  removeStudents,
  listLessons,
  setLessons,
  report,
};
