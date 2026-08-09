import Select from '../../ui/Select';

const LINE_KIND_OPTIONS = [
  { value: 'line', label: 'Lời thoại' },
  { value: 'loc', label: 'Vị trí (loc)' },
  { value: 'gap', label: 'Khoảng trống (gap)' },
];

const SIDE_OPTIONS = [
  { value: '', label: 'Tự động' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
];

function lineKindOf(line) {
  if (line.gap) return 'gap';
  if (line.loc !== undefined) return 'loc';
  return 'line';
}

function DialogueLinesEditor({ lines, onChange }) {
  function update(i, val) {
    onChange(lines.map((l, idx) => (idx === i ? val : l)));
  }
  function setField(i, field, val) {
    update(i, { ...lines[i], [field]: val });
  }
  function changeKind(i, kind) {
    if (kind === 'gap') update(i, { gap: true });
    else if (kind === 'loc') update(i, { loc: '' });
    else update(i, { role: '', text: '', py: '' });
  }
  function add() {
    onChange([...lines, { role: '', text: '', py: '' }]);
  }
  function remove(i) {
    onChange(lines.filter((_, idx) => idx !== i));
  }

  return (
    <div className="dialogue-lines-editor">
      {lines.map((line, i) => {
        const kind = lineKindOf(line);
        return (
          <div key={i} className="dialogue-line-row">
            <div className="field-row">
              <Select value={kind} onChange={(v) => changeKind(i, v)} options={LINE_KIND_OPTIONS} />
              <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá dòng">
                ×
              </button>
            </div>
            {kind === 'line' && (
              <>
                <div className="field-row">
                  <input placeholder="Vai (VD: 麦克)" value={line.role || ''} onChange={(e) => setField(i, 'role', e.target.value)} />
                  <Select value={line.side || ''} onChange={(v) => setField(i, 'side', v)} options={SIDE_OPTIONS} />
                </div>
                <input placeholder="Câu thoại (chữ Hán)" value={line.text || ''} onChange={(e) => setField(i, 'text', e.target.value)} />
                <input placeholder="Pinyin" value={line.py || ''} onChange={(e) => setField(i, 'py', e.target.value)} />
              </>
            )}
            {kind === 'loc' && (
              <input placeholder="Vị trí (VD: tại thư viện)" value={line.loc || ''} onChange={(e) => setField(i, 'loc', e.target.value)} />
            )}
          </div>
        );
      })}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm dòng
      </button>
    </div>
  );
}

export default function DialogueListEditor({ dialogues, onChange }) {
  function update(i, val) {
    onChange(dialogues.map((d, idx) => (idx === i ? val : d)));
  }
  function add() {
    onChange([...dialogues, { title: '', lines: [] }]);
  }
  function remove(i) {
    onChange(dialogues.filter((_, idx) => idx !== i));
  }

  return (
    <div className="dialogue-list-editor">
      {dialogues.map((d, i) => (
        <div key={i} className="dialogue-editor-card">
          <div className="vocab-entry-editor-head">
            <input
              placeholder="Tiêu đề hội thoại"
              value={d.title || ''}
              onChange={(e) => update(i, { ...d, title: e.target.value })}
            />
            <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá hội thoại">
              Xoá hội thoại
            </button>
          </div>
          <DialogueLinesEditor lines={d.lines || []} onChange={(v) => update(i, { ...d, lines: v })} />
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={add}>
        + Thêm hội thoại
      </button>
    </div>
  );
}
