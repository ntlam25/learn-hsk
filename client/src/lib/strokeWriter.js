// Bút thuận cho ô tianzige — port nguyên cách làm của giáo trình gốc (window.playHanziSafe +
// tự chạy các chữ đang hiện trên màn hình trong tab Từ mới).
const writerCache = new WeakMap();

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function resetHost(host, char) {
  writerCache.delete(host);
  host.innerHTML = `<span class="zh">${escapeHtml(char || '')}</span>`;
}

function fallbackRun(host) {
  host.classList.remove('run');
  void host.offsetWidth;
  host.classList.add('run');
}

// Dữ liệu nét chữ: jsDelivr trước, lỗi thì thử unpkg (giống missingStrokeDataLoader trong file gốc)
export function strokeDataLoader(char, onComplete, onError) {
  const encoded = encodeURIComponent(char);
  const urls = [
    `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encoded}.json`,
    `https://unpkg.com/hanzi-writer-data@2.0.1/${encoded}.json`,
  ];
  let index = 0;
  function tryNext() {
    if (index >= urls.length) {
      onError(new Error('Không tải được dữ liệu bút thuận cho chữ ' + char));
      return;
    }
    fetch(urls[index++])
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(onComplete)
      .catch(tryNext);
  }
  tryNext();
}

export function playHanziSafe(host, char) {
  if (!host || !char) return;
  if (!window.HanziWriter) {
    fallbackRun(host);
    return;
  }
  let writer = writerCache.get(host);
  if (writer) {
    writer.animateCharacter();
    return;
  }
  try {
    host.innerHTML = '';
    writer = window.HanziWriter.create(host, char, {
      width: 78,
      height: 78,
      padding: 5,
      showOutline: true,
      showCharacter: false,
      strokeColor: '#4A2839',
      radicalColor: '#E85D93',
      outlineColor: '#F0C8DA',
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 150,
      charDataLoader: strokeDataLoader,
      onLoadCharDataError() {
        host.innerHTML = `<span class="zh">${escapeHtml(char)}</span>`;
        fallbackRun(host);
      },
    });
    writerCache.set(host, writer);
    writer.animateCharacter();
  } catch {
    host.innerHTML = `<span class="zh">${escapeHtml(char)}</span>`;
    fallbackRun(host);
  }
}

function isVisible(host) {
  if (!host || !host.isConnected) return false;
  const style = getComputedStyle(host);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = host.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= (innerHeight || document.documentElement.clientHeight) + 80;
}

// Tự chạy bút thuận cho các ô đang nằm trong màn hình của tab Từ mới (lần lượt cách nhau 220ms).
// Trả về { schedule(reset), destroy() }.
export function createAutoStroke(getRoot) {
  let batchToken = 0;
  let scrollTimer = null;
  let engineTimer = null;

  function activeVocabularyPanel() {
    const root = getRoot();
    const panel = root?.querySelector('main > section.panel.active');
    return panel && panel.querySelector('.vocab-grid, .book-vocab-grid') ? panel : null;
  }

  function run(reset) {
    const panel = activeVocabularyPanel();
    if (!panel) return;
    if (reset) panel.querySelectorAll('.tianzige.char-runner[data-hanzi]').forEach((h) => delete h.dataset.autoPlayed);
    const token = ++batchToken;
    const hosts = Array.from(panel.querySelectorAll('.tianzige.char-runner[data-hanzi]')).filter(
      (h) => !h.dataset.autoPlayed && isVisible(h)
    );
    hosts.forEach((host, index) => {
      host.dataset.autoPlayed = 'queued';
      setTimeout(() => {
        if (token !== batchToken || !isVisible(host)) {
          delete host.dataset.autoPlayed;
          return;
        }
        host.classList.add('auto-writing');
        playHanziSafe(host, host.dataset.hanzi);
        host.dataset.autoPlayed = '1';
        setTimeout(() => host.classList.remove('auto-writing'), 1600);
      }, index * 220);
    });
  }

  function schedule(reset, delay = 260) {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => run(!!reset), delay);
  }

  function waitForEngine(attempt) {
    if (window.HanziWriter || attempt >= 48) {
      schedule(true);
      return;
    }
    engineTimer = setTimeout(() => waitForEngine(attempt + 1), 250);
  }

  const onScroll = () => schedule(false);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  waitForEngine(0);

  return {
    schedule,
    destroy() {
      batchToken++;
      clearTimeout(scrollTimer);
      clearTimeout(engineTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    },
  };
}
