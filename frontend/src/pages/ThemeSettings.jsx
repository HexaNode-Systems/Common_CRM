import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function ThemeSettings() {
  const { settings, updateSettings } = useSettings();
  const [theme, setTheme] = useState({});
  const [brand, setBrand] = useState({});

  useEffect(() => {
    setTheme(settings?.theme || {});
    setBrand(settings?.brand || {});
  }, [settings]);

  async function submit(event) {
    event.preventDefault();
    await updateSettings({ brand, theme });
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Theme Settings</h1>
        <Button type="submit" className="px-4 py-2">Save Theme</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Brand">
          <div className="space-y-4">
            <Input label="Brand Name" value={brand.name || ''} onChange={(e) => setBrand({ ...brand, name: e.target.value })} />
            <Input label="Logo URL" value={brand.logo || ''} onChange={(e) => setBrand({ ...brand, logo: e.target.value })} />
            <Input label="Favicon URL" value={brand.favicon || ''} onChange={(e) => setBrand({ ...brand, favicon: e.target.value })} />
          </div>
        </Card>
        <Card title="Design Tokens">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Primary Color" type="color" value={theme.primaryColor || '#2563eb'} onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })} />
            <Input label="Secondary Color" type="color" value={theme.secondaryColor || '#0f172a'} onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })} />
            <Input label="Accent Color" type="color" value={theme.accentColor || '#f59e0b'} onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })} />
            <Input label="Border Radius" value={theme.borderRadius || '8px'} onChange={(e) => setTheme({ ...theme, borderRadius: e.target.value })} />
            <Input label="Font Family" value={theme.fontFamily || ''} onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })} />
            <Input label="Button Style" value={theme.buttonStyle || 'solid'} onChange={(e) => setTheme({ ...theme, buttonStyle: e.target.value })} />
            <Input label="Card Style" value={theme.cardStyle || 'bordered'} onChange={(e) => setTheme({ ...theme, cardStyle: e.target.value })} />
          </div>
        </Card>
      </div>
    </form>
  );
}

