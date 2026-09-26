// Chuẩn hoá + kiểm tra dữ liệu import bài học hàng loạt từ JSON.
// Định dạng file: xem client/public/samples/lesson-import-sample.json (mỗi bài có cùng dạng với server/src/seed/lesson{n}.json,
// thêm exerciseItems). JSON không có comment nên file mẫu ghi chú bằng các khoá bắt đầu bằng "_" — stripNotes() bỏ hết các khoá đó.

const LESSON_FIELDS = [
  'lessonNumber',
  'seal',
  'titleZh',
  'titleVi',
  'tag',
  'vocab',
  'properNouns',
  'dialogues',
  'phoneticsNotes',
  'grammar',
  'exercises',
  'extra',
  'sourcePdfUrl',
  'isPreview',
  'published',
  'audioTracks',
  'pages',
  'exerciseItems',
];
const STRING_FIELDS = ['seal', 'titleZh', 'titleVi', 'tag', 'sourcePdfUrl'];
const ARRAY_FIELDS = ['vocab', 'properNouns', 'dialogues', 'phoneticsNotes', 'grammar', 'audioTracks', 'pages', 'exerciseItems'];
const TAB_KEYS = ['vocab', 'dialogue', 'phonetics', 'grammar', 'exercise'];
const AUDIO_CATEGORIES = ['vocab', 'text', 'phonetics', 'practice'];
const PART_TYPES = ['subtitle', 'chips', 'pinyin', 'sentences', 'reading', 'homework', 'toneQuiz', 'extensions'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function stripNotes(v) {
  if (Array.isArray(v)) return v.map(stripNotes);
  if (!isObj(v)) return v;
  const out = {};
  for (const [k, val] of Object.entries(v)) if (!k.startsWith('_')) out[k] = stripNotes(val);
  return out;
}

// Nhận: mảng bài | { lessons: [...] } | 1 bài lẻ
function extractLessons(body) {
  const data = stripNotes(body);
  if (Array.isArray(data)) return data;
  if (isObj(data) && Array.isArray(data.lessons)) return data.lessons;
  if (isObj(data) && data.lessonNumber !== undefined) return [data];
  return null;
}

// Cho phép viết gọn: "chars": "你好" → [{ h: '你' }, { h: '好' }]; ví dụ dạng { h, p, m } → [h, p, m]
function normalizeLesson(raw) {
  const lesson = {};
  for (const k of LESSON_FIELDS) if (raw[k] !== undefined) lesson[k] = raw[k];
  if (typeof lesson.lessonNumber === 'string' && lesson.lessonNumber.trim() !== '') lesson.lessonNumber = Number(lesson.lessonNumber);
  if (Array.isArray(lesson.vocab)) {
    lesson.vocab = lesson.vocab.map((e, i) => {
      if (!isObj(e)) return e;
      const entry = { num: i + 1, ...e };
      if (typeof entry.chars === 'string') entry.chars = Array.from(entry.chars.trim()).map((h) => ({ h }));
      if (Array.isArray(entry.examples)) {
        entry.examples = entry.examples.map((ex) => (isObj(ex) ? [ex.h || '', ex.p || '', ex.m || ''] : ex));
      }
      return entry;
    });
  }
  return lesson;
}

function checkParts(blocks, where, errors, warnings) {
  if (blocks === undefined) return;
  if (!Array.isArray(blocks)) return errors.push(`${where} phải là mảng.`);
  blocks.forEach((b, i) => {
    if (!isObj(b)) return errors.push(`${where}[${i}] phải là object.`);
    if (b.parts !== undefined && !Array.isArray(b.parts)) return errors.push(`${where}[${i}].parts phải là mảng.`);
    (b.parts || []).forEach((p, j) => {
      if (!isObj(p) || !PART_TYPES.includes(p.type)) {
        warnings.push(`${where}[${i}].parts[${j}]: type "${p?.type}" không hợp lệ (${PART_TYPES.join(', ')}) — sẽ không hiển thị.`);
      }
    });
  });
}

function checkExerciseItem(it, i, errors) {
  const at = `exerciseItems[${i}]`;
  if (!isObj(it)) return errors.push(`${at} phải là object.`);
  if (it.kind === 'flashcard') {
    if (!it.prompt?.hanzi) errors.push(`${at}: flashcard thiếu prompt.hanzi.`);
    return;
  }
  if (it.kind !== 'quiz') return errors.push(`${at}: kind phải là "quiz" hoặc "flashcard".`);
  const options = it.prompt?.options;
  if (!it.prompt?.question) errors.push(`${at}: quiz thiếu prompt.question.`);
  if (!Array.isArray(options) || options.length < 2) return errors.push(`${at}: quiz cần ít nhất 2 lựa chọn (prompt.options).`);
  const idx = it.correctAnswer?.optionIndex;
  if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
    errors.push(`${at}: correctAnswer.optionIndex phải là số từ 0 đến ${options.length - 1}.`);
  }
}

