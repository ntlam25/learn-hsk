import FileUploadField from '../../ui/FileUploadField';
import ExerciseItemListEditor from '../lesson/ExerciseItemListEditor';
import { AddButton, AreaField, Hint, ItemControls, TextField, listOps } from './EditorFields';
import { ExBlockListEditor } from './ExBlockEditor';
import BulkPageUpload from './BulkPageUpload';
import {
  AUDIO_GROUP_TITLE,
  DEFAULT_TEACHER_DIVIDER,
  DEFAULT_WORDLIST_LABEL,
  audioIndex,
  audioMeta,
  avatarFor,
  defaultBookTitle,
} from '../../../lib/lessonContent';

const HTML_HINT = 'Có thể dùng HTML inline: <b>…</b>, <br/>, <span class="hanzi">…</span>, <span class="tone-y2">…</span>';

// ---------------------------------------------------------------- dùng chung
export function NoteEditor({ value, onChange }) {
  return <AreaField className="book-source-note" value={value} onChange={onChange} placeholder="Ghi chú nguồn (tuỳ chọn, ô viền nét đứt)" title={HTML_HINT} />;
}

// Đầu mục (h2 + mô tả). Tab Từ mới đặt ghi chú bên trong đầu mục; các tab khác đặt sau nhóm file nghe (dùng NoteEditor).
export function HeadEditor({ head, onChange, children, noteInside }) {
  const set = (f) => onChange({ ...head, ...f });
  return (
    <div className="section-head">
      <TextField className="be-h2" value={head.title} onChange={(v) => set({ title: v })} placeholder="生词 · Từ mới" />
      <TextField className="be-p" value={head.desc} onChange={(v) => set({ desc: v })} placeholder="Dòng mô tả in nghiêng (tuỳ chọn)" />
      {noteInside ? <NoteEditor value={head.note} onChange={(v) => set({ note: v })} /> : null}
      {children}
    </div>
  );
}

function readDuration(url) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
    audio.addEventListener('error', () => resolve(null));
    audio.src = url;
  });
}

export function AudioEditor({ category, tracks, onChange }) {
  // onChange nhận mảng mới hoặc hàm (cur) => mảng mới — dùng hàm cho cập nhật bất đồng bộ sau khi tải file
  const set = (i, f) => onChange((cur) => listOps.patch(cur, i, f));
  async function handleUpload(i, url, meta) {
    set(i, { audioUrl: url, sizeBytes: meta?.size ?? null, durationSec: null });
    if (url) {
      const duration = await readDuration(url);
      if (duration) set(i, { durationSec: Math.round(duration) });
    }
  }
  return (
    <div className="section-audio-group be-audio" data-audio-category={category}>
      <div className="section-audio-title">
        <span className="section-audio-badge">🔊</span>
        <div>
          <strong>{AUDIO_GROUP_TITLE[category]}</strong>
          <span>Nghe trực tiếp trước khi học nội dung bên dưới</span>
        </div>
      </div>
      {tracks.length ? (
        <div className="embedded-audio-grid section-audio-grid">
          {tracks.map((t, i) => (
            <article key={i} className="embedded-audio-track">
              <div className="embedded-audio-track-head">
                <span aria-hidden="true" className="embedded-audio-icon">
                  ♪
                </span>
                <div className="embedded-audio-meta">
                  <TextField value={t.label} onChange={(v) => set(i, { label: v })} placeholder="生词 · Nghe từ mới" />
                  <span>
                    {t.audioUrl ? audioMeta({ ...t, code: '' }) || 'Đã tải file' : <b className="be-missing">Chưa tải file — học viên chưa thấy</b>} · Mã{' '}
                    <TextField className="be-inline" value={t.code} onChange={(v) => set(i, { code: v })} placeholder="01-2" />
                  </span>
                </div>
                <span className="embedded-audio-index">{audioIndex(t, i)}</span>
                <ItemControls index={i} count={tracks.length} onMove={(a, b) => onChange(listOps.move(tracks, a, b))} onRemove={(idx) => onChange(listOps.remove(tracks, idx))} label="file nghe" />
              </div>
              <FileUploadField value={t.audioUrl} onChange={(url, meta) => handleUpload(i, url, meta)} folder="audio" accept="audio/*" previewKind="audio" />
            </article>
          ))}
        </div>
      ) : (
        <Hint>Chưa có file nghe cho mục này — nhóm file nghe sẽ không hiển thị với học viên.</Hint>
      )}
      <AddButton onClick={() => onChange([...tracks, { category, label: '', audioUrl: '', code: '', durationSec: null, sizeBytes: null }])}>+ Thêm file nghe</AddButton>
    </div>
  );
}

