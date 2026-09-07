import SectionHeading from './SectionHeading.jsx';
import { Star } from 'lucide-react';

export default function Testimonials() {
  const quotes = [
    { name: 'Meera Iyer', role: 'Founder, Studio Loom', quote: 'We stopped losing enquiries the week we switched. Everyone finally works off the same list.' },
    { name: 'Devansh Rao', role: 'Ops Lead, Fernway Agency', quote: 'The WhatsApp isolation alone saved us from three awkward conversations about who owns which client.' },
    { name: 'Ishita Sharma', role: 'Director, Vantage Clinics', quote: 'Project budgets and documents finally live in one place instead of six email threads.' },
  ];
  return (
    <section className="bg-slate-50 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Customers" title="Teams who used to work out of five tools" align="center" />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {quotes.map((q) => (
            <div key={q.name} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">&ldquo;{q.quote}&rdquo;</p>
              <p className="mt-5 text-sm font-semibold text-slate-900">{q.name}</p>
              <p className="text-xs text-slate-500">{q.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}