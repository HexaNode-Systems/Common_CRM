import SectionHeading from './SectionHeading.jsx';
import GradientBlob from '../GradientBlob.jsx';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react';

const items = [
  {
    icon: Lock,
    badge: 'Zero Trust Session',
    title: 'JWT authentication',
    body: 'Every session is cryptographically signed and verified, with role authorization verified on every backend API request.',
  },
  {
    icon: Fingerprint,
    badge: 'Data Isolation',
    title: 'Per-user data isolation',
    body: 'WhatsApp chats and customer messages are strictly scoped to the assigned user with zero message leakage across reps.',
  },
  {
    icon: ShieldCheck,
    badge: 'Access Governance',
    title: 'Role-based permissions',
    body: 'Admins, managers and sales reps each see exactly what their role permits — with fine-grained read and write rules.',
  },
];

export default function Security() {
  return (
    <section id="security" className="relative overflow-hidden bg-slate-950 py-20 sm:py-24 font-theme">
      <GradientBlob position="right" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          dark
          eyebrow="Security"
          title="Access control that's strict by default"
          description="Data isolation isn't a setting you turn on — it's how Appnix CRM Pro is built from the ground up."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map(({ icon: Icon, badge, title, body }) => (
            <div
              key={title}
              className="group relative flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/65 p-6 sm:p-7 backdrop-blur-md shadow-lg shadow-black/25 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-slate-900/90"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-indigo-400 border border-primary/25 transition-colors duration-300 group-hover:bg-primary group-hover:text-white shadow-xs">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                  {badge}
                </span>
              </div>
              <h3 className="mt-5 text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}