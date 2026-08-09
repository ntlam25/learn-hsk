import {
  CharsEditor,
  TripleTupleEditor,
  WordListEditor,
  SubEntryEditor,
  emptyEntry,
  emptySubEntry,
} from '../../VocabListEditor';
import ExerciseItemListEditor from './ExerciseItemListEditor';

function VocabCardEditor({ entry, onChange, onRemove }) {
  function set(field, val) {
    onChange({ ...entry, [field]: val });
  }
  return (
    <div className="vcard vcard-edit">
      <div className="vcard-top">
        <input
          className="vnum vnum-input"
          type="number"
          placeholder="#"
          value={entry.num}
          onChange={(e) => set('num', e.target.value === '' ? '' : Number(e.target.value))}
        />
        <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá thẻ này">
          ×
        </button>
      </div>

      <CharsEditor chars={entry.chars || []} onChange={(v) => set('chars', v)} />

      <div className="field-row">
        <input placeholder="Pinyin cả từ" value={entry.pinyin || ''} onChange={(e) => set('pinyin', e.target.value)} />
        <input placeholder="Từ loại" value={entry.pos || ''} onChange={(e) => set('pos', e.target.value)} />
      </div>
      <div className="field-row">
        <input placeholder="Nghĩa (tiếng Việt)" value={entry.meaning || ''} onChange={(e) => set('meaning', e.target.value)} />
        <input placeholder="Meaning (English)" value={entry.meaning_en || ''} onChange={(e) => set('meaning_en', e.target.value)} />
      </div>
      <input className="note-box-input" placeholder="Ghi chú (âm Hán Việt...)" value={entry.note || ''} onChange={(e) => set('note', e.target.value)} />

      <div className="sub-label">VÍ DỤ</div>
      <TripleTupleEditor
        items={entry.examples || []}
        onChange={(v) => set('examples', v)}
        placeholders={['例句 汉字', 'pinyin', 'Nghĩa tiếng Việt']}
        addLabel="+ Thêm ví dụ"
      />

      <div className="sub-label">TỪ MỞ RỘNG</div>
      <WordListEditor items={entry.wordlist || []} onChange={(v) => set('wordlist', v)} />

      <div className="sub-label">TỪ LIÊN QUAN</div>
      <TripleTupleEditor
        items={entry.related || []}
        onChange={(v) => set('related', v)}
        placeholders={['汉字', 'pinyin', 'Nghĩa tiếng Việt']}
        addLabel="+ Thêm từ liên quan"
      />

      {entry.sub ? (
        <SubEntryEditor sub={entry.sub} onChange={(v) => set('sub', v)} onRemove={() => set('sub', null)} />
      ) : (
        <button type="button" className="btn-ghost-sm" onClick={() => set('sub', emptySubEntry())}>
          + Thêm từ gốc (sub)
        </button>
      )}
    </div>
  );
}

function ProperNounRow({ entry, onChange, onRemove }) {
  const chars = entry.chars || [{ h: '' }];
  function setHanzi(val) {
    onChange({ ...entry, chars: [{ ...chars[0], h: val }] });
  }
  return (
    <div className="book-proper-row book-proper-row-edit">
      <input className="hanzi" placeholder="汉字" value={chars[0]?.h || ''} onChange={(e) => setHanzi(e.target.value)} />
      <input placeholder="pinyin" value={entry.pinyin || ''} onChange={(e) => onChange({ ...entry, pinyin: e.target.value })} />
      <input placeholder="Nghĩa" value={entry.meaning || ''} onChange={(e) => onChange({ ...entry, meaning: e.target.value })} />
      <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá">
        ×
      </button>
    </div>
  );
}

