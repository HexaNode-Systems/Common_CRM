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
    <section id="features" className="relative overflow-hidden bg-slate-950 py-24 font-theme">
      <GradientBlob position="left" />

      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Why teams switch" title="Common CRM replaces five disconnected tools with one" description="Every gap below is where deals usually go quiet. Hover a card to see how it's closed." />

        <div ref={gridRef} className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, short, detail }, i) => {
            const isActive = active === i;
            return (
              <div
                key={title}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 ease-out ${isActive ? 'border-primary/40 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'} ${i === 0 ? 'lg:col-span-2' : ''}`}
                style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transitionProperty: 'opacity, transform, border-color, background-color', transitionDelay: visible ? `${i * 90}ms` : '0ms' }}
              >
                <span className="relative flex h-11 w-11 items-center justify-center">
                  <span className={`absolute flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-indigo-300 transition-all duration-300 ${isActive ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`absolute flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                    <Check className="h-5 w-5" />
                  </span>
                </span>

                <h3 className="mt-4 text-base font-bold text-white">{title}</h3>

                <div className="relative mt-2">
                  <p className={`text-sm leading-relaxed text-slate-400 transition-opacity duration-300 ${isActive ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}>{short}</p>
                  <p className={`text-sm leading-relaxed text-slate-200 transition-opacity duration-300 delay-100 ${isActive ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}>{detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}