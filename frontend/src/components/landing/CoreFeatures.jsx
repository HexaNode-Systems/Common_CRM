import { useCallback, useEffect, useRef, useState } from 'react';
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
  const sectionRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouse({ x, y });
  }, []);
  const handleMouseLeave = useCallback(() => setMouse({ x: 0, y: 0 }), []);

  return (
    <section
      id="features"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-white py-24 font-theme"
    >
      {/* Same parallax-orb + panning-grid language as ProductShowcase, tuned lighter/whiter for this section */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="cf-orb cf-orb-1 absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl sm:h-96 sm:w-96"
          style={{ transform: `translate3d(${mouse.x * 26}px, ${mouse.y * 26}px, 0)` }}
        />
        <span
          className="cf-orb cf-orb-2 absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl sm:h-80 sm:w-80"
          style={{ transform: `translate3d(${mouse.x * -34}px, ${mouse.y * -34}px, 0)` }}
        />
        <span
          className="cf-orb cf-orb-3 absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-sky-100/60 blur-3xl sm:h-72 sm:w-72"
          style={{ transform: `translate3d(${mouse.x * 18}px, ${mouse.y * -18}px, 0)` }}
        />
        <div className="cf-grid absolute inset-0 opacity-[0.035]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Core features"
          title="Everything a sales and delivery team needs, built in"
          description="No separate subscriptions for chat, tasks and reporting — it's one system that already knows how your business works."
        />

        <div ref={gridRef} className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div
            className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-white transition-all duration-500 ease-out hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-950/20 motion-reduce:transition-none lg:col-span-2 lg:row-span-2"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(14px)',
              transitionProperty: 'opacity, transform, border-color, box-shadow',
              transitionDelay: visible ? '0ms' : '0ms',
            }}
          >
            {/* subtle white glow inside the dark card, echoing the section's white theme */}
            <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 transition-colors duration-300 group-hover:bg-white/15">
              <KanbanSquare className="h-6 w-6 text-indigo-300" />
            </span>
            <h3 className="relative mt-5 text-xl font-bold">Lead management, end to end</h3>
            <p className="relative mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Capture enquiries from every channel, assign them automatically, and track each one
              through a pipeline your team actually agrees on — from first contact to signed deal.
            </p>
            <ul className="relative mt-6 space-y-2.5 text-sm text-slate-200">
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
              className={`group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-slate-200/60 motion-reduce:transition-none ${span}`}
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

      <style>{`
        .cf-orb {
          will-change: transform, opacity;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cf-orb-1 { animation: cf-float-a 14s ease-in-out infinite; }
        .cf-orb-2 { animation: cf-float-b 17s ease-in-out infinite; }
        .cf-orb-3 { animation: cf-float-c 12s ease-in-out infinite; }

        @keyframes cf-float-a {
          0%, 100% { margin: 0 0; opacity: 0.8; }
          50% { margin: 60px 0 0 40px; opacity: 1; }
        }
        @keyframes cf-float-b {
          0%, 100% { margin: 0 0; opacity: 0.7; }
          50% { margin: -50px 0 0 -60px; opacity: 1; }
        }
        @keyframes cf-float-c {
          0%, 100% { margin: 0 0; opacity: 0.6; }
          50% { margin: 40px 0 0 -40px; opacity: 0.9; }
        }

        .cf-grid {
          background-image:
            linear-gradient(to right, rgba(15,23,42,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15,23,42,0.6) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: cf-grid-pan 22s linear infinite;
        }
        @keyframes cf-grid-pan {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cf-orb-1, .cf-orb-2, .cf-orb-3, .cf-grid { animation: none !important; }
          .cf-orb { transition: none; transform: none !important; }
        }
      `}</style>
    </section>
  );
}