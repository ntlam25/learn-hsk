const CATEGORY_LABEL = {
  vocab: '生词 · File nghe Từ mới',
  text: '课文 · File nghe Bài khóa',
  phonetics: '语音 · File nghe Ngữ âm',
  practice: '练习 · File nghe Luyện tập',
};

export function formatDuration(sec) {
  if (!sec && sec !== 0) return '';
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LessonAudioGroup({ tracks = [] }) {
  if (!tracks.length) return null;
  return (
    <div className="section-audio-group">
      <div className="section-audio-title">
        <span className="section-audio-badge">🔊</span>
        <div>
          <strong>{CATEGORY_LABEL[tracks[0].category] || 'File nghe'}</strong>
          <span>Nghe trực tiếp trước khi học nội dung bên dưới</span>
        </div>
      </div>
      <div className="embedded-audio-grid section-audio-grid">
        {tracks.map((t, i) => (
          <article key={t.id || i} className="embedded-audio-track">
            <div className="embedded-audio-track-head">
              <span className="embedded-audio-icon">汉</span>
              <div className="embedded-audio-meta">
                <strong>{t.label || `Track ${i + 1}`}</strong>
                {(t.durationSec || t.code) && (
                  <span className="embedded-audio-track-sub">
                    {t.durationSec ? `Thời lượng ${formatDuration(t.durationSec)}` : ''}
                    {t.durationSec && t.code ? ' · ' : ''}
                    {t.code ? `Mã ${t.code}` : ''}
                  </span>
                )}
              </div>
              <span className="embedded-audio-index">{i + 1}</span>
            </div>
            <audio controls preload="none" src={t.audioUrl} />
          </article>
        ))}
      </div>
    </div>
  );
}
