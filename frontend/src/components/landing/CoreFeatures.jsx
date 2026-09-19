import { useEffect, useRef, useState } from 'react';
import SectionHeading from './SectionHeading.jsx';
import GradientBlob from '../GradientBlob.jsx';
import { KanbanSquare, MessageCircle, Users, Vault, BarChart3, Check } from 'lucide-react';

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const items = [
  { icon: KanbanSquare, title: 'Leads scatter across tools', short: 'Enquiries land in five places and no one owns the follow-up.', detail: 'Every lead is captured automatically and assigned by territory or workload, moving through a pipeline your whole team can see.' },
  { icon: MessageCircle, title: 'WhatsApp threads get mixed up', short: 'Reps reply from personal phones with no record of who said what.', detail: 'Each conversation stays locked to its lead and owner — even on a shared number — with full history saved automatically.' },
  { icon: Users, title: 'No one sees who has room', short: 'You find out a rep is overloaded after assigning them.', detail: 'Live capacity checks across every project, with soft warnings before you commit anyone to a deadline.' },
  { icon: Vault, title: 'Documents live in six inboxes', short: 'Agreements and invoices get buried in email threads.', detail: 'Files sort automatically by project and category, with a viewer built for bulk uploads.' },
  { icon: BarChart3, title: 'Reporting means waiting', short: 'Numbers only show up once someone builds the export.', detail: 'Pipeline value, budgets and team output update live — nothing to compile at month end.' },
];

export default function CoreFeatures() {
  const [gridRef, visible] = useReveal();
  const [active, setActive] = useState(null);

  return (
    <section id="features" className="relative overflow-hidden bg-slate-950 py-20 sm:py-24 font-theme">
      <GradientBlob position="left" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          dark
          eyebrow="Why teams switch"
          title="Appnix CRM Pro replaces five disconnected tools with one"
          description="Every gap below is where deals usually go quiet. Hover or tap a card to see how it's closed."
        />

        <div ref={gridRef} className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, short, detail }, i) => {
            const isActive = active === i;
            return (
              <div
                key={title}
                tabIndex={0}
                role="button"
                aria-pressed={isActive}
                onClick={() => setActive(active === i ? null : i)}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ease-out cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 ${
                  isActive
                    ? 'border-primary/50 bg-slate-900/95 shadow-lg shadow-primary/10 -translate-y-1'
                    : 'border-slate-800/90 bg-slate-900/60 hover:border-primary/40 hover:bg-slate-900/80 hover:-translate-y-0.5 shadow-sm shadow-black/20'
                } ${i === 0 ? 'lg:col-span-2' : ''}`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? undefined : 'translateY(14px)',
                  transitionProperty: 'opacity, transform, border-color, background-color, box-shadow',
                  transitionDelay: visible ? `${i * 80}ms` : '0ms',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="relative flex h-11 w-11 items-center justify-center">
                    <span
                      className={`absolute flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-indigo-300 border border-primary/25 transition-all duration-300 ${
                        isActive ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={`absolute flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30 transition-all duration-300 ${
                        isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                      }`}
                    >
                      <Check className="h-5 w-5" />
                    </span>
                  </span>

                  <span className={`text-[11px] font-semibold tracking-wider uppercase transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-slate-300'
                  }`}>
                    {isActive ? 'Solution' : 'The Gap'}
                  </span>
                </div>

                <h3 className="mt-5 text-base sm:text-lg font-bold text-white tracking-tight">
                  {title}
                </h3>

                <div className="relative mt-2.5 min-h-[52px]">
                  <p
                    className={`text-sm leading-relaxed text-slate-300 transition-opacity duration-300 ${
                      isActive ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
                    }`}
                  >
                    {short}
                  </p>
                  <p
                    className={`text-sm leading-relaxed text-slate-100 font-medium transition-opacity duration-300 delay-75 ${
                      isActive ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
                    }`}
                  >
                    {detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}