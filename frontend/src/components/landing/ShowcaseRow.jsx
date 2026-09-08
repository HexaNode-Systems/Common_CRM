import { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

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
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

export default function ShowcaseRow({ reverse, icon: Icon, eyebrow, title, body, bullets, mock }) {
  const [ref, visible] = useReveal();

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20 ${
        reverse ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
    >
      <div
        className="transition-all duration-700 ease-out motion-reduce:transition-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>

        <p className="mt-5 text-sm font-semibold text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 lg:text-[1.75rem]">
          {title}
        </h3>
        <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-slate-600">{body}</p>

        <ul className="mt-6 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition-all duration-700 ease-out motion-reduce:transition-none lg:p-7"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.97)',
          transitionDelay: visible ? '120ms' : '0ms',
        }}
      >
        {mock}
      </div>
    </div>
  );
}