// ---------------------------------------------------------------- Từ mới
function emptyVocab(num) {
  return { num, chars: [{ h: '' }], pinyin: '', pos: '', meaning: '', examples: [] };
}

function VocabCardEditor({ entry, index, count, onChange, onMove, onRemove }) {
  const set = (f) => onChange({ ...entry, ...f });
  const chars = entry.chars || [];
  const wordlist = entry.wordlist || [];
  const examples = entry.examples || [];
  return (
    <div className="vcard integrated-vcard book-aligned-card be-card">
      <div className="vcard-top">
        <span className="vnum">
          Từ <TextField type="number" className="be-inline be-num" value={entry.num} onChange={(v) => set({ num: v })} />
        </span>
        <ItemControls index={index} count={count} onMove={onMove} onRemove={onRemove} label="từ" />
      </div>
      <div className="char-row">
        {chars.map((c, i) => (
          <div key={i} className="char-box be-item">
            <div className="tianzige">
              <input className="zh be-char" maxLength={2} value={c.h} onChange={(e) => set({ chars: listOps.patch(chars, i, { h: e.target.value.trim() }) })} placeholder="字" />
            </div>
            <ItemControls index={i} count={chars.length} onRemove={(idx) => set({ chars: listOps.remove(chars, idx) })} label="chữ" />
          </div>
        ))}
        <AddButton onClick={() => set({ chars: [...chars, { h: '' }] })}>+ Chữ</AddButton>
      </div>
      <TextField className="word-pinyin" value={entry.pinyin} onChange={(v) => set({ pinyin: v })} placeholder="pinyin cả từ" />
      <TextField className="pos" value={entry.pos} onChange={(v) => set({ pos: v })} placeholder="Từ loại" />
      <TextField className="meaning" value={entry.meaning} onChange={(v) => set({ meaning: v })} placeholder="Nghĩa tiếng Việt" />
      <TextField className="meaning-en" value={entry.meaningEn} onChange={(v) => set({ meaningEn: v })} placeholder="Meaning (English, tuỳ chọn)" />
      <div className="sub-entry">
        <TextField className="sub-label" value={entry.wordlistLabel ?? (wordlist.length ? DEFAULT_WORDLIST_LABEL : '')} onChange={(v) => set({ wordlistLabel: v })} placeholder={DEFAULT_WORDLIST_LABEL} />
        <div className="wordlist">
          {wordlist.map((w, i) => (
            <div key={i} className="wordlist-item be-item">
              <TextField className="wh" value={w.h} onChange={(v) => set({ wordlist: listOps.patch(wordlist, i, { h: v }) })} placeholder="汉字" />
              <TextField className="wp" value={w.p} onChange={(v) => set({ wordlist: listOps.patch(wordlist, i, { p: v }) })} placeholder="pinyin" />
              <TextField className="wm" value={w.m} onChange={(v) => set({ wordlist: listOps.patch(wordlist, i, { m: v }) })} placeholder="nghĩa" />
              <ItemControls index={i} count={wordlist.length} onRemove={(idx) => set({ wordlist: listOps.remove(wordlist, idx) })} />
            </div>
          ))}
        </div>
        <AddButton onClick={() => set({ wordlist: [...wordlist, { h: '', p: '', m: '' }] })}>+ Từ đi kèm</AddButton>
      </div>
      <AreaField className="note-box" value={entry.note} onChange={(v) => set({ note: v })} placeholder="Ghi chú (tuỳ chọn), VD: Âm Hán Việt: TRUNG NGỌ" />
      <div className="example-list">
        {examples.map((ex, i) => (
          <div key={i} className="example-line be-item">
            <TextField className="example-hanzi" value={ex[0]} onChange={(v) => set({ examples: listOps.update(examples, i, [v, ex[1], ex[2]]) })} placeholder="例句" />
            <TextField className="example-pinyin" value={ex[1]} onChange={(v) => set({ examples: listOps.update(examples, i, [ex[0], v, ex[2]]) })} placeholder="pinyin (tuỳ chọn)" />
            <TextField className="example-vi" value={ex[2]} onChange={(v) => set({ examples: listOps.update(examples, i, [ex[0], ex[1], v]) })} placeholder="Nghĩa" />
            <ItemControls index={i} count={examples.length} onRemove={(idx) => set({ examples: listOps.remove(examples, idx) })} label="ví dụ" />
          </div>
        ))}
        <AddButton onClick={() => set({ examples: [...examples, ['', '', '']] })}>+ Ví dụ</AddButton>
      </div>
    </div>
  );
}