function ProperNounsEditor({ entries, onChange }) {
  function update(i, val) {
    onChange(entries.map((e, idx) => (idx === i ? val : e)));
  }
  function add() {
    onChange([...entries, { chars: [{ h: '' }], pinyin: '', meaning: '' }]);
  }
  function remove(i) {
    onChange(entries.filter((_, idx) => idx !== i));
  }
  return (
    <div className="book-proper-table book-proper-table-edit">
      {entries.map((e, i) => (
        <ProperNounRow key={i} entry={e} onChange={(v) => update(i, v)} onRemove={() => remove(i)} />
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm danh từ riêng
      </button>
    </div>
  );
}

function CountryRow({ entry, onChange, onRemove }) {
  return (
    <div className="country-row country-row-edit">
      <input className="ch" placeholder="汉字" value={entry.h || ''} onChange={(e) => onChange({ ...entry, h: e.target.value })} />
      <input className="py" placeholder="pinyin" value={entry.p || ''} onChange={(e) => onChange({ ...entry, p: e.target.value })} />
      <input className="mn" placeholder="Nghĩa" value={entry.m || ''} onChange={(e) => onChange({ ...entry, m: e.target.value })} />
      <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá">
        ×
      </button>
    </div>
  );
}

function CountriesEditor({ countries, onChange }) {
  function update(i, val) {
    onChange(countries.map((c, idx) => (idx === i ? val : c)));
  }
  function add() {
    onChange([...countries, { h: '', p: '', m: '' }]);
  }
  function remove(i) {
    onChange(countries.filter((_, idx) => idx !== i));
  }
  return (
    <div className="country-table country-table-edit">
      {countries.map((c, i) => (
        <CountryRow key={i} entry={c} onChange={(v) => update(i, v)} onRemove={() => remove(i)} />
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm quốc gia
      </button>
    </div>
  );
}

function ExtensionChip({ tuple, onChange, onRemove }) {
  return (
    <div className="extension-chip extension-chip-edit">
      <input className="eh" placeholder="汉字" value={tuple[0] || ''} onChange={(e) => onChange([e.target.value, tuple[1], tuple[2]])} />
      <input className="ep" placeholder="pinyin" value={tuple[1] || ''} onChange={(e) => onChange([tuple[0], e.target.value, tuple[2]])} />
      <input className="em" placeholder="Nghĩa" value={tuple[2] || ''} onChange={(e) => onChange([tuple[0], tuple[1], e.target.value])} />
      <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá">
        ×
      </button>
    </div>
  );
}

function ExtensionsEditor({ extensions, onChange }) {
  function update(i, val) {
    onChange(extensions.map((ex, idx) => (idx === i ? val : ex)));
  }
  function add() {
    onChange([...extensions, ['', '', '']]);
  }
  function remove(i) {
    onChange(extensions.filter((_, idx) => idx !== i));
  }
  return (
    <div className="extension-grid extension-grid-edit">
      {extensions.map((ex, i) => (
        <ExtensionChip key={i} tuple={ex} onChange={(v) => update(i, v)} onRemove={() => remove(i)} />
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm từ mở rộng
      </button>
    </div>
  );
}

// Nội dung tab 生词 · Từ mới: lưới thẻ từ kiểu .vcard giống hệt trang xem (nhưng
// với input thay vì chữ tĩnh), cộng bảng danh từ riêng / bảng quốc gia / chip từ
// mở rộng, và thẻ flashcard (exerciseItems kind=flashcard).
export default function EditableVocabSection({ lesson, setField }) {
  const vocab = lesson.vocab || [];
  const properNouns = lesson.properNouns || [];
  const extra = lesson.extra || {};
  const exerciseItems = lesson.exerciseItems || [];
  const flashcards = exerciseItems.filter((it) => it.kind === 'flashcard');

  function updateVocab(i, val) {
    setField('vocab', vocab.map((e, idx) => (idx === i ? val : e)));
  }
  function addVocab() {
    setField('vocab', [...vocab, emptyEntry()]);
  }
  function removeVocab(i) {
    setField('vocab', vocab.filter((_, idx) => idx !== i));
  }

  function setFlashcards(nextFlashcards) {
    const others = exerciseItems.filter((it) => it.kind !== 'flashcard');
    setField('exerciseItems', [...others, ...nextFlashcards]);
  }

  return (
    <>
      <div className="vocab-grid">
        {vocab.map((entry, i) => (
          <VocabCardEditor key={i} entry={entry} onChange={(v) => updateVocab(i, v)} onRemove={() => removeVocab(i)} />
        ))}
      </div>
      <button type="button" className="btn-secondary section-add-btn" onClick={addVocab}>
        + Thêm từ mới
      </button>

      <h2 className="section-title">专名 · Danh từ riêng</h2>
      <ProperNounsEditor entries={properNouns} onChange={(v) => setField('properNouns', v)} />

      <h2 className="section-title">国家 · Tên các nước</h2>
      <CountriesEditor countries={extra.countries || []} onChange={(v) => setField('extra', { ...extra, countries: v })} />

      <h2 className="section-title">扩展词汇 · Từ mở rộng</h2>
      <ExtensionsEditor extensions={extra.extensions || []} onChange={(v) => setField('extra', { ...extra, extensions: v })} />

      <h2 className="section-title">卡片 · Flashcard ôn từ vựng</h2>
      <ExerciseItemListEditor items={flashcards} onChange={setFlashcards} />
    </>
  );
}
