import FileUploadField from '../../ui/FileUploadField';
import { formatDuration } from '../../LessonAudioGroup';

const CATEGORY_LABEL = {
  vocab: '生词 · File nghe Từ mới',
  text: '课文 · File nghe Bài khóa',
  phonetics: '语音 · File nghe Ngữ âm',
  practice: '练习 · File nghe Luyện tập',
};

function readDuration(url) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
    audio.addEventListener('error', () => resolve(null));
    audio.src = url;
  });
}

// Section file nghe cho đúng 1 danh mục (category), style giống hệt
// LessonAudioGroup ở trang xem, nhưng nhãn/mã file có thể sửa và thời lượng tự
// đọc lại từ file khi upload xong.
export default function AudioSectionEditor({ category, tracks, onChange }) {
  function update(i, field, val) {
    onChange(tracks.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)));
  }
  async function handleUpload(i, url) {
    update(i, 'audioUrl', url);
    if (url) {
      const duration = await readDuration(url);
      if (duration) update(i, 'durationSec', duration);
    }
  }
  function add() {
    onChange([...tracks, { category, label: '', audioUrl: '', code: '', durationSec: null }]);
  }
  function remove(i) {
    onChange(tracks.filter((_, idx) => idx !== i));
  }

  return (
    <div className="section-audio-group">
      <div className="section-audio-title">
        <span className="section-audio-badge">🔊</span>
        <div>
          <strong>{CATEGORY_LABEL[category] || 'File nghe'}</strong>
          <span>Nghe trực tiếp trước khi học nội dung bên dưới</span>
        </div>
      </div>
      <div className="embedded-audio-grid section-audio-grid">
        {tracks.map((t, i) => (
          <article key={i} className="embedded-audio-track embedded-audio-track-edit">
            <div className="embedded-audio-track-head">
              <span className="embedded-audio-icon">汉</span>
              <div className="embedded-audio-meta">
                <input
                  className="embedded-audio-label-input"
                  placeholder={`Track ${i + 1}`}
                  value={t.label || ''}
                  onChange={(e) => update(i, 'label', e.target.value)}
                />
                <span className="embedded-audio-track-sub">
                  {t.durationSec ? `Thời lượng ${formatDuration(t.durationSec)}` : 'Chưa rõ thời lượng'}
                  {' · '}
                  <input
                    className="embedded-audio-code-input"
                    placeholder="Mã file, VD: 04-3"
                    value={t.code || ''}
                    onChange={(e) => update(i, 'code', e.target.value)}
                  />
                </span>
              </div>
              <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá file nghe">
                ×
              </button>
            </div>
            <FileUploadField value={t.audioUrl} onChange={(url) => handleUpload(i, url)} folder="audio" accept="audio/*" previewKind="audio" />
          </article>
        ))}
      </div>
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm file nghe
      </button>
    </div>
  );
}
