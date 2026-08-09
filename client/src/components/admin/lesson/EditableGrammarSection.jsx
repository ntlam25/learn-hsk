// Nội dung tab 语法 · Ngữ pháp: danh sách thẻ .grammar-item giống trang xem
// (GrammarList.jsx), tiêu đề/nội dung sửa trực tiếp qua input/textarea.
export default function EditableGrammarSection({ lesson, setField }) {
  const items = lesson.grammar || [];

  function update(i, field, val) {
    setField('grammar', items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  }
  function add() {
    setField('grammar', [...items, { title: '', content: '' }]);
  }
  function remove(i) {
    setField('grammar', items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="ex-block">
      <h3>语法 · Ngữ pháp trọng tâm</h3>
      <div className="grammar-list">
        {items.map((it, i) => (
          <div key={i} className="grammar-item grammar-item-edit">
            <div className="mini-note-edit-head">
              <input placeholder="Tiêu đề" value={it.title || ''} onChange={(e) => update(i, 'title', e.target.value)} />
              <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá mục">
                ×
              </button>
            </div>
            <textarea className="reading-box reading-box-input" placeholder="Nội dung" value={it.content || ''} onChange={(e) => update(i, 'content', e.target.value)} />
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary section-add-btn" onClick={add}>
        + Thêm mục ngữ pháp
      </button>
    </div>
  );
}
