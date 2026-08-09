// Editor dùng chung cho các mảng {title, content} — phoneticsNotes và grammar.
export default function TitledEntryListEditor({ items, onChange, addLabel = '+ Thêm mục' }) {
  function update(i, field, val) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  }
  function add() {
    onChange([...items, { title: '', content: '' }]);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="titled-entry-list-editor">
      {items.map((it, i) => (
        <div key={i} className="titled-entry-row">
          <input placeholder="Tiêu đề" value={it.title || ''} onChange={(e) => update(i, 'title', e.target.value)} />
          <textarea placeholder="Nội dung" value={it.content || ''} onChange={(e) => update(i, 'content', e.target.value)} />
          <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá mục">
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
