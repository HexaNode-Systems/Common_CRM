import SectionHeading from './SectionHeading.jsx';

const points = [
  { title: 'Leads go cold in spreadsheets', body: 'By the time someone follows up, the enquiry is three days old and already talking to a competitor.' },
  { title: 'WhatsApp replies get lost', body: 'Conversations live on personal phones with no record of who said what, or who owns the follow-up.' },
  { title: 'No one sees the full picture', body: 'Sales, delivery and finance each work off their own tool, so nothing lines up at the end of the month.' },
];

export default function Problem() {
  return (
    <section className="problem-light relative bg-white py-24 font-theme">
      {/* Seam from the dark hero into the light section, so the switch reads as
          intentional rather than an abrupt cut. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/[0.06] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="The problem"
          title="Most teams don't lose deals to competitors. They lose them to gaps."
          description="Common CRM closes the gap between a first enquiry and a closed deal by keeping every conversation, task and document in one place."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm shadow-slate-900/[0.03]"
            >
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SectionHeading is shared with the dark sections, so its own colours are
          re-mapped here rather than editing the component. Descendant selectors
          out-rank Tailwind's single-class utilities, so no !important needed. */}
      <style>{`
        .problem-light h2 { color: #0f172a; }
        .problem-light p { color: #475569; }
        .problem-light .text-white,
        .problem-light [class*="text-slate-100"],
        .problem-light [class*="text-slate-200"] { color: #0f172a; }
        .problem-light [class*="text-slate-300"],
        .problem-light [class*="text-slate-400"] { color: #475569; }
        .problem-light [class*="bg-white/"] { background-color: rgba(15, 23, 42, 0.03); }
        .problem-light [class*="border-white/"] { border-color: rgba(15, 23, 42, 0.1); }
      `}</style>
    </section>
  );
}