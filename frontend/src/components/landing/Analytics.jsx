import { useEffect, useRef, useState } from 'react';
import GradientBlob from '../GradientBlob.jsx';
import { TrendingUp } from 'lucide-react';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function useCountUp(target, decimals, visible, duration = 1200) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (!visible || startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return value.toFixed(decimals);
}

const bars = [40, 65, 50, 80, 60, 90, 72];

export default function Analytics() {
  const [contentRef, contentVisible] = useReveal();
  const [chartRef, chartVisible] = useReveal();
  const responseValue = useCountUp(32, 0, contentVisible);
  const followUpValue = useCountUp(4.6, 1, contentVisible);

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 font-theme">
      <GradientBlob position="left" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <div
          ref={contentRef}
          className="transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{ opacity: contentVisible ? 1 : 0, transform: contentVisible ? 'translateY(0)' : 'translateY(16px)' }}
        >
          <span className="an-icon-pulse relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
            <span className="absolute inset-0 rounded-xl bg-indigo-400/30 an-pulse-ring" />
            <TrendingUp className="relative h-5 w-5" />
          </span>
          <p className="mt-5 text-sm font-semibold text-indigo-300">Analytics</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Know where every deal and every hour went
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            Pipeline value, conversion by stage, team output and project budgets update live — no
            spreadsheet exports, no waiting for a monthly report.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="group rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-slate-900/90 shadow-sm shadow-black/20">
              <p className="text-2xl font-bold text-white">{responseValue}%</p>
              <p className="mt-1 text-xs text-slate-300 font-medium">Faster lead response</p>
            </div>
            <div className="group rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-slate-900/90 shadow-sm shadow-black/20">
              <p className="text-2xl font-bold text-white">{followUpValue}x</p>
              <p className="mt-1 text-xs text-slate-300 font-medium">More follow-ups logged</p>
            </div>
          </div>
        </div>

        <div
          ref={chartRef}
          className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 backdrop-blur-md shadow-xl shadow-black/30 transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{
            opacity: chartVisible ? 1 : 0,
            transform: chartVisible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.94)',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Weekly closed value</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-3">
            {bars.map((h, i) => (
              <div
                key={i}
                className="an-bar group relative flex-1 cursor-default rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-300 transition-all duration-300 ease-out hover:brightness-125"
                style={{
                  height: chartVisible ? `${h}%` : '0%',
                  transitionProperty: 'height, filter, transform',
                  transitionDuration: '700ms',
                  transitionDelay: chartVisible ? `${300 + i * 90}ms` : '0ms',
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  {h}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .an-pulse-ring { animation: an-pulse 2.4s ease-in-out infinite; }
        @keyframes an-pulse { 0%,100%{transform:scale(1);opacity:.5;} 50%{transform:scale(1.4);opacity:0;} }
        .an-bar:hover { transform: scaleY(1.02); transform-origin: bottom; }
        @media (prefers-reduced-motion: reduce) { .an-pulse-ring { animation: none !important; } }
      `}</style>
    </section>
  );
}