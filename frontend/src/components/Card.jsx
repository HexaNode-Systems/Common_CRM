export default function Card({ title, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title ? <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2> : null}
      {children}
    </section>
  );
}

