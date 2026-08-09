export default function ExtensionChipGrid({ extensions = [] }) {
  if (!extensions.length) return null;
  return (
    <div className="extension-grid">
      {extensions.map((e, i) => (
        <div key={i} className="extension-chip">
          <div className="eh">{e[0]}</div>
          <div className="ep">{e[1]}</div>
          <div className="em">{e[2]}</div>
        </div>
      ))}
    </div>
  );
}
