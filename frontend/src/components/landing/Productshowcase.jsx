import ShowcaseRow from './ShowcaseRow.jsx';
import { KanbanSquare, MessageCircle, Users, Check, CheckCheck } from 'lucide-react';

const stageMeta = [
  { label: 'Pipeline', count: 18, color: 'bg-slate-400' },
  { label: 'Running', count: 26, color: 'bg-amber-400' },
  { label: 'Finished', count: 41, color: 'bg-emerald-500' },
];

const teamMembers = [
  { initials: 'AK', name: 'Aditi K.' },
  { initials: 'RS', name: 'Rohan S.' },
  { initials: 'MJ', name: 'Meera J.' },
  { initials: 'PV', name: 'Priya V.' },
];

export default function ProductShowcase() {
  return (
    <section id="product" className="bg-white py-8 font-theme">
      <div className="mx-auto max-w-7xl divide-y divide-slate-100 px-6">
        <ShowcaseRow
          icon={KanbanSquare}
          eyebrow="Lead management"
          title="A pipeline your whole team actually looks at"
          body="Filter by owner, stage or date range and find any lead in seconds. Every field is searchable, every status change is logged."
          bullets={[
            'Debounced global search across name, company and email',
            'Color-coded status at a glance',
            'Serial-numbered records for easy reference',
          ]}
          mock={
            <div className="space-y-2.5">
              {stageMeta.map(({ label, count, color }) => (
                <div
                  key={label}
                  className="group flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-400">{count} leads</span>
                </div>
              ))}
            </div>
          }
        />

        <ShowcaseRow
          reverse
          icon={MessageCircle}
          eyebrow="WhatsApp built in"
          title="Chats stay attached to the lead — and to the right person"
          body="Message isolation means one team member's conversations never leak into another's inbox, even on shared numbers."
          bullets={[
            'Strict per-user chat and message isolation',
            'Full conversation history on every lead',
            'No more screenshots forwarded on Slack',
          ]}
          mock={
            <div className="space-y-2">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  RS
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Ravi Sharma</p>
                  <p className="text-xs text-slate-400">Lead · +91 98xxxxxx12</p>
                </div>
              </div>

              <div className="ml-auto flex max-w-[75%] flex-col items-end gap-1">
                <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                  Sending the proposal now, thanks for waiting!
                </div>
                <span className="flex items-center gap-1 pr-1 text-[11px] text-slate-400">
                  10:42 AM <CheckCheck className="h-3 w-3 text-primary" />
                </span>
              </div>

              <div className="flex max-w-[75%] flex-col gap-1">
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100 transition-transform duration-200 hover:-translate-y-0.5">
                  Perfect, looking forward to it.
                </div>
                <span className="flex items-center gap-1 pl-1 text-[11px] text-slate-400">
                  <Check className="h-3 w-3" /> 10:44 AM
                </span>
              </div>
            </div>
          }
        />

        <ShowcaseRow
          icon={Users}
          eyebrow="Team management"
          title="Assign work without guessing who has room for it"
          body="Multi-select team members onto a project and get a live capacity check before you commit anyone to a deadline."
          bullets={[
            'Automatic allocation checks across running projects',
            'Soft warnings instead of hard blocks',
            'Role-based permissions for admin, manager and user',
          ]}
          mock={
            <div>
             <div className="flex flex-wrap -space-x-3 sm:-space-x-2.5">
  {teamMembers.map(({ initials }) => (
    <span
      key={initials}
      title={initials}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold text-white shadow-sm transition-transform duration-200 hover:z-10 hover:-translate-y-1 hover:scale-105 sm:h-10 sm:w-10"
    >
      {initials}
    </span>
  ))}
  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-300 text-xs font-semibold text-slate-700 shadow-sm transition-transform duration-200 hover:z-10 hover:-translate-y-1 hover:scale-105 sm:h-10 sm:w-10">
    +3
  </span>
</div>

              <div className="mt-4 rounded-lg bg-white px-3 py-2.5 text-xs text-slate-500 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <span>Team capacity</span>
                  <span className="font-semibold text-emerald-600">72% free</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[28%] rounded-full bg-primary transition-all duration-700 ease-out" />
                </div>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
}