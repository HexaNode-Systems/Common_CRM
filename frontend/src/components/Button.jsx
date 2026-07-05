export default function Button({
  type = 'button',
  variant = 'default',
  size = 'default',
  className = '',
  children,
  disabled,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none';
  
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-transparent active:bg-slate-950',
    destructive: 'bg-red-600 text-white hover:bg-red-500 shadow-sm border border-transparent active:bg-red-700',
    outline: 'border border-slate-200 bg-white text-slate-850 hover:bg-slate-50 hover:text-slate-900 shadow-sm active:bg-slate-100',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200/80 active:bg-slate-200',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200/50',
    link: 'text-primary underline-offset-4 hover:underline bg-transparent border-none shadow-none',
  };

  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-8 text-base',
    icon: 'h-9 w-9 p-0',
  };

  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.default;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
