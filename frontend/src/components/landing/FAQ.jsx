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
    <section id="faq" className="faq-light relative overflow-hidden bg-white py-24 font-theme">
      {/* GradientBlob is tuned for dark backgrounds; dimmed here so it reads as a
          faint tint on white instead of a washed-out pale shape. */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply">
        <GradientBlob position="right" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Questions teams usually ask" align="center" />

        <div ref={listRef} className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={f.q}
                className={`faq-item group overflow-hidden rounded-2xl border transition-all duration-300 ease-out motion-reduce:transition-none ${
                  isOpen ? 'border-primary/40 bg-primary/[0.04]' : 'border-slate-200 bg-slate-50/70 hover:border-primary/25'
                }`}
                style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transitionDelay: visible ? `${i * 90}ms` : '0ms' }}
              >
                <button onClick={() => setOpenIndex(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left">
                  <span className={`text-sm font-semibold transition-colors duration-300 ${isOpen ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                    {f.q}
                  </span>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 bg-primary text-white' : 'bg-slate-900/5 text-slate-500 group-hover:bg-primary/15 group-hover:text-primary'}`}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div className="faq-collapse grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 transition-opacity duration-300" style={{ opacity: isOpen ? 1 : 0, transitionDelay: isOpen ? '100ms' : '0ms' }}>
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SectionHeading is shared with dark sections; re-mapped here for light background */}
      <style>{`
        .faq-light h2 { color: #0f172a; }
        .faq-light p { color: #475569; }
        .faq-light [class*="text-slate-100"],
        .faq-light [class*="text-slate-200"] { color: #0f172a; }
        .faq-light [class*="text-slate-300"],
        .faq-light [class*="text-slate-400"] { color: #475569; }
        .faq-light [class*="border-white/"] { border-color: rgba(15, 23, 42, 0.1); }

        @media (prefers-reduced-motion: reduce) { .faq-collapse { transition: none !important; } }
      `}</style>
    </section>
  );
}