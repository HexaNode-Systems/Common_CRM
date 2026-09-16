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
    <section className="bg-slate-950 py-24 font-theme overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="How it works" title="Live in a day, not a quarter" align="center" />

        <div ref={wrapRef} className="relative mt-20">
          {/* Connector overlay */}
          <svg
            className="pointer-events-none absolute inset-0 hidden lg:block"
            width={size.w}
            height={size.h}
            style={{ overflow: 'visible' }}
          >
            {paths.map((d, i) => (
              <g key={i} className={visible[i] ? 'opacity-100' : 'opacity-0'} style={{ transition: 'opacity 700ms ease 200ms' }}>
                <path d={d} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" strokeLinecap="round" />
                <circle r="3" fill={SIGNAL} style={{ offsetPath: `path("${d}")`, offsetRotate: '0deg', animation: `travel-dot 2.8s ${i * 0.5}s linear infinite`, filter: `drop-shadow(0 0 6px ${SIGNAL})` }} />
              </g>
            ))}
          </svg>

          <div className="relative flex flex-col gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <div key={step.title} className={`flex ${step.align === 'left' ? 'justify-start' : 'justify-end'}`}>
                <div
                  ref={(el) => (cardRefs.current[i] = el)}
                  className="w-full max-w-sm rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm"
                  style={{
                    opacity: visible[i] ? 1 : 0,
                    transform: visible[i] ? 'translateY(0)' : 'translateY(24px)',
                    transition: 'opacity 700ms ease, transform 700ms ease',
                  }}
                >
                  <span className="text-sm font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
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
    <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-900/70 p-3">{children}</div>
  );
}

function WorkspaceVisual() {
  const colors = ['#D7FF3F', '#7C6CF6', '#38BDF8', '#F97362'];
  return (
    <MockShell>
      <div className="flex items-center gap-2">
        {colors.map((c) => (
          <span key={c} className="h-5 w-5 rounded-full border border-white/10" style={{ background: c }} />
        ))}
      </div>
      <div className="mt-3 flex -space-x-2">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-7 w-7 rounded-full border-2 border-slate-900 bg-slate-700" />
        ))}
        <div className="ml-1 flex h-7 items-center rounded-full bg-white/5 px-2 text-[11px] text-slate-300">Invite team</div>
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
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>Lead</span>
        <span>Stage</span>
      </div>
      <div className="mt-2 divide-y divide-white/5">
        {rows.map(([name, stage, dot]) => (
          <div key={name} className="flex items-center justify-between py-1.5 text-[11px] text-slate-300">
            <span>{name}</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
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
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span className="rounded-md bg-white/5 px-2 py-1">+91 98xxx xxxxx</span>
        <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Linked
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="ml-auto w-3/5 rounded-lg rounded-tr-sm bg-primary/20 px-2 py-1 text-[11px] text-white">Hi! I'm interested</div>
        <div className="w-3/5 rounded-lg rounded-tl-sm bg-white/5 px-2 py-1 text-[11px] text-slate-300">Assigned to Ritika</div>
      </div>
    </MockShell>
  );
}

function GrowthVisual() {
  const bars = [40, 65, 50, 80, 60, 95];
  return (
    <MockShell>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/20 to-primary" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Pipeline this month</span>
        <span className="font-semibold text-emerald-400">+24%</span>
      </div>
    </MockShell>
  );
}