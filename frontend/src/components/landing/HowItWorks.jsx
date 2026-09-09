import SectionHeading from './SectionHeading.jsx';

export default function HowItWorks() {
  const steps = [
    { title: 'Set up your workspace', body: 'Add your brand, colors and team in minutes — no developer needed.' },
    { title: 'Import your leads', body: 'Bring in existing contacts and enquiries from a spreadsheet or your old tool.' },
    { title: 'Connect WhatsApp', body: 'Link your business number so every chat lands against the right lead.' },
    { title: 'Track and grow', body: 'Watch pipeline, projects and team capacity from one live dashboard.' },
  ];
  return (
    <section className="bg-slate-50 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="How it works" title="Live in a day, not a quarter" align="center" />
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative">
              <span className="text-4xl font-extrabold text-primary/20">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-base font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}