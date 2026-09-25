const enrollmentModel = require('../models/enrollmentModel');
const courseModel = require('../models/courseModel');
const lessonModel = require('../models/lessonModel');
const progressModel = require('../models/progressModel');
const classModel = require('../models/classModel');
const { courseAccess } = require('../models/accessModel');

function classSummary(c) {
  return {
    id: c.id,
    name: c.name,
    teacherName: c.users?.full_name || c.users?.username || '',
    startDate: c.start_date,
    endDate: c.end_date,
    ended: classModel.isEnded(c),
  };
}

// Tình hình học của 1 học viên trong 1 khoá: danh sách bài (mở/khoá, trạng thái, số từ đã thuộc) + bài "Học tiếp"
async function courseState(studentId, courseId) {
  const [lessons, access] = await Promise.all([lessonModel.listPublicByCourse(courseId), courseAccess(studentId, courseId)]);
  const ids = lessons.map((l) => l.id);
  const [progressRows, vocabCounts] = await Promise.all([progressModel.listFor([studentId], ids), lessonModel.vocabCounts(ids)]);
  const progressById = Object.fromEntries(progressRows.map((p) => [p.lessonId, p]));

  const items = lessons.map((l) => {
    const st = access.lesson(l.id);
    const p = progressById[l.id];
    const vocabTotal = vocabCounts[l.id] || 0;
    return {
      ...l,
      open: st.open || l.isPreview,
      releaseAt: st.releaseAt,
      status: p?.status || 'not_started',
      lastViewedAt: p?.lastViewedAt || null,
      knownCount: Math.min(new Set(p?.knownVocab || []).size, vocabTotal),
      vocabTotal,
    };
  });

  const open = items.filter((l) => l.open);
  const latest = open.filter((l) => l.lastViewedAt).sort((a, b) => (a.lastViewedAt < b.lastViewedAt ? 1 : -1))[0];
  // Chưa mở bài nào thì bắt đầu từ bài mở đầu tiên chưa hoàn thành
  const resume = latest || open.find((l) => l.status !== 'completed') || open[0];

  return {
    access,
    lessons: items,
    openCount: open.length,
    completedCount: items.filter((l) => l.status === 'completed').length,
    resumeLesson: resume ? { id: resume.id, lessonNumber: resume.lessonNumber, titleZh: resume.titleZh, started: !!latest } : null,
  };
}

// GET /api/me/courses (student) — mỗi lớp học viên đang ở là 1 thẻ: khoá, lớp, GV, tiến độ, bài "Học tiếp"
async function myCourses(req, res) {
  const classes = await enrollmentModel.classesForStudent(req.user.id);
  const courseIds = [...new Set(classes.map((c) => c.course_id))];
  const byCourse = {};
  await Promise.all(
    courseIds.map(async (id) => {
      const [course, state] = await Promise.all([courseModel.getById(id), courseState(req.user.id, id)]);
      byCourse[id] = { course, state };
    })
  );
  const cards = classes
    .filter((c) => byCourse[c.course_id]?.course)
    .map((c) => {
      const { course, state } = byCourse[c.course_id];
      return {
        class: classSummary(c),
        course,
        lessonCount: state.lessons.length,
        openCount: state.openCount,
        completedCount: state.completedCount,
        resumeLesson: state.resumeLesson,
      };
    })
    // Lớp đang học lên trước, lớp đã kết thúc xuống cuối
    .sort((a, b) => Number(a.class.ended) - Number(b.class.ended));
  res.json(cards);
}

// GET /api/me/courses/:courseId (student) — trang khoá học phía học viên
async function myCourseDetail(req, res) {
  const course = await courseModel.getById(req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Không tìm thấy khoá học.' });
  const state = await courseState(req.user.id, course.id);
  res.json({
    course,
    enrolled: state.access.enrolled,
    ended: state.access.ended,
    classes: state.access.classes.map(classSummary),
    lessons: state.lessons,
    openCount: state.openCount,
    completedCount: state.completedCount,
    resumeLesson: state.resumeLesson,
  });
}

// POST /api/me/classes/join  body: { code } — học viên tự vào lớp bằng mã mời của giáo viên
async function joinClass(req, res) {
  const code = String(req.body.code || '').trim();
  if (!/^[A-Za-z0-9]{4,12}$/.test(code)) return res.status(400).json({ message: 'Mã lớp không hợp lệ.' });
  const klass = await classModel.getByJoinCode(code);
  if (!klass || !klass.joinEnabled) {
    return res.status(404).json({ message: 'Mã lớp không đúng hoặc giáo viên đã tắt nhận học viên bằng mã.' });
  }
  if (klass.ended) return res.status(400).json({ message: 'Lớp học này đã kết thúc, không nhận thêm học viên.' });

  const info = { id: klass.id, name: klass.name, courseId: klass.courseId, courseTitle: klass.courseTitle };
  const existing = await enrollmentModel.findInClass(klass.id, req.user.id);
  if (existing) return res.json({ class: info, alreadyEnrolled: true });
  try {
    await enrollmentModel.create({ classId: klass.id, studentId: req.user.id, enrolledBy: null });
  } catch (err) {
    if (err.code !== '23505') throw err;
    return res.json({ class: info, alreadyEnrolled: true });
  }
  res.status(201).json({ class: info, alreadyEnrolled: false });
}

module.exports = { myCourses, myCourseDetail, joinClass };
