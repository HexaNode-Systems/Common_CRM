export default function TrustBar() {
  const names = ['Northbridge Realty', 'Vantage Clinics', 'Studio Loom', 'Craft & Co.', 'Beacon Academy', 'Fernway Agency'];

  return (
    <section className="border-b border-white/5 bg-slate-950 py-12 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-sm font-medium text-slate-400">
          Trusted by growing teams across industries
        </p>

        <div className="trustbar-mask relative mt-7 overflow-hidden">
          <div className="trustbar-track flex w-max items-center gap-14">
            {[...names, ...names].map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="shrink-0 text-base font-semibold text-slate-500 transition-colors duration-300 hover:text-slate-200"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .trustbar-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .trustbar-track {
          animation: trustbar-scroll 26s linear infinite;
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