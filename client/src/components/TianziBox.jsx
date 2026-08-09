import { useEffect, useRef, useState } from 'react';

/**
 * Ô chữ điền (tianzige) chạy hiệu ứng bút thuận bằng HanziWriter (nạp qua CDN
 * trong index.html, giữ đúng cách bản HTML gốc dùng — không cần cài npm package
 * riêng vì HanziWriter tự tải dữ liệu nét chữ từ CDN theo từng ký tự).
 * Bấm vào ô để phát lại hiệu ứng.
 */
export default function TianziBox({ char }) {
  const hostRef = useRef(null);
  const writerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!char || !hostRef.current || typeof window.HanziWriter === 'undefined') {
      setFailed(true);
      return;
    }
    hostRef.current.innerHTML = '';
    try {
      writerRef.current = window.HanziWriter.create(hostRef.current, char, {
        width: 72,
        height: 72,
        padding: 4,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 150,
      });
      writerRef.current.animateCharacter();
    } catch (e) {
      setFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  function replay() {
    if (writerRef.current) writerRef.current.animateCharacter();
  }

  return (
    <div className="char-box">
      <div className="tianzige char-runner" onClick={replay} title={`Bấm để xem lại chữ ${char}`}>
        <div ref={hostRef} className="hanzi-writer-host" />
        {failed && <span className="zh">{char}</span>}
      </div>
    </div>
  );
}
