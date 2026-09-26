import { useCallback, useEffect, useMemo, useState } from 'react';

// Chọn nhiều dòng trong bảng. rowIds = id các dòng đang hiển thị (và được phép chọn).
// Dòng biến mất (tải lại, lọc, tìm kiếm) thì tự bỏ khỏi danh sách chọn.
export default function useRowSelection(rowIds) {
  const [selected, setSelected] = useState([]);
  const key = rowIds.join('|');

  useEffect(() => {
    const visible = new Set(rowIds);
    setSelected((prev) => {
      const next = prev.filter((id) => visible.has(id));
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id));
  const someSelected = selected.length > 0 && !allSelected;

  const toggle = useCallback((id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), []);
  const toggleAll = useCallback(() => setSelected(allSelected ? [] : rowIds), [allSelected, rowIds]);
  const clear = useCallback(() => setSelected([]), []);

  return { selected, count: selected.length, isSelected: (id) => selectedSet.has(id), toggle, toggleAll, clear, allSelected, someSelected };
}
