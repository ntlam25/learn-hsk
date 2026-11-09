import { BDAY } from './data';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const fmt = (n) => Math.floor(n).toLocaleString('vi-VN');

export function centerOf(el) {
  if (!el) return [window.innerWidth / 2, window.innerHeight / 2];
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

/* ---------- Ngày tháng ---------- */
// ?xem-thu=sinh-nhat trên URL → giả lập hôm nay là đúng ngày sinh nhật (để xem trước)
let simulateBirthday = false;
export const setSimulateBirthday = (v) => {
  simulateBirthday = !!v;
};

export function getNow() {
  const n = new Date();
  if (simulateBirthday) n.setMonth(BDAY.birth.m - 1, BDAY.birth.d);
  return n;
}

/**
 * status: 'today' (đúng ngày) | 'recent' (đã qua ≤ 30 ngày) | 'upcoming' (sắp tới)
 * age: tuổi của lần sinh nhật đang được chúc mừng
 */
export function birthdayInfo() {
  const b = new Date(BDAY.birth.y, BDAY.birth.m - 1, BDAY.birth.d);
  const now = getNow();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  const diffDays = Math.round((todayStart - thisYear) / 864e5);
  if (diffDays === 0) return { b, now, next: thisYear, status: 'today', age: thisYear.getFullYear() - b.getFullYear() };
  if (diffDays > 0 && diffDays <= 30) {
    return { b, now, next: thisYear, status: 'recent', age: thisYear.getFullYear() - b.getFullYear() };
  }
  const next = diffDays < 0 ? thisYear : new Date(now.getFullYear() + 1, b.getMonth(), b.getDate());
  return { b, now, next, status: 'upcoming', age: next.getFullYear() - b.getFullYear() };
}

/* ---------- Âm thanh (Web Audio, không cần file nhạc) ---------- */
let ac = null;
export function audio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ac = new AC();
  }
  if (ac && ac.state === 'suspended') ac.resume();
  return ac;
}

export function popSound() {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(700, t);
  o.frequency.exponentialRampToValueAtTime(110, t + 0.09);
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + 0.14);
}

// Tiếng chuông gió nhỏ khi treo điều ước
export function chime() {
  const a = audio();
  if (!a) return;
  [1046.5, 1318.5, 1568].forEach((f, i) => {
    const t = a.currentTime + i * 0.09;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 1);
  });
}

const NOTE = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
const SONG = [
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
  ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
  ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2.5],
];

export function playSong() {
  const a = audio();
  if (!a) return;
  const beat = 0.4;
  const master = a.createGain();
  master.gain.value = 0.32;
  master.connect(a.destination);
  let t = a.currentTime + 0.1;
  for (const [n, d] of SONG) {
    const dur = d * beat;
    for (const [mult, type, vol] of [[1, 'triangle', 1], [2, 'sine', 0.25]]) {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.value = NOTE[n] * mult;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(dur * 0.95, 0.15));
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    t += dur;
  }
}
