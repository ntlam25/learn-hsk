import { useCallback, useEffect, useRef, useState } from 'react';
import { BDAY, COLORS } from './data';
import Reveal from './Reveal';
import { audio, birthdayInfo, centerOf, playSong } from './utils';

const TIP = 'Mẹo: chạm vào từng ngọn nến cũng tắt được.';

// Màn 3: bánh kem, số nến = số tuổi; thổi bằng micro / giữ nút / chạm từng nến
export default function CakeCandles({ fx }) {
  const { age } = birthdayInfo();
  const [out, setOut] = useState(() => Array(age).fill(false));
  const [celebrated, setCelebrated] = useState(false);
  const [msg, setMsg] = useState(TIP);
  const [holding, setHolding] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const cakeRef = useRef(null);
  const meterRef = useRef(null);
  const micRef = useRef({ stream: null, raf: 0 });
  const holdRef = useRef(0);
  const litCount = out.filter((o) => !o).length;

  const blowOut = useCallback((k) => {
    setOut((prev) => {
      const lit = prev.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
      if (!lit.length) return prev;
      const nx = [...prev];
      for (let j = 0; j < k && lit.length; j++) nx[lit.splice(Math.floor(Math.random() * lit.length), 1)[0]] = true;
      return nx;
    });
  }, []);

  const stopMic = useCallback(() => {
    const m = micRef.current;
    cancelAnimationFrame(m.raf);
    m.stream?.getTracks().forEach((t) => t.stop());
    m.stream = null;
    setMicOn(false);
  }, []);

  const stopHold = useCallback(() => {
    clearInterval(holdRef.current);
    setHolding(false);
  }, []);

  useEffect(() => () => {
    stopMic();
    clearInterval(holdRef.current);
  }, [stopMic]);

  // Tắt hết nến → ăn mừng
  useEffect(() => {
    if (litCount > 0 || celebrated) return;
    setCelebrated(true);
    stopMic();
    stopHold();
    setMsg('');
    const [x, y] = centerOf(cakeRef.current);
    fx.burst(x, y - 60, 120, { speed: 11, lift: 5 });
    setTimeout(() => fx.rain(160), 350);
    playSong();
  }, [litCount, celebrated, fx, stopMic, stopHold]);

  function relight() {
    setOut(Array(age).fill(false));
    setCelebrated(false);
    setMsg(TIP);
  }

  function lightOff(i) {
    audio();
    setOut((prev) => {
      if (prev[i]) return prev;
      const nx = [...prev];
      nx[i] = true;
      return nx;
    });
  }

  function holdStart(e) {
    e.preventDefault();
    audio();
    setHolding(true);
    blowOut(1);
    clearInterval(holdRef.current);
    holdRef.current = setInterval(() => blowOut(1), 130);
  }

  async function toggleMic() {
    if (micRef.current.stream) {
      stopMic();
      setMsg(TIP);
      return;
    }
    const a = audio();
    try {
      if (!a || !navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      micRef.current.stream = stream;
      setMicOn(true);
      setMsg('Thổi thật mạnh vào micro nhé 💨');
      const an = a.createAnalyser();
      an.fftSize = 1024;
      a.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      let acc = 0;
      const loop = () => {
        if (!micRef.current.stream) return;
        an.getFloatTimeDomainData(buf);
        let s = 0;
        for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        const rms = Math.sqrt(s / buf.length);
        if (meterRef.current) meterRef.current.style.width = `${Math.min(100, rms * 420)}%`;
        if (rms > 0.08) {
          acc += rms;
          if (acc > 0.35) {
            acc = 0;
            blowOut(rms > 0.2 ? 2 : 1);
          }
        } else acc = Math.max(0, acc - 0.02);
        micRef.current.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      stopMic();
      setMsg('Không mở được micro, chạm vào từng ngọn nến hoặc giữ nút "Giữ để thổi" nhé.');
    }
  }

  const back = age > 12 ? Math.ceil(age / 2) : age;
  const rows = age > 12 ? [[0, back], [back, age]] : [[0, age]];

  return (
    <section className="bd-scene">
      <Reveal>
        <p className="bd-eyebrow">Ước đi nào</p>
        <h2 className="bd-title">Thổi nến thôi!</h2>
        <p className="bd-lead">
          {celebrated ? (
            <>Điều ước của {BDAY.name} đã được gửi lên trời rồi ✨</>
          ) : (
            <>Nhắm mắt, ước một điều thật to, rồi thổi tắt <b>{litCount}</b> ngọn nến nhé!</>
          )}
        </p>
      </Reveal>

      <Reveal className="bd-cake-stage">
        <div className="bd-cake" ref={cakeRef}>
          <div className="bd-candles">
            {rows.map(([from, to], ri) => (
              <div key={ri} className={`bd-candle-row ${rows.length > 1 && ri === 0 ? 'bd-back' : ''}`}>
                {out.slice(from, to).map((isOut, k) => {
                  const i = from + k;
                  return (
                    <button
                      key={i}
                      className={`bd-candle ${isOut ? 'bd-out' : ''}`}
                      aria-label="Ngọn nến"
                      onClick={() => lightOff(i)}
                    >
                      <span className="bd-flame" />
                      <span className="bd-smoke" />
                      <span className="bd-wick" />
                      <span className="bd-stick" style={{ '--c': COLORS[(k + ri) % COLORS.length] }} />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="bd-tier bd-t3" />
          <div className="bd-tier bd-t2">
            <em>{age}</em>
          </div>
          <div className="bd-tier bd-t1" />
          <div className="bd-plate" />
        </div>
      </Reveal>

      {!celebrated && (
        <div className="bd-cake-actions">
          <button className="bd-btn" onClick={toggleMic}>
            {micOn ? '🎤 Đang nghe… thổi đi! (bấm để tắt)' : '🎤 Thổi bằng micro'}
          </button>
          <button
            className={`bd-btn bd-ghost ${holding ? 'bd-holding' : ''}`}
            onPointerDown={holdStart}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
            onContextMenu={(e) => e.preventDefault()}
          >
            💨 Giữ để thổi
          </button>
        </div>
      )}
      {micOn && (
        <div className="bd-mic-meter">
          <span ref={meterRef} />
        </div>
      )}
      <p className="bd-cake-msg">{msg}</p>

      {celebrated && (
        <div className="bd-cake-done">
          <p>🎉 Điều ước đã bay đi rồi!</p>
          <div className="bd-cake-actions" style={{ marginTop: 0 }}>
            <button className="bd-btn" onClick={playSong}>🔊 Nghe lại bài hát</button>
            <button className="bd-btn bd-ghost" onClick={relight}>🕯️ Thắp lại nến</button>
          </div>
        </div>
      )}
    </section>
  );
}
