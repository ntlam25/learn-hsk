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

module.exports = { create };
