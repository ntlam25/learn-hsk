import { useState } from 'react';
import PdfLightbox from './PdfLightbox';

export default function LessonPagesViewer({ pages = [], sourcePdfUrl }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!pages.length && !sourcePdfUrl) return null;

  return (
    <div className="lesson-pages-viewer">
      {sourcePdfUrl && (
        <div className="pdf-view-hint">
          <a href={sourcePdfUrl} target="_blank" rel="noreferrer" className="btn-secondary">
            📄 Xem/Tải PDF trang sách gốc
          </a>
        </div>
      )}

      {pages.length > 0 && (
        <div className="lesson-pages-strip">
          {pages.map((p, i) => (
            <button key={p.id || i} className="lesson-page-thumb" onClick={() => setOpenIndex(i)}>
              <img src={p.imageUrl} alt={p.caption || `Trang ${p.pageNumber}`} />
            </button>
          ))}
        </div>
      )}

      <PdfLightbox pages={pages} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </div>
  );
}
