export default function DialogueBlock({ dialogue }) {
  return (
    <div className="dialogue-card">
      {dialogue.title ? <h3 className="dialogue-title">{dialogue.title}</h3> : null}
      {(dialogue.lines || []).map((line, i) => {
        if (line.loc) {
          return (
            <div key={i} className="location-divider">
              {line.loc}
            </div>
          );
        }
        if (line.gap) {
          return <div key={i} className="dlg-gap" />;
        }
        const side = line.side || (i % 2 === 0 ? 'A' : 'B');
        return (
          <div key={i} className={`dlg-line side-${side}`}>
            <div className={`dlg-avatar ${side}`}>{line.role}</div>
            <div className="dlg-bubble">
              <div className="dlg-text">{line.text}</div>
              {line.py ? <div className="dlg-pinyin">{line.py}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