export function VocabTabEditor({ lesson, setField, setExtra }) {
  const vocab = lesson.vocab;
  const rows = lesson.properNouns;
  const title = lesson.extra.properNounsTitle || { zh: '专名', vi: 'Tên riêng' };
  return (
    <>
      <div className="vocab-grid book-vocab-grid">
        {vocab.map((entry, i) => (
          <VocabCardEditor
            key={i}
            entry={entry}
            index={i}
            count={vocab.length}
            onChange={(v) => setField('vocab', listOps.update(vocab, i, v))}
            onMove={(a, b) => setField('vocab', listOps.move(vocab, a, b))}
            onRemove={(idx) => setField('vocab', listOps.remove(vocab, idx))}
          />
        ))}
      </div>
      <AddButton className="be-add-block" onClick={() => setField('vocab', [...vocab, emptyVocab(vocab.length + 1)])}>
        + Thêm từ mới
      </AddButton>
      <h3 className="group-title">
        <TextField className="be-inline" value={title.zh} onChange={(v) => setExtra('properNounsTitle', { ...title, zh: v })} placeholder="专名" />{' '}
        <span className="vi">
          <TextField className="be-inline" value={title.vi} onChange={(v) => setExtra('properNounsTitle', { ...title, vi: v })} placeholder="Tên riêng" />
        </span>
      </h3>
      <div className="book-proper-table">
        {rows.map((r, i) => (
          <div key={i} className="book-proper-row be-item">
            <TextField className="hanzi" value={r.hanzi} onChange={(v) => setField('properNouns', listOps.patch(rows, i, { hanzi: v }))} placeholder="北京" />
            <TextField value={r.pinyin} onChange={(v) => setField('properNouns', listOps.patch(rows, i, { pinyin: v }))} placeholder="Běijīng" />
            <TextField value={r.meaning} onChange={(v) => setField('properNouns', listOps.patch(rows, i, { meaning: v }))} placeholder="Bắc Kinh" />
            <ItemControls index={i} count={rows.length} onMove={(a, b) => setField('properNouns', listOps.move(rows, a, b))} onRemove={(idx) => setField('properNouns', listOps.remove(rows, idx))} label="tên riêng" />
          </div>
        ))}
      </div>
      <AddButton onClick={() => setField('properNouns', [...rows, { hanzi: '', pinyin: '', meaning: '' }])}>+ Tên riêng</AddButton>
      <Hint>Bảng tên riêng chỉ hiện với học viên khi có ít nhất một dòng.</Hint>
    </>
  );
}

