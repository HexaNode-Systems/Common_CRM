import { useCallback, useEffect, useRef, useState } from 'react';
import SectionHeading from './SectionHeading.jsx';
import { Building2, GraduationCap, Stethoscope, ShoppingBag, Briefcase, Cloud } from 'lucide-react';

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
      id="industries"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-white py-24 font-theme"
    >
      {/* Same parallax-orb + panning-grid language as ProductShowcase / CoreFeatures, kept light/white for this section */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="ind-orb ind-orb-1 absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl sm:h-96 sm:w-96"
          style={{ transform: `translate3d(${mouse.x * 26}px, ${mouse.y * 26}px, 0)` }}
        />
        <span
          className="ind-orb ind-orb-2 absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl sm:h-80 sm:w-80"
          style={{ transform: `translate3d(${mouse.x * -34}px, ${mouse.y * -34}px, 0)` }}
        />
        <span
          className="ind-orb ind-orb-3 absolute left-1/3 top-1/2 h-56 w-56 rounded-full bg-sky-100/60 blur-3xl sm:h-72 sm:w-72"
          style={{ transform: `translate3d(${mouse.x * 18}px, ${mouse.y * -18}px, 0)` }}
        />
        <div className="ind-grid absolute inset-0 opacity-[0.035]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Industries"
          title="Configured for how your business already sells"
          description="The same core system, themed and structured for your industry's pipeline and vocabulary."
        />
        <div
          ref={gridRef}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          {industries.map(({ name, icon: Icon }, i) => (
            <div
              key={name}
              className="ind-card group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.03] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 motion-reduce:transition-none"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1) rotate(0deg)' : 'translateY(20px) scale(0.9) rotate(-3deg)',
                transitionProperty: 'opacity, transform, border-color, box-shadow',
                transitionDuration: visible ? '550ms' : '0ms',
                transitionDelay: visible ? `${i * 80}ms` : '0ms',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* shine sweep on hover */}
              <span className="ind-shine pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent group-hover:translate-x-full" />

              {/* pulsing ring behind icon */}
              <span className="relative flex h-11 w-11 items-center justify-center">
                <span className="ind-pulse-ring absolute inset-0 rounded-xl bg-primary/20" />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:rotate-[8deg] group-hover:scale-110">
                  <Icon className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-white" />
                </span>
              </span>

              <span className="relative text-sm font-semibold text-slate-700 transition-colors duration-300 group-hover:text-primary">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .ind-orb {
          will-change: transform, opacity;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ind-orb-1 { animation: ind-float-a 14s ease-in-out infinite; }
        .ind-orb-2 { animation: ind-float-b 17s ease-in-out infinite; }
        .ind-orb-3 { animation: ind-float-c 12s ease-in-out infinite; }

        @keyframes ind-float-a {
          0%, 100% { margin: 0 0; opacity: 0.8; }
          50% { margin: 60px 0 0 40px; opacity: 1; }
        }
        @keyframes ind-float-b {
          0%, 100% { margin: 0 0; opacity: 0.7; }
          50% { margin: -50px 0 0 -60px; opacity: 1; }
        }
        @keyframes ind-float-c {
          0%, 100% { margin: 0 0; opacity: 0.6; }
          50% { margin: 40px 0 0 -40px; opacity: 0.9; }
        }

        .ind-grid {
          background-image:
            linear-gradient(to right, rgba(15,23,42,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15,23,42,0.6) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: ind-grid-pan 22s linear infinite;
        }
        @keyframes ind-grid-pan {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        .ind-shine {
          transition: transform 0.7s ease;
        }

        .ind-pulse-ring {
          animation: ind-pulse 2.6s ease-in-out infinite;
        }
        @keyframes ind-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.35); opacity: 0; }
        }

        .ind-card:hover .ind-pulse-ring {
          animation-play-state: paused;
          opacity: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .ind-orb-1, .ind-orb-2, .ind-orb-3, .ind-grid, .ind-pulse-ring { animation: none !important; }
          .ind-orb { transition: none; transform: none !important; }
          .ind-shine { display: none; }
        }
      `}</style>
    </section>
  );
}