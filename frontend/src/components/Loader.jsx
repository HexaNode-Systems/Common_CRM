import { useEffect, useState } from 'react';

// The one loading indicator for the admin panel: a thin ring spinner with an optional short label,
// centred in whatever space it is given. Styles live in styles/admin.css (.ax-loader).
//
//   <Loader label="Loading leads" />            block, centred, for cards and table bodies
//   <Loader fill delay={300} />                  silent full-page spinner (refresh, page switch)
//   <Loader label="Loading roles" size="sm" />   compact, for small areas and dropdown fields
//
// `delay` (ms) keeps the loader hidden for fast loads, so a quick refresh shows nothing at all
// instead of a spinner that flashes for a split second.
export default function Loader({ label, fill = false, size = 'md', delay = 0, className = '' }) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return undefined;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const classes = ['ax-loader', fill && 'ax-loader--fill', size === 'sm' && 'ax-loader--sm', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div role="status" aria-live="polite" className={classes}>
      {visible && <span className="ax-spinner" aria-hidden="true" />}
      {label ? (
        visible && <span className="ax-loader-label">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}
