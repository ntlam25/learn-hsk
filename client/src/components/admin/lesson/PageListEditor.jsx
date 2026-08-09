import FileUploadField from '../../ui/FileUploadField';

export default function PageListEditor({ pages, onChange }) {
  function update(i, field, val) {
    onChange(pages.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));
  }
  function add() {
    const nextNumber = pages.reduce((max, p) => Math.max(max, Number(p.pageNumber) || 0), 0) + 1;
    onChange([...pages, { pageNumber: nextNumber, imageUrl: '', caption: '' }]);
  }
  function remove(i) {
    onChange(pages.filter((_, idx) => idx !== i));
  }

  return (
    <div className="page-list-editor">
      {pages.map((p, i) => (
        <div key={i} className="vocab-entry-editor">
          <div className="vocab-entry-editor-head">
            <input
              className="entry-num-input"
              type="number"
              placeholder="Trang #"
              value={p.pageNumber}
              onChange={(e) => update(i, 'pageNumber', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá trang">
              Xoá trang
            </button>
          </div>
          <FileUploadField
            value={p.imageUrl}
            onChange={(url) => update(i, 'imageUrl', url)}
            folder="book-pages"
            accept="image/*"
            previewKind="image"
          />
          <input placeholder="Chú thích (tuỳ chọn)" value={p.caption || ''} onChange={(e) => update(i, 'caption', e.target.value)} />
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={add}>
        + Thêm trang
      </button>
    </div>
  );
}
