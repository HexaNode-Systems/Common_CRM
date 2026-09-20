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
  root.dataset.buttonStyle = theme.buttonStyle;
  root.dataset.cardStyle = theme.cardStyle;

  if (seo?.title) {
    document.title = seo.title;
  }

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

