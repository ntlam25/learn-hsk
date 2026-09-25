import { useState } from 'react';
import api from '../../../api/client';

// Chọn nhiều ảnh trang sách một lần: tải lần lượt lên Storage, số trang lấy theo số cuối trong tên file
// (vd. "trang-36.jpg" → 36), không có số thì nối tiếp trang cuối.
export default function BulkPageUpload({ nextPageNumber, onUploaded }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    e.target.value = '';
    if (!files.length) return;
    setError('');
    let next = nextPageNumber;
    for (let i = 0; i < files.length; i++) {
      setProgress(`Đang tải ${i + 1}/${files.length}…`);
      const file = files[i];
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', 'book-pages');
        const res = await api.post('/admin/uploads', form);
        const m = file.name.match(/(\d+)(?!.*\d)/);
        const pageNumber = m ? Number(m[1]) : next;
        next = pageNumber + 1;
        onUploaded({ pageNumber, imageUrl: res.data.url, caption: '' });
      } catch (err) {
        setError(`${file.name}: ${err.response?.data?.message || 'tải lên thất bại'}`);
      }
    }
    setProgress(null);
  }

  return (
    <span className="be-bulk-upload">
      <label className="be-add">
        {progress || '⇪ Tải nhiều ảnh trang cùng lúc'}
        <input type="file" accept="image/*" multiple hidden disabled={!!progress} onChange={handleFiles} />
      </label>
      {error ? <span className="field-error">{error}</span> : null}
    </span>
  );
}