// Trả về { errors, warnings } — có errors thì bài đó không được import
function validateLesson(lesson) {
  const errors = [];
  const warnings = [];
  if (!Number.isInteger(lesson.lessonNumber) || lesson.lessonNumber < 1) errors.push('lessonNumber phải là số nguyên ≥ 1.');
  if (typeof lesson.titleVi !== 'string' || !lesson.titleVi.trim()) errors.push('Thiếu titleVi (tên bài tiếng Việt).');
  STRING_FIELDS.forEach((k) => {
    if (lesson[k] !== undefined && lesson[k] !== null && typeof lesson[k] !== 'string') errors.push(`${k} phải là chuỗi.`);
  });
  ARRAY_FIELDS.forEach((k) => {
    if (lesson[k] !== undefined && !Array.isArray(lesson[k])) errors.push(`${k} phải là mảng.`);
  });
  ['exercises', 'extra'].forEach((k) => {
    if (lesson[k] !== undefined && !isObj(lesson[k])) errors.push(`${k} phải là object.`);
  });
  ['isPreview', 'published'].forEach((k) => {
    if (lesson[k] !== undefined && typeof lesson[k] !== 'boolean') errors.push(`${k} phải là true/false.`);
  });
  if (errors.length) return { errors, warnings };

  (lesson.vocab || []).forEach((e, i) => {
    if (!isObj(e)) return errors.push(`vocab[${i}] phải là object.`);
    if (!Array.isArray(e.chars) || !e.chars.length || e.chars.some((c) => !c?.h)) errors.push(`vocab[${i}]: thiếu chữ Hán (chars).`);
    if (!e.meaning) warnings.push(`vocab[${i}] (${(e.chars || []).map((c) => c?.h).join('')}): chưa có nghĩa (meaning).`);
  });
  (lesson.dialogues || []).forEach((d, i) => {
    if (!isObj(d) || !Array.isArray(d.lines)) errors.push(`dialogues[${i}]: cần có mảng lines.`);
  });
  (lesson.audioTracks || []).forEach((t, i) => {
    if (!AUDIO_CATEGORIES.includes(t?.category)) errors.push(`audioTracks[${i}]: category phải là ${AUDIO_CATEGORIES.join(' / ')}.`);
  });
  (lesson.pages || []).forEach((p, i) => {
    if (p?.pageNumber !== undefined && !Number.isInteger(p.pageNumber)) errors.push(`pages[${i}]: pageNumber phải là số nguyên.`);
  });
  (lesson.exerciseItems || []).forEach((it, i) => checkExerciseItem(it, i, errors));
  checkParts(lesson.exercises?.blocks, 'exercises.blocks', errors, warnings);
  checkParts(lesson.extra?.phoneticsBlocks, 'extra.phoneticsBlocks', errors, warnings);
  (lesson.extra?.tabs || []).forEach((t) => {
    if (!TAB_KEYS.includes(t)) warnings.push(`extra.tabs: "${t}" không hợp lệ (${TAB_KEYS.join(', ')}) — sẽ bị bỏ qua.`);
  });
  return { errors, warnings };
}

// Ghi đè bài đã có: ô file nghe / trang sách trong JSON để trống URL thì giữ file đã tải lên trước đó.
function keepUploadedMedia(lesson, existing) {
  const out = { ...lesson };
  if (Array.isArray(lesson.audioTracks)) {
    out.audioTracks = lesson.audioTracks.map((t) => {
      if (t.audioUrl) return t;
      const old = existing.audioTracks.find(
        (o) => o.audioUrl && o.category === t.category && (t.code ? o.code === t.code : o.label === (t.label || ''))
      );
      return old ? { ...t, audioUrl: old.audioUrl, durationSec: t.durationSec ?? old.durationSec, sizeBytes: t.sizeBytes ?? old.sizeBytes } : t;
    });
  }
  if (Array.isArray(lesson.pages)) {
    out.pages = lesson.pages.map((p, i) => {
      if (p.imageUrl) return p;
      const old = existing.pages.find((o) => o.imageUrl && o.pageNumber === (p.pageNumber ?? i + 1));
      return old ? { ...p, imageUrl: old.imageUrl } : p;
    });
  }
  return out;
}

module.exports = { extractLessons, normalizeLesson, validateLesson, keepUploadedMedia };
