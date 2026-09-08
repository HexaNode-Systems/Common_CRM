// One numbered card per policy point - clearer visual hierarchy
// than plain <section> + <h2> blocks.
export default function LegalSection({ number, title, children }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
          {number}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-[15px]">{children}</p>
        </div>
      </div>
    </section>
  );
}