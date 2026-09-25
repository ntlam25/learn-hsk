// Đường dẫn quay lại sau đăng nhập/đăng ký (?next=/join/ABC123). Chỉ nhận đường dẫn nội bộ để tránh chuyển hướng ra ngoài.
export function safeNext(search) {
  const next = new URLSearchParams(search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export function withNext(path, next) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
