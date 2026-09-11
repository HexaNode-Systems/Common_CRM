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

// Mouse-tracking 3D tilt + spotlight, same interaction language as the Hero orbs
function useTilt() {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glowX: 50, glowY: 50 });

  const onMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * -7, y: (px - 0.5) * 7, glowX: px * 100, glowY: py * 100 });
  };
  const onMouseLeave = () => setTilt({ x: 0, y: 0, glowX: 50, glowY: 50 });

  return { cardRef, tilt, onMouseMove, onMouseLeave };
}

export default function ShowcaseRow({ reverse, icon: Icon, eyebrow, title, body, bullets, mock }) {
  const [ref, visible] = useReveal();
  const { cardRef, tilt, onMouseMove, onMouseLeave } = useTilt();
  const textFrom = reverse ? 40 : -40;
  const cardFrom = reverse ? -40 : 40;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20 ${
        reverse ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
    >
      {/* Text column — slides in horizontally, opposite direction from the card */}
      <div
        className="transition-all duration-700 motion-reduce:transition-none"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : `translateX(${textFrom}px)`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25 transition-transform duration-500 ease-out"
          style={{ transform: visible ? 'scale(1)' : 'scale(0.8)', transitionDelay: '100ms' }}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>

        <p
          className="mt-5 text-sm font-semibold text-sky-300 transition-all duration-500 ease-out"
          style={{ opacity: visible ? 1 : 0, transitionDelay: '160ms' }}
        >
          {eyebrow}
        </p>

        <h3
          className="mt-2 text-2xl font-extrabold tracking-tight text-white lg:text-[1.75rem] transition-all duration-500 ease-out"
          style={{ opacity: visible ? 1 : 0, transitionDelay: '220ms' }}
        >
          {title}
        </h3>

        <p
          className="mt-4 max-w-[46ch] text-base leading-relaxed text-slate-300 transition-all duration-500 ease-out"
          style={{ opacity: visible ? 1 : 0, transitionDelay: '280ms' }}
        >
          {body}
        </p>

        <ul className="mt-6 space-y-3">
          {bullets.map((b, i) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-sm text-slate-300 transition-all duration-500 ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(-10px)',
                transitionDelay: `${360 + i * 90}ms`,
              }}
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Visual column — slides in from the opposite side, then tilts toward the cursor */}
      <div className="relative" style={{ perspective: '1000px' }}>
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-primary/25 blur-3xl"
          style={{ animation: 'sr-float 8s ease-in-out infinite' }}
        />
        <div
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur-sm transition-[transform,box-shadow] duration-200 ease-out hover:border-white/20 lg:p-7"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? `translateX(0) scale(1) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
              : `translateX(${cardFrom}px) scale(0.96)`,
            transitionDuration: '700ms',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
            style={{
              background: `radial-gradient(320px circle at ${tilt.glowX}% ${tilt.glowY}%, rgba(99,102,241,0.18), transparent 70%)`,
            }}
          />
          <div className="relative">{mock}</div>
        </div>
      </div>

      <style>{`
        @keyframes sr-float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(12px, -16px); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}