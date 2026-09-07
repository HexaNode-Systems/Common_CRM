import { Link } from 'react-router-dom';
import Button from '../Button.jsx';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-theme">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-20 lg:grid-cols-12 lg:pt-28">
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Built for sales-led teams
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            One workspace for every lead, chat and deal your team touches.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
            Track leads, reply on WhatsApp, run projects and manage your whole team from a single
            dashboard — instead of five disconnected tools that never agree with each other.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/login">
              <Button className="px-6 py-3 text-sm shadow-lg shadow-primary/30">
                Start free trial
              </Button>
            </Link>
            <a href="#product" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-slate-200">
              See how it works <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Live in one day</span>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 px-2 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <div className="rounded-xl bg-white p-5">
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Open leads', value: '128', tone: 'text-primary' },
                  { label: 'Running projects', value: '14', tone: 'text-indigo-600' },
                  { label: 'Unread chats', value: '9', tone: 'text-amber-600' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className={`text-xl font-bold ${s.tone}`}>{s.value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'Aarav Mehta', stage: 'Negotiation', color: 'bg-amber-100 text-amber-700' },
                  { name: 'Riya Kapoor', stage: 'Won', color: 'bg-emerald-100 text-emerald-700' },
                  { name: 'Studio North', stage: 'New enquiry', color: 'bg-sky-100 text-sky-700' },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {row.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{row.name}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.color}`}>{row.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}