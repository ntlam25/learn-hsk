import { useEffect, useMemo, useRef } from 'react';
import { BDAY } from './data';
import Photo from './Photo';

const ITEM_W = 212; // 184px ảnh + 28px khoảng cách (khớp với họa tiết dây trong CSS)

// Kết thúc: dây ảnh tràn viền chạy vô tận + nút xem lại
export default function Finale({ photos, onOpen, onAgain }) {
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 900);
    return () => clearTimeout(t);
  }, []);

  // Một "vòng" phải rộng hơn màn hình lớn, rồi nhân đôi để translateX(-50%) lặp liền mạch
  const { items, dur } = useMemo(() => {
    if (!photos.length) return { items: [], dur: 40 };
    const reps = Math.max(1, Math.ceil(2200 / (photos.length * ITEM_W)));
    const one = Array.from({ length: reps }, () => photos.map((p, i) => ({ p, i }))).flat();
    return { items: [...one, ...one], dur: (one.length * ITEM_W) / 45 }; // ~45px/giây
  }, [photos]);

  return (
    <div className="bd-finale" ref={ref}>
      <p className="bd-finale-title">Tuổi mới rực rỡ nha {BDAY.name}! 💗</p>
      {items.length > 0 && (
        <div className="bd-finale-strip">
          <div className="bd-finale-track" style={{ '--dur': `${dur}s` }}>
            {items.map(({ p, i }, k) => (
              <figure key={k} className="bd-pol" style={{ '--d': `${-k * 0.7}s` }} onClick={() => onOpen(i)}>
                <Photo p={p} />
                <figcaption>{p.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
      <div className="bd-end-actions">
        <button className="bd-btn" onClick={onAgain}>
          ↺ Xem lại từ đầu
        </button>
      </div>
    </div>
  );
}
