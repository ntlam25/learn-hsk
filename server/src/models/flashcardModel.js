const { supabase } = require('../config/supabase');

function fromRow(row) {
  if (!row) return null;
  return { id: row.id, exerciseItemId: row.exercise_item_id, studentId: row.student_id, status: row.status, reviewedAt: row.reviewed_at };
}

// Upsert theo (exercise_item_id, student_id) — mỗi thẻ chỉ giữ trạng thái review gần nhất
async function upsertReview({ exerciseItemId, studentId, status }) {
  const { data, error } = await supabase
    .from('flashcard_reviews')
    .upsert(
      { exercise_item_id: exerciseItemId, student_id: studentId, status, reviewed_at: new Date().toISOString() },
      { onConflict: 'exercise_item_id,student_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

async function reviewsForStudentInLesson(studentId, lessonId) {
  const { data, error } = await supabase
    .from('flashcard_reviews')
    .select('exercise_item_id, status, exercise_items!inner(lesson_id)')
    .eq('student_id', studentId)
    .eq('exercise_items.lesson_id', lessonId);
  if (error) throw error;
  return data.map((r) => ({ exerciseItemId: r.exercise_item_id, status: r.status }));
}

module.exports = { upsertReview, reviewsForStudentInLesson };
