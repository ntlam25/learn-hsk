import { useEffect, useState } from 'react';
import api from '../api/client';

const FOLDER_OPTIONS = [
  { value: 'images', label: 'Ảnh minh hoạ' },
  { value: 'book-pages', label: 'Ảnh trang sách' },
  { value: 'audio', label: 'Audio' },
  { value: 'documents', label: 'PDF trang sách' },
];

/**
 * Tải ảnh/audio lên Supabase Storage qua API backend (POST /api/admin/uploads,
 * multipart/form-data), liệt kê file đã có trong từng thư mục (GET) và cho xoá
 * (DELETE). Sau khi tải xong hiện URL public để copy, dán vào các field JSON
 * khác (ví dụ extra.images, extra.audio) trong form soạn bài học.
 */
export default function MediaUploader() {
  const [folder, setFolder] = useState('images');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copiedPath, setCopiedPath] = useState('');

  function loadFiles(f) {
    setLoading(true);
    setError('');
    api
      .get('/admin/uploads', { params: { folder: f } })
      .then((res) => setFiles(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Không tải được danh sách file.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFiles(folder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file lần sau
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      await api.post('/admin/uploads', formData);
      loadFiles(folder);
    } catch (err) {
      setError(err.response?.data?.message || 'Tải file lên thất bại.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Xoá file "${item.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete('/admin/uploads', { data: { path: item.path } });
      setFiles((list) => list.filter((f) => f.path !== item.path));
    } catch (err) {
      alert(err.response?.data?.message || 'Xoá thất bại.');
    }
  }

  function copyUrl(item) {
    navigator.clipboard?.writeText(item.url);
    setCopiedPath(item.path);
    setTimeout(() => setCopiedPath(''), 1500);
  }

  return (
    <div className="media-uploader">
      <label>Ảnh / audio trên Supabase Storage</label>
      <p className="field-hint">
        Bấm "Copy URL" rồi dán vào ô JSON "Dữ liệu mở rộng" (ví dụ field <code>extra.images</code> hoặc{' '}
        <code>extra.audio</code>) để gắn vào bài học.
      </p>

      <div className="media-uploader-controls">
        <select value={folder} onChange={(e) => setFolder(e.target.value)}>
          {FOLDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="btn-secondary media-uploader-picker">
          {uploading ? 'Đang tải lên…' : 'Chọn file…'}
          <input type="file" hidden onChange={handleFileChange} disabled={uploading} />
        </label>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {loading && <div className="field-hint">Đang tải danh sách…</div>}

      {!loading && files.length === 0 && !error && (
        <div className="field-hint">Chưa có file nào trong thư mục này.</div>
      )}

      {files.length > 0 && (
        <ul className="media-uploader-list">
          {files.map((item) => (
            <li key={item.path}>
              <span className="media-uploader-name">{item.name}</span>
              <code className="media-uploader-url">{item.url}</code>
              <button type="button" className="btn-ghost-sm" onClick={() => copyUrl(item)}>
                {copiedPath === item.path ? 'Đã copy ✓' : 'Copy URL'}
              </button>
              <button type="button" className="btn-icon-danger" title="Xoá file" onClick={() => handleDelete(item)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
