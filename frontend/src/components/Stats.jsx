import { useEffect, useRef, useState } from 'react';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const stats = [
  { value: 32, suffix: '%', label: 'Faster lead response time' },
  { value: 4.6, suffix: 'x', label: 'More follow-ups logged per rep' },
  { value: 5, suffix: '→1', label: 'Tools replaced by one dashboard' },
];

export default function Stats() {
  const [ref, visible] = useReveal();

  return (
    <section ref={ref} className="relative overflow-hidden bg-slate-950 py-24 font-theme">
      <div className="relative mx-auto max-w-7xl px-6">
        <span className="mx-auto mb-10 block w-fit rounded-full border border-primary/30 px-4 py-1.5 text-sm font-medium text-primary">
          What teams achieve
        </span>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-700"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transitionDelay: visible ? `${i * 140}ms` : '0ms' }}
            >
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                {s.value}
                <span className="bg-gradient-to-r from-indigo-400 to-primary bg-clip-text text-transparent">{s.suffix}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}