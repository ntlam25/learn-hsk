const { supabase } = require('../config/supabase');

function fromRow(row) {
  if (!row) return null;
  return { id: row.id, studentId: row.student_id, lessonId: row.lesson_id, status: row.status, lastViewedAt: row.last_viewed_at };
}

async function upsert({ studentId, lessonId, status }) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(
      { student_id: studentId, lesson_id: lessonId, status, last_viewed_at: new Date().toISOString() },
      { onConflict: 'student_id,lesson_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

// Số bài đã hoàn thành / tổng số bài của course, cho 1 học viên — dùng trong báo cáo lớp
async function summaryForStudentLessons(studentId, lessonIds) {
  if (!lessonIds.length) return { completed: 0, total: 0 };
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('status')
    .eq('student_id', studentId)
    .in('lesson_id', lessonIds);
  if (error) throw error;
  return { completed: data.filter((p) => p.status === 'completed').length, total: lessonIds.length };
}

module.exports = { upsert, summaryForStudentLessons };
