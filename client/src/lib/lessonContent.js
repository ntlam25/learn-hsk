// Cấu trúc nội dung bài học bám theo "Giáo trình Hán ngữ Bài 1–15.html".
// normalizeLesson() nhận cả dữ liệu kiểu cũ (exercises.chips/questions/…) lẫn kiểu mới và trả về
// một dạng thống nhất cho trang xem và trình soạn bài.

export const TAB_META = {
  vocab: { zh: '生词', label: 'Từ mới', audio: 'vocab' },
  dialogue: { zh: '课文', label: 'Bài khóa', audio: 'text' },
  phonetics: { zh: '语音', label: 'Ngữ âm', audio: 'phonetics' },
  grammar: { zh: '语法', label: 'Ngữ pháp', audio: null },
  exercise: { zh: '练习', label: 'Luyện tập', audio: 'practice' },
};
export const TAB_KEYS = Object.keys(TAB_META);

export const AUDIO_GROUP_TITLE = {
  vocab: '生词 · File nghe Từ mới',
  text: '课文 · File nghe Bài khóa',
  phonetics: '语音 · File nghe Ngữ âm',
  practice: '练习 · File nghe Luyện tập',
};

export const DEFAULT_HEADS = {
  vocab: { title: '生词 · Từ mới', desc: '', note: '' },
  dialogue: { title: '课文 · Bài khóa', desc: '', note: '' },
  phonetics: { title: '语音 · Ngữ âm', desc: '', note: '' },
  grammar: { title: '语法 · Ngữ pháp', desc: '', note: '' },
  exercise: { title: '练习 · Luyện tập', desc: '', note: '' },
};

export const DEFAULT_TEACHER_DIVIDER = '✦ Bài luyện tập bổ sung của giáo viên ✦';
export const DEFAULT_WORDLIST_LABEL = 'Từ đi kèm (không đánh số riêng)';
export const DEFAULT_TONE_WRONG_TEXT = 'Chưa đúng — hãy nhận dạng thanh điệu của âm tiết đứng sau 一.';
// Style nội tuyến của reading-box trong tab Ngữ pháp ở file gốc
export const PROSE_READING_STYLE = { fontFamily: 'Be Vietnam Pro,sans-serif', fontSize: '1rem', lineHeight: 1.75 };

export const PART_TYPES = {
  subtitle: 'Tiêu đề phụ',
  chips: 'Ô luyện đọc (chữ Hán + phiên âm)',
  pinyin: 'Ô phiên âm',
  sentences: 'Danh sách câu',
  reading: 'Đoạn văn',
  homework: 'Bài tập về nhà',
  toneQuiz: 'Quiz chọn cách đọc',
  extensions: 'Từ mở rộng',
};

export function defaultFooter(lessonNumber) {
  return { zh: '温故而知新', text: `· Ôn cũ biết mới — Bài ${lessonNumber || ''}`.trim() };
}

export function defaultBookTitle(lessonNumber, pageCount) {
  return `📘 Bài tập nguyên bản trong sách - Bài ${lessonNumber || ''} (${pageCount} trang)`;
}

