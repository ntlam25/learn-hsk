const lessonModel = require('../models/lessonModel');
const courseModel = require('../models/courseModel');
const { lessonAccessFor, DENY_MESSAGE } = require('../models/accessModel');
const { idsFrom, BAD_IDS } = require('../utils/bulk');
const { extractLessons, normalizeLesson, validateLesson, keepUploadedMedia } = require('../utils/lessonImport');

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
// (admin/GV xem được mọi bài, kể cả bài đang ẩn — nút "Xem" ở trang quản trị). Bị chặn thì trả 401/403 kèm `reason` để client hiện thông báo phù hợp.
async function getById(req, res) {
  const lesson = await lessonModel.getFullById(req.params.id);
  const isStaff = req.user?.role === 'admin' || req.user?.role === 'teacher';
  if (!lesson || (!lesson.published && !isStaff)) return res.status(404).json({ message: 'Không tìm thấy bài học.' });

  const access = await lessonAccessFor(req.user, lesson);
  // Khoá đang xem (bài dùng chung nhiều khoá): ?courseId= nếu bài thuộc khoá đó → khoá cho học viên quyền → khoá đầu tiên
  const wanted = req.query.courseId;
  const courseId = (wanted && lesson.courseIds.includes(wanted) ? wanted : null) || access.courseId || lesson.courseIds[0] || null;
  if (!access.canView) {
    return res.status(access.reason === 'login' ? 401 : 403).json({
      message: DENY_MESSAGE[access.reason],
      reason: access.reason,
      releaseAt: access.releaseAt,
      courseId,
    });
  }
  return res.json({ ...lesson, courseId });
}

