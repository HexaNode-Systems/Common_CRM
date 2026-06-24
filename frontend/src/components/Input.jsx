export default function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span> : null}
      <input className={`input ${className}`} {...props} />
    </label>
  );
}