// ---------------------------------------------------------------- Bài khóa
function DialogueEditor({ dialogue, index, count, onChange, onMove, onRemove }) {
  const set = (f) => onChange({ ...dialogue, ...f });
  const lines = dialogue.lines;
  let speakerIndex = 0;
  return (
    <div className="dialogue-card book-dialogue be-card">
      <div className="be-card-tools">
        <ItemControls index={index} count={count} onMove={onMove} onRemove={onRemove} label="bài khóa" />
      </div>
      <TextField className="dlg-title" value={dialogue.title} onChange={(v) => set({ title: v })} placeholder="（一）这是什么书" />
      <TextField className="book-context" value={dialogue.context} onChange={(v) => set({ context: v })} placeholder="（Bối cảnh, tuỳ chọn）" />
      {lines.map((line, i) => {
        const tools = (
          <ItemControls index={i} count={lines.length} onMove={(a, b) => set({ lines: listOps.move(lines, a, b) })} onRemove={(idx) => set({ lines: listOps.remove(lines, idx) })} label="dòng" />
        );
        if (line.loc != null) {
          return (
            <div key={i} className="location-divider be-item">
              <TextField value={line.loc} onChange={(v) => set({ lines: listOps.update(lines, i, { loc: v }) })} placeholder="（Địa điểm）" />
              {tools}
            </div>
          );
        }
        if (line.gap) {
          return (
            <div key={i} className="be-item be-gap">
              <span>— khoảng cách —</span>
              {tools}
            </div>
          );
        }
        const av = avatarFor(line.role, speakerIndex++);
        return (
          <div key={i} className="dlg-line be-item">
            <div className={['dlg-avatar', av.variant, av.long ? 'long-role' : ''].filter(Boolean).join(' ')}>{av.text || '?'}</div>
            <div className="be-grow">
              <TextField className="dlg-speaker" value={line.role} onChange={(v) => set({ lines: listOps.patch(lines, i, { role: v }) })} placeholder="Tên vai (A, 麦克…)" />
              <TextField className="dlg-text" value={line.text} onChange={(v) => set({ lines: listOps.patch(lines, i, { text: v }) })} placeholder="Câu thoại — **cụm trọng tâm** để tô đậm" title="Bọc cụm từ trọng tâm trong **…** (VD: 我要**一碗**鸡蛋汤) để tô đậm như giáo trình" />
              <TextField className="dlg-pinyin" value={line.py} onChange={(v) => set({ lines: listOps.patch(lines, i, { py: v }) })} placeholder="pinyin (tuỳ chọn)" />
            </div>
            {tools}
          </div>
        );
      })}
      <div className="be-row">
        <AddButton
          onClick={() => {
            const speakers = lines.filter((l) => l.role);
            const prev = speakers[speakers.length - 2]?.role || (speakers.length ? '' : 'A');
            set({ lines: [...lines, { role: prev || (speakers.length % 2 ? 'B' : 'A'), text: '' }] });
          }}
        >
          + Lượt thoại
        </AddButton>
        <AddButton onClick={() => set({ lines: [...lines, { loc: '' }] })}>+ Dòng địa điểm</AddButton>
        <AddButton onClick={() => set({ lines: [...lines, { gap: true }] })}>+ Khoảng cách</AddButton>
      </div>
    </div>
  );
}

export function DialogueTabEditor({ lesson, setField }) {
  const list = lesson.dialogues;
  return (
    <>
      {list.map((d, i) => (
        <DialogueEditor
          key={i}
          dialogue={d}
          index={i}
          count={list.length}
          onChange={(v) => setField('dialogues', listOps.update(list, i, v))}
          onMove={(a, b) => setField('dialogues', listOps.move(list, a, b))}
          onRemove={(idx) => setField('dialogues', listOps.remove(list, idx))}
        />
      ))}
      <AddButton className="be-add-block" onClick={() => setField('dialogues', [...list, { title: '课文', context: '', lines: [{ role: 'A', text: '' }] }])}>
        + Thêm bài khóa
      </AddButton>
      <Hint>Avatar tự lấy 2 ký tự đầu của tên vai và đổi màu lần lượt theo thứ tự lượt nói — giống giáo trình.</Hint>
    </>
  );
}

