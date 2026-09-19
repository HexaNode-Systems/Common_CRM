import SectionHeading from './SectionHeading.jsx';
import {
  MessageSquare,
  Cloud,
  Mail,
  Calendar,
  CreditCard,
  Webhook,
  FileSpreadsheet,
  Code2,
} from 'lucide-react';

const tools = [
  {
    name: 'WhatsApp Business',
    desc: 'Official Cloud API & Web sync',
    icon: MessageSquare,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
  },
  {
    name: 'Cloud Storage',
    desc: 'Encrypted document vault',
    icon: Cloud,
    color: 'text-sky-600 bg-sky-50 border-sky-200/60',
  },
  {
    name: 'Email Integration',
    desc: 'Two-way SMTP & IMAP sync',
    icon: Mail,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
  },
  {
    name: 'Calendar & Tasks',
    desc: 'Automated follow-up reminders',
    icon: Calendar,
    color: 'text-amber-600 bg-amber-50 border-amber-200/60',
  },
  {
    name: 'Payment Gateways',
    desc: 'Razorpay, Stripe & UPI tracking',
    icon: CreditCard,
    color: 'text-violet-600 bg-violet-50 border-violet-200/60',
  },
  {
    name: 'Webhooks & Zapier',
    desc: 'Real-time event dispatching',
    icon: Webhook,
    color: 'text-blue-600 bg-blue-50 border-blue-200/60',
  },
  {
    name: 'CSV Import & Export',
    desc: 'One-click spreadsheet migration',
    icon: FileSpreadsheet,
    color: 'text-teal-600 bg-teal-50 border-teal-200/60',
  },
  {
    name: 'REST API Access',
    desc: 'Full developer programmatic access',
    icon: Code2,
    color: 'text-rose-600 bg-rose-50 border-rose-200/60',
  },
];

export default function Integrations() {
  return (
    <section className="integrations-light relative bg-white py-20 sm:py-24 font-theme">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Integrations"
          title="Fits seamlessly into your existing tech stack"
          description="Connect your favorite business channels, payment gateways and storage providers in minutes without custom code."
          align="center"
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ name, desc, icon: Icon, color }) => (
            <div
              key={name}
              className="group relative flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-md hover:shadow-slate-900/[0.04]"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${color} transition-transform duration-300 group-hover:scale-105`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
              </div>
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