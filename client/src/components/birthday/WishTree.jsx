import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { BDAY, COLORS, SLUG } from './data';
import Reveal from './Reveal';
import { audio, chime } from './utils';

// Điểm treo thẻ trên cành (toạ độ theo viewBox 400 × 380 của SVG cây)
const ANCHORS = [
  [150, 192], [245, 192], [110, 175], [290, 172], [170, 132],
  [235, 120], [80, 163], [325, 155], [130, 108], [275, 99],
];
const VB_W = 400;
const VB_H = 380;
const STORAGE_KEY = 'bd-mai-wishes'; // [{ key, text }] — điều ước đang treo trên cây (trên máy này)
const PENDING_KEY = 'bd-mai-wishes-pending'; // [{ key, text }] — chưa gửi được lên server (mất mạng…) → gửi lại sau
const IDS_KEY = 'bd-mai-wishes-ids'; // { key: id trong DB } — để gỡ được điều ước trên server
const MAX_LEN = 60;

const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const readJSON = (k, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* chế độ ẩn danh / chặn lưu trữ: bỏ qua */
  }
};
// Bản cũ lưu chuỗi trơn → đổi sang { key, text }
const toItems = (v) =>
  (Array.isArray(v) ? v : [])
    .map((x) => (typeof x === 'string' ? { key: newKey(), text: x } : x))
    .filter((x) => x && typeof x.text === 'string' && typeof x.key === 'string');

const readPending = () => {
  const raw = readJSON(PENDING_KEY, []);
  const items = toItems(raw);
  // Bản cũ có chuỗi trơn → ghi lại ngay để khoá vừa tạo được giữ cố định giữa các lần đọc
  if (Array.isArray(raw) && raw.some((x) => typeof x === 'string')) writePending(items);
  return items;
};
const writePending = (list) => writeJSON(PENDING_KEY, list);
const readIds = () => {
  const v = readJSON(IDS_KEY, {});
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
};
const removedKeys = new Set(); // gỡ trong lúc điều ước đang được gửi → gửi xong thì xoá luôn

// Gửi lần lượt các điều ước đang chờ; cái nào lỗi mạng thì giữ lại để lần sau gửi tiếp
let flushing = false;
async function flushWishes() {
  if (flushing) return true;
  flushing = true;
  try {
    for (let item = readPending()[0]; item; item = readPending()[0]) {
      let id = null;
      try {
        const res = await api.post('/birthday/wishes', { recipient: SLUG, content: item.text });
        id = res.data?.wish?.id || null;
      } catch (err) {
        // 400: dữ liệu không hợp lệ → bỏ hẳn; lỗi mạng / 429 / 5xx → dừng, để lần sau gửi lại
        if (err.response?.status !== 400) return false;
      }
      if (id) {
        if (removedKeys.has(item.key)) api.delete(`/birthday/wishes/${id}`).catch(() => {});
        else writeJSON(IDS_KEY, { ...readIds(), [item.key]: id });
      }
      writePending(readPending().filter((p) => p.key !== item.key));
    }
    return true;
  } finally {
    flushing = false;
  }
}

const PETALS = Array.from({ length: 10 }, (_, i) => ({
  x: `${(i * 37) % 100}%`,
  d: `${-(i * 1.3).toFixed(1)}s`,
  dur: `${7 + (i % 4) * 1.5}s`,
}));

const loadMine = () => toItems(readJSON(STORAGE_KEY, [])).slice(-(ANCHORS.length - BDAY.treeWishes.length));

