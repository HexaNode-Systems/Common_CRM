export default function TrustBar() {
  const brands = [
    {
      name: 'Northbridge Realty',
      wordmark: 'Northbridge Realty',
      style: 'font-bold tracking-wider uppercase text-xs sm:text-sm',
      hoverColor: 'group-hover:text-indigo-600',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
      ),
    },
    {
      name: 'Vantage Clinics',
      wordmark: 'VANTAGE CLINICS',
      style: 'font-bold tracking-tight text-xs sm:text-sm',
      hoverColor: 'group-hover:text-emerald-600',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M2 12h20" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
    },
    {
      name: 'Studio Loom',
      wordmark: 'STUDIO LOOM',
      style: 'font-semibold tracking-widest uppercase text-xs sm:text-sm',
      hoverColor: 'group-hover:text-amber-600',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 12 12 22 22 12" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      ),
    },
    {
      name: 'Craft & Co.',
      wordmark: 'CRAFT & CO.',
      style: 'font-bold tracking-wider uppercase text-xs sm:text-sm',
      hoverColor: 'group-hover:text-cyan-600',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
          <line x1="12" y1="22" x2="12" y2="12" />
          <polyline points="22 8.5 12 12 2 8.5" />
        </svg>
      ),
    },
    {
      name: 'Beacon Academy',
      wordmark: 'BEACON ACADEMY',
      style: 'font-bold tracking-widest uppercase text-xs sm:text-sm',
      hoverColor: 'group-hover:text-blue-600',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 19 21 12 17 5 21" />
        </svg>
      ),
    },
    {
      name: 'Fernway Agency',
      wordmark: 'FERNWAY AGENCY',
      style: 'font-extrabold tracking-tight text-xs sm:text-sm',
      hoverColor: 'group-hover:text-purple-600',
      icon: (
        <svg className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative border-y border-slate-200/80 bg-slate-50/70 py-10 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          Trusted by growing teams across industries
        </p>

        <div className="trustbar-mask relative mt-8 overflow-hidden">
          <div className="trustbar-track flex w-max items-center gap-10 sm:gap-14">
            {[...brands, ...brands].map((brand, i) => (
              <div
                key={`${brand.name}-${i}`}
                className="group flex shrink-0 items-center gap-2.5 text-slate-400/90 transition-all duration-300 hover:text-slate-800"
              >
                <div className={`transition-colors duration-300 ${brand.hoverColor}`}>
                  {brand.icon}
                </div>
                <span className={`transition-colors duration-300 group-hover:text-slate-900 ${brand.style}`}>
                  {brand.wordmark}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .trustbar-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
          mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
        }
        .trustbar-track {
          animation: trustbar-scroll 28s linear infinite;
        }
        .trustbar-mask:hover .trustbar-track {
          animation-play-state: paused;
        }
        @keyframes trustbar-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .trustbar-track { animation: none; }
        }
      `}</style>
    </section>
  );
}