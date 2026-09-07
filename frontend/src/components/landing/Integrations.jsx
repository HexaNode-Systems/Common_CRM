import SectionHeading from './SectionHeading.jsx';

export default function Integrations() {
  const tools = ['WhatsApp Business', 'Cloud storage', 'Email', 'Calendar', 'Payment gateways', 'Webhooks', 'CSV import/export', 'REST API'];
  return (
    <section className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Integrations" title="Fits into the tools you already use" align="center" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tools.map((t) => (
            <div key={t} className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-600">
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}