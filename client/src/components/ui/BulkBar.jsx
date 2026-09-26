import Checkbox from './Checkbox';

// Ô chọn tất cả ở đầu bảng
export function SelectAllCell({ selection, disabled }) {
  return (
    <th className="col-select">
      <Checkbox
        checked={selection.allSelected}
        indeterminate={selection.someSelected}
        onChange={selection.toggleAll}
        disabled={disabled}
        ariaLabel="Chọn tất cả"
      />
    </th>
  );
}

// Ô chọn ở mỗi dòng
export function SelectCell({ selection, id, disabled, title }) {
  return (
    <td className="col-select" title={title}>
      <Checkbox checked={selection.isSelected(id)} onChange={() => selection.toggle(id)} disabled={disabled} ariaLabel="Chọn dòng" />
    </td>
  );
}

// Thanh thao tác hàng loạt nổi ở đáy màn hình, chỉ hiện khi đã chọn ít nhất 1 dòng
export default function BulkBar({ selection, noun = 'mục', children }) {
  if (!selection.count) return null;
  return (
    <div className="bulk-bar" role="region" aria-label="Thao tác hàng loạt">
      <span className="bulk-bar-count">
        Đã chọn <strong>{selection.count}</strong> {noun}
      </span>
      <button type="button" className="bulk-bar-clear" onClick={selection.clear}>
        Bỏ chọn
      </button>
      <span className="bulk-bar-sep" />
      {children}
    </div>
  );
}
