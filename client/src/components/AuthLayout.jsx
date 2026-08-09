export default function AuthLayout({ eyebrow, title, subtitle, promoTitle, promoText, promoPoints = [], children }) {
  return (
    <main className="auth-layout">
      <section className="auth-promo">
        <div className="auth-promo-seal">汉</div>
        <span className="auth-promo-eyebrow">{eyebrow}</span>
        <h1>{promoTitle}</h1>
        <p>{promoText}</p>
        {promoPoints.length > 0 && (
          <ul className="auth-promo-points">
            {promoPoints.map((p, i) => (
              <li key={i}>
                <span className="auth-promo-check">✓</span> {p}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-card">
          <h2>{title}</h2>
          {subtitle && <p className="login-sub">{subtitle}</p>}
          {children}
        </div>
      </section>
    </main>
  );
}
