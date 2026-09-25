import { useEffect } from 'react';

// Trình xem trang sách toàn màn hình (#pdfPageLightbox của giáo trình): bấm ảnh/nền/× hoặc Esc để đóng.
export default function PageLightbox({ page, onClose }) {
  useEffect(() => {
    if (!page) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [page, onClose]);

  if (!page) return null;

  function handleClick(e) {
    const t = e.target;
    if (t === e.currentTarget || t.classList.contains('pdf-lightbox-inner') || t.tagName === 'IMG') onClose();
  }

  return (
    <div id="pdfPageLightbox" className="pdf-lightbox open" aria-hidden="false" onClick={handleClick}>
      <button className="pdf-lightbox-close" type="button" aria-label="Đóng" onClick={onClose}>
        ×
      </button>
      <div className="pdf-lightbox-inner">
        <img alt={page.alt || 'Trang PDF phóng to'} src={page.src} />
      </div>
      <div className="pdf-lightbox-caption">{page.caption || 'Trang PDF'}</div>
    </div>
  );
}
