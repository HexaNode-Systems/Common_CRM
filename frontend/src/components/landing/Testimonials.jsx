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
    <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-24 font-theme">
      <GradientBlob position="left" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-indigo-300">
          What our customers are saying
        </span>

        <span className="mx-auto block text-5xl leading-none text-primary/40 font-serif select-none">&ldquo;</span>

        <ScrollRevealText
          className="mt-2 text-xl sm:text-2xl lg:text-3xl italic leading-relaxed text-slate-200"
          text="The implementation of Appnix CRM Pro will have reduced the inherent friction that comes with manually chasing leads across five different tools, improving agility and the service our team provides to customers."
          highlightWords={['reduced', 'agility', 'friction']}
        />

        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-800/90 bg-slate-900/80 py-2 pl-2.5 pr-5 shadow-md shadow-black/20">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold text-sm shadow-xs">
            MI
          </span>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Meera Iyer</p>
            <p className="text-xs text-slate-300 font-medium">Founder, Studio Loom</p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-20 max-w-7xl px-6">
        <SectionHeading
          dark
          eyebrow="Customers"
          title="Teams who used to work out of five tools"
          description="Hear from leaders who consolidated their communication, pipeline and delivery into Appnix CRM Pro."
          align="center"
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {quotes.map((q) => (
            <div
              key={q.name}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/65 p-6 sm:p-7 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-slate-900/90 flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-200">&ldquo;{q.quote}&rdquo;</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/70">
                <p className="text-sm sm:text-base font-bold text-white">{q.name}</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">{q.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}