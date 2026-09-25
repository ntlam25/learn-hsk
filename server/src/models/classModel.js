const { supabase } = require('../config/supabase');

const SELECT = '*, courses(title, hsk_level), teacher:users!classes_teacher_id_fkey(id, username, full_name), enrollments(count)';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Lớp "đã kết thúc" (lưu trữ hoặc quá ngày kết thúc): học viên vẫn xem lại bài nhưng không nộp bài / vào lớp bằng mã
function isEnded(row) {
  return !!row.archived || (!!row.end_date && row.end_date < todayISO());
}

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    courseId: row.course_id,
    teacherId: row.teacher_id,
    name: row.name,
    joinCode: row.join_code,
    joinEnabled: row.join_enabled,
    startDate: row.start_date,
    endDate: row.end_date,
    archived: row.archived,
    ended: isEnded(row),
    createdAt: row.created_at,
    courseTitle: row.courses?.title,
    hskLevel: row.courses?.hsk_level,
    teacher: row.teacher ? { id: row.teacher.id, username: row.teacher.username, fullName: row.teacher.full_name } : null,
    studentCount: row.enrollments?.[0]?.count,
  };
}

function unwrapSingle({ data, error }) {
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

// Admin thấy tất cả lớp; giáo viên chỉ thấy lớp mình dạy.
async function list({ teacherId, courseId } = {}) {
  let query = supabase.from('classes').select(SELECT).order('created_at', { ascending: false });
  if (teacherId) query = query.eq('teacher_id', teacherId);
  if (courseId) query = query.eq('course_id', courseId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(fromRow);
}

async function getById(id) {
  const res = await supabase.from('classes').select(SELECT).eq('id', id).single();
  return unwrapSingle(res);
}

async function getByJoinCode(code) {
  const res = await supabase.from('classes').select(SELECT).eq('join_code', code.trim().toUpperCase()).single();
  return unwrapSingle(res);
}

function toRow(payload) {
  const row = {};
  if (payload.courseId !== undefined) row.course_id = payload.courseId;
  if (payload.teacherId !== undefined) row.teacher_id = payload.teacherId || null;
  if (payload.name !== undefined) row.name = payload.name;
  if (payload.joinEnabled !== undefined) row.join_enabled = !!payload.joinEnabled;
  if (payload.startDate !== undefined) row.start_date = payload.startDate || null;
  if (payload.endDate !== undefined) row.end_date = payload.endDate || null;
  if (payload.archived !== undefined) row.archived = !!payload.archived;
  if (payload.joinCode !== undefined) row.join_code = payload.joinCode;
  return row;
}

async function create(payload) {
  const { data, error } = await supabase.from('classes').insert(toRow(payload)).select(SELECT).single();
  if (error) throw error;
  return fromRow(data);
}

async function update(id, payload) {
  const { data, error } = await supabase.from('classes').update(toRow(payload)).eq('id', id).select(SELECT).single();
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

async function remove(id) {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw error;
}

// ---------- class_lessons: giáo viên mở/khoá từng bài cho lớp ----------

function isReleased(row) {
  return !!row && (row.released || (!!row.release_at && new Date(row.release_at) <= new Date()));
}

async function lessonStates(classIds) {
  if (!classIds.length) return [];
  const { data, error } = await supabase.from('class_lessons').select('*').in('class_id', classIds);
  if (error) throw error;
  return data.map((r) => ({
    classId: r.class_id,
    lessonId: r.lesson_id,
    released: r.released,
    releaseAt: r.release_at,
    open: isReleased(r),
  }));
}

async function setLessonStates(classId, items) {
  if (!items.length) return;
  const rows = items.map((it) => ({
    class_id: classId,
    lesson_id: it.lessonId,
    released: !!it.released,
    release_at: it.releaseAt || null,
  }));
  const { error } = await supabase.from('class_lessons').upsert(rows, { onConflict: 'class_id,lesson_id' });
  if (error) throw error;
}

module.exports = { list, getById, getByJoinCode, create, update, remove, lessonStates, setLessonStates, isEnded };
