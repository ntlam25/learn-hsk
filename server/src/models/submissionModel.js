const { supabase } = require('../config/supabase');

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    exerciseItemId: row.exercise_item_id,
    studentId: row.student_id,
    answer: row.answer,
    isCorrect: row.is_correct,
    score: row.score,
    submittedAt: row.submitted_at,
  };
}

async function create({ exerciseItemId, studentId, answer, isCorrect, score }) {
  const { data, error } = await supabase
    .from('submissions')
    .insert({ exercise_item_id: exerciseItemId, student_id: studentId, answer, is_correct: isCorrect, score })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

// Điểm/số câu đúng của 1 học viên trên toàn bộ các exercise_item thuộc danh sách lesson (dùng cho báo cáo lớp)
async function summaryForStudentLessons(studentId, lessonIds) {
  if (!lessonIds.length) return { totalPoints: 0, correctCount: 0, submittedCount: 0 };
  const { data: items, error: itemsErr } = await supabase
    .from('exercise_items')
    .select('id')
    .in('lesson_id', lessonIds)
    .eq('kind', 'quiz');
  if (itemsErr) throw itemsErr;
  const itemIds = items.map((i) => i.id);
  if (!itemIds.length) return { totalPoints: 0, correctCount: 0, submittedCount: 0 };

  const { data, error } = await supabase
    .from('submissions')
    .select('score, is_correct')
    .eq('student_id', studentId)
    .in('exercise_item_id', itemIds);
  if (error) throw error;

  return {
    totalPoints: data.reduce((sum, s) => sum + (s.score || 0), 0),
    correctCount: data.filter((s) => s.is_correct).length,
    submittedCount: data.length,
  };
}

module.exports = { create, summaryForStudentLessons };
