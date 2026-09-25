const { supabase } = require('../config/supabase');

const PUBLIC_LIST_COLUMNS = 'id, course_id, lesson_number, seal, title_zh, title_vi, tag, is_preview, updated_at';
const ADMIN_LIST_COLUMNS = 'id, course_id, lesson_number, seal, title_zh, title_vi, tag, is_preview, published, updated_at';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    courseId: row.course_id,
    lessonNumber: row.lesson_number,
    seal: row.seal,
    titleZh: row.title_zh,
    titleVi: row.title_vi,
    tag: row.tag,
    vocab: row.vocab,
    properNouns: row.proper_nouns,
    dialogues: row.dialogues,
    phoneticsNotes: row.phonetics_notes,
    grammar: row.grammar,
    exercises: row.exercises,
    extra: row.extra,
    sourcePdfUrl: row.source_pdf_url,
    isPreview: row.is_preview,
    published: row.published,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(payload) {
  const row = {};
  if (payload.courseId !== undefined) row.course_id = payload.courseId;
  if (payload.lessonNumber !== undefined) row.lesson_number = payload.lessonNumber;
  if (payload.seal !== undefined) row.seal = payload.seal;
  if (payload.titleZh !== undefined) row.title_zh = payload.titleZh;
  if (payload.titleVi !== undefined) row.title_vi = payload.titleVi;
  if (payload.tag !== undefined) row.tag = payload.tag;
  if (payload.vocab !== undefined) row.vocab = payload.vocab;
  if (payload.properNouns !== undefined) row.proper_nouns = payload.properNouns;
  if (payload.dialogues !== undefined) row.dialogues = payload.dialogues;
  if (payload.phoneticsNotes !== undefined) row.phonetics_notes = payload.phoneticsNotes;
  if (payload.grammar !== undefined) row.grammar = payload.grammar;
  if (payload.exercises !== undefined) row.exercises = payload.exercises;
  if (payload.extra !== undefined) row.extra = payload.extra;
  if (payload.sourcePdfUrl !== undefined) row.source_pdf_url = payload.sourcePdfUrl || null;
  if (payload.isPreview !== undefined) row.is_preview = payload.isPreview;
  if (payload.published !== undefined) row.published = payload.published;
  if (payload.createdBy !== undefined) row.created_by = payload.createdBy;
  return row;
}

