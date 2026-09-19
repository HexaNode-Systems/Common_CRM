import {
  LayoutDashboard,
  MessageCircle,
  Users,
  FolderKanban,
  FileText,
  Palette,
  ShieldCheck,
  Receipt,
  BarChart3,
  Tags,
} from 'lucide-react';

// One pool of feature cards — split across the columns below.
// Swap the copy/icons for whatever you want to highlight; everything
// else (loop, spacing, timing) keeps working unchanged.
const FEATURES = [
  {
    icon: MessageCircle,
    title: 'WhatsApp, Linked Per Lead',
    body: 'Connect one business number and every chat lands against the right lead automatically.',
  },
  {
    icon: FolderKanban,
    title: 'Full Project Lifecycle',
    body: 'Track pipeline, running, finished and blocked projects with timelines and budgets in one table.',
  },
  {
    icon: Users,
    title: 'Team Capacity, Visible',
    body: 'See who is over-allocated before you assign them to another running project.',
  },
  {
    icon: Palette,
    title: 'Rebrand Without a Rebuild',
    body: 'Change colors, fonts and logo from Settings — every reusable component updates instantly.',
  },
  {
    icon: FileText,
    title: 'Documents, Organized',
    body: 'Agreements, PRDs and invoices are stored and categorized per project automatically.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    body: 'Admins, managers and users each see exactly what they are allowed to touch.',
  },
  {
    icon: Receipt,
    title: 'Invoices & Payments',
    body: 'Generate invoices and track payment status without leaving the dashboard.',
  },
  {
    icon: BarChart3,
    title: 'Reports That Update Live',
    body: 'Pipeline, revenue and team load recalculate as soon as new data comes in.',
  },
  {
    icon: Tags,
    title: 'Coupons & Banners',
    body: 'Run promotions and update site banners without touching a line of code.',
  },
  {
    icon: LayoutDashboard,
    title: 'One Panel, Any Client',
    body: 'Reuse the same admin panel for product or service businesses — just change the settings.',
  },
];

function Card({ icon: Icon, title, body }) {
  return (
    <div className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={18} />
      </span>
      <h4 className="mt-4 text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function Column({ items, duration, className = '' }) {
  // Render the list twice back-to-back, then animate translateY 0 -> -50%.
  // Because the second copy is identical, the loop point is seamless.
  const doubled = [...items, ...items];
  return (
    <div className={`absolute w-72 overflow-hidden ${className}`} style={{ maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)' }}>
      <div
        className="flex flex-col gap-6"
        style={{ animation: `drift-up ${duration}s linear infinite` }}
      >
        {doubled.map((f, i) => (
          <Card key={i} {...f} />
        ))}
      </div>
    </div>
  );
}

export default function FloatingFeatureCards() {
  const left = [FEATURES[0], FEATURES[3], FEATURES[6], FEATURES[9]];
  const rightA = [FEATURES[1], FEATURES[4], FEATURES[7]];
  const rightB = [FEATURES[2], FEATURES[5], FEATURES[8]];

  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block" aria-hidden="true">
      <Column items={left} duration={26} className="left-[2%] lg:left-[6%] top-0 h-full" />
      <Column items={rightA} duration={22} className="right-[2%] lg:right-[6%] top-0 h-full" />
      <Column items={rightB} duration={30} className="right-[22%] lg:right-[28%] top-0 hidden h-full opacity-70 xl:block" />

      <style>{`
        @keyframes drift-up {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="drift-up"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}