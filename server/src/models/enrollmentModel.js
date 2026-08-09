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
    .select('*, users(id, username, email, full_name)')
    .eq('class_id', classId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

// Danh sách course_id mà học viên được enroll (qua các lớp), dùng để lọc "khoá học của tôi"
async function courseIdsForStudent(studentId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('classes(course_id)')
    .eq('student_id', studentId);
  if (error) throw error;
  return [...new Set(data.map((r) => r.classes?.course_id).filter(Boolean))];
}

async function isStudentEnrolledInCourse(studentId, courseId) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, classes!inner(course_id)')
    .eq('student_id', studentId)
    .eq('classes.course_id', courseId)
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}

async function create({ classId, studentId, enrolledBy }) {
  const { data, error } = await supabase
    .from('enrollments')
    .insert({ class_id: classId, student_id: studentId, enrolled_by: enrolledBy })
    .select('*, users(id, username, email, full_name)')
    .single();
  if (error) throw error;
  return fromRow(data);
}

async function remove(id) {
  const { error } = await supabase.from('enrollments').delete().eq('id', id);
  if (error) throw error;
}

module.exports = { listByClass, courseIdsForStudent, isStudentEnrolledInCourse, create, remove };
