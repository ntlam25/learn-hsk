import { useEffect, useState } from 'react';
import { BDAY } from './data';
import Reveal from './Reveal';
import { birthdayInfo, fmt } from './utils';

// Màn 2: đồng hồ cuộc đời + đếm ngược nếu chưa tới ngày
export default function LifeClock({ id }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const { b, now, next, status, age } = birthdayInfo();
  const ms = now - b;
  const min = ms / 6e4;
  const left = next - now;
  const name = BDAY.name;

  return (
    <section className="bd-scene" id={id}>
      <Reveal>
        <p className="bd-eyebrow">Số liệu cực kỳ khoa học 🔬</p>
        <h2 className="bd-title">{name} đã có mặt trên đời…</h2>
      </Reveal>

      {status === 'upcoming' && (
        <Reveal className="bd-countdown">
          <p>Còn</p>
          <div className="bd-cd-grid">
            <div><b>{Math.floor(left / 864e5)}</b><span>ngày</span></div>
            <div><b>{Math.floor(left / 36e5) % 24}</b><span>giờ</span></div>
            <div><b>{Math.floor(left / 6e4) % 60}</b><span>phút</span></div>
            <div><b>{Math.floor(left / 1e3) % 60}</b><span>giây</span></div>
          </div>
          <p>là tới sinh nhật tuổi <b>{age}</b> của {name} 🎂</p>
        </Reveal>
      )}

      <Reveal className="bd-stats">
        <div className="bd-stat"><b>{fmt(ms / 864e5)}</b><span>ngày</span></div>
        <div className="bd-stat"><b>{fmt(ms / 36e5)}</b><span>giờ</span></div>
        <div className="bd-stat"><b>{fmt(min)}</b><span>phút</span></div>
        <div className="bd-stat"><b>{fmt(ms / 1e3)}</b><span>giây</span></div>
      </Reveal>

      <Reveal as="ul" className="bd-facts">
        <li>❤️ Trái tim đã đập khoảng <b>{fmt(min * 75)}</b> nhịp</li>
        <li>
          ☀️{' '}
          {status === 'upcoming' ? (
            <>Đã đi <b>{age - 1}</b> vòng quanh Mặt Trời, sắp tròn vòng thứ <b>{age}</b></>
          ) : (
            <>Vừa tròn <b>{age}</b> vòng quanh Mặt Trời</>
          )}
        </li>
      </Reveal>

      <Reveal as="p" className="bd-today-line">
        {status === 'today' && '…và hôm nay là ngày đặc biệt nhất trong năm ✨'}
        {status === 'recent' && 'Sinh nhật vừa qua, nhưng lời chúc thì vẫn còn nguyên ✨'}
        {status === 'upcoming' && 'Sắp tới rồi, chuẩn bị tinh thần nha ✨'}
      </Reveal>
    </section>
  );
}
