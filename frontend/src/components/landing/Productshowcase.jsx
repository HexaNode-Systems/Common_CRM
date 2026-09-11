import { useEffect, useRef, useState } from 'react';
import { KanbanSquare, MessageCircle, Users, BarChart3 } from 'lucide-react';

const steps = [
  { icon: KanbanSquare, title: 'A pipeline you can scan in seconds', body: 'Filter by owner, stage or date and find any lead instantly. Every status change is logged automatically.' },
  { icon: MessageCircle, title: 'WhatsApp that never mixes up conversations', body: 'Each conversation stays locked to its lead and owner, even on a shared number.' },
  { icon: Users, title: 'A team view that shows who has room', body: 'Live capacity checks across every project, with soft warnings before you commit anyone.' },
  { icon: BarChart3, title: 'Reporting that updates itself', body: 'Pipeline value and team output update in real time — no exports required.' },
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
    <section id="product" ref={containerRef} className="relative bg-slate-950 font-theme" style={{ height: `${steps.length * 90}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 px-6 lg:grid-cols-[80px_1fr]">
          {/* connecting line + moving dot */}
          <div className="relative hidden justify-self-center lg:block">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
            <div
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_16px_4px_rgba(99,102,241,0.6)] transition-[top] duration-150 ease-out"
              style={{ top: `${dotPercent}%` }}
            />
          </div>

          {/* active step content */}
          <div key={activeIndex} className="ps-step-in">
            {(() => {
              const Icon = steps[activeIndex].icon;
              return (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-6 w-6 text-indigo-300" />
                </span>
              );
            })()}
            <h3 className="mt-6 text-3xl font-bold text-white sm:text-4xl">{steps[activeIndex].title}</h3>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-300">{steps[activeIndex].body}</p>

            <div className="mt-8 flex gap-2">
              {steps.map((_, i) => (
                <span key={i} className={`h-1 w-8 rounded-full transition-colors duration-300 ${i === activeIndex ? 'bg-primary' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ps-step-in { animation: ps-step-in 0.4s ease-out; }
        @keyframes ps-step-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .ps-step-in { animation: none; }
        }
      `}</style>
    </section>
  );
}