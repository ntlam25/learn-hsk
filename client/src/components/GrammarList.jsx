export default function GrammarList({ items = [] }) {
  if (!items.length) return <div className="empty-state">Bài này chưa có ngữ pháp trọng tâm.</div>;
  return (
    <div className="ex-block">
      <h3>语法 · Ngữ pháp trọng tâm</h3>
      <div className="grammar-list">
        {items.map((g, i) => (
          <div key={i} className="grammar-item">
            <h4>{g.title}</h4>
            <div className="reading-box">{g.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
