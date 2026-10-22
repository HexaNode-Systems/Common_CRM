// Standard page header for restyled admin pages: small mono label, title, description, actions.
export default function PageHeader({ label, title, description, actions, className = 'mb-6' }) {
  return (
    <header className={`ax-divider flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0 space-y-3">
        {label && (
          <span className="ax-label">
            <span className="ax-label-rule" />
            {label}
          </span>
        )}
        <h1 className="ax-h1">{title}</h1>
        {description && <p className="ax-text-2 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
