// Shared avatar / brand mark for the admin shell: an image when there is one,
// otherwise up to two initials on a plain tile. Used by Header, ProfileModal and Sidebar.

export function getInitials(name, fallback = 'A') {
  if (!name) return fallback;
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ src, name, size = 32, className = '' }) {
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) };

  return src ? (
    <img src={src} alt={name || ''} width={size} height={size} style={style} className={`ax-avatar ${className}`} />
  ) : (
    <span aria-hidden="true" style={style} className={`ax-avatar ${className}`}>
      {getInitials(name)}
    </span>
  );
}
