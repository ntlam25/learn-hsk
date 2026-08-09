export default function CountryTable({ countries = [] }) {
  if (!countries.length) return null;
  return (
    <div className="country-table">
      {countries.map((c, i) => (
        <div key={i} className="country-row">
          <span className="ch">{c.h}</span>
          <span className="py">{c.p}</span>
          <span className="mn">{c.m}</span>
        </div>
      ))}
    </div>
  );
}
