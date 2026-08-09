const { supabase } = require('../config/supabase');

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    lessonId: row.lesson_id,
    kind: row.kind,
    type: row.type,
    prompt: row.prompt,
    correctAnswer: row.correct_answer,
    points: row.points,
    sortOrder: row.sort_order,
  };
}

async function getById(id) {
  const { data, error } = await supabase.from('exercise_items').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

module.exports = { getById };
