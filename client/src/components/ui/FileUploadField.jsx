import { useState } from 'react';
import api from '../../api/client';

function fileNameFromUrl(url) {
  try {
    return decodeURIComponent(url.split('/').pop().split('?')[0]);
  } catch {
    return url;
  }
}

function FilePreview({ kind, url }) {
  if (kind === 'image') return <img className="ui-file-upload-preview-img" src={url} alt="" />;
  if (kind === 'audio') return <audio className="ui-file-upload-preview-audio" controls src={url} />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="ui-file-upload-preview-link">
      {fileNameFromUrl(url)}
    </a>
  );
}

export default function FileUploadField({ value, onChange, folder, accept, label, previewKind = 'none' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      const res = await api.post('/admin/uploads', formData);
      onChange(res.data.url, res.data); // res.data có size/mimeType để hiển thị dung lượng file
    } catch (err) {
      setError(err.response?.data?.message || 'Tải file lên thất bại.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="ui-file-upload">
      {label && <label>{label}</label>}
      {value && <FilePreview kind={previewKind} url={value} />}
      <div className="ui-file-upload-controls">
        <label className="btn-secondary ui-file-upload-picker">
          {uploading ? 'Đang tải lên…' : value ? 'Đổi file…' : 'Chọn file…'}
          <input type="file" accept={accept} hidden onChange={handleFileChange} disabled={uploading} />
        </label>
        {value && (
          <button type="button" className="btn-icon-danger" title="Xoá file" onClick={() => onChange('')}>
            ×
          </button>
        )}
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
