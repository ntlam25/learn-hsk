export default function PdfLightbox({ pages, index, onClose, onNavigate }) {
  if (index == null || !pages[index]) return null;
  const page = pages[index];

  return (
    <div className={'pdf-lightbox' + (index != null ? ' open' : '')} onClick={onClose}>
      <button className="pdf-lightbox-close" onClick={onClose} aria-label="Đóng">
        ✕
      </button>
      <div className="pdf-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        {index > 0 && (
          <button className="pdf-lightbox-nav prev" onClick={() => onNavigate(index - 1)} aria-label="Trang trước">
            ‹
          </button>
        )}
        <img src={page.imageUrl} alt={page.caption || `Trang ${page.pageNumber}`} />
        {index < pages.length - 1 && (
          <button className="pdf-lightbox-nav next" onClick={() => onNavigate(index + 1)} aria-label="Trang sau">
            ›
          </button>
        )}
      </div>
      {page.caption ? <div className="pdf-lightbox-caption">{page.caption}</div> : null}
    </div>
  );
}
