import { useEffect, useRef, useState } from 'react';
import SectionHeading from './SectionHeading.jsx';
import GradientBlob from '../GradientBlob.jsx';
import { Building2, GraduationCap, Stethoscope, ShoppingBag, Briefcase, Cloud } from 'lucide-react';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const industries = [
  { name: 'Real estate', icon: Building2 },
  { name: 'Education', icon: GraduationCap },
  { name: 'Healthcare', icon: Stethoscope },
  { name: 'Retail', icon: ShoppingBag },
  { name: 'Agencies', icon: Briefcase },
  { name: 'SaaS teams', icon: Cloud },
];

export default function Industries() {
  const [gridRef, visible] = useReveal();

  return (
    <section id="industries" className="industries-light relative overflow-hidden bg-white py-24 font-theme">
      {/* GradientBlob is tuned for dark backgrounds; dimmed here so it reads as a
          faint tint on white instead of a washed-out dark shape. */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply">
        <GradientBlob position="right" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Industries"
          title="Configured for how your business already sells"
          description="The same core system, themed and structured for your industry's pipeline and vocabulary."
        />
        <div ref={gridRef} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {industries.map(({ name, icon: Icon }, i) => (
            <div
              key={name}
              className="ind-card group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-8 text-center shadow-sm shadow-slate-900/[0.03] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-md hover:shadow-slate-900/[0.06] motion-reduce:transition-none"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.94)',
                transitionDelay: visible ? `${i * 80}ms` : '0ms',
              }}
            >
              <span className="relative flex h-11 w-11 items-center justify-center">
                <span className="ind-pulse-ring absolute inset-0 rounded-xl bg-primary/20" />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-6 w-6 text-indigo-600 transition-colors duration-300 group-hover:text-white" />
                </span>
              </span>
              <span className="relative text-sm font-semibold text-slate-700 transition-colors duration-300 group-hover:text-slate-900">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SectionHeading is shared with dark sections; re-mapped here for light
          background rather than editing the shared component. */}
      <style>{`
        .industries-light h2 { color: #0f172a; }
        .industries-light p { color: #475569; }
        .industries-light [class*="text-slate-100"],
        .industries-light [class*="text-slate-200"] { color: #0f172a; }
        .industries-light [class*="text-slate-300"],
        .industries-light [class*="text-slate-400"] { color: #475569; }
        .industries-light [class*="border-white/"] { border-color: rgba(15, 23, 42, 0.1); }

        .ind-pulse-ring { animation: ind-pulse 2.6s ease-in-out infinite; }
        @keyframes ind-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        .ind-card:hover .ind-pulse-ring { animation-play-state: paused; opacity: 0; }
        @media (prefers-reduced-motion: reduce) {
          .ind-pulse-ring { animation: none !important; }
        }
      `}</style>
    </section>
  );
}