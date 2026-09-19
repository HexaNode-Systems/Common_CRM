import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SectionHeading from './SectionHeading.jsx';

// Accent used only for the connector "signal" — kept separate from the
// brand's `primary` token so it reads as a distinct system/status color.
const SIGNAL = '#D7FF3F';

const steps = [
  {
    title: 'Set up your workspace',
    body: 'Add your brand, colors and team in minutes — no developer needed.',
    align: 'left',
    Visual: WorkspaceVisual,
  },
  {
    title: 'Import your leads',
    body: 'Bring in existing contacts and enquiries from a spreadsheet or your old tool.',
    align: 'right',
    Visual: LeadsVisual,
  },
  {
    title: 'Connect WhatsApp',
    body: 'Link your business number so every chat lands against the right lead.',
    align: 'left',
    Visual: WhatsAppVisual,
  },
  {
    title: 'Track and grow',
    body: 'Watch pipeline, projects and team capacity from one live dashboard.',
    align: 'right',
    Visual: GrowthVisual,
  },
];

export default function HowItWorks() {
  const wrapRef = useRef(null);
  const cardRefs = useRef([]);
  const [paths, setPaths] = useState([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [visible, setVisible] = useState(() => steps.map(() => false));

  // Measure card positions and build a connector path (horizontal leg,
  // rounded corner, vertical leg) between each consecutive pair of cards.
  useLayoutEffect(() => {
    function measure() {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const wrapRect = wrap.getBoundingClientRect();
      const rects = cardRefs.current.map((el) => el?.getBoundingClientRect());

      const nextPaths = [];
      for (let i = 0; i < rects.length - 1; i++) {
        const a = rects[i];
        const b = rects[i + 1];
        if (!a || !b) continue;

        const dir = steps[i].align === 'left' ? 1 : -1; // which side the line leaves from
        const r = 28;

        const sx = (dir === 1 ? a.right : a.left) - wrapRect.left;
        const sy = a.top - wrapRect.top + Math.min(150, a.height * 0.4);
        const ex = b.left - wrapRect.left + b.width / 2;
        const ey = b.top - wrapRect.top;

        const cornerY = sy + r * (ey > sy ? 1 : -1);
        const d = `M ${sx} ${sy} H ${ex - r * dir} Q ${ex} ${sy} ${ex} ${cornerY} V ${ey}`;
        nextPaths.push(d);
      }
      setPaths(nextPaths);
      setSize({ w: wrap.scrollWidth, h: wrap.scrollHeight });
    }

    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Fade + slide each card up once it enters the viewport.
  useEffect(() => {
    const observers = cardRefs.current.map((el, i) => {
      if (!el) return null;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible((v) => {
              if (v[i]) return v;
              const next = [...v];
              next[i] = true;
              return next;
            });
            io.disconnect();
          }
        },
        { threshold: 0.3, rootMargin: '0px 0px -10% 0px' }
      );
      io.observe(el);
      return io;
    });
    return () => observers.forEach((io) => io?.disconnect());
  }, []);

  return (
    <section className="bg-slate-950 py-20 sm:py-24 font-theme overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          dark
          eyebrow="How it works"
          title="Live in a day, not a quarter"
          description="A straightforward, four-step path to bringing all your sales conversations and client workflows together."
          align="center"
        />

        <div ref={wrapRef} className="relative mt-16 sm:mt-20">
          {/* Connector overlay */}
          <svg
            className="pointer-events-none absolute inset-0 hidden lg:block"
            width={size.w}
            height={size.h}
            style={{ overflow: 'visible' }}
          >
            {paths.map((d, i) => (
              <g key={i} className={visible[i] ? 'opacity-100' : 'opacity-0'} style={{ transition: 'opacity 700ms ease 200ms' }}>
                <path d={d} fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                <circle r="3" fill={SIGNAL} style={{ offsetPath: `path("${d}")`, offsetRotate: '0deg', animation: `travel-dot 2.8s ${i * 0.5}s linear infinite`, filter: `drop-shadow(0 0 6px ${SIGNAL})` }} />
              </g>
            ))}
          </svg>

          <div className="relative flex flex-col gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <div key={step.title} className={`flex ${step.align === 'left' ? 'justify-start' : 'justify-end'}`}>
                <div
                  ref={(el) => (cardRefs.current[i] = el)}
                  className="w-full max-w-md sm:max-w-lg lg:max-w-xl rounded-2xl border border-slate-800/90 bg-slate-900/75 p-6 sm:p-7 backdrop-blur-md shadow-xl shadow-black/30 hover:border-primary/50 hover:bg-slate-900/90 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    opacity: visible[i] ? 1 : 0,
                    transform: visible[i] ? 'translateY(0)' : 'translateY(24px)',
                    transition: 'opacity 700ms ease, transform 700ms ease, border-color 300ms, background-color 300ms',
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 text-xs font-bold text-indigo-300">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Step {i + 1}
                      </span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
                      {i === 0 ? '5 mins' : i === 1 ? '1 click' : i === 2 ? 'Instant' : 'Live'}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl sm:text-2xl font-bold text-white tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300">{step.body}</p>
                  <div className="mt-5">
                    <step.Visual />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @offset-distance {
          from { offset-distance: 0%; }
          to { offset-distance: 100%; }
        }
        @keyframes travel-dot {
          0%   { offset-distance: 0%;   opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="travel-dot"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}

/* ---------------------------- mini mockups ---------------------------- */

function MockShell({ children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/70 p-4 shadow-inner">{children}</div>
  );
}

function WorkspaceVisual() {
  const colors = ['#D7FF3F', '#7C6CF6', '#38BDF8', '#F97362'];
  return (
    <MockShell>
      <div className="flex items-center gap-2.5">
        {colors.map((c) => (
          <span key={c} className="h-6 w-6 rounded-full border-2 border-slate-800 shadow-sm" style={{ background: c }} />
        ))}
      </div>
      <div className="mt-3.5 flex -space-x-2 items-center">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-7 w-7 rounded-full border-2 border-slate-950 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-xs" />
        ))}
        <div className="ml-3 flex h-7 items-center rounded-full bg-slate-800 border border-slate-700 px-3 text-[11px] font-medium text-slate-200 shadow-xs">
          Invite team
        </div>
      </div>
    </MockShell>
  );
}

function LeadsVisual() {
  const rows = [
    ['Ritika Sharma', 'New', '#D7FF3F'],
    ['Arjun Mehta', 'Contacted', '#38BDF8'],
    ['Priya Nair', 'Qualified', '#7C6CF6'],
  ];
  return (
    <MockShell>
      <div className="flex justify-between text-xs font-semibold text-slate-400 pb-1.5 border-b border-slate-800/70">
        <span>Lead</span>
        <span>Stage</span>
      </div>
      <div className="mt-2 divide-y divide-slate-800/60">
        {rows.map(([name, stage, dot]) => (
          <div key={name} className="flex items-center justify-between py-2 text-xs text-slate-200">
            <span className="font-medium">{name}</span>
            <span className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/80">
              <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
              {stage}
            </span>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function WhatsAppVisual() {
  return (
    <MockShell>
      <div className="flex items-center justify-between text-xs text-slate-200 pb-2 border-b border-slate-800/70">
        <span className="rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 font-mono text-[11px] text-slate-300">
          +91 98xxx xxxxx
        </span>
        <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[11px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Linked
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="ml-auto w-4/5 rounded-xl rounded-tr-xs bg-primary px-3 py-2 text-xs text-white shadow-xs">
          Hi! I'm interested
        </div>
        <div className="w-4/5 rounded-xl rounded-tl-xs bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 shadow-xs">
          Assigned to Ritika
        </div>
      </div>
    </MockShell>
  );
}

function GrowthVisual() {
  const bars = [40, 65, 50, 80, 60, 95];
  return (
    <MockShell>
      <div className="flex items-end gap-2 h-16 pt-2">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/30 via-primary/70 to-primary shadow-xs" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800/70">
        <span className="font-medium">Pipeline this month</span>
        <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">+24%</span>
      </div>
    </MockShell>
  );
}