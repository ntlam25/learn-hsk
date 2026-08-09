// Editor cho mảng vocab / properNouns: mỗi thẻ có các trường chính (số thứ tự,
// chữ Hán+pinyin+bộ thủ từng ký tự, pinyin cả từ, từ loại, nghĩa, ví dụ, từ mở
// rộng, từ liên quan, từ gốc lồng bên trong) — khớp đầy đủ dữ liệu mà VocabCard
// hiển thị ở trang xem bài học.
export function emptyEntry() {
  return {
    num: '',
    chars: [{ h: '', p: '', r: '', rm: '' }],
    pinyin: '',
    pos: '',
    meaning: '',
    meaning_en: '',
    note: '',
    examples: [],
    wordlist: [],
    related: [],
    sub: null,
  };
}

export function emptySubEntry() {
  return { chars: [{ h: '', p: '', r: '', rm: '' }], pinyin: '', pos: '', meaning: '', meaning_en: '', note: '' };
}

export function CharsEditor({ chars, onChange }) {
  function update(i, field, val) {
    const next = chars.map((c, idx) => (idx === i ? { ...c, [field]: val } : c));
    onChange(next);
  }
  function add() {
    onChange([...chars, { h: '', p: '', r: '', rm: '' }]);
  }
  function remove(i) {
    onChange(chars.filter((_, idx) => idx !== i));
  }

  return (
    <div className="chars-editor">
      {chars.map((c, i) => (
        <div key={i} className="chars-editor-row">
          <input
            className="chars-hanzi-input"
            placeholder="汉字"
            value={c.h}
            onChange={(e) => update(i, 'h', e.target.value)}
          />
          <input
            className="chars-pinyin-input"
            placeholder="pinyin"
            value={c.p}
            onChange={(e) => update(i, 'p', e.target.value)}
          />
          <input placeholder="Bộ thủ (VD: 门)" value={c.r || ''} onChange={(e) => update(i, 'r', e.target.value)} />
          <input
            placeholder="Nghĩa bộ thủ (VD: Bộ Môn)"
            value={c.rm || ''}
            onChange={(e) => update(i, 'rm', e.target.value)}
          />
          <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá ký tự">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm ký tự
      </button>
    </div>
  );
}

// Editor dùng chung cho các mảng tuple 3 phần tử [hán tự, pinyin, nghĩa] — dùng
// cho cả "examples" và "related" (2 field cùng shape, chỉ khác ngữ cảnh).
export function TripleTupleEditor({ items, onChange, placeholders, addLabel }) {
  function update(i, idx2, val) {
    const next = items.map((it, i2) => {
      if (i2 !== i) return it;
      const copy = [...it];
      copy[idx2] = val;
      return copy;
    });
    onChange(next);
  }
  function add() {
    onChange([...items, ['', '', '']]);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="examples-editor">
      {items.map((it, i) => (
        <div key={i} className="examples-editor-row">
          <input placeholder={placeholders[0]} value={it[0] || ''} onChange={(e) => update(i, 0, e.target.value)} />
          <input placeholder={placeholders[1]} value={it[1] || ''} onChange={(e) => update(i, 1, e.target.value)} />
          <input placeholder={placeholders[2]} value={it[2] || ''} onChange={(e) => update(i, 2, e.target.value)} />
          <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá dòng">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        {addLabel}
      </button>
    </div>
  );
}

// Editor cho "wordlist" (từ mở rộng bên trong 1 thẻ từ) — mảng object {h,p,m}.
export function WordListEditor({ items, onChange }) {
  function update(i, field, val) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  }
  function add() {
    onChange([...items, { h: '', p: '', m: '' }]);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="examples-editor">
      {items.map((it, i) => (
        <div key={i} className="examples-editor-row">
          <input placeholder="汉字" value={it.h || ''} onChange={(e) => update(i, 'h', e.target.value)} />
          <input placeholder="pinyin" value={it.p || ''} onChange={(e) => update(i, 'p', e.target.value)} />
          <input placeholder="Nghĩa tiếng Việt" value={it.m || ''} onChange={(e) => update(i, 'm', e.target.value)} />
          <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá từ">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm từ mở rộng
      </button>
    </div>
  );
}

// Editor cho "sub" (từ gốc lồng bên trong 1 thẻ từ, VD "问" là từ gốc của
// "请问") — chỉ 1 cấp, không có sub/wordlist/related/examples riêng.
export function SubEntryEditor({ sub, onChange, onRemove }) {
  function set(field, val) {
    onChange({ ...sub, [field]: val });
  }
  return (
    <div className="sub-entry-editor">
      <div className="vocab-entry-editor-head">
        <span className="sub-label">TỪ GỐC</span>
        <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá từ gốc">
          Xoá từ gốc
        </button>
      </div>
      <CharsEditor chars={sub.chars || []} onChange={(v) => set('chars', v)} />
      <div className="field-row">
        <input placeholder="Pinyin cả từ" value={sub.pinyin || ''} onChange={(e) => set('pinyin', e.target.value)} />
        <input placeholder="Từ loại" value={sub.pos || ''} onChange={(e) => set('pos', e.target.value)} />
      </div>
      <div className="field-row">
        <input placeholder="Nghĩa (tiếng Việt)" value={sub.meaning || ''} onChange={(e) => set('meaning', e.target.value)} />
        <input placeholder="Meaning (English)" value={sub.meaning_en || ''} onChange={(e) => set('meaning_en', e.target.value)} />
      </div>
      <input placeholder="Ghi chú" value={sub.note || ''} onChange={(e) => set('note', e.target.value)} />
    </div>
  );
}

function EntryCard({ entry, onChange, onRemove }) {
  function set(field, val) {
    onChange({ ...entry, [field]: val });
  }
  return (
    <div className="vocab-entry-editor">
      <div className="vocab-entry-editor-head">
        <input
          className="entry-num-input"
          type="number"
          placeholder="#"
          value={entry.num}
          onChange={(e) => set('num', e.target.value === '' ? '' : Number(e.target.value))}
        />
        <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá thẻ này">
          Xoá thẻ
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
      <input
        placeholder="Ghi chú (âm Hán Việt...)"
        value={entry.note || ''}
        onChange={(e) => set('note', e.target.value)}
      />

      <div className="sub-label">VÍ DỤ</div>
      <TripleTupleEditor
        items={entry.examples || []}
        onChange={(v) => set('examples', v)}
        placeholders={['例句 汉字', 'pinyin', 'Nghĩa tiếng Việt']}
        addLabel="+ Thêm ví dụ"
      />

      <div className="sub-label">TỪ MỞ RỘNG (WORDLIST)</div>
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

export default function VocabListEditor({ label, entries, onChange }) {
  function update(i, val) {
    onChange(entries.map((e, idx) => (idx === i ? val : e)));
  }
  function add() {
    onChange([...entries, emptyEntry()]);
  }
  function remove(i) {
    onChange(entries.filter((_, idx) => idx !== i));
  }

  return (
    <div className="vocab-list-editor">
      <label>{label}</label>
      {entries.map((entry, i) => (
        <EntryCard key={i} entry={entry} onChange={(v) => update(i, v)} onRemove={() => remove(i)} />
      ))}
      <button type="button" className="btn-secondary" onClick={add}>
        + Thêm từ
      </button>
    </div>
  );
}
