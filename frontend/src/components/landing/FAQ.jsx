import { useEffect, useRef, useState } from 'react';
import SectionHeading from './SectionHeading.jsx';
import GradientBlob from '../GradientBlob.jsx';
import { Plus } from 'lucide-react';

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

const faqs = [
  { q: 'Can I bring in leads from my current spreadsheet?', a: 'Yes — import via CSV and we map the columns to your pipeline fields during setup.' },
  { q: 'Is WhatsApp messaging really isolated per user?', a: 'Yes. Each team member only ever sees the chats and messages assigned to them, even on a shared business number.' },
  { q: 'Can I change the branding for a client I manage this for?', a: 'Yes — brand name, logo, colors, fonts and content are all editable from Settings without touching code.' },
  { q: 'What happens if I outgrow the Starter plan?', a: 'You can upgrade at any time; your leads, projects and documents carry over with no migration needed.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const [listRef, visible] = useReveal();

  return (
    <section id="faq" className="relative overflow-hidden bg-slate-950 py-24 font-theme">
      <GradientBlob position="right" />

      <div className="relative mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Questions teams usually ask" align="center" />

        <div ref={listRef} className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={f.q}
                className={`faq-item group overflow-hidden rounded-2xl border transition-all duration-300 ease-out motion-reduce:transition-none ${
                  isOpen ? 'border-primary/40 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03] hover:border-primary/25'
                }`}
                style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transitionDelay: visible ? `${i * 90}ms` : '0ms' }}
              >
                <button onClick={() => setOpenIndex(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left">
                  <span className={`text-sm font-semibold transition-colors duration-300 ${isOpen ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                    {f.q}
                  </span>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 bg-primary text-white' : 'bg-white/10 text-slate-400 group-hover:bg-primary/20 group-hover:text-primary'}`}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div className="faq-collapse grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400 transition-opacity duration-300" style={{ opacity: isOpen ? 1 : 0, transitionDelay: isOpen ? '100ms' : '0ms' }}>
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) { .faq-collapse { transition: none !important; } }
      `}</style>
    </section>
  );
}