function unwrapSingle({ data, error }) {
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

function audioFromRow(row) {
  return {
    id: row.id,
    category: row.category,
    label: row.label,
    audioUrl: row.audio_url,
    durationSec: row.duration_sec,
    code: row.code,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
  };
}

function pageFromRow(row) {
  return { id: row.id, pageNumber: row.page_number, imageUrl: row.image_url, caption: row.caption };
}

function exerciseItemFromRow(row) {
  return {
    id: row.id,
    kind: row.kind,
    type: row.type,
    prompt: row.prompt,
    correctAnswer: row.correct_answer,
    points: row.points,
    sortOrder: row.sort_order,
  };
}

async function attachChildren(lesson) {
  if (!lesson) return lesson;
  const [audioRes, pagesRes, itemsRes] = await Promise.all([
    supabase.from('lesson_audio_tracks').select('*').eq('lesson_id', lesson.id).order('category').order('sort_order'),
    supabase.from('lesson_pages').select('*').eq('lesson_id', lesson.id).order('page_number'),
    supabase.from('exercise_items').select('*').eq('lesson_id', lesson.id).order('kind').order('sort_order'),
  ]);
  if (audioRes.error) throw audioRes.error;
  if (pagesRes.error) throw pagesRes.error;
  if (itemsRes.error) throw itemsRes.error;
  lesson.audioTracks = audioRes.data.map(audioFromRow);
  lesson.pages = pagesRes.data.map(pageFromRow);
  lesson.exerciseItems = itemsRes.data.map(exerciseItemFromRow);
  return lesson;
}

async function syncChildren(lessonId, payload) {
  if (payload.audioTracks !== undefined) {
    const { error: delErr } = await supabase.from('lesson_audio_tracks').delete().eq('lesson_id', lessonId);
    if (delErr) throw delErr;
    const rows = (payload.audioTracks || []).map((t, i) => ({
      lesson_id: lessonId,
      category: t.category,
      label: t.label || '',
      audio_url: t.audioUrl || '', // cho phép "ô" chưa tải file (tải sau qua trình soạn)
      duration_sec: t.durationSec ?? null,
      code: t.code || '',
      size_bytes: t.sizeBytes ?? null,
      sort_order: t.sortOrder ?? i,
    }));
    if (rows.length) {
      const { error } = await supabase.from('lesson_audio_tracks').insert(rows);
      if (error) throw error;
    }
  }
  if (payload.pages !== undefined) {
    const { error: delErr } = await supabase.from('lesson_pages').delete().eq('lesson_id', lessonId);
    if (delErr) throw delErr;
    const rows = (payload.pages || []).map((p, i) => ({
      lesson_id: lessonId,
      page_number: p.pageNumber ?? i + 1,
      image_url: p.imageUrl || '',
      caption: p.caption || '',
    }));
    if (rows.length) {
      const { error } = await supabase.from('lesson_pages').insert(rows);
      if (error) throw error;
    }
  }
  if (payload.exerciseItems !== undefined) {
    // Lưu ý: xoá-rồi-tạo-lại nghĩa là exercise_item cũ mất id — submissions/flashcard_reviews
    // của học viên gắn với item cũ sẽ mồ côi. Chấp nhận đánh đổi này để đơn giản hoá form soạn bài;
    // nếu cần giữ lịch sử khi sửa bài đã có học viên làm, nên tách trang soạn exercise riêng sau này.
    const { error: delErr } = await supabase.from('exercise_items').delete().eq('lesson_id', lessonId);
    if (delErr) throw delErr;
    const rows = (payload.exerciseItems || []).map((it, i) => ({
      lesson_id: lessonId,
      kind: it.kind,
      type: it.type || 'multiple_choice',
      prompt: it.prompt || {},
      correct_answer: it.correctAnswer || {},
      points: it.points ?? 1,
      sort_order: it.sortOrder ?? i,
    }));
    if (rows.length) {
      const { error } = await supabase.from('exercise_items').insert(rows);
      if (error) throw error;
    }
  }
}

async function listPublicByCourse(courseId) {
  const { data, error } = await supabase
    .from('lessons')
    .select(PUBLIC_LIST_COLUMNS)
    .eq('course_id', courseId)
    .eq('published', true)
    .order('lesson_number', { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

async function listPreview() {
  const { data, error } = await supabase
    .from('lessons')
    .select(`${PUBLIC_LIST_COLUMNS}, courses(title, hsk_level)`)
    .eq('published', true)
    .eq('is_preview', true)
    .order('lesson_number', { ascending: true });
  if (error) throw error;
  return data.map((row) => ({ ...fromRow(row), courseTitle: row.courses?.title, hskLevel: row.courses?.hsk_level }));
}

async function getFullById(id) {
  const res = await supabase.from('lessons').select('*').eq('id', id).single();
  const lesson = unwrapSingle(res);
  return attachChildren(lesson);
}

async function listAdmin() {
  const { data, error } = await supabase.from('lessons').select(ADMIN_LIST_COLUMNS).order('lesson_number', { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

async function listAdminByCourse(courseId) {
  const { data, error } = await supabase
    .from('lessons')
    .select(ADMIN_LIST_COLUMNS)
    .eq('course_id', courseId)
    .order('lesson_number', { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

// Số từ mới của từng bài (id → số từ) — cho báo cáo lớp / % đã thuộc
async function vocabCounts(lessonIds) {
  if (!lessonIds.length) return {};
  const { data, error } = await supabase.from('lessons').select('id, vocab').in('id', lessonIds);
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.id, Array.isArray(r.vocab) ? r.vocab.length : 0]));
}

// Số file nghe đã tải / ảnh trang sách của từng bài: { lessonId: { audio, pages } }
async function mediaCounts(lessonIds) {
  if (!lessonIds.length) return {};
  const [audioRes, pagesRes] = await Promise.all([
    supabase.from('lesson_audio_tracks').select('lesson_id').in('lesson_id', lessonIds).neq('audio_url', ''),
    supabase.from('lesson_pages').select('lesson_id').in('lesson_id', lessonIds).neq('image_url', ''),
  ]);
  if (audioRes.error) throw audioRes.error;
  if (pagesRes.error) throw pagesRes.error;
  const out = Object.fromEntries(lessonIds.map((id) => [id, { audio: 0, pages: 0 }]));
  audioRes.data.forEach((r) => out[r.lesson_id].audio++);
  pagesRes.data.forEach((r) => out[r.lesson_id].pages++);
  return out;
}

// Câu quiz / thẻ flashcard của nhiều bài (id, lessonId, kind, points)
async function exerciseItemsFor(lessonIds) {
  if (!lessonIds.length) return [];
  const { data, error } = await supabase.from('exercise_items').select('id, lesson_id, kind, points').in('lesson_id', lessonIds);
  if (error) throw error;
  return data.map((r) => ({ id: r.id, lessonId: r.lesson_id, kind: r.kind, points: r.points }));
}

async function findByNumber(courseId, lessonNumber) {
  const res = await supabase.from('lessons').select('id').eq('course_id', courseId).eq('lesson_number', lessonNumber).single();
  return unwrapSingle(res);
}

async function create(payload) {
  const { data, error } = await supabase.from('lessons').insert(toRow(payload)).select().single();
  if (error) throw error;
  const lesson = fromRow(data);
  await syncChildren(lesson.id, payload);
  return getFullById(lesson.id);
}

async function update(id, payload) {
  const res = await supabase.from('lessons').update(toRow(payload)).eq('id', id).select().single();
  const lesson = unwrapSingle(res);
  if (!lesson) return null;
  await syncChildren(id, payload);
  return getFullById(id);
}

async function remove(id) {
  const { data, error } = await supabase.from('lessons').delete().eq('id', id).select().single();
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

module.exports = {
  vocabCounts,
  mediaCounts,
  exerciseItemsFor,
  listPublicByCourse,
  listPreview,
  getFullById,
  listAdmin,
  listAdminByCourse,
  findByNumber,
  create,
  update,
  remove,
};
