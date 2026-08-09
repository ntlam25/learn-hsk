export default function ProperNounTable({ entries = [] }) {
  if (!entries.length) return null;
  return (
    <div className="book-proper-table">
      {entries.map((entry, i) => (
        <div key={i} className="book-proper-row">
          <span className="hanzi">{(entry.chars || []).map((c) => c.h).join('')}</span>
          <span>{entry.pinyin}</span>
          <span>{entry.meaning}</span>
        </div>
      ))}
    </div>
  );
}
