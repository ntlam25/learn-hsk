// Sao chép chữ vào clipboard; trang không chạy HTTPS (hoặc trình duyệt chặn) thì dùng textarea ẩn + execCommand.
function fallbackCopy(value) {
  const area = document.createElement('textarea');
  area.value = value;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand('copy');
  } catch {
    // bỏ qua
  }
  area.remove();
}

export function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(value).catch(() => fallbackCopy(value));
  }
  fallbackCopy(value);
  return Promise.resolve();
}
