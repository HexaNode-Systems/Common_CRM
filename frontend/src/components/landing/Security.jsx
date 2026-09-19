import SectionHeading from './SectionHeading.jsx';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react';

const items = [
  { icon: Lock, title: 'JWT authentication', body: 'Every session is signed and verified, with role checks on every request.' },
  { icon: Fingerprint, title: 'Per-user data isolation', body: 'WhatsApp chats and messages are strictly scoped to the user who owns them.' },
  { icon: ShieldCheck, title: 'Role-based permissions', body: 'Admins, managers and users each see exactly what their role allows.' },
];

export default function Security() {
  return (
    <section className="bg-slate-950 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Security" title="Access control that's strict by default" description="Data isolation isn't a setting you turn on — it's how the system is built." />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}