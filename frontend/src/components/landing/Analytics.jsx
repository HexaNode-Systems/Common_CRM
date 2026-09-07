import { TrendingUp, Clock } from 'lucide-react';

export default function Analytics() {
  const bars = [40, 65, 50, 80, 60, 90, 72];
  return (
    <section className="bg-slate-950 py-24 font-theme">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
            <TrendingUp className="h-5 w-5" />
          </span>
          <p className="mt-5 text-sm font-semibold text-indigo-300">Analytics</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Know where every deal and every hour went
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            Pipeline value, conversion by stage, team output and project budgets update live — no
            spreadsheet exports, no waiting for a monthly report.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">32%</p>
              <p className="mt-1 text-xs text-slate-400">Faster lead response</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">4.6x</p>
              <p className="mt-1 text-xs text-slate-400">More follow-ups logged</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Weekly closed value</span>
            <span className="flex items-center gap-1 text-emerald-400"><Clock className="h-3.5 w-3.5" /> Live</span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-3">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-300" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}