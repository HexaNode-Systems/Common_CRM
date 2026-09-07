import { useState } from 'react';
import SectionHeading from './SectionHeading.jsx';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const faqs = [
    { q: 'Can I bring in leads from my current spreadsheet?', a: 'Yes — import via CSV and we map the columns to your pipeline fields during setup.' },
    { q: 'Is WhatsApp messaging really isolated per user?', a: 'Yes. Each team member only ever sees the chats and messages assigned to them, even on a shared business number.' },
    { q: 'Can I change the branding for a client I manage this for?', a: 'Yes — brand name, logo, colors, fonts and content are all editable from Settings without touching code.' },
    { q: 'What happens if I outgrow the Starter plan?', a: 'You can upgrade at any time; your leads, projects and documents carry over with no migration needed.' },
  ];
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Questions teams usually ask" align="center" />
        <div className="mt-10 divide-y divide-slate-100 border-t border-slate-100">
          {faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <p className="pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}