// ---------------------------------------------------------------- Ngữ âm
function PhoneticsHeroEditor({ hero, onChange }) {
  const set = (f) => onChange({ ...hero, ...f });
  const rules = hero.rules || [];
  return (
    <div className="phonetics-hero be-card">
      <div className="be-card-tools">
        <button type="button" className="be-mini be-danger" onClick={() => onChange(null)} title="Bỏ khung quy tắc">
          × Bỏ khung
        </button>
      </div>
      <h3>
        <input className="big-one be-char" maxLength={2} value={hero.big || ''} onChange={(e) => set({ big: e.target.value })} placeholder="一" />
        <TextField value={hero.title} onChange={(v) => set({ title: v })} placeholder="Biến điệu của “一”" />
      </h3>
      <div className="rule-grid">
        {rules.map((r, i) => (
          <div key={i} className="rule-card be-item">
            <TextField value={r.title} onChange={(v) => set({ rules: listOps.patch(rules, i, { title: v }) })} placeholder="Giữ nguyên thanh 1" />
            <TextField className="rule-form" value={r.form} onChange={(v) => set({ rules: listOps.patch(rules, i, { form: v }) })} placeholder='<span class="tone-y1">yī</span>' title={HTML_HINT} />
            <AreaField value={r.desc} onChange={(v) => set({ rules: listOps.patch(rules, i, { desc: v }) })} placeholder="Giải thích" />
            <ItemControls index={i} count={rules.length} onMove={(a, b) => set({ rules: listOps.move(rules, a, b) })} onRemove={(idx) => set({ rules: listOps.remove(rules, idx) })} label="quy tắc" />
          </div>
        ))}
      </div>
      <AddButton onClick={() => set({ rules: [...rules, { title: '', form: '', desc: '' }] })}>+ Thẻ quy tắc</AddButton>
      <AreaField className="phonetic-note" value={hero.note} onChange={(v) => set({ note: v })} placeholder="<b>Ghi nhớ:</b> …" title={HTML_HINT} />
    </div>
  );
}

export function PhoneticsTabEditor({ lesson, setField, setExtra }) {
  const notes = lesson.phoneticsNotes;
  const hero = lesson.extra.phoneticsHero;
  return (
    <>
      {hero ? (
        <PhoneticsHeroEditor hero={hero} onChange={(v) => setExtra('phoneticsHero', v)} />
      ) : (
        <AddButton className="be-add-block" onClick={() => setExtra('phoneticsHero', { big: '一', title: '', rules: [{ title: '', form: '', desc: '' }], note: '' })}>
          + Khung quy tắc biến điệu (tuỳ chọn)
        </AddButton>
      )}
      <div className="mini-note-grid">
        {notes.map((n, i) => (
          <div key={i} className="mini-note be-item">
            <TextField className="be-h4" value={n.title} onChange={(v) => setField('phoneticsNotes', listOps.patch(notes, i, { title: v }))} placeholder="声母 · Thanh mẫu" />
            <AreaField value={n.content} onChange={(v) => setField('phoneticsNotes', listOps.patch(notes, i, { content: v }))} placeholder="Nội dung ghi chú" title={HTML_HINT} />
            <ItemControls index={i} count={notes.length} onMove={(a, b) => setField('phoneticsNotes', listOps.move(notes, a, b))} onRemove={(idx) => setField('phoneticsNotes', listOps.remove(notes, idx))} label="ghi chú" />
          </div>
        ))}
      </div>
      <AddButton onClick={() => setField('phoneticsNotes', [...notes, { title: '', content: '' }])}>+ Ghi chú ngữ âm</AddButton>
      <ExBlockListEditor blocks={lesson.extra.phoneticsBlocks} onChange={(v) => setExtra('phoneticsBlocks', v)} addLabel="+ Thêm khối luyện ngữ âm" />
    </>
  );
}

