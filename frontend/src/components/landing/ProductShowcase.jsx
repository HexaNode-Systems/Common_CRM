import { useEffect, useRef, useState } from 'react';
import { KanbanSquare, MessageCircle, Users, BarChart3, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: KanbanSquare,
    badge: 'Pipeline Management',
    title: 'A pipeline you can scan in seconds',
    body: 'Filter by owner, stage or date and find any lead instantly. Every status change is logged automatically without manual tracking.',
    renderVisual: () => (
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Active Pipeline
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
            32 Leads Active
          </span>
        </div>
        <div className="mt-3.5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50/90 p-2.5 border border-slate-200/80 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-700">New</p>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-md">12</span>
            </div>
            <div className="mt-2.5 rounded-lg bg-white p-2.5 shadow-2xs border border-slate-200/90 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/30 transition-all duration-200 cursor-default">
              <p className="text-[11px] font-semibold text-slate-800">Acme Corp</p>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">₹1,20,000</p>
            </div>
          </div>
          <div className="rounded-xl bg-indigo-50/40 p-2.5 border border-indigo-100 hover:border-indigo-200/80 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-indigo-950">In Talk</p>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-md">8</span>
            </div>
            <div className="mt-2.5 rounded-lg bg-white p-2.5 shadow-2xs border border-indigo-200/70 hover:-translate-y-0.5 hover:shadow-sm hover:border-indigo-300 transition-all duration-200 cursor-default">
              <p className="text-[11px] font-semibold text-slate-800">Studio Loom</p>
              <p className="text-[10px] font-semibold text-indigo-600 mt-0.5">₹2,40,000</p>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50/40 p-2.5 border border-emerald-100 hover:border-emerald-200/80 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-950">Proposal</p>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">4</span>
            </div>
            <div className="mt-2.5 rounded-lg bg-white p-2.5 shadow-2xs border border-emerald-200/70 hover:-translate-y-0.5 hover:shadow-sm hover:border-emerald-300 transition-all duration-200 cursor-default">
              <p className="text-[11px] font-semibold text-slate-800">Fernway Co</p>
              <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">₹4,80,000</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: MessageCircle,
    badge: 'WhatsApp Isolation',
    title: 'WhatsApp that never mixes up conversations',
    body: 'Each conversation stays strictly locked to its lead and owner, even on a shared business number, with zero message leakage.',
    renderVisual: () => (
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">W</span>
            <span className="text-xs font-semibold text-slate-800">+91 98765 43210</span>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">Assigned: Ritika S.</span>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          <div className="ml-auto w-3/4 rounded-xl rounded-tr-xs bg-indigo-600 p-2.5 text-white">
            <p className="text-[11px]">Hello! Here is the quote for your CRM rollout.</p>
            <span className="mt-1 block text-[9px] text-indigo-200 text-right">10:42 AM · Sent</span>
          </div>
          <div className="w-3/4 rounded-xl rounded-tl-xs bg-slate-100 p-2.5 text-slate-800">
            <p className="text-[11px]">Looks solid. Can we schedule a demo call today?</p>
            <span className="mt-1 block text-[9px] text-slate-400">10:44 AM · Received</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Users,
    badge: 'Capacity Planning',
    title: 'A team view that shows who has room',
    body: 'Live capacity checks across every project, with soft warnings before you commit anyone to a new sprint or client deal.',
    renderVisual: () => (
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 mb-3">Live Team Workload</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>Ritika Sharma (Sales Lead)</span>
              <span className="text-emerald-600 font-semibold">65% Loaded</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: '65%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>Arjun Mehta (Ops Specialist)</span>
              <span className="text-amber-600 font-semibold">85% Loaded</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-amber-500" style={{ width: '85%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>Devansh Rao (Tech Delivery)</span>
              <span className="text-indigo-600 font-semibold">40% Available</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    badge: 'Automated Reporting',
    title: 'Reporting that updates itself',
    body: 'Pipeline value, team output, and deal velocity update in real time — no manual spreadsheets or month-end exports required.',
    renderVisual: () => (
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Pipeline Value</span>
            <p className="mt-1 text-lg font-extrabold text-slate-900">₹38,40,000</p>
            <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-emerald-600">+18% this month</span>
          </div>
          <div className="rounded-lg bg-indigo-50/50 p-3 border border-indigo-100/60">
            <span className="text-[10px] uppercase font-semibold text-indigo-700">Win Rate</span>
            <p className="mt-1 text-lg font-extrabold text-indigo-900">76.4%</p>
            <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-indigo-600">Across 12 Reps</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Automated nightly sync</span>
          <span className="text-[10px] text-emerald-600">Zero CSV exports</span>
        </div>
      </div>
    ),
  },
];

function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function onScroll() {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? -rect.top / total : 0;
      setProgress(Math.min(Math.max(p, 0), 1));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref]);
  return progress;
}

export default function ProductShowcase() {
  const containerRef = useRef(null);
  const progress = useScrollProgress(containerRef);
  const rawIndex = progress * steps.length;
  const activeIndex = Math.min(steps.length - 1, Math.floor(rawIndex));
  const dotPercent = Math.min(progress * 100, 100);

  return (
    <section id="product" className="relative bg-white font-theme">
      {/* Desktop Sticky Showcase (falls back to normal scroll on <lg and for reduced-motion) */}
      <div
        ref={containerRef}
        className="ps-sticky-showcase relative hidden lg:block"
        style={{ height: `${steps.length * 60}vh` }}
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          {/* Seam at top of sticky viewport */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[60px_1fr_1.1fr]">
            {/* Vertical indicator line + moving dot */}
            <div className="relative hidden justify-self-center lg:block h-64">
              <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-slate-200 via-indigo-200 to-slate-200 rounded-full" />
              <div
                className="ps-dot absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-primary ring-4 ring-primary/20 shadow-md shadow-primary/40 transition-[top] duration-200 ease-out"
                style={{ top: `${dotPercent}%` }}
              />
            </div>

            {/* Active step text content */}
            <div key={`text-${activeIndex}`} className="ps-step-in">
              {(() => {
                const Icon = steps[activeIndex].icon;
                return (
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20 text-indigo-600 shadow-xs">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-700">
                      {steps[activeIndex].badge}
                    </span>
                  </div>
                );
              })()}
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {steps[activeIndex].title}
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
                {steps[activeIndex].body}
              </p>

              <div className="mt-8 flex gap-2">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIndex ? 'w-8 bg-primary shadow-xs' : 'w-4 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Active step interactive visual mockup */}
            <div key={`visual-${activeIndex}`} className="ps-step-in">
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
                {steps[activeIndex].renderVisual()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fallback to Normal Scrolling (Active on Mobile, Tablet & prefers-reduced-motion) */}
      <div className="ps-fallback-showcase block lg:hidden py-16 sm:py-20 px-4 sm:px-6 max-w-3xl mx-auto space-y-8 sm:space-y-10">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary uppercase tracking-wider">
            Product Showcase
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            A pipeline and workflow you can trust
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Every conversation, pipeline stage, and capacity check in one place.
          </p>
        </div>

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/75 p-5 sm:p-7 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20 text-indigo-600 shadow-xs">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    {step.badge}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  0{i + 1}
                </span>
              </div>

              <h3 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-600">
                {step.body}
              </p>

              <div className="mt-5">
                {step.renderVisual()}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .ps-step-in {
          animation: ps-step-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes ps-step-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ps-sticky-showcase {
            display: none !important;
          }
          .ps-fallback-showcase {
            display: block !important;
          }
          .ps-step-in {
            animation: none !important;
            transform: none !important;
          }
          .ps-dot {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}