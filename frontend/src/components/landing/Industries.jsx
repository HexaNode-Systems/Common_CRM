import SectionHeading from './SectionHeading.jsx';
import { Building2, GraduationCap, Stethoscope, ShoppingBag, Briefcase, Cloud } from 'lucide-react';

export default function Industries() {
  const industries = [
    { name: 'Real estate', icon: Building2 },
    { name: 'Education', icon: GraduationCap },
    { name: 'Healthcare', icon: Stethoscope },
    { name: 'Retail', icon: ShoppingBag },
    { name: 'Agencies', icon: Briefcase },
    { name: 'SaaS teams', icon: Cloud },
  ];
  return (
    <section id="industries" className="bg-white py-24 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Industries" title="Configured for how your business already sells" description="The same core system, themed and structured for your industry's pipeline and vocabulary." />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {industries.map(({ name, icon: Icon }) => (
            <div key={name} className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 px-4 py-8 text-center transition-colors hover:border-primary/40">
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold text-slate-700">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}