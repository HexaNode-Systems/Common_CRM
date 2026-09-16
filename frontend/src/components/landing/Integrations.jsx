import SectionHeading from './SectionHeading.jsx';

const tools = ['WhatsApp Business', 'Cloud storage', 'Email', 'Calendar', 'Payment gateways', 'Webhooks', 'CSV import/export', 'REST API'];

export default function Integrations() {
  return (
    <section className="integrations-light relative bg-white py-24 font-theme">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Integrations" title="Fits into the tools you already use" align="center" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tools.map((t) => (
            <div
              key={t}
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/[0.03]"
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* SectionHeading is shared with dark sections; re-mapped here for light background */}
      <style>{`
        .integrations-light h2 { color: #0f172a; }
        .integrations-light p { color: #475569; }
        .integrations-light [class*="text-slate-100"],
        .integrations-light [class*="text-slate-200"] { color: #0f172a; }
        .integrations-light [class*="text-slate-300"],
        .integrations-light [class*="text-slate-400"] { color: #475569; }
        .integrations-light [class*="border-white/"] { border-color: rgba(15, 23, 42, 0.1); }
      `}</style>
    </section>
  );
}