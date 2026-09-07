import SectionHeading from './SectionHeading.jsx';
import { KanbanSquare, MessageCircle, Users, Vault, BarChart3, CheckCircle2 } from 'lucide-react';

export default function CoreFeatures() {
  return (
    <section id="features" className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Core features"
          title="Everything a sales and delivery team needs, built in"
          description="No separate subscriptions for chat, tasks and reporting — it's one system that already knows how your business works."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white lg:col-span-2 lg:row-span-2">
            <KanbanSquare className="h-8 w-8 text-indigo-300" />
            <h3 className="mt-5 text-xl font-bold">Lead management, end to end</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Capture enquiries from every channel, assign them automatically, and track each one
              through a pipeline your team actually agrees on — from first contact to signed deal.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-200">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-300" /> Auto-assignment by territory or workload</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-300" /> Custom pipeline stages per team</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-300" /> Serial-numbered lead tracking</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <MessageCircle className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">WhatsApp, per user</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Every team member sees only their own chats and messages — strictly isolated, with a full history attached to the lead.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <Users className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">Team &amp; capacity</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              See who's overloaded before you assign the next project, with soft warnings on over-allocation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 lg:col-span-2">
            <Vault className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">Documents &amp; storage, organized by project</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Agreements, invoices and files sorted automatically by category, with safe filenames and a document viewer built for bulk uploads.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">Reporting</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Real-time visibility into pipeline value, budgets and team output — no exports required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}