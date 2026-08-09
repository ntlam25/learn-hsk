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

// % thẻ đã "known" trong tổng số flashcard của các bài (dùng cho báo cáo lớp)
async function knownRatioForStudentLessons(studentId, lessonIds) {
  if (!lessonIds.length) return { total: 0, known: 0 };
  const { data: items, error: itemsErr } = await supabase
    .from('exercise_items')
    .select('id')
    .in('lesson_id', lessonIds)
    .eq('kind', 'flashcard');
  if (itemsErr) throw itemsErr;
  const itemIds = items.map((i) => i.id);
  if (!itemIds.length) return { total: 0, known: 0 };

  const { data, error } = await supabase
    .from('flashcard_reviews')
    .select('status')
    .eq('student_id', studentId)
    .in('exercise_item_id', itemIds);
  if (error) throw error;

  return { total: itemIds.length, known: data.filter((r) => r.status === 'known').length };
}

module.exports = { upsertReview, reviewsForStudentInLesson, knownRatioForStudentLessons };
