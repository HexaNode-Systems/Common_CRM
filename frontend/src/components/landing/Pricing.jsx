import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button.jsx';
import SectionHeading from './SectionHeading.jsx';
import { CheckCircle2, Star } from 'lucide-react';

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

const plans = [
  { name: 'Starter', price: '₹1,999', period: '/month', desc: 'For small teams getting off spreadsheets.', features: ['Up to 5 users', 'Lead management', 'WhatsApp for 1 number', 'Email support'], highlight: false },
  { name: 'Growth', price: '₹5,999', period: '/month', desc: 'For teams running projects and multiple channels.', features: ['Up to 25 users', 'Everything in Starter', 'Projects & document storage', 'Team capacity checks', 'Priority support'], highlight: true },
  { name: 'Enterprise', price: 'Custom', period: '', desc: 'For larger orgs with custom workflows.', features: ['Unlimited users', 'Everything in Growth', 'Custom roles & permissions', 'Dedicated onboarding'], highlight: false },
];

export default function Pricing() {
  const [gridRef, visible] = useReveal();

  return (
    <section id="pricing" className="bg-slate-950 py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Pricing" title="Simple plans that grow with your team" align="center" />

        <div ref={gridRef} className="mt-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={p.name}
              className={`group flex h-full flex-col rounded-2xl border p-8 transition-all duration-300 ease-out motion-reduce:transition-none ${
                p.highlight ? 'border-primary bg-primary/10 hover:-translate-y-1.5' : 'border-white/10 bg-white/[0.03] hover:-translate-y-1 hover:border-white/20'
              }`}
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transitionDelay: visible ? `${i * 110}ms` : '0ms' }}
            >
              <div className="h-6">
                {p.highlight && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    <Star className="h-3 w-3" /> Most popular
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{p.desc}</p>
              <p className="mt-6 text-3xl font-extrabold text-white">
                {p.price}
                <span className="text-base font-medium text-slate-500">{p.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="mt-8 pt-0">
                <Button className={`w-full justify-center text-sm transition-transform duration-200 group-hover:scale-[1.02] ${p.highlight ? '' : 'bg-white/10 hover:bg-white/20'}`}>
                  {p.name === 'Enterprise' ? 'Contact sales' : 'Start free trial'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}