const { supabase } = require('../config/supabase');

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    lessonId: row.lesson_id,
    status: row.status,
    lastViewedAt: row.last_viewed_at,
    knownVocab: row.known_vocab || [],
    completedAt: row.completed_at,
  };
}

// Đặt trạng thái bài (nút "Hoàn thành bài" / bỏ đánh dấu)
async function upsert({ studentId, lessonId, status }) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        student_id: studentId,
        lesson_id: lessonId,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        last_viewed_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,lesson_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

// Học viên vừa xem / làm bài: cập nhật lần xem cuối, not_started → in_progress, KHÔNG hạ bài đã hoàn thành
async function touch(studentId, lessonId) {
  const existing = await getForStudent(studentId, lessonId);
  const row = { student_id: studentId, lesson_id: lessonId, last_viewed_at: new Date().toISOString() };
  if (!existing || existing.status === 'not_started') row.status = 'in_progress';
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert(row, { onConflict: 'student_id,lesson_id' })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

// Tự hoàn thành khi đã thuộc hết từ của bài VÀ mọi câu quiz đều đã có lượt nộp đúng
// (bài không có từ / không có quiz thì bỏ qua điều kiện tương ứng; bài không có cả hai thì không tự hoàn thành).
async function maybeAutoComplete(studentId, lesson) {
  const progress = await getForStudent(studentId, lesson.id);
  if (progress?.status === 'completed') return progress;
  const vocabTotal = (lesson.vocab || []).length;
  const quizIds = (lesson.exerciseItems || []).filter((it) => it.kind === 'quiz').map((it) => it.id);
  if (!vocabTotal && !quizIds.length) return progress;
  if (vocabTotal && new Set(progress?.knownVocab || []).size < vocabTotal) return progress;
  if (quizIds.length) {
    const { data, error } = await supabase
      .from('submissions')
      .select('exercise_item_id')
      .eq('student_id', studentId)
      .eq('is_correct', true)
      .in('exercise_item_id', quizIds);
    if (error) throw error;
    if (new Set(data.map((r) => r.exercise_item_id)).size < quizIds.length) return progress;
  }
  return upsert({ studentId, lessonId: lesson.id, status: 'completed' });
}

// Tiến độ của nhiều học viên × nhiều bài trong 1 truy vấn (báo cáo lớp, trang khoá học)
async function listFor(studentIds, lessonIds) {
  if (!studentIds.length || !lessonIds.length) return [];
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .in('student_id', studentIds)
    .in('lesson_id', lessonIds);
  if (error) throw error;
  return data.map(fromRow);
}

async function getForStudent(studentId, lessonId) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

// Ghi đè danh sách từ đã thuộc (nút ✓ trên thẻ từ); chỉ đụng cột known_vocab, không đổi trạng thái bài
async function setKnownVocab({ studentId, lessonId, knownVocab }) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({ student_id: studentId, lesson_id: lessonId, known_vocab: knownVocab }, { onConflict: 'student_id,lesson_id' })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

module.exports = { upsert, touch, maybeAutoComplete, listFor, getForStudent, setKnownVocab };
