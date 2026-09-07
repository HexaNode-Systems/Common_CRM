import { CheckCircle2 } from 'lucide-react';

export default function ShowcaseRow({ reverse, icon: Icon, eyebrow, title, body, bullets, mock }) {
  return (
    <div className={`grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-5 text-sm font-semibold text-primary">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h3>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{body}</p>
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">{mock}</div>
    </div>
  );
}