import { COLORS } from './data';
import { prefersReducedMotion } from './utils';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

/** Pháo giấy vẽ trên 1 canvas phủ toàn màn hình. Trả về { burst, rain, destroy }. */
export function createConfetti(cv) {
  const ctx = cv.getContext('2d');
  const reduce = prefersReducedMotion();
  const parts = [];
  let W = 0;
  let H = 0;
  let raf = 0;
  let running = false;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  function add(p) {
    parts.push(p);
    if (!running) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  }
  function make(x, y, vx, vy, o = {}) {
    const r = Math.random();
    return {
      x, y, vx, vy,
      g: o.g ?? 0.18,
      drag: o.drag ?? 0.985,
      s: 5 + Math.random() * 6,
      c: pick(o.colors || COLORS),
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
      tilt: Math.random() * 6,
      vt: 0.08 + Math.random() * 0.18,
      shape: r < 0.45 ? 'rect' : r < 0.8 ? 'dot' : 'heart',
      life: 0,
      max: o.max ?? 150 + Math.random() * 80,
    };
  }
  function burst(x, y, n = 80, o = {}) {
    if (reduce) n = Math.min(n, 14);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (o.speed || 8) * (0.35 + Math.random());
      add(make(x, y, Math.cos(a) * sp, Math.sin(a) * sp - (o.lift ?? 3), o));
    }
  }
  function rain(n = 180) {
    if (reduce) n = 24;
    for (let i = 0; i < n; i++) {
      add(make(Math.random() * W, -20 - Math.random() * H * 0.6, (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2.5, {
        g: 0.04, drag: 0.995, max: 420,
      }));
    }
  }
  function heart(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.4, -s, 0, -s * 0.35);
    ctx.bezierCurveTo(s * 0.4, -s, s, -s * 0.4, 0, s * 0.3);
    ctx.fill();
  }
  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.tilt += p.vt;
      p.life++;
      if (p.life > p.max || p.y > H + 40) {
        parts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.max - p.life) / 40);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.tilt));
      ctx.fillStyle = p.c;
      if (p.shape === 'rect') ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      else if (p.shape === 'dot') {
        ctx.beginPath();
        ctx.arc(0, 0, p.s / 2.4, 0, 7);
        ctx.fill();
      } else heart(p.s * 0.9);
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop);
    else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }
  function destroy() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', size);
    parts.length = 0;
    running = false;
  }
  return { burst, rain, destroy };
}
