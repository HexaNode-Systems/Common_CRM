import SectionHeading from './SectionHeading.jsx';
import { FileSpreadsheet, MessageSquareOff, EyeOff } from 'lucide-react';

const points = [
  {
    icon: FileSpreadsheet,
    iconColor: 'text-amber-600 bg-amber-50 border-amber-200/60',
    title: 'Leads go cold in spreadsheets',
    body: 'By the time someone follows up, the enquiry is three days old and already talking to a competitor.',
  },
  {
    icon: MessageSquareOff,
    iconColor: 'text-rose-600 bg-rose-50 border-rose-200/60',
    title: 'WhatsApp replies get lost',
    body: 'Conversations live on personal phones with no record of who said what, or who owns the follow-up.',
  },
  {
    icon: EyeOff,
    iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
    title: 'No one sees the full picture',
    body: 'Sales, delivery and finance each work off their own tool, so nothing lines up at the end of the month.',
  },
];

export default function Problem() {
  return (
    <section className="problem-light relative bg-white py-20 sm:py-24 font-theme">
      {/* Subtle top seam gradient from preceding section */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/[0.04] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="The problem"
          title="Most teams don't lose deals to competitors. They lose them to gaps."
          description="Appnix CRM Pro closes the gap between a first enquiry and a closed deal by keeping every conversation, task and document in one place."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {points.map(({ icon: Icon, iconColor, title, body }) => (
            <div
              key={title}
              className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 sm:p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-md hover:shadow-slate-900/[0.05]"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconColor} transition-transform duration-300 group-hover:scale-105`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SectionHeading is shared with dark sections; re-mapped here for light background */}
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