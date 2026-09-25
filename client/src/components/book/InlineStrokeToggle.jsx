import { useEffect, useMemo, useRef, useState } from 'react';
import { escapeHtml, strokeDataLoader } from '../../lib/strokeWriter';

// Lấy các chữ Hán trong một chuỗi (có thể chứa HTML như <b>…</b>)
function hanziOnly(text) {
  return Array.from(String(text || '').replace(/<[^>]*>/g, '')).filter((ch) => /[㐀-鿿]/.test(ch));
}

function showStatic(host, char) {
  host.innerHTML = `<span class="zh">${escapeHtml(char)}</span>`;
}

// Nút "✍ Bút thuận" của giáo trình cho cả một cụm từ / tên nước: bấm để mở một hàng ô nhỏ,
// mỗi ô chạy bút thuận cho một chữ. HanziWriter chỉ được tạo ở lần mở đầu tiên.
// Trả về 2 phần tử anh em (nút + bảng) để đặt thẳng vào hàng flex/grid như file gốc.
export default function InlineStrokeToggle({ text, label = 'Bút thuận' }) {
  const chars = useMemo(() => hanziOnly(text), [text]);
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const hostRefs = useRef([]);
  const writers = useRef([]);
  const replayTimers = useRef([]);

  // Đổi nội dung (trình soạn bài) thì bỏ các ô đã vẽ để lần mở sau vẽ lại
  useEffect(() => {
    writers.current = [];
    setOpen(false);
    setOpened(false);
  }, [chars.join('')]);

  useEffect(() => {
    if (!open) return;
    if (!writers.current.length) {
      writers.current = chars.map((char, i) => {
        const host = hostRefs.current[i];
        if (!host) return null;
        host.innerHTML = '';
        if (!window.HanziWriter) {
          showStatic(host, char);
          return null;
        }
        try {
          return window.HanziWriter.create(host, char, {
            width: 60,
            height: 60,
            padding: 4,
            showOutline: true,
            showCharacter: false,
            strokeColor: '#4A2839',
            radicalColor: '#E85D93',
            outlineColor: '#F0C8DA',
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 150,
            charDataLoader: strokeDataLoader,
            onLoadCharDataError: () => showStatic(host, char),
          });
        } catch {
          showStatic(host, char);
          return null;
        }
      });
    }
    replay();
    return clearReplay;
  }, [open, chars]);

  if (!chars.length) return null;

  // Chạy lại nét cho cả cụm, lần lượt từng chữ (cách nhau 120ms như giáo trình)
  function clearReplay() {
    replayTimers.current.forEach(clearTimeout);
    replayTimers.current = [];
  }
  function replay() {
    clearReplay();
    replayTimers.current = writers.current.map((w, i) => w && setTimeout(() => w.animateCharacter(), i * 120));
  }

  function toggle() {
    setOpen((o) => !o);
    setOpened(true);
  }

  return (
    <>
      <span className="stroke-toggle-group">
        <button type="button" className={'stroke-toggle' + (open ? ' on' : '')} aria-expanded={open} onClick={toggle}>
          ✍ {open ? 'Ẩn bút thuận' : label}
        </button>
        {open ? (
          <button type="button" className="stroke-replay" title="Chạy lại bút thuận" aria-label="Chạy lại bút thuận" onClick={replay}>
            ↻
          </button>
        ) : null}
      </span>
      <div className={'inline-stroke-panel' + (open ? ' open' : '')}>
        {opened
          ? chars.map((char, i) => (
              <div key={i} className="mini-writer-wrap">
                <div
                  ref={(el) => (hostRefs.current[i] = el)}
                  className="mini-writer"
                  title="Bấm để xem lại"
                  onClick={() => writers.current[i]?.animateCharacter()}
                />
                <div className="mini-label">{char}</div>
              </div>
            ))
          : null}
      </div>
    </>
  );
}
