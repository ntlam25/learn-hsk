import { useEffect, useRef } from 'react';
import { playHanziSafe, resetHost } from '../../lib/strokeWriter';

// Ô chữ điền (tianzige) giống giáo trình: hiện chữ tĩnh, tự chạy bút thuận khi cuộn tới, bấm để xem lại.
// Nội dung bên trong ô do HanziWriter quản lý trực tiếp nên React không render con của ô này;
// icon ↻ ở góc nằm ngoài ô (trong khung bọc) để báo rõ là bấm được để chạy lại nét.
export default function CharRunner({ char }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) resetHost(ref.current, char);
  }, [char]);

  const replay = () => playHanziSafe(ref.current, char);

  return (
    <div className="char-runner-wrap">
      <div ref={ref} className="tianzige char-runner" data-hanzi={char} title="Tự động chạy; bấm để xem lại" onClick={replay} />
      {char ? (
        <button type="button" className="char-replay" title="Chạy lại bút thuận" aria-label={`Chạy lại bút thuận chữ ${char}`} onClick={replay}>
          ↻
        </button>
      ) : null}
    </div>
  );
}