// ---------------------------------------------------------------- Ngữ pháp
export function GrammarTabEditor({ lesson, setField }) {
  const list = lesson.grammar;
  return (
    <>
      {list.map((g, i) => (
        <div key={i} className="ex-block be-block">
          <h3>
            <span className="ex-num">{i + 1}</span>
            <TextField value={g.title} onChange={(v) => setField('grammar', listOps.patch(list, i, { title: v }))} placeholder="汉字、笔画、笔顺" />
            <ItemControls index={i} count={list.length} onMove={(a, b) => setField('grammar', listOps.move(list, a, b))} onRemove={(idx) => setField('grammar', listOps.remove(list, idx))} label="mục ngữ pháp" />
          </h3>
          <AreaField className="reading-box be-prose" value={g.content} onChange={(v) => setField('grammar', listOps.patch(list, i, { content: v }))} placeholder="Giải thích ngữ pháp" rows={2} title={HTML_HINT} />
        </div>
      ))}
      <AddButton className="be-add-block" onClick={() => setField('grammar', [...list, { title: '', content: '' }])}>
        + Thêm mục ngữ pháp
      </AddButton>
    </>
  );
}

// ---------------------------------------------------------------- Luyện tập
function BookExercisesEditor({ lesson, setField }) {
  const ex = lesson.exercises;
  const textPages = ex.textPages || [];
  const pages = lesson.pages || [];
  const setEx = (f) => setField('exercises', { ...ex, ...f });
  const count = Math.max(textPages.length, pages.length);
  return (
    <details className="book-exercises be-card" open>
      <summary>
        <TextField className="be-inline be-wide" value={ex.bookTitle} onChange={(v) => setEx({ bookTitle: v })} placeholder={defaultBookTitle(lesson.lessonNumber, count)} />
      </summary>
      <AreaField className="book-source-note" value={ex.bookNote} onChange={(v) => setEx({ bookNote: v })} placeholder="Ghi chú (tuỳ chọn)" title={HTML_HINT} />
      <div className="exercise-text-extract">
        <div className="exercise-text-intro">
          <span aria-hidden="true" className="exercise-text-intro-icon">
            文
          </span>
          <div>
            <strong>Nội dung luyện tập dạng văn bản</strong>
            <span>Mỗi trang là một khung văn bản học viên có thể bôi đen / sao chép.</span>
          </div>
        </div>
        <div className="exercise-text-pages">
          {textPages.map((p, i) => (
            <article key={i} className="exercise-text-page be-item">
              <div className="exercise-text-page-head">
                <div>
                  <TextField className="exercise-text-page-label be-inline" value={p.label} onChange={(v) => setEx({ textPages: listOps.patch(textPages, i, { label: v }) })} placeholder="练习" />
                  <strong>
                    Trang <TextField type="number" className="be-inline be-num" value={p.pageNumber} onChange={(v) => setEx({ textPages: listOps.patch(textPages, i, { pageNumber: v }) })} />
                  </strong>
                </div>
                <ItemControls index={i} count={textPages.length} onMove={(a, b) => setEx({ textPages: listOps.move(textPages, a, b) })} onRemove={(idx) => setEx({ textPages: listOps.remove(textPages, idx) })} label="trang" />
              </div>
              <AreaField className="exercise-copyable-text" value={p.text} onChange={(v) => setEx({ textPages: listOps.patch(textPages, i, { text: v }) })} placeholder="Dán nội dung văn bản của trang bài tập" rows={6} />
            </article>
          ))}
        </div>
        <AddButton
          onClick={() => {
            const last = textPages[textPages.length - 1]?.pageNumber || pages[pages.length - 1]?.pageNumber || 0;
            setEx({ textPages: [...textPages, { label: '练习', pageNumber: Number(last) + 1, text: '' }] });
          }}
        >
          + Trang văn bản
        </AddButton>
      </div>
      <div className="original-page-divider">Trang sách gốc</div>
      <div className="book-page-grid be-page-grid">
        {pages.map((p, i) => (
          <figure key={i} className="book-page-card be-item">
            {p.imageUrl ? <img alt={`Bài tập sách - PDF trang ${p.pageNumber}`} src={p.imageUrl} /> : <div className="be-missing-page">Chưa tải ảnh trang {p.pageNumber}</div>}
            <figcaption>
              Trang{' '}
              <TextField type="number" className="be-inline be-num" value={p.pageNumber} onChange={(v) => setField('pages', listOps.patch(pages, i, { pageNumber: v }))} /> ·{' '}
              <TextField className="be-inline be-wide" value={p.caption} onChange={(v) => setField('pages', listOps.patch(pages, i, { caption: v }))} placeholder={`Trang bài tập trong PDF: ${p.pageNumber}`} />
              <ItemControls index={i} count={pages.length} onMove={(a, b) => setField('pages', listOps.move(pages, a, b))} onRemove={(idx) => setField('pages', listOps.remove(pages, idx))} label="ảnh trang" />
            </figcaption>
            <FileUploadField value={p.imageUrl} onChange={(url) => setField('pages', (cur) => listOps.patch(cur, i, { imageUrl: url }))} folder="book-pages" accept="image/*" previewKind="none" />
          </figure>
        ))}
      </div>
      <AddButton
        onClick={() => {
          const last = pages[pages.length - 1]?.pageNumber || textPages[0]?.pageNumber - 1 || 0;
          setField('pages', [...pages, { pageNumber: Number(last) + 1, imageUrl: '', caption: '' }]);
        }}
      >
        + Ô ảnh trang sách
      </AddButton>
      <BulkPageUpload
        nextPageNumber={Number(pages[pages.length - 1]?.pageNumber || textPages[0]?.pageNumber || 1) + (pages.length ? 1 : 0)}
        onUploaded={(page) =>
          setField('pages', (cur) => {
            // cùng số trang: điền vào ô đó (thay ảnh cũ nếu có); chưa có thì thêm trang mới
            const idx = cur.findIndex((p) => Number(p.pageNumber) === page.pageNumber);
            return idx >= 0 ? listOps.patch(cur, idx, { imageUrl: page.imageUrl }) : [...cur, page];
          })
        }
      />
      <div className="be-pdf">
        <FileUploadField
          label="PDF trang sách gốc (tuỳ chọn — học viên thấy nút mở/tải PDF)"
          value={lesson.sourcePdfUrl}
          onChange={(url) => setField('sourcePdfUrl', url)}
          folder="documents"
          accept="application/pdf"
          previewKind="none"
        />
      </div>
    </details>
  );
}

