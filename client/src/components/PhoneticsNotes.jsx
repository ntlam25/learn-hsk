export default function PhoneticsNotes({ notes = [] }) {
  if (!notes.length) return <div className="empty-state">Bài này chưa có ghi chú ngữ âm.</div>;
  return (
    <div className="ex-block">
      <h3>语音笔记 · Ghi chú ngữ âm</h3>
      <div className="mini-note-grid">
        {notes.map((n, i) => (
          <div key={i} className="mini-note">
            <h4>{n.title}</h4>
            <div>{n.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
