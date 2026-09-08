import { Link } from 'react-router-dom';
import { useRef, useState, useCallback } from 'react';
import Button from '../Button.jsx';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const sectionRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Normalize to -1..1 relative to section center
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouse({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => setMouse({ x: 0, y: 0 }), []);

  return (
    <section
      id="top"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 font-theme"
    >
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="hero-orb hero-orb-1 absolute -left-16 top-6 h-64 w-64 rounded-full bg-primary/40 blur-2xl sm:h-80 sm:w-80"
          style={{ transform: `translate3d(${mouse.x * 30}px, ${mouse.y * 30}px, 0)` }}
        />
        <span
          className="hero-orb hero-orb-2 absolute -right-16 top-1/4 h-64 w-64 rounded-full bg-indigo-500/35 blur-2xl sm:h-96 sm:w-96"
          style={{ transform: `translate3d(${mouse.x * -45}px, ${mouse.y * -45}px, 0)` }}
        />
        <span
          className="hero-orb hero-orb-3 absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-sky-500/30 blur-2xl sm:h-72 sm:w-72"
          style={{ transform: `translate3d(${mouse.x * 20}px, ${mouse.y * -20}px, 0)` }}
        />
        <div className="hero-grid absolute inset-0 opacity-[0.07]" />

        {/* Floating particles */}
        <div className="hero-particles absolute inset-0">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`hero-particle hero-particle-${(i % 7) + 1}`} />
          ))}
        </div>

        {/* Soft vignette so content stays readable over the motion */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/60" />
      </div>

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
        .hero-orb {
          will-change: transform, opacity;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .hero-orb-1 { animation: hero-float-a 10s ease-in-out infinite; }
        .hero-orb-2 { animation: hero-float-b 12s ease-in-out infinite; }
        .hero-orb-3 { animation: hero-float-c 11s ease-in-out infinite; }

        @keyframes hero-float-a {
          0%   { margin: 0 0; opacity: 0.8; }
          25%  { margin: 90px 0 0 140px; opacity: 1; }
          50%  { margin: 180px 0 0 60px; opacity: 0.7; }
          75%  { margin: 60px 0 0 -90px; opacity: 0.9; }
          100% { margin: 0 0; opacity: 0.8; }
        }
        @keyframes hero-float-b {
          0%   { margin: 0 0; opacity: 0.75; }
          30%  { margin: 110px 0 0 -160px; opacity: 1; }
          60%  { margin: -100px 0 0 -50px; opacity: 0.65; }
          100% { margin: 0 0; opacity: 0.75; }
        }
        @keyframes hero-float-c {
          0%   { margin: 0 0; opacity: 0.7; }
          40%  { margin: -140px 0 0 120px; opacity: 1; }
          70%  { margin: -40px 0 0 -70px; opacity: 0.6; }
          100% { margin: 0 0; opacity: 0.7; }
        }

        .hero-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: hero-grid-pan 20s linear infinite;
        }
        @keyframes hero-grid-pan {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        /* Shimmering gradient headline text */
        .hero-shimmer {
          background-size: 200% auto;
          animation: hero-shimmer-move 4s ease-in-out infinite;
        }
        @keyframes hero-shimmer-move {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Pulsing status dot */
        .hero-dot {
          box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6);
          animation: hero-pulse 2s ease-out infinite;
        }
        @keyframes hero-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(52, 211, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }

        /* Staggered entrance */
        .hero-fade-up {
          opacity: 0;
          transform: translateY(18px);
          animation: hero-fade-up-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .hero-delay-1 { animation-delay: 0.05s; }
        .hero-delay-2 { animation-delay: 0.15s; }
        .hero-delay-3 { animation-delay: 0.28s; }
        .hero-delay-4 { animation-delay: 0.4s; }
        .hero-delay-5 { animation-delay: 0.52s; }
        @keyframes hero-fade-up-in {
          to { opacity: 1; transform: translateY(0); }
        }

        /* CTA button glow pulse */
        .hero-cta-btn {
          position: relative;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .hero-cta-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 30px -5px rgba(99, 102, 241, 0.5);
        }
        .hero-cta-btn:active { transform: translateY(0) scale(0.98); }

        /* Underline sweep for the secondary link */
        .hero-link-arrow {
          position: relative;
        }
        .hero-link-arrow::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -3px;
          width: 100%;
          height: 1px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .hero-link-arrow:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }

        /* Floating particles */
        .hero-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 0;
          animation: hero-particle-rise linear infinite;
        }
        .hero-particle-1 { left: 8%;  animation-duration: 14s; animation-delay: 0s;  }
        .hero-particle-2 { left: 18%; animation-duration: 18s; animation-delay: 2s;  }
        .hero-particle-3 { left: 32%; animation-duration: 12s; animation-delay: 4s;  }
        .hero-particle-4 { left: 47%; animation-duration: 16s; animation-delay: 1s;  }
        .hero-particle-5 { left: 61%; animation-duration: 13s; animation-delay: 3s;  }
        .hero-particle-6 { left: 76%; animation-duration: 17s; animation-delay: 5s;  }
        .hero-particle-7 { left: 89%; animation-duration: 15s; animation-delay: 2.5s;}
        @keyframes hero-particle-rise {
          0%   { transform: translateY(110%) scale(0.6); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-20%) scale(1); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-orb-1, .hero-orb-2, .hero-orb-3,
          .hero-grid, .hero-shimmer, .hero-dot,
          .hero-fade-up, .hero-particle {
            animation: none !important;
          }
          .hero-fade-up { opacity: 1; transform: none; }
          .hero-orb { transition: none; transform: none !important; }
        }
      `}</style>
    </section>
  );
}