export function ExerciseTabEditor({ lesson, setField, setExtra, head }) {
  const ex = lesson.exercises;
  return (
    <>
      <BookExercisesEditor lesson={lesson} setField={setField} />
      <TextField className="teacher-extra-divider be-wide" value={lesson.extra.teacherDivider} onChange={(v) => setExtra('teacherDivider', v)} placeholder={DEFAULT_TEACHER_DIVIDER} />
      <Hint>Khung "Bài tập nguyên bản trong sách" và dòng phân cách chỉ hiện khi có trang văn bản, ảnh trang đã tải hoặc PDF. Ô ảnh chưa tải file sẽ không hiện với học viên.</Hint>
      {head}
      <ExBlockListEditor blocks={ex.blocks || []} onChange={(v) => setField('exercises', { ...ex, blocks: v })} />
      <div className="ex-block be-block">
        <h3>
          <span className="ex-num">✓</span>
          <span className="hanzi">小测验</span> — Quiz chấm điểm &amp; flashcard (tính năng hệ thống)
        </h3>
        <p className="ex-desc">Quiz có chấm điểm hiện cuối tab Luyện tập; flashcard hiện cuối tab Từ mới.</p>
        <div className="be-admin-panel">
          <ExerciseItemListEditor items={lesson.exerciseItems || []} onChange={(v) => setField('exerciseItems', v)} />
        </div>
      </div>
    </>
  );
}
