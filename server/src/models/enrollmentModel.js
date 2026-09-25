const { supabase } = require('../config/supabase');

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    classId: row.class_id,
    studentId: row.student_id,
    enrolledBy: row.enrolled_by,
    createdAt: row.created_at,
    student: row.users
      ? { id: row.users.id, username: row.users.username, email: row.users.email, fullName: row.users.full_name }
      : undefined,
  };
}

async function listByClass(classId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*, users!enrollments_student_id_fkey(id, username, email, full_name)')
    .eq('class_id', classId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

// Các lớp học viên đang ở (kèm cột lớp thô để tính trạng thái kết thúc); courseId để lọc theo khoá
async function classesForStudent(studentId, courseId) {
  let query = supabase
    .from('enrollments')
    .select('classes!inner(id, course_id, name, teacher_id, start_date, end_date, archived, users!classes_teacher_id_fkey(full_name, username))')
    .eq('student_id', studentId);
  if (courseId) query = query.eq('classes.course_id', courseId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((r) => r.classes);
}

async function findInClass(classId, studentId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .limit(1);
  if (error) throw error;
  return data[0] || null;
}

async function create({ classId, studentId, enrolledBy }) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ class_id: classId, student_id: studentId, enrolled_by: enrolledBy })
    .select('*, users!enrollments_student_id_fkey(id, username, email, full_name)')
    .single();
  if (error) throw error;
  return fromRow(data);
}

// Xoá ghi danh — luôn kèm classId để giáo viên không xoá nhầm học viên của lớp khác
async function remove(id, classId) {
  const { error } = await supabase.from('enrollments').delete().eq('id', id).eq('class_id', classId);
  if (error) throw error;
}

module.exports = { listByClass, classesForStudent, findInClass, create, remove };
