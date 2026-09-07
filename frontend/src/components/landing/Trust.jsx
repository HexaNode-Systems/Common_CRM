export default function TrustBar() {
  const names = ['Northbridge Realty', 'Vantage Clinics', 'Studio Loom', 'Craft & Co.', 'Beacon Academy', 'Fernway Agency'];
  return (
    <section className="border-b border-slate-100 bg-white py-10 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          Trusted by growing teams across industries
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {names.map((n) => (
            <span key={n} className="text-sm font-semibold text-slate-400">{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}