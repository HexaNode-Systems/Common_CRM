import { useEffect, useRef, useState } from 'react';
import SectionHeading from './SectionHeading.jsx';
import { KanbanSquare, MessageCircle, Users, Vault, BarChart3, CheckCircle2 } from 'lucide-react';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

const smallFeatures = [
  {
    icon: MessageCircle,
    title: 'WhatsApp, per user',
    description:
      "Every team member sees only their own chats and messages — strictly isolated, with a full history attached to the lead.",
    span: '',
  },
  {
    icon: Users,
    title: 'Team & capacity',
    description:
      "See who's overloaded before you assign the next project, with soft warnings on over-allocation.",
    span: '',
  },
  {
    icon: Vault,
    title: 'Documents & storage, organized by project',
    description:
      'Agreements, invoices and files sorted automatically by category, with safe filenames and a document viewer built for bulk uploads.',
    span: 'lg:col-span-2',
  },
  {
    icon: BarChart3,
    title: 'Reporting',
    description:
      'Real-time visibility into pipeline value, budgets and team output — no exports required.',
    span: '',
  },
];

export default function CoreFeatures() {
  const [gridRef, visible] = useReveal();

  return (
    <section id="features" className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Core features"
          title="Everything a sales and delivery team needs, built in"
          description="No separate subscriptions for chat, tasks and reporting — it's one system that already knows how your business works."
        />

        <div ref={gridRef} className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div
            className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white transition-all duration-500 ease-out hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-950/20 motion-reduce:transition-none lg:col-span-2 lg:row-span-2"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(14px)',
              transitionProperty: 'opacity, transform, border-color, box-shadow',
              transitionDelay: visible ? '0ms' : '0ms',
            }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 transition-colors duration-300 group-hover:bg-white/15">
              <KanbanSquare className="h-6 w-6 text-indigo-300" />
            </span>
            <h3 className="mt-5 text-xl font-bold">Lead management, end to end</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Capture enquiries from every channel, assign them automatically, and track each one
              through a pipeline your team actually agrees on — from first contact to signed deal.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-300" /> Auto-assignment by territory or workload
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-300" /> Custom pipeline stages per team
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-300" /> Serial-numbered lead tracking
              </li>
            </ul>
          </div>

          {smallFeatures.map(({ icon: Icon, title, description, span }, i) => (
            <div
              key={title}
              className={`group rounded-2xl border border-slate-200 p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-slate-200/60 motion-reduce:transition-none ${span}`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(14px)',
                transitionProperty: 'opacity, transform',
                transitionDelay: visible ? `${(i + 1) * 90}ms` : '0ms',
              }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                <Icon className="h-5 w-5 text-primary transition-colors duration-300 group-hover:text-white" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}