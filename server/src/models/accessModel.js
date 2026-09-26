const enrollmentModel = require('./enrollmentModel');
const classModel = require('./classModel');

// Quyền của một học viên với các bài của một khoá, gộp qua mọi lớp học viên đang ở:
//  • open: có ít nhất 1 lớp đã mở bài (bấm mở hoặc tới ngày mở)
//  • canSubmit: bài mở ở 1 lớp chưa kết thúc → được nộp quiz / lưu tiến độ
//  • releaseAt: ngày mở sớm nhất đã hẹn (khi bài còn khoá)
async function courseAccess(studentId, courseId) {
  const classes = (await enrollmentModel.classesForStudent(studentId, courseId)).map((c) => ({
    ...c,
    ended: classModel.isEnded(c),
  }));
  const endedById = Object.fromEntries(classes.map((c) => [c.id, c.ended]));
  const states = await classModel.lessonStates(classes.map((c) => c.id));

  const lessons = {};
  states.forEach((st) => {
    const cur = lessons[st.lessonId] || { open: false, canSubmit: false, releaseAt: null };
    if (st.open) {
      cur.open = true;
      if (!endedById[st.classId]) cur.canSubmit = true;
    } else if (st.releaseAt && (!cur.releaseAt || st.releaseAt < cur.releaseAt)) {
      cur.releaseAt = st.releaseAt;
    }
    lessons[st.lessonId] = cur;
  });

  return {
    enrolled: classes.length > 0,
    ended: classes.length > 0 && classes.every((c) => c.ended),
    classes,
    lesson(lessonId) {
      return lessons[lessonId] || { open: false, canSubmit: false, releaseAt: null };
    },
  };
}

// { canView, canSubmit, reason: null | 'not_enrolled' | 'locked' | 'ended', releaseAt, courseId }
// Bài dùng chung ở nhiều khoá: xét mọi khoá chứa bài, lấy quyền tốt nhất (courseId = khoá cho quyền đó).
// Chỉ tính lớp thuộc khoá đang chứa bài — bài đã gỡ khỏi khoá thì trạng thái mở cũ ở lớp của khoá đó không còn tác dụng.
async function studentLessonAccess(studentId, lesson) {
  const courseIds = lesson.courseIds || [];
  let best = { canView: false, canSubmit: false, reason: 'not_enrolled', releaseAt: null, courseId: null };
  for (const courseId of courseIds) {
    const access = await courseAccess(studentId, courseId);
    if (!access.enrolled) continue;
    const st = access.lesson(lesson.id);
    if (st.open) {
      const result = { canView: true, canSubmit: st.canSubmit, reason: st.canSubmit ? null : 'ended', releaseAt: null, courseId };
      if (st.canSubmit) return result;
      best = result;
    } else if (!best.canView) {
      const releaseAt = best.releaseAt && (!st.releaseAt || best.releaseAt < st.releaseAt) ? best.releaseAt : st.releaseAt;
      best = { canView: false, canSubmit: false, reason: 'locked', releaseAt, courseId };
    }
  }
  return best;
}

// Quyền theo vai trò: bài preview ai cũng xem, admin/GV xem & thử mọi bài (không lưu tiến độ học viên)
async function lessonAccessFor(user, lesson) {
  if (user && (user.role === 'admin' || user.role === 'teacher')) {
    return { canView: true, canSubmit: true, reason: null, releaseAt: null };
  }
  if (!user) {
    return lesson.isPreview
      ? { canView: true, canSubmit: false, reason: null, releaseAt: null }
      : { canView: false, canSubmit: false, reason: 'login', releaseAt: null };
  }
  const access = await studentLessonAccess(user.id, lesson);
  // Bài xem trước: học viên chưa vào lớp vẫn học & làm thử được như trước
  if (!access.canView && lesson.isPreview) return { canView: true, canSubmit: true, reason: null, releaseAt: null };
  return access;
}

const DENY_MESSAGE = {
  login: 'Cần đăng nhập để xem bài học này.',
  not_enrolled: 'Bạn chưa vào lớp học nào của khoá này. Hãy nhập mã lớp giáo viên gửi cho bạn.',
  locked: 'Bài này chưa được giáo viên mở cho lớp của bạn.',
  ended: 'Lớp học đã kết thúc — bạn chỉ có thể xem lại bài, không nộp bài được nữa.',
};

module.exports = { courseAccess, studentLessonAccess, lessonAccessFor, DENY_MESSAGE };
