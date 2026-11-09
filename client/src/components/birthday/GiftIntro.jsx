import { useEffect, useRef, useState } from 'react';
import { BDAY, COLORS } from './data';
import { audio, centerOf, popSound } from './utils';

// Màn 1: hộp quà → bóng bay mang chữ cái tên, nổ bóng rơi ra lời chúc
export default function GiftIntro({ fx, onOpen, onNext }) {
  const ref = useRef(null);
  const giftRef = useRef(null);
  const [phase, setPhase] = useState('closed'); // closed → open → launched → flying
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [popped, setPopped] = useState([]);
  const [complete, setComplete] = useState(false);
  const [wishes, setWishes] = useState([]);
  const n = BDAY.balloons.length;

  useEffect(() => {
    const el = ref.current;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bóng vừa được tạo ở vị trí hộp quà → frame sau mới bay tới vị trí đích (để có transition)
  useEffect(() => {
    if (phase !== 'launched') return undefined;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setPhase('flying'));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [phase]);

  useEffect(() => {
    if (popped.length !== n || complete) return undefined;
    const t = setTimeout(() => {
      setComplete(true);
      fx.rain(220);
    }, 450);
    return () => clearTimeout(t);
  }, [popped.length, n, complete, fx]);

  function open() {
    if (phase !== 'closed') return;
    audio();
    setPhase('open');
    onOpen?.();
    const [x, y] = centerOf(giftRef.current);
    fx.burst(x, y, 90, { speed: 10, lift: 4 });
    setTimeout(() => setPhase('launched'), 650);
  }

  function pop(e, i) {
    if (popped.includes(i)) return;
    popSound();
    const [x, y] = centerOf(e.currentTarget.querySelector('.bd-b-body'));
    fx.burst(x, y, 22, { colors: [COLORS[i % COLORS.length], '#fff', '#FFCF5C'], speed: 6, lift: 1, max: 70 });
    const ir = ref.current.getBoundingClientRect();
    const id = `${Date.now()}-${i}`;
    const wx = Math.min(Math.max(x - ir.left, 120), ir.width - 120);
    setWishes((w) => [...w, { id, text: BDAY.balloons[i][1], x: wx, y: y - ir.top }]);
    setTimeout(() => setWishes((w) => w.filter((it) => it.id !== id)), 2900);
    setPopped((p) => [...p, i]);
  }

  const opened = phase !== 'closed';
  const flying = phase === 'flying';
  const showBalloons = phase === 'launched' || flying;
  // Tên dài (> 6 chữ) thì xếp bóng thành 2 hàng
  const perRow = n > 6 ? Math.ceil(n / 2) : n;
  const sp = Math.min(size.w / (perRow + 1.2), 110);
  const bw = Math.max(40, Math.min(72, sp - 10));
  const target = (i) => {
    const row = i < perRow ? 0 : 1;
    const inRow = row ? n - perRow : perRow;
    const idx = row ? i - perRow : i;
    return {
      left: size.w / 2 + (idx - (inRow - 1) / 2) * sp,
      top: size.h * (n > perRow ? (row ? 0.53 : 0.37) : 0.42),
    };
  };

  return (
    <section className={`bd-intro ${opened ? 'bd-opened' : ''}`} ref={ref} style={{ '--bw': `${bw}px` }}>
      <div className="bd-stars" />
      <div className="bd-dawn" />

      <header className="bd-head">
        <p className="bd-kicker">Chúc mừng sinh nhật</p>
        <div
          className={`bd-slots ${complete ? 'bd-complete' : ''}`}
          aria-label={BDAY.name}
          style={n > 5 ? { fontSize: `clamp(28px, ${Math.round(70 / n)}vw, 64px)` } : undefined}
        >
          {BDAY.balloons.map(([ch], i) => (
            <span key={i} className={`bd-slot ${popped.includes(i) ? 'bd-filled' : ''}`}>
              {ch}
            </span>
          ))}
        </div>
      </header>

      <div className="bd-gift-wrap">
        <div className="bd-gift-glow" />
        <button className="bd-gift" ref={giftRef} onClick={open} aria-label="Mở hộp quà">
          <span className="bd-gift-lid">
            <span className="bd-bow" />
          </span>
          <span className="bd-gift-box" />
        </button>
      </div>

      {showBalloons &&
        BDAY.balloons.map(([ch], i) => (
          <button
            key={i}
            className={`bd-balloon ${popped.includes(i) ? 'bd-popped' : ''}`}
            aria-label={`Bóng bay chữ ${ch}`}
            onClick={(e) => pop(e, i)}
            style={{
              left: flying ? target(i).left : size.w / 2,
              top: flying ? target(i).top : size.h * 0.84,
              '--s': flying ? 1 : 0.15,
              '--c': COLORS[i % COLORS.length],
              '--d': `${-i * 0.9}s`,
              transitionDelay: `${i * 0.09}s`,
            }}
          >
            <span className="bd-b-inner">
              <span className="bd-b-body">{ch}</span>
              <span className="bd-b-string" />
            </span>
          </button>
        ))}

      {wishes.map((w) => (
        <div key={w.id} className="bd-wish" style={{ left: w.x, top: w.y }}>
          {w.text}
        </div>
      ))}

      <p className="bd-hint">
        {!opened && (
          <>
            Có quà cho <b>{BDAY.name}</b> nè 🎁
            <br />
            <small>Chạm vào hộp quà để mở</small>
          </>
        )}
        {opened && !complete && (
          <>
            Bấm vào từng quả bóng nhé 🎈
            <br />
            <small>mỗi quả giấu một lời chúc</small>
          </>
        )}
        {complete && (
          <>
            <b>Sinh nhật vui vẻ nha {BDAY.name}! 🥳</b>
            <br />
            <small>Cuộn xuống, còn nhiều bất ngờ nữa ↓</small>
          </>
        )}
      </p>
      <button className="bd-scroll-cue" onClick={onNext}>
        Cuộn xuống, còn nhiều bất ngờ ↓
      </button>
    </section>
  );
}
