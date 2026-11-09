import { useEffect, useMemo, useRef, useState } from 'react';
import { BDAY } from './data';
import Reveal from './Reveal';
import { audio, birthdayInfo, centerOf, popSound, prefersReducedMotion } from './utils';

// Màn 6: mở phong thư → thư hiện dần như viết tay → xong thì báo onFinish
export default function FinalLetter({ fx, onFinish }) {
  const [stage, setStage] = useState('closed'); // closed → open → gone → letter
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const signRef = useRef(null);
  const { age } = birthdayInfo();
  const chars = useMemo(() => Array.from(BDAY.letter.replace('{age}', age)), [age]);

  function openEnvelope() {
    if (stage !== 'closed') return;
    audio();
    setStage('open');
    setTimeout(() => setStage('gone'), 1300);
    setTimeout(() => setStage('letter'), 1850);
  }

  // Gõ từng ký tự
  useEffect(() => {
    if (stage !== 'letter' || done) return undefined;
    if (prefersReducedMotion() || count >= chars.length) {
      setDone(true);
      return undefined;
    }
    const ch = chars[count - 1];
    const delay = count === 0 ? 0 : ch === '\n' ? 220 : /[,.!?]/.test(ch) ? 170 : 34;
    const t = setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [stage, count, done, chars]);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => {
      const [x, y] = centerOf(signRef.current);
      fx.burst(x, y, 70, { colors: ['#F2789F', '#E0527F', '#FFB59E'], speed: 7 });
      popSound();
      onFinish?.();
    }, 600);
    return () => clearTimeout(t);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const envClass = ['bd-env', stage !== 'closed' && 'bd-open', (stage === 'gone' || stage === 'letter') && 'bd-gone']
    .filter(Boolean)
    .join(' ');

  return (
    <section className="bd-scene">
      <Reveal>
        <p className="bd-eyebrow">Cuối cùng là…</p>
        <h2 className="bd-title">Một lá thư cho {BDAY.name}</h2>
      </Reveal>

      {stage !== 'letter' ? (
        <Reveal className="bd-env-zone">
          <button className={envClass} onClick={openEnvelope} aria-label="Mở thư">
            <span className="bd-env-back" />
            <span className="bd-env-peek" />
            <span className="bd-env-front" />
            <span className="bd-env-flap" />
            <span className="bd-env-seal">💌</span>
            <span className="bd-env-label">Gửi {BDAY.name}</span>
          </button>
        </Reveal>
      ) : (
        <article className="bd-letter">
          {!done && (
            <button className="bd-skip" onClick={() => setDone(true)}>
              Hiện hết ›
            </button>
          )}
          <p className={`bd-letter-text ${done ? '' : 'bd-typing'}`}>
            {done ? chars.join('') : chars.slice(0, count).join('')}
          </p>
          <p ref={signRef} className={`bd-letter-sign ${done ? 'bd-show' : ''}`}>
            {BDAY.signature}
          </p>
        </article>
      )}
    </section>
  );
}
