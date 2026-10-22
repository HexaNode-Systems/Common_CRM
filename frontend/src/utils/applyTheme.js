// Defaults the theme starts with. While a value equals its default, the admin panel keeps its own
// design; once it is changed on the Theme page, the change is applied inside the admin panel too.
const DEFAULTS = { primaryColor: '#2563eb', borderRadius: '8px', fontFamily: 'Inter, system-ui, sans-serif' };
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const ADMIN_PATHS = /^\/(dashboard|users|catalog|leads|tasks|vault|storage|whatsapp|reports|integrations|theme|support|accessories|roles|settings|super-admin|orders|forbidden)/i;

function darken(hex, amount = 0.15) {
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const n = parseInt(full.slice(1), 16);
  const ch = (shift) => Math.max(0, Math.round(((n >> shift) & 255) * (1 - amount)));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

function adminOverrides(theme = {}) {
  const light = [];
  const all = [];
  const primary = String(theme.primaryColor || '').toLowerCase();
  if (HEX.test(primary) && primary !== DEFAULTS.primaryColor) {
    // Light mode only: dark mode keeps colours tuned for contrast.
    light.push(`--ax-accent:${primary}`, `--ax-btn:${primary}`, `--ax-btn-hover:${darken(primary)}`, `--color-primary:${primary}`,
      `--ax-accent-dim:color-mix(in srgb, ${primary} 10%, white)`);
  }
  const radius = /^(\d{1,2})px$/.exec(String(theme.borderRadius || ''));
  if (radius && theme.borderRadius !== DEFAULTS.borderRadius) {
    const px = Math.min(Number(radius[1]), 24);
    all.push(`--ax-radius:${px}px`, `--ax-radius-sm:${Math.max(0, Math.round(px * 0.6))}px`, `--radius-theme:${px}px`);
  }
  const font = String(theme.fontFamily || '');
  if (font && font !== DEFAULTS.fontFamily && /^[\w\s,'"-]+$/.test(font)) all.push(`--ax-font:${font}`);

  let css = '';
  // Doubled class = higher priority than the admin stylesheet's own tokens.
  if (all.length) css += `.ax-admin.ax-admin{${all.join(';')}}`;
  if (light.length) css += `.ax-admin.ax-admin[data-mode='light']{${light.join(';')}}`;
  return css;
}

export function applyTheme(settings) {
  if (typeof document === 'undefined') return;
  if (!settings?.theme) return;

  const { theme, brand, seo } = settings;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-secondary', theme.secondaryColor);
  root.style.setProperty('--color-accent', theme.accentColor);
  root.style.setProperty('--font-family', theme.fontFamily);
  root.style.setProperty('--radius-theme', theme.borderRadius);
  root.dataset.buttonStyle = theme.buttonStyle || 'solid';
  root.dataset.cardStyle = theme.cardStyle || 'bordered';

  let style = document.getElementById('ax-theme-overrides');
  if (!style) {
    style = document.createElement('style');
    style.id = 'ax-theme-overrides';
    document.head.appendChild(style);
  }
  style.textContent = adminOverrides(theme);

  // The SEO title is for the public website; admin pages show the brand name instead.
  const inAdmin = typeof window !== 'undefined' && ADMIN_PATHS.test(window.location.pathname);
  if (inAdmin && brand?.name) document.title = brand.name;
  else if (seo?.title) document.title = seo.title;

  if (brand?.favicon) {
    let icon = document.querySelector("link[rel='icon']");
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = brand.favicon;
  }
}
