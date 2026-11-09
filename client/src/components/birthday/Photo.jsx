import { useState } from 'react';
import { BDAY } from './data';

/** Ảnh thật nếu có src, nếu chưa có / lỗi thì hiện ô màu + emoji. */
export default function Photo({ p }) {
  const [broken, setBroken] = useState(false);
  if (p.src && !broken) {
    return (
      <div className="bd-ph">
        <img src={p.src} alt={p.cap || `Ảnh của ${BDAY.name}`} loading="lazy" onError={() => setBroken(true)} />
      </div>
    );
  }
  return (
    <div className="bd-ph" style={{ background: `linear-gradient(135deg, ${p.bg[0]}, ${p.bg[1]})` }}>
      <span className="bd-emo">{p.emo}</span>
    </div>
  );
}
