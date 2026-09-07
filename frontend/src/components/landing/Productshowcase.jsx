import ShowcaseRow from '../ShowcaseRow.jsx';
import { KanbanSquare, MessageCircle, Users } from 'lucide-react';

export default function ProductShowcase() {
  return (
    <section id="product" className="bg-white py-8 font-theme">
      <div className="mx-auto max-w-7xl divide-y divide-slate-100 px-6">
        <ShowcaseRow
          icon={KanbanSquare}
          eyebrow="Lead management"
          title="A pipeline your whole team actually looks at"
          body="Filter by owner, stage or date range and find any lead in seconds. Every field is searchable, every status change is logged."
          bullets={['Debounced global search across name, company and email', 'Color-coded status at a glance', 'Serial-numbered records for easy reference']}
          mock={
            <div className="space-y-2">
              {['Pipeline', 'Running', 'Finished'].map((s, i) => (
                <div key={s} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm font-medium text-slate-700">{s}</span>
                  <span className="text-sm font-semibold text-slate-400">{[18, 26, 41][i]} leads</span>
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
          bullets={['Strict per-user chat and message isolation', 'Full conversation history on every lead', 'No more screenshots forwarded on Slack']}
          mock={
            <div className="space-y-2">
              <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white">
                Sending the proposal now, thanks for waiting!
              </div>
              <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                Perfect, looking forward to it.
              </div>
            </div>
          }
        />

        <ShowcaseRow
          icon={Users}
          eyebrow="Team management"
          title="Assign work without guessing who has room for it"
          body="Multi-select team members onto a project and get a live capacity check before you commit anyone to a deadline."
          bullets={['Automatic allocation checks across running projects', 'Soft warnings instead of hard blocks', 'Role-based permissions for admin, manager and user']}
          mock={
            <div className="flex -space-x-2">
              {['AK', 'RS', 'MJ', 'PV'].map((i) => (
                <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary/90 text-xs font-semibold text-white">
                  {i}
                </span>
              ))}
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-600">+3</span>
            </div>
          }
        />
      </div>
    </section>
  );
}