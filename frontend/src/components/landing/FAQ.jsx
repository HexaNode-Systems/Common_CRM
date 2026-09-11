import { useCallback, useEffect, useRef, useState } from 'react';
import SectionHeading from './SectionHeading.jsx';
import { Plus } from 'lucide-react';

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
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

const faqs = [
  {
    q: 'Can I bring in leads from my current spreadsheet?',
    a: 'Yes — import via CSV and we map the columns to your pipeline fields during setup.',
  },
  {
    q: 'Is WhatsApp messaging really isolated per user?',
    a: 'Yes. Each team member only ever sees the chats and messages assigned to them, even on a shared business number.',
  },
  {
    q: 'Can I change the branding for a client I manage this for?',
    a: 'Yes — brand name, logo, colors, fonts and content are all editable from Settings without touching code.',
  },
  {
    q: 'What happens if I outgrow the Starter plan?',
    a: 'You can upgrade at any time; your leads, projects and documents carry over with no migration needed.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  const [listRef, visible] = useReveal();
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
      id="faq"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-white py-24 font-theme"
    >
      {/* Ambient background, same family as other sections */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="faq-orb faq-orb-1 absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl sm:h-80 sm:w-80"
          style={{ transform: `translate3d(${mouse.x * 22}px, ${mouse.y * 22}px, 0)` }}
        />
        <span
          className="faq-orb faq-orb-2 absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl sm:h-96 sm:w-96"
          style={{ transform: `translate3d(${mouse.x * -30}px, ${mouse.y * -30}px, 0)` }}
        />
        <div className="faq-grid absolute inset-0 opacity-[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Questions teams usually ask" align="center" />

        <div ref={listRef} className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={f.q}
                className={`faq-item group overflow-hidden rounded-2xl border bg-white transition-all duration-300 ease-out motion-reduce:transition-none ${
                  isOpen
                    ? 'border-primary/30 shadow-lg shadow-primary/[0.06]'
                    : 'border-slate-200 hover:border-primary/25 hover:shadow-md hover:shadow-slate-200/50'
                }`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(14px)',
                  transitionProperty: 'opacity, transform, border-color, box-shadow',
                  transitionDelay: visible ? `${i * 90}ms` : '0ms',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                >
                  <span
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      isOpen ? 'text-primary' : 'text-slate-900 group-hover:text-primary'
                    }`}
                  >
                    {f.q}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      isOpen ? 'rotate-45 bg-primary text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>

                {/* smooth height animation via grid-template-rows, no JS measuring needed */}
                <div
                  className="faq-collapse grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p
                      className="px-5 pb-5 text-sm leading-relaxed text-slate-600 transition-opacity duration-300"
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transitionDelay: isOpen ? '100ms' : '0ms',
                      }}
                    >
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
        .faq-orb {
          will-change: transform, opacity;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .faq-orb-1 { animation: faq-float-a 14s ease-in-out infinite; }
        .faq-orb-2 { animation: faq-float-b 17s ease-in-out infinite; }

        @keyframes faq-float-a {
          0%, 100% { margin: 0 0; opacity: 0.7; }
          50% { margin: 50px 0 0 30px; opacity: 1; }
        }
        @keyframes faq-float-b {
          0%, 100% { margin: 0 0; opacity: 0.6; }
          50% { margin: -40px 0 0 -50px; opacity: 0.9; }
        }

        .faq-grid {
          background-image:
            linear-gradient(to right, rgba(15,23,42,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15,23,42,0.6) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: faq-grid-pan 22s linear infinite;
        }
        @keyframes faq-grid-pan {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-orb-1, .faq-orb-2, .faq-grid { animation: none !important; }
          .faq-orb { transition: none; transform: none !important; }
          .faq-collapse { transition: none !important; }
        }
      `}</style>
    </section>
  );
}