import SectionHeading from './SectionHeading.jsx';
import ScrollRevealText from '../ScrollRevealText.jsx';
import GradientBlob from '../GradientBlob.jsx';
import { Star } from 'lucide-react';

const quotes = [
  { name: 'Meera Iyer', role: 'Founder, Studio Loom', quote: 'We stopped losing enquiries the week we switched. Everyone finally works off the same list.' },
  { name: 'Devansh Rao', role: 'Ops Lead, Fernway Agency', quote: 'The WhatsApp isolation alone saved us from three awkward conversations about who owns which client.' },
  { name: 'Ishita Sharma', role: 'Director, Vantage Clinics', quote: 'Project budgets and documents finally live in one place instead of six email threads.' },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 font-theme">
      <GradientBlob position="left" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <span className="mx-auto mb-8 block w-fit rounded-full border border-primary/30 px-4 py-1.5 text-sm font-medium text-primary">
          What our customers are saying
        </span>

        <span className="mx-auto block text-5xl leading-none text-slate-700">&ldquo;</span>

        <ScrollRevealText
          className="mt-2 text-xl italic leading-relaxed sm:text-2xl"
          text="The implementation of Common CRM will have reduced the inherent friction that comes with manually chasing leads across five different tools, improving agility and the service our team provides to customers."
          highlightWords={['reduced', 'agility', 'friction']}
        />

        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-2 pl-2 pr-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
            MI
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Meera Iyer</p>
            <p className="text-xs text-slate-400">Founder, Studio Loom</p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-20 max-w-7xl px-6">
        <SectionHeading eyebrow="Customers" title="Teams who used to work out of five tools" align="center" />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {quotes.map((q) => (
            <div
              key={q.name}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">&ldquo;{q.quote}&rdquo;</p>
              <p className="mt-5 text-sm font-semibold text-white">{q.name}</p>
              <p className="text-xs text-slate-500">{q.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}