// Màn 5: cây ước nguyện, có sẵn lời chúc của người gửi, Mai treo thêm / gỡ điều ước của mình
export default function WishTree({ fx }) {
  const treeRef = useRef(null);
  const [mine, setMine] = useState(loadMine);
  const [text, setText] = useState('');
  const [selected, setSelected] = useState(null); // { text, from, key? }
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [justAdded, setJustAdded] = useState(-1);
  const [msg, setMsg] = useState('');

  useEffect(() => writeJSON(STORAGE_KEY, mine), [mine]);

  // Mở trang mà còn điều ước chưa gửi được lần trước → gửi lại
  useEffect(() => {
    if (readPending().length) flushWishes();
  }, []);

  const free = ANCHORS.length - BDAY.treeWishes.length;
  const tags = [
    ...BDAY.treeWishes.map((t) => ({ text: t, from: BDAY.sender })),
    ...mine.map((w) => ({ text: w.text, from: BDAY.name, key: w.key })),
  ];

  function select(t) {
    setSelected(t);
    setConfirming(false);
  }

  async function removeSelected() {
    const key = selected?.key;
    if (!key) return;
    setRemoving(true);
    const id = readIds()[key];
    if (id) {
      try {
        await api.delete(`/birthday/wishes/${id}`);
      } catch (err) {
        if (err.response?.status !== 404) {
          setRemoving(false);
          setMsg('Chưa gỡ được, kiểm tra mạng rồi thử lại nha 🙏');
          return;
        }
      }
      const ids = readIds();
      delete ids[key];
      writeJSON(IDS_KEY, ids);
    } else {
      // Chưa gửi lên server (hoặc đang gửi) → bỏ khỏi hàng chờ, gửi xong sẽ tự xoá
      removedKeys.add(key);
      writePending(readPending().filter((p) => p.key !== key));
    }
    setMine((list) => list.filter((w) => w.key !== key));
    setSelected(null);
    setConfirming(false);
    setRemoving(false);
    setJustAdded(-1);
    setMsg('Đã gỡ điều ước khỏi cây 🍃');
  }

  function hang(e) {
    e.preventDefault();
    const wish = text.trim();
    if (!wish) {
      setMsg('Viết điều ước trước đã nha ✍️');
      return;
    }
    audio();
    const item = { key: newKey(), text: wish };
    // Hết chỗ trên cành thì điều ước cũ nhất của Mai nhường chỗ (vẫn còn trong DB)
    const next = [...mine, item].slice(-free);
    const idx = BDAY.treeWishes.length + next.length - 1;
    setMine(next);
    setText('');
    setJustAdded(idx);
    setSelected(null);
    setConfirming(false);
    setMsg('Điều ước đã được treo lên cây ✨ Ước thêm nữa cũng được!');
    chime();
    const r = treeRef.current.getBoundingClientRect();
    const [ax, ay] = ANCHORS[idx];
    fx.burst(r.left + (ax / VB_W) * r.width, r.top + (ay / VB_H) * r.height + 30, 50, { speed: 7, lift: 2 });

    // Lưu vào DB (qua hàng chờ để không mất điều ước khi mạng chập chờn)
    writePending([...readPending(), item]);
    flushWishes().then((ok) => {
      if (!ok) setMsg('Điều ước đã treo lên cây ✨ (mạng hơi chập chờn, lát nữa sẽ tự gửi lại)');
    });
  }

  return (
    <section className="bd-scene">
      <Reveal>
        <p className="bd-eyebrow">Cây ước nguyện</p>
        <h2 className="bd-title">Treo một điều ước nhé</h2>
        <p className="bd-lead">
          Trên cây đã có vài lời chúc của {BDAY.sender}. Giờ tới lượt {BDAY.name}: viết điều ước rồi treo lên cây nha!
        </p>
      </Reveal>

      <Reveal className="bd-tree">
        <div className="bd-tree-box" ref={treeRef}>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="bd-tree-svg" aria-hidden="true">
            <ellipse cx="200" cy="362" rx="150" ry="13" fill="#EBD8C6" />
            <g fill="none" stroke="#8B5E3C" strokeLinecap="round">
              <path d="M195 215 C160 190 120 175 70 160" strokeWidth="9" />
              <path d="M205 210 C245 185 290 170 335 150" strokeWidth="9" />
              <path d="M200 215 C198 170 202 130 200 80" strokeWidth="10" />
              <path d="M198 150 C170 125 140 110 105 95" strokeWidth="7" />
              <path d="M201 140 C230 115 262 100 300 88" strokeWidth="7" />
              <path d="M120 175 C110 160 100 150 92 135" strokeWidth="4" />
              <path d="M290 168 C300 150 312 140 325 128" strokeWidth="4" />
              <path d="M200 100 C185 85 175 70 165 55" strokeWidth="4" />
              <path d="M200 95 C215 80 228 68 240 52" strokeWidth="4" />
            </g>
            <path d="M178 364 C188 300 186 250 191 205 L209 205 C212 250 214 300 224 364 Z" fill="#8B5E3C" />
            <path d="M196 360 C200 300 198 250 200 212" stroke="#74492C" strokeWidth="3" fill="none" opacity=".5" />
            <g opacity=".92">
              {[
                [70, 140, 36, '#FFC4D6'], [112, 88, 32, '#FFD9E4'], [165, 52, 30, '#FFB0C8'], [238, 48, 32, '#FFC4D6'],
                [300, 78, 32, '#FFD9E4'], [336, 128, 36, '#FFB0C8'], [200, 64, 38, '#FFD9E4'], [150, 118, 26, '#FFB0C8'],
                [255, 110, 26, '#FFC4D6'], [200, 128, 24, '#FFC4D6'],
              ].map(([cx, cy, r, c], i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill={c} />
              ))}
            </g>
            <g>
              {Array.from({ length: 34 }, (_, i) => {
                const a = i * 2.39996;
                const cx = 200 + Math.cos(a) * (40 + ((i * 53) % 120));
                const cy = 95 + Math.sin(a) * (20 + ((i * 29) % 55));
                return <circle key={i} cx={cx} cy={cy} r={i % 3 ? 2.6 : 3.6} fill={i % 2 ? '#fff' : '#F2789F'} opacity=".85" />;
              })}
            </g>
          </svg>

          {PETALS.map((p, i) => (
            <span key={i} className="bd-petal" style={{ left: p.x, animationDelay: p.d, animationDuration: p.dur }} />
          ))}

          {tags.map((t, i) => {
            const [ax, ay] = ANCHORS[i];
            return (
              <button
                key={t.key || `preset-${i}`}
                className={`bd-tag ${i === justAdded ? 'bd-tag-new' : ''} ${t.key ? 'bd-tag-mine' : ''} ${
                  selected && (selected.key ? selected.key === t.key : !t.key && selected.text === t.text) ? 'bd-tag-active' : ''
                }`}
                style={{
                  left: `${(ax / VB_W) * 100}%`,
                  top: `${(ay / VB_H) * 100}%`,
                  '--c': COLORS[i % COLORS.length],
                  '--len': `${i % 2 ? 30 : 14}px`,
                  '--d': `${-i * 0.6}s`,
                }}
                onClick={() => select(t)}
                aria-label={`Thẻ ước: ${t.text}`}
              >
                <span className="bd-tag-string" />
                <span className="bd-tag-paper">{t.text}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="bd-tree-read" aria-live="polite">
        {selected ? (
          <>
            <p>
              “{selected.text}”
              <small>{selected.key ? `điều ước của ${BDAY.name}` : `${selected.from} chúc ${BDAY.name}`}</small>
            </p>
            {selected.key && (
              <div className="bd-tree-remove">
                {!confirming ? (
                  <button type="button" className="bd-btn bd-ghost bd-btn-sm" onClick={() => setConfirming(true)}>
                    🍃 Gỡ điều ước này
                  </button>
                ) : (
                  <>
                    <span>Gỡ điều ước này khỏi cây?</span>
                    <button type="button" className="bd-btn bd-btn-sm" onClick={removeSelected} disabled={removing}>
                      {removing ? 'Đang gỡ…' : 'Gỡ'}
                    </button>
                    <button type="button" className="bd-btn bd-ghost bd-btn-sm" onClick={() => setConfirming(false)} disabled={removing}>
                      Thôi
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="bd-tree-tip">Chạm vào thẻ trên cây để đọc 🎐</p>
        )}
      </div>

      <form className="bd-tree-form" onSubmit={hang}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          placeholder={`Điều ước của ${BDAY.name} là…`}
          maxLength={MAX_LEN}
          aria-label="Điều ước"
        />
        <button type="submit" className="bd-btn">🎐 Treo lên cây</button>
      </form>
      <p className="bd-cake-msg">{msg}</p>
      <p className="bd-cards-note">Điều ước sẽ được gửi riêng tới {BDAY.sender} 💌</p>
    </section>
  );
}
