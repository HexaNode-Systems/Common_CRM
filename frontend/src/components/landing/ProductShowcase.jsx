import { useCallback, useRef, useState } from 'react';
import ShowcaseRow from './ShowcaseRow.jsx';
import { KanbanSquare, MessageCircle, Users, Check, CheckCheck } from 'lucide-react';

const stageMeta = [
  { label: 'New', count: 18, color: 'bg-slate-500' },
  { label: 'In progress', count: 26, color: 'bg-amber-400' },
  { label: 'Closed won', count: 41, color: 'bg-emerald-400' },
];

const teamMembers = [
  { initials: 'AK', name: 'Aditi K.' },
  { initials: 'RS', name: 'Rohan S.' },
  { initials: 'MJ', name: 'Meera J.' },
  { initials: 'PV', name: 'Priya V.' },
];

const freeCapacityPct = 72;

export default function ProductShowcase() {
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
      id="product"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20 font-theme"
    >
      {/* Same moving-background language as the Hero: parallax orbs + panning grid */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="ps-orb ps-orb-1 absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/30 blur-2xl sm:h-96 sm:w-96"
          style={{ transform: `translate3d(${mouse.x * 26}px, ${mouse.y * 26}px, 0)` }}
        />
        <span
          className="ps-orb ps-orb-2 absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-indigo-500/25 blur-2xl sm:h-80 sm:w-80"
          style={{ transform: `translate3d(${mouse.x * -34}px, ${mouse.y * -34}px, 0)` }}
        />
        <span
          className="ps-orb ps-orb-3 absolute right-1/3 top-0 h-56 w-56 rounded-full bg-sky-500/20 blur-2xl sm:h-72 sm:w-72"
          style={{ transform: `translate3d(${mouse.x * 18}px, ${mouse.y * -18}px, 0)` }}
        />
        <div className="ps-grid absolute inset-0 opacity-[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/70" />
      </div>

      <div className="relative mx-auto max-w-7xl divide-y divide-white/10 px-6">
        <ShowcaseRow
          icon={KanbanSquare}
          eyebrow="Lead pipeline"
          title="A pipeline you can scan in seconds"
          body="Filter by owner, stage or date and find any lead instantly. Every field is searchable, and every status change is logged automatically — no more digging through spreadsheets."
          bullets={[
            'Instant search across name, company and email',
            'Colour-coded stages so status is obvious at a glance',
            'Reference numbers for quick lookup on calls',
          ]}
          mock={
            <div className="space-y-2.5">
              {stageMeta.map(({ label, count, color }) => (
                <div
                  key={label}
                  className="group flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{count} leads</span>
                </div>
              ))}
            </div>
          }
        />

        <ShowcaseRow
          reverse
          icon={MessageCircle}
          eyebrow="WhatsApp threads"
          title="WhatsApp that never mixes up conversations"
          body="Each conversation stays locked to its lead and its owner, even on a shared number. No more forwarded screenshots to figure out who said what."
          bullets={[
            'Per-user chat isolation, even on shared numbers',
            'Full conversation history saved on every lead',
            'Nothing gets lost between reps',
          ]}
          mock={
            <div className="space-y-2">
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  RS
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Ravi Sharma</p>
                  <p className="text-xs text-slate-500">Lead · +91 98xxxxxx12</p>
                </div>
              </div>

              <div className="ml-auto flex max-w-[75%] flex-col items-end gap-1">
                <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                  Sending the proposal now, thanks for waiting!
                </div>
                <span className="flex items-center gap-1 pr-1 text-[11px] text-slate-500">
                  10:42 AM <CheckCheck className="h-3 w-3 text-primary" />
                </span>
              </div>

              <div className="flex max-w-[75%] flex-col gap-1">
                <div className="rounded-2xl rounded-bl-sm bg-white/[0.06] px-4 py-2.5 text-sm text-slate-200 ring-1 ring-white/10 transition-transform duration-200 hover:-translate-y-0.5">
                  Perfect, looking forward to it.
                </div>
                <span className="flex items-center gap-1 pl-1 text-[11px] text-slate-500">
                  <Check className="h-3 w-3" /> 10:44 AM
                </span>
              </div>
            </div>
          }
        />

        <ShowcaseRow
          icon={Users}
          eyebrow="Team capacity"
          title="A team view that shows who actually has room for more"
          body="Select team members for a project and see a live capacity check before you commit anyone to a deadline. No more overloading your best closer."
          bullets={[
            'Live capacity checks across every running project',
            'Soft warnings instead of hard blocks',
            'Role-based permissions for admin, manager and user',
          ]}
          mock={
            <div>
              <div className="flex flex-wrap -space-x-3 sm:-space-x-2.5">
                {teamMembers.map(({ initials }) => (
                  <span
                    key={initials}
                    title={initials}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-primary text-xs font-semibold text-white shadow-sm transition-transform duration-200 hover:z-10 hover:-translate-y-1 hover:scale-105 sm:h-10 sm:w-10"
                  >
                    {initials}
                  </span>
                ))}
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-700 text-xs font-semibold text-slate-200 shadow-sm transition-transform duration-200 hover:z-10 hover:-translate-y-1 hover:scale-105 sm:h-10 sm:w-10">
                  +3
                </span>
              </div>

              <div className="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-xs text-slate-400 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <span>Team capacity</span>
                  <span className="font-semibold text-emerald-400">{freeCapacityPct}% free</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${freeCapacityPct}%` }}
                  />
                </div>
              </div>
            </div>
          }
        />
      </div>

      <style>{`
        .ps-orb {
          will-change: transform, opacity;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ps-orb-1 { animation: ps-float-a 14s ease-in-out infinite; }
        .ps-orb-2 { animation: ps-float-b 17s ease-in-out infinite; }
        .ps-orb-3 { animation: ps-float-c 12s ease-in-out infinite; }

        @keyframes ps-float-a {
          0%, 100% { margin: 0 0; opacity: 0.8; }
          50% { margin: 60px 0 0 40px; opacity: 1; }
        }
        @keyframes ps-float-b {
          0%, 100% { margin: 0 0; opacity: 0.7; }
          50% { margin: -50px 0 0 -60px; opacity: 1; }
        }
        @keyframes ps-float-c {
          0%, 100% { margin: 0 0; opacity: 0.6; }
          50% { margin: 40px 0 0 -40px; opacity: 0.9; }
        }

        .ps-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: ps-grid-pan 22s linear infinite;
        }
        @keyframes ps-grid-pan {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ps-orb-1, .ps-orb-2, .ps-orb-3, .ps-grid { animation: none !important; }
          .ps-orb { transition: none; transform: none !important; }
        }
      `}</style>
    </section>
  );
}