// GET /api/admin/lessons?courseId=... (teacher/admin) — tất cả bài, kể cả chưa publish; courseId=none → bài độc lập
async function listAdmin(req, res) {
  const { courseId } = req.query;
  const lessons = courseId
    ? await lessonModel.listAdminByCourse(courseId === 'none' ? null : courseId)
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
    // courseIds: các khoá chứa bài (rỗng = bài độc lập). Số bài được phép trùng — một khoá có thể ghép bài từ nhiều giáo trình.
    const payload = { ...req.body, createdBy: req.user.id };
    if (!payload.lessonNumber || Number.isNaN(Number(payload.lessonNumber))) {
      return res.status(400).json({ message: 'Thiếu hoặc sai số bài (lessonNumber).' });
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

// POST /api/admin/lessons/bulk-delete  body: { ids } — xoá hẳn nhiều bài (gỡ khỏi mọi khoá)
async function removeMany(req, res) {
  const ids = idsFrom(req.body);
  if (!ids) return res.status(400).json(BAD_IDS);
  const deleted = await lessonModel.removeMany(ids);
  res.json({ message: `Đã xoá ${deleted} bài học.`, deleted });
}

async function remove(req, res) {
  const lesson = await lessonModel.remove(req.params.id);
  if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học.' });
  res.json({ message: 'Đã xoá.' });
}

// POST /api/admin/lessons/import — import nhiều bài từ JSON.
// body: { courseIds?: [...], mode: 'skip' | 'overwrite', dryRun?: boolean, data: <mảng bài | { lessons: [...] } | 1 bài> }
// (vẫn nhận courseId đơn lẻ). Không chọn khoá nào → nhập thành bài độc lập.
// Bài trùng = cùng số bài trong một trong các khoá đã chọn (hoặc trong các bài độc lập). Bài trùng — dù bỏ qua hay ghi đè —
// vẫn được gắn thêm vào các khoá đã chọn mà nó chưa có. Ghi đè không gỡ bài khỏi các khoá khác đang dùng chung.
// Trả về { summary, results: [{ index, lessonNumber, titleVi, action, errors, warnings }] },
// action: create | update | skip | error. dryRun = chỉ kiểm tra, không ghi (dùng cho bước xem trước).
async function importMany(req, res) {
  const { mode = 'skip', dryRun = false } = req.body;
  const rawIds = Array.isArray(req.body.courseIds) ? req.body.courseIds : req.body.courseId ? [req.body.courseId] : [];
  const courseIds = [...new Set(rawIds.filter((x) => typeof x === 'string' && x))];
  if (!['skip', 'overwrite'].includes(mode)) return res.status(400).json({ message: 'mode phải là "skip" hoặc "overwrite".' });
  const courses = await Promise.all(courseIds.map((id) => courseModel.getById(id)));
  if (courses.some((c) => !c)) return res.status(404).json({ message: 'Không tìm thấy khoá học đã chọn.' });
  const courseTitle = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  const rawLessons = extractLessons(req.body.data);
  if (!rawLessons) {
    return res.status(400).json({ message: 'File JSON phải là một mảng bài học, hoặc object có khoá "lessons" là mảng.' });
  }
  if (!rawLessons.length) return res.status(400).json({ message: 'File không có bài học nào.' });

  // số bài → các bài (khác nhau) mang số đó trong phạm vi đích
  const scopes = courseIds.length ? await Promise.all(courseIds.map((id) => lessonModel.listAdminByCourse(id))) : [await lessonModel.listAdminByCourse(null)];
  const existing = new Map();
  scopes.flat().forEach((l) => {
    const list = existing.get(l.lessonNumber) || [];
    if (!list.some((x) => x.id === l.id)) list.push(l);
    existing.set(l.lessonNumber, list);
  });
  const seen = new Set();
  const results = [];

  for (const [index, raw] of rawLessons.entries()) {
    const lesson = raw && typeof raw === 'object' && !Array.isArray(raw) ? normalizeLesson(raw) : null;
    const result = { index, lessonNumber: lesson?.lessonNumber ?? null, titleVi: lesson?.titleVi || '', action: 'error', errors: [], warnings: [] };
    results.push(result);
    if (!lesson) {
      result.errors.push('Mỗi phần tử phải là một object bài học.');
      continue;
    }
    const { errors, warnings } = validateLesson(lesson);
    result.errors.push(...errors);
    result.warnings.push(...warnings);
    result.attach = false; // bài bỏ qua nhưng vẫn được gắn thêm vào khoá (vẫn tính là có thay đổi)
    if (seen.has(lesson.lessonNumber)) result.errors.push(`Trùng số bài ${lesson.lessonNumber} với một bài phía trên trong file.`);
    seen.add(lesson.lessonNumber);
    if (result.errors.length) continue;

    const matches = existing.get(lesson.lessonNumber) || [];
    const current = matches[0];
    if (matches.length > 1) {
      result.warnings.push(`Có ${matches.length} bài khác nhau cùng số ${lesson.lessonNumber} trong các khoá đã chọn — chỉ xử lý bài "${current.titleVi}".`);
    }
    const missing = current ? courseIds.filter((id) => !current.courseIds.includes(id)) : [];
    if (missing.length) {
      result.attach = true;
      result.warnings.push(`Gắn thêm vào khoá: ${missing.map((id) => courseTitle[id]).join(', ')}.`);
    }

    if (current && mode === 'skip') {
      result.action = 'skip';
      result.warnings.push(`Bài số này đã có ${courseIds.length ? 'trong khoá' : 'trong các bài độc lập'} — giữ nguyên nội dung (chọn "Ghi đè" để cập nhật).`);
    } else {
      result.action = current ? 'update' : 'create';
    }

    try {
      if (current) {
        if (mode === 'overwrite') {
          const full = await lessonModel.getFullById(current.id);
          if (lesson.exerciseItems !== undefined && full.exerciseItems.length) {
            result.warnings.push(`Thay ${full.exerciseItems.length} câu quiz/flashcard cũ — kết quả làm bài của học viên với các câu cũ sẽ mất.`);
          }
          if (!dryRun) await lessonModel.update(current.id, keepUploadedMedia(lesson, full));
        }
        if (!dryRun) for (const courseId of missing) await lessonModel.addToCourse(courseId, [current.id]);
      } else if (!dryRun) {
        await lessonModel.create({ ...lesson, courseIds, createdBy: req.user.id });
      }
    } catch (err) {
      result.action = 'error';
      result.errors.push('Lỗi khi lưu: ' + err.message);
    }
  }

  const summary = { create: 0, update: 0, skip: 0, error: 0, attach: 0 };
  results.forEach((r) => {
    summary[r.action]++;
    if (r.action === 'skip' && r.attach) summary.attach++;
  });
  res.json({ dryRun: !!dryRun, summary, results });
}

module.exports = { listByCourse, listPreview, getById, listAdmin, getAdminById, create, update, remove, removeMany, importMany };
