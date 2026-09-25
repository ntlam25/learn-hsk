// Trạng thái hiển thị của lớp: lưu trữ / đã kết thúc / sắp khai giảng / đang học
export function classStatus(klass) {
  if (klass.archived) return { key: 'archived', label: 'Đã lưu trữ' };
  if (klass.ended) return { key: 'ended', label: 'Đã kết thúc' };
  const today = new Date().toISOString().slice(0, 10);
  if (klass.startDate && klass.startDate > today) return { key: 'upcoming', label: 'Sắp khai giảng' };
  return { key: 'active', label: 'Đang học' };
}
