import { Link } from 'react-router-dom';
import Button from '../Button.jsx';
import GradientBlob from '../GradientBlob.jsx';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-theme"
    >
      <GradientBlob position="right" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/60" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-24 pt-24 text-center lg:pt-32">
        <span className="hero-fade-up hero-delay-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 backdrop-blur-sm">
          <span className="hero-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Built for sales-led teams
        </span>

        <h1 className="hero-fade-up hero-delay-2 mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          One workspace for every{' '}
          <span className="hero-shimmer bg-gradient-to-r from-sky-300 via-indigo-200 to-primary bg-clip-text text-transparent">
            lead, chat and deal
          </span>{' '}
          your team touches.
        </h1>

        <p className="hero-fade-up hero-delay-3 mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
          Track leads, reply on WhatsApp, run projects and manage your whole team from a single
          dashboard — instead of five disconnected tools that never agree with each other.
        </p>

        <div className="hero-fade-up hero-delay-4 mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login">
            <Button className="hero-cta-btn px-6 py-3 text-sm shadow-lg shadow-primary/30">
              Start free trial
            </Button>
          </Link>
          <a href="#product" className="hero-link-arrow group inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-slate-200">
            See how it works
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </a>
        </div>

        <div className="hero-fade-up hero-delay-5 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Live in one day</span>
        </div>
      </div>

      <style>{`
        .hero-shimmer { background-size: 200% auto; animation: hero-shimmer-move 4s ease-in-out infinite; }
        @keyframes hero-shimmer-move { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }

        .hero-dot { box-shadow: 0 0 0 0 rgba(52,211,153,0.6); animation: hero-pulse 2s ease-out infinite; }
        @keyframes hero-pulse { 0%{box-shadow:0 0 0 0 rgba(52,211,153,0.55);} 70%{box-shadow:0 0 0 8px rgba(52,211,153,0);} 100%{box-shadow:0 0 0 0 rgba(52,211,153,0);} }

        .hero-fade-up { opacity: 0; transform: translateY(18px); animation: hero-fade-up-in 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .hero-delay-1{animation-delay:.05s} .hero-delay-2{animation-delay:.15s} .hero-delay-3{animation-delay:.28s} .hero-delay-4{animation-delay:.4s} .hero-delay-5{animation-delay:.52s}
        @keyframes hero-fade-up-in { to{opacity:1; transform:translateY(0);} }

        .hero-cta-btn { transition: transform .25s ease, box-shadow .25s ease; }
        .hero-cta-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 10px 30px -5px rgba(99,102,241,0.5); }
        .hero-cta-btn:active { transform: translateY(0) scale(0.98); }

        .hero-link-arrow { position: relative; }
        .hero-link-arrow::after { content:''; position:absolute; left:0; bottom:-3px; width:100%; height:1px; background:currentColor; transform:scaleX(0); transform-origin:right; transition:transform .3s cubic-bezier(0.22,1,0.36,1); }
        .hero-link-arrow:hover::after { transform:scaleX(1); transform-origin:left; }

        @media (prefers-reduced-motion: reduce) {
          .hero-shimmer, .hero-dot, .hero-fade-up { animation: none !important; }
          .hero-fade-up { opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  );
}