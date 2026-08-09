// Editor cho field kiểu string[] đơn giản (câu hỏi, bài tập về nhà, syllable...).
export default function StringListEditor({ items, onChange, addLabel = '+ Thêm', placeholder, multiline }) {
  function update(i, val) {
    onChange(items.map((it, idx) => (idx === i ? val : it)));
  }
  function add() {
    onChange([...items, '']);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  const Field = multiline ? 'textarea' : 'input';

  return (
    <div className="string-list-editor">
      {items.map((it, i) => (
        <div key={i} className="string-list-editor-row">
          <Field placeholder={placeholder} value={it} onChange={(e) => update(i, e.target.value)} />
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
