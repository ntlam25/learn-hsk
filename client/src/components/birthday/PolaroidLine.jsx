import { useEffect } from 'react';
import { BDAY } from './data';
import Photo from './Photo';
import Reveal from './Reveal';

// Màn 4: ảnh polaroid treo trên dây, vuốt ngang để xem
export default function PolaroidLine({ photos, onOpen }) {
  return (
    <section className="bd-scene">
      <Reveal>
        <p className="bd-eyebrow">Kỷ niệm</p>
        <h2 className="bd-title">Những khoảnh khắc của {BDAY.name}</h2>
      </Reveal>
      <Reveal className="bd-rope-wrap">
        <div className="bd-rope-track">
          {photos.map((p, i) => (
            <figure key={i} className="bd-pol" style={{ '--d': `${-i * 0.7}s` }} onClick={() => onOpen(i)}>
              <Photo p={p} />
              <figcaption>{p.cap}</figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
      <p className="bd-swipe-hint">← Vuốt để xem thêm · chạm vào ảnh để phóng to →</p>
    </section>
  );
}

export function Lightbox({ photos, index, onClose, onNav }) {
  const open = index !== null;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNav(-1);
      if (e.key === 'ArrowRight') onNav(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onNav]);

  if (!photos.length) return null;
  const p = photos[index ?? 0];

  return (
    <div
      className={`bd-lightbox ${open ? 'bd-show' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bd-lb-card">
        <Photo key={index ?? 0} p={p} />
        {p.cap && <h3>{p.cap}</h3>}
        {p.memo && <p>{p.memo}</p>}
        <div className="bd-lb-nav">
          <button onClick={() => onNav(-1)} aria-label="Ảnh trước">‹</button>
          <button className="bd-lb-close" onClick={onClose}>Đóng</button>
          <button onClick={() => onNav(1)} aria-label="Ảnh sau">›</button>
        </div>
      </div>
    </div>
  );
}
