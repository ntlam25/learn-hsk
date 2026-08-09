// Nội dung tab 语音 · Ngữ âm: lưới thẻ ghi chú kiểu .mini-note giống trang xem
// (PhoneticsNotes.jsx), tiêu đề/nội dung sửa trực tiếp qua input/textarea.
export default function EditablePhoneticsSection({ lesson, setField }) {
  const notes = lesson.phoneticsNotes || [];

  function update(i, field, val) {
    setField('phoneticsNotes', notes.map((n, idx) => (idx === i ? { ...n, [field]: val } : n)));
  }
  function add() {
    setField('phoneticsNotes', [...notes, { title: '', content: '' }]);
  }
  function remove(i) {
    setField('phoneticsNotes', notes.filter((_, idx) => idx !== i));
  }

  return (
    <div className="ex-block">
      <h3>语音笔记 · Ghi chú ngữ âm</h3>
      <div className="mini-note-grid">
        {notes.map((n, i) => (
          <div key={i} className="mini-note mini-note-edit">
            <div className="mini-note-edit-head">
              <input placeholder="Tiêu đề" value={n.title || ''} onChange={(e) => update(i, 'title', e.target.value)} />
              <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá mục">
                ×
              </button>
            </div>
            <textarea placeholder="Nội dung" value={n.content || ''} onChange={(e) => update(i, 'content', e.target.value)} />
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary section-add-btn" onClick={add}>
        + Thêm ghi chú ngữ âm
      </button>
    </div>
  );
}
