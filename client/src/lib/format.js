// Định dạng ngày kiểu Việt Nam: 2026-09-25 / ISO → "25/09/2026" (kèm giờ nếu withTime)
export function formatDate(value, { withTime = false } = {}) {
  if (!value) return '';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('vi-VN', opts);
}
