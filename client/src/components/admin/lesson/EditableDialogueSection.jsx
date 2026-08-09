import Select from '../../ui/Select';

const LINE_KIND_OPTIONS = [
  { value: 'line', label: 'Lời thoại' },
  { value: 'loc', label: 'Vị trí' },
  { value: 'gap', label: 'Khoảng trống' },
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

function DialogueLineEditor({ line, index, onChange, onRemove }) {
  const kind = lineKindOf(line);
  function setField(field, val) {
    onChange({ ...line, [field]: val });
  }
  function changeKind(nextKind) {
    if (nextKind === 'gap') onChange({ gap: true });
    else if (nextKind === 'loc') onChange({ loc: '' });
    else onChange({ role: '', text: '', py: '' });
  }

  if (kind === 'loc') {
    return (
      <div className="location-divider location-divider-edit">
        <input placeholder="Vị trí (VD: tại thư viện)" value={line.loc || ''} onChange={(e) => setField('loc', e.target.value)} />
        <Select value={kind} onChange={changeKind} options={LINE_KIND_OPTIONS} />
        <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá dòng">
          ×
        </button>
      </div>
    );
  }
  if (kind === 'gap') {
    return (
      <div className="dlg-gap dlg-gap-edit">
        <Select value={kind} onChange={changeKind} options={LINE_KIND_OPTIONS} />
        <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá dòng">
          ×
        </button>
      </div>
    );
  }
  const side = line.side || (index % 2 === 0 ? 'A' : 'B');
  return (
    <div className={`dlg-line dlg-line-edit side-${side}`}>
      <input className={`dlg-avatar dlg-avatar-input ${side}`} value={line.role || ''} onChange={(e) => setField('role', e.target.value)} placeholder="?" />
      <div className="dlg-bubble">
        <input className="dlg-text-input" placeholder="Câu thoại (chữ Hán)" value={line.text || ''} onChange={(e) => setField('text', e.target.value)} />
        <input className="dlg-pinyin-input" placeholder="Pinyin" value={line.py || ''} onChange={(e) => setField('py', e.target.value)} />
        <div className="dlg-line-controls">
          <Select value={kind} onChange={changeKind} options={LINE_KIND_OPTIONS} />
          <Select value={line.side || ''} onChange={(v) => setField('side', v)} options={SIDE_OPTIONS} />
          <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá dòng">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function DialogueCardEditor({ dialogue, onChange, onRemove }) {
  const lines = dialogue.lines || [];
  function updateLine(i, val) {
    onChange({ ...dialogue, lines: lines.map((l, idx) => (idx === i ? val : l)) });
  }
  function addLine() {
    onChange({ ...dialogue, lines: [...lines, { role: '', text: '', py: '' }] });
  }
  function removeLine(i) {
    onChange({ ...dialogue, lines: lines.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="dialogue-card dialogue-card-edit">
      <div className="vocab-entry-editor-head">
        <input
          className="dialogue-title-input"
          placeholder="Tiêu đề hội thoại"
          value={dialogue.title || ''}
          onChange={(e) => onChange({ ...dialogue, title: e.target.value })}
        />
        <button type="button" className="btn-icon-danger" onClick={onRemove} title="Xoá hội thoại">
          Xoá hội thoại
        </button>
      </div>
      {lines.map((line, i) => (
        <DialogueLineEditor key={i} line={line} index={i} onChange={(v) => updateLine(i, v)} onRemove={() => removeLine(i)} />
      ))}
      <button type="button" className="btn-ghost-sm" onClick={addLine}>
        + Thêm dòng
      </button>
    </div>
  );
}

// Nội dung tab 课文 · Bài khóa: các thẻ hội thoại kiểu bong bóng chat giống
// DialogueBlock ở trang xem, nhưng mỗi dòng là input có thể sửa trực tiếp.
export default function EditableDialogueSection({ lesson, setField }) {
  const dialogues = lesson.dialogues || [];

  function update(i, val) {
    setField('dialogues', dialogues.map((d, idx) => (idx === i ? val : d)));
  }
  function add() {
    setField('dialogues', [...dialogues, { title: '', lines: [] }]);
  }
  function remove(i) {
    setField('dialogues', dialogues.filter((_, idx) => idx !== i));
  }

  return (
    <>
      {dialogues.map((d, i) => (
        <DialogueCardEditor key={i} dialogue={d} onChange={(v) => update(i, v)} onRemove={() => remove(i)} />
      ))}
      <button type="button" className="btn-secondary section-add-btn" onClick={add}>
        + Thêm hội thoại
      </button>
    </>
  );
}