export function formatDuration(sec) {
  if (sec == null || sec === '' || Number.isNaN(Number(sec))) return '';
  const total = Math.round(Number(sec));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function audioMeta(track) {
  const parts = [];
  if (track.durationSec) parts.push(`Thời lượng ${formatDuration(track.durationSec)}`);
  if (track.sizeBytes) parts.push(`${(track.sizeBytes / 1024 / 1024).toFixed(1)} MB`);
  if (track.code) parts.push(`Mã ${track.code}`);
  return parts.join(' · ');
}

// Số hiển thị ở góc file nghe: theo mã file (06-3 → "03") như giáo trình, không có mã thì theo thứ tự.
export function audioIndex(track, i) {
  if (track.index) return track.index;
  const m = /-(\d+)$/.exec(track.code || '');
  return String(m ? Number(m[1]) : i + 1).padStart(2, '0');
}

// Avatar hội thoại: 2 ký tự đầu tên vai, màu xoay vòng A/B/C theo thứ tự lượt nói, tên dài thì avatar dạng viên thuốc.
export function avatarFor(role, lineIndex) {
  const chars = Array.from(role || '');
  return {
    text: chars.slice(0, 2).join(''),
    variant: ['', 'B', 'C'][lineIndex % 3],
    long: chars.length > 2,
  };
}

// Cú pháp gọn cho câu thoại: **一碗** → <span class="focus">一碗</span> (tô đậm cụm từ trọng tâm như giáo trình).
// Vẫn nhận HTML viết tay <span class="focus">…</span>.
export function focusMarkup(html) {
  return typeof html === 'string' ? html.replace(/\*\*(.+?)\*\*/g, '<span class="focus">$1</span>') : html;
}

export function vocabKey(lesson, entry, i) {
  return `book-l${lesson.lessonNumber || 0}-${entry.num ?? i + 1}`;
}

function legacyExerciseBlocks(ex) {
  const blocks = [];
  (ex.phonetics || []).forEach((b) =>
    blocks.push({ title: b.subtitle || '', desc: '', parts: [{ type: 'chips', items: toChipItems(b.items) }] })
  );
  (ex.chips || []).forEach((b) =>
    blocks.push({ title: b.title || '', desc: b.desc || '', parts: [{ type: 'chips', items: toChipItems(b.items) }] })
  );
  if (ex.questions?.length) {
    blocks.push({
      title: '<span class="hanzi">回答问题</span> — Trả lời câu hỏi',
      desc: 'Trả lời thành câu hoàn chỉnh bằng tiếng Trung, không chỉ trả lời một từ.',
      parts: [{ type: 'sentences', hanzi: true, items: ex.questions }],
    });
  }
  if (ex.reading) {
    blocks.push({
      title: '<span class="hanzi">短文朗读</span> — Đọc đoạn văn',
      desc: 'Ngắt nghỉ theo cụm nghĩa, sau đó thuật lại mà không nhìn văn bản.',
      parts: [{ type: 'reading', prose: false, html: ex.reading }],
    });
  }
  if (ex.homework?.length) {
    blocks.push({
      title: '<span class="hanzi">课后任务</span> — Bài tập về nhà',
      desc: '',
      parts: [{ type: 'homework', items: ex.homework.map((h) => `✓ ${h}`) }],
    });
  }
  return blocks;
}

function toChipItems(items = []) {
  return items.map((it) => (Array.isArray(it) ? { ph: it[0] || '', pp: it[1] || '' } : typeof it === 'string' ? { ph: it } : it));
}

function normalizeVocabEntry(entry) {
  const e = { ...entry, chars: entry.chars || [] };
  if (!e.wordlist && Array.isArray(e.related) && e.related.length) {
    e.wordlist = e.related.map(([h, p, m]) => ({ h, p, m }));
    e.wordlistLabel = e.wordlistLabel || 'Từ liên quan';
  }
  if (e.meaning_en && !e.meaningEn) e.meaningEn = e.meaning_en;
  e.examples = (e.examples || []).map((ex) => (Array.isArray(ex) ? ex : [ex.h || '', ex.p || '', ex.m || '']));
  return e;
}

function inferTabs(lesson, extra) {
  const ex = lesson.exercises || {};
  const tabs = [];
  if (lesson.vocab?.length || lesson.properNouns?.length || extra.countries?.length || extra.extensions?.length) tabs.push('vocab');
  if (lesson.dialogues?.length) tabs.push('dialogue');
  if (lesson.phoneticsNotes?.length || extra.phoneticsHero || extra.phoneticsBlocks?.length) tabs.push('phonetics');
  if (lesson.grammar?.length) tabs.push('grammar');
  if (
    ex.blocks?.length ||
    ex.textPages?.length ||
    lesson.pages?.length ||
    (lesson.exerciseItems || []).some((it) => it.kind !== 'flashcard')
  ) {
    tabs.push('exercise');
  }
  return tabs.length ? tabs : ['vocab'];
}

export function normalizeLesson(raw) {
  if (!raw) return raw;
  const lesson = { ...raw };
  const extra = { ...(raw.extra || {}) };
  const ex = { ...(raw.exercises || {}) };

  if (!Array.isArray(ex.blocks)) {
    ex.blocks = legacyExerciseBlocks(ex);
  }
  ['phonetics', 'chips', 'questions', 'reading', 'homework'].forEach((k) => delete ex[k]);
  ex.textPages = (ex.textPages || []).map((p) => ({ label: '练习', ...p }));
  lesson.exercises = ex;

  lesson.vocab = (raw.vocab || []).map(normalizeVocabEntry);
  lesson.properNouns = (raw.properNouns || []).map((p) => ({
    hanzi: p.hanzi ?? (p.chars || []).map((c) => c.h).join(''),
    pinyin: p.pinyin || '',
    meaning: p.meaning || '',
  }));
  lesson.dialogues = (raw.dialogues || []).map((d) => ({ title: '', context: '', ...d, lines: d.lines || [] }));
  lesson.phoneticsNotes = raw.phoneticsNotes || [];
  lesson.grammar = raw.grammar || [];
  lesson.audioTracks = raw.audioTracks || [];
  lesson.pages = raw.pages || [];

  extra.heads = TAB_KEYS.reduce((acc, k) => ({ ...acc, [k]: { ...DEFAULT_HEADS[k], ...(extra.heads?.[k] || {}) } }), {});
  extra.phoneticsBlocks = extra.phoneticsBlocks || [];
  extra.tabs = Array.isArray(extra.tabs) && extra.tabs.length ? extra.tabs.filter((k) => TAB_META[k]) : inferTabs(lesson, extra);
  lesson.extra = extra;
  return lesson;
}
