import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';
import { Upload, Image as ImageIcon, CheckCircle, RotateCcw } from 'lucide-react';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'];

// Same checks as the server, so mistakes show before saving.
function themeProblem(theme) {
  for (const key of ['primaryColor', 'secondaryColor', 'accentColor']) {
    if (theme[key] && !HEX.test(theme[key])) return `${key} must be a colour like #2563eb.`;
  }
  if (theme.borderRadius && !/^\d{1,2}(px)?$/.test(String(theme.borderRadius).trim())) return 'Corner radius must be a number of pixels, like 6px.';
  if (theme.borderRadius && Number(String(theme.borderRadius).replace('px', '')) > 24) return 'Corner radius can be at most 24px.';
  if (theme.fontFamily && !/^[\w\s,'"-]+$/.test(theme.fontFamily)) return 'Font can only contain font names separated by commas.';
  if (theme.splashDuration !== undefined && theme.splashDuration !== '' && (Number(theme.splashDuration) < 0 || Number(theme.splashDuration) > 10000)) return 'Splash duration must be 0 to 10000 ms.';
  return '';
}

export default function ThemeSettings() {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'settings', 'update');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState({});
  const [brand, setBrand] = useState({});
  const [seo, setSeo] = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingSplashLogo, setUploadingSplashLogo] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTheme(settings?.theme || {});
    setBrand(settings?.brand || {});
    setSeo(settings?.seo || {});
  }, [settings]);

  const handleFileUpload = async (event, field) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!IMAGE_TYPES.includes(ext)) {
      setError('Upload a PNG, JPG, WEBP, GIF or ICO image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Images can be at most 2 MB.');
      return;
    }

    if (field === 'logo') setUploadingLogo(true);
    if (field === 'favicon') setUploadingFavicon(true);
    if (field === 'splashLogo') setUploadingSplashLogo(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (field === 'splashLogo') {
        setTheme(prev => ({ ...prev, splashLogo: res.data.url }));
      } else {
        setBrand(prev => ({ ...prev, [field]: res.data.url }));
      }
    } catch (err) {
      setError(`Upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      if (field === 'logo') setUploadingLogo(false);
      if (field === 'favicon') setUploadingFavicon(false);
      if (field === 'splashLogo') setUploadingSplashLogo(false);
    }
  };

  async function submit(event) {
    event.preventDefault();
    if (!canEdit) return;
    const problem = themeProblem(theme);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateSettings({ brand, theme, seo });
      setMessage('Theme settings saved.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save theme settings.');
    } finally {
      setSaving(false);
    }
  }

  async function resetTheme() {
    if (!window.confirm('Reset colours, corners, font, button and card style, and the splash screen to the defaults? Logo, favicon and brand name stay.')) return;
    setSaving(true);
    setError('');
    try {
      await updateSettings({ reset: 'theme' });
      setMessage('Theme reset to defaults.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset the theme.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Theme & Branding</h1>
          <p className="text-sm text-slate-500">Customize the colors, typography, logos, and general layout of the CRM.</p>
          <p className="mt-1 text-xs text-slate-500">Colours apply to the public website and the admin panel in light mode; dark mode keeps its own high-contrast colours.</p>
        </div>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={resetTheme} className="flex items-center gap-2">
              <RotateCcw size={16} />
              Reset
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary text-white flex items-center gap-2">
              <CheckCircle size={16} />
              {saving ? 'Saving...' : 'Save Theme'}
            </Button>
          </div>
        ) : null}
      </div>

      {!canEdit ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">View only. You need Settings update access to change the theme.</div>
      ) : null}
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {message && (
        <div className="rounded-xl bg-slate-900 text-white p-3 text-sm font-semibold flex items-center justify-between shadow-md">
          <span>{message}</span>
        </div>
      )}

      <fieldset disabled={!canEdit || saving} className="grid gap-6 lg:grid-cols-2">
        {/* Brand & Assets Card */}
        <Card title="Brand & Identity">
          <div className="space-y-6">
            <Input
              label="Brand Name"
              placeholder="e.g. My Business CRM"
              value={brand.name || ''}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
            />

            <Input
              label="Browser Tab Title"
              placeholder="e.g. My Business Hub | CRM"
              value={seo.title || ''}
              onChange={(e) => setSeo({ ...seo, title: e.target.value })}
            />

            {/* Logo Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Company Logo</label>
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
                  {brand.logo ? (
                    <img src={brand.logo} alt="Logo Preview" className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition">
                      <Upload size={14} />
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                    {brand.logo && (
                      <button
                        type="button"
                        onClick={() => setBrand({ ...brand, logo: '' })}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter logo URL manually"
                    value={brand.logo || ''}
                    onChange={(e) => setBrand({ ...brand, logo: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Favicon Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Favicon Icon</label>
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
                  {brand.favicon ? (
                    <img src={brand.favicon} alt="Favicon Preview" className="h-8 w-8 object-contain" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition">
                      <Upload size={14} />
                      {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'favicon')}
                        className="hidden"
                        disabled={uploadingFavicon}
                      />
                    </label>
                    {brand.favicon && (
                      <button
                        type="button"
                        onClick={() => setBrand({ ...brand, favicon: '' })}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter favicon URL manually"
                    value={brand.favicon || ''}
                    onChange={(e) => setBrand({ ...brand, favicon: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Color Tokens Card */}
        <Card title="Design Tokens & Theme Colors">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <input
                type="color"
                value={theme.primaryColor || '#2563eb'}
                onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 focus:outline-none"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Primary Color</span>
                <span className="font-mono text-xs text-slate-600 uppercase">{theme.primaryColor || '#2563eb'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <input
                type="color"
                value={theme.secondaryColor || '#0f172a'}
                onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 focus:outline-none"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Secondary Color</span>
                <span className="font-mono text-xs text-slate-600 uppercase">{theme.secondaryColor || '#0f172a'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <input
                type="color"
                value={theme.accentColor || '#f59e0b'}
                onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 focus:outline-none"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Accent Color</span>
                <span className="font-mono text-xs text-slate-600 uppercase">{theme.accentColor || '#f59e0b'}</span>
              </div>
            </div>

            <Input
              label="Border Radius"
              placeholder="e.g. 8px, 12px, 0px"
              value={theme.borderRadius || '8px'}
              onChange={(e) => setTheme({ ...theme, borderRadius: e.target.value })}
            />

            <Input
              label="Font Family"
              placeholder="e.g. Inter, sans-serif"
              value={theme.fontFamily || 'Inter, system-ui, sans-serif'}
              onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Button Style</label>
              <select
                value={theme.buttonStyle || 'solid'}
                onChange={(e) => setTheme({ ...theme, buttonStyle: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-primary focus:outline-none bg-white"
              >
                <option value="solid">Solid Filled</option>
                <option value="outline">Outline Bordered</option>
                <option value="soft">Soft Tinted</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Card Style</label>
              <select
                value={theme.cardStyle || 'bordered'}
                onChange={(e) => setTheme({ ...theme, cardStyle: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-primary focus:outline-none bg-white"
              >
                <option value="bordered">Bordered Outline</option>
                <option value="elevated">Shadow Elevated</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Splash Screen Card */}
        <Card title="Animated Splash Screen Settings">
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div>
                <span className="block text-sm font-bold text-slate-700">Enable Splash Screen</span>
                <span className="block text-xs text-slate-500">Show a premium animated greeting on app loading.</span>
              </div>
              <input
                type="checkbox"
                checked={theme.splashEnabled ?? true}
                onChange={(e) => setTheme({ ...theme, splashEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <Input
              label="Splash Screen Message"
              placeholder="e.g. Loading Premium CRM..."
              value={theme.splashText || ''}
              onChange={(e) => setTheme({ ...theme, splashText: e.target.value })}
              disabled={theme.splashEnabled === false}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Splash Duration (ms)"
                type="number"
                placeholder="e.g. 2000"
                value={theme.splashDuration || ''}
                onChange={(e) => setTheme({ ...theme, splashDuration: e.target.value })}
                disabled={theme.splashEnabled === false}
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Splash Background</label>
                <select
                  value={theme.splashBgStyle || 'gradient'}
                  onChange={(e) => setTheme({ ...theme, splashBgStyle: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-primary focus:outline-none bg-white"
                  disabled={theme.splashEnabled === false}
                >
                  <option value="gradient">Modern Dark Gradient</option>
                  <option value="primary">Theme Primary Color</option>
                  <option value="secondary">Theme Secondary Color</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Custom Splash Logo (Optional)</label>
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
                  {theme.splashLogo ? (
                    <img src={theme.splashLogo} alt="Splash Logo Preview" className="h-full w-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <label className={`cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition ${theme.splashEnabled === false ? 'opacity-55 pointer-events-none' : ''}`}>
                      <Upload size={14} />
                      {uploadingSplashLogo ? 'Uploading...' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'splashLogo')}
                        className="hidden"
                        disabled={uploadingSplashLogo || theme.splashEnabled === false}
                      />
                    </label>
                    {theme.splashLogo && (
                      <button
                        type="button"
                        onClick={() => setTheme({ ...theme, splashLogo: '' })}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                        disabled={theme.splashEnabled === false}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter logo URL manually (defaults to Brand Logo)"
                    value={theme.splashLogo || ''}
                    onChange={(e) => setTheme({ ...theme, splashLogo: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                    disabled={theme.splashEnabled === false}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </fieldset>
    </form>
  );
}
