function CountryListEditor({ countries, onChange }) {
  function update(i, field, val) {
    onChange(countries.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));
  }
  function add() {
    onChange([...countries, { h: '', p: '', m: '' }]);
  }
  function remove(i) {
    onChange(countries.filter((_, idx) => idx !== i));
  }

  return (
    <div className="examples-editor">
      {countries.map((c, i) => (
        <div key={i} className="examples-editor-row">
          <input placeholder="汉字" value={c.h || ''} onChange={(e) => update(i, 'h', e.target.value)} />
          <input placeholder="pinyin" value={c.p || ''} onChange={(e) => update(i, 'p', e.target.value)} />
          <input placeholder="Nghĩa tiếng Việt" value={c.m || ''} onChange={(e) => update(i, 'm', e.target.value)} />
          <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm quốc gia
      </button>
    </div>
  );
}

function ExtensionListEditor({ extensions, onChange }) {
  function update(i, idx2, val) {
    onChange(
      extensions.map((ex, i2) => {
        if (i2 !== i) return ex;
        const copy = [...ex];
        copy[idx2] = val;
        return copy;
      })
    );
  }
  function add() {
    onChange([...extensions, ['', '', '']]);
  }
  function remove(i) {
    onChange(extensions.filter((_, idx) => idx !== i));
  }

  return (
    <div className="examples-editor">
      {extensions.map((ex, i) => (
        <div key={i} className="examples-editor-row">
          <input placeholder="汉字" value={ex[0] || ''} onChange={(e) => update(i, 0, e.target.value)} />
          <input placeholder="pinyin" value={ex[1] || ''} onChange={(e) => update(i, 1, e.target.value)} />
          <input placeholder="Nghĩa tiếng Việt" value={ex[2] || ''} onChange={(e) => update(i, 2, e.target.value)} />
          <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá">
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

export default function ExtraEditor({ extra, onChange }) {
  const countries = extra?.countries || [];
  const extensions = extra?.extensions || [];

  function set(field, val) {
    onChange({ ...extra, [field]: val });
  }

  return (
    <div className="extra-editor">
      <div className="sub-label">BẢNG TÊN CÁC NƯỚC</div>
      <CountryListEditor countries={countries} onChange={(v) => set('countries', v)} />

      <div className="sub-label">TỪ MỞ RỘNG (extra.extensions)</div>
      <ExtensionListEditor extensions={extensions} onChange={(v) => set('extensions', v)} />
    </div>
  );
}
