// Logo dùng chung cho header học viên và sidebar quản trị.
export default function Brand({ eyebrow = 'Hán Ngữ', name = 'Giáo trình Hán ngữ' }) {
  return (
    <span className="brand">
      <span className="topnav-seal">汉</span>
      <span className="brand-text">
        <span className="brand-eyebrow">{eyebrow}</span>
        <span className="brand-name">{name}</span>
      </span>
    </span>
  );
}
