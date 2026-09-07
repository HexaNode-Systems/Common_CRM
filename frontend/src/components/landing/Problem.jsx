import SectionHeading from './SectionHeading.jsx';

export default function Problem() {
  const points = [
    { title: 'Leads go cold in spreadsheets', body: 'By the time someone follows up, the enquiry is three days old and already talking to a competitor.' },
    { title: 'WhatsApp replies get lost', body: 'Conversations live on personal phones with no record of who said what, or who owns the follow-up.' },
    { title: 'No one sees the full picture', body: 'Sales, delivery and finance each work off their own tool, so nothing lines up at the end of the month.' },
  ];
  return (
    <section className="bg-slate-50 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="The problem"
          title="Most teams don't lose deals to competitors. They lose them to gaps."
          description="Common CRM closes the gap between a first enquiry and a closed deal by keeping every conversation, task and document in one place."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}