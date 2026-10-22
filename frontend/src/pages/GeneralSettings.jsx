import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';

export default function GeneralSettings({ title }) {
  const { settings, updateSettings } = useSettings();
  const [content, setContent] = useState({});
  const [contact, setContact] = useState({});
  const [social, setSocial] = useState({});
  const [seo, setSeo] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'settings', 'update');

  useEffect(() => {
    setContent(settings?.content || {});
    setContact(settings?.contact || {});
    setSocial(settings?.social || {});
    setSeo(settings?.seo || {});
  }, [settings]);

  async function submit(event) {
    event.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateSettings({ content, contact, social, seo });
      setMessage('Settings saved.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        {canEdit ? <Button type="submit" disabled={saving} className="px-4 py-2">{saving ? 'Saving...' : 'Save Settings'}</Button> : null}
      </div>
      {error ? <p role="alert" className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p role="status" className="mb-4 rounded-theme bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      <fieldset disabled={!canEdit || saving} className="grid gap-4 lg:grid-cols-2">
        <Card title="Website Content">
          <div className="space-y-4">
            <Input label="Home Title" value={content.homeTitle || ''} onChange={(e) => setContent({ ...content, homeTitle: e.target.value })} />
            <Input label="Home Subtitle" value={content.homeSubtitle || ''} onChange={(e) => setContent({ ...content, homeSubtitle: e.target.value })} />
            <Input label="Footer Text" value={content.footerText || ''} onChange={(e) => setContent({ ...content, footerText: e.target.value })} />
          </div>
        </Card>
        <Card title="Contact Info">
          <div className="space-y-4">
            <Input label="Email" value={contact.email || ''} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            <Input label="Phone" value={contact.phone || ''} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            <Input label="Address" value={contact.address || ''} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
          </div>
        </Card>
        <Card title="Social Links">
          <div className="space-y-4">
            {['facebook', 'instagram', 'linkedin', 'x', 'youtube'].map((key) => (
              <Input key={key} label={key.toUpperCase()} value={social[key] || ''} onChange={(e) => setSocial({ ...social, [key]: e.target.value })} />
            ))}
          </div>
        </Card>
        <Card title="SEO Content">
          <div className="space-y-4">
            <Input label="SEO Title" value={seo.title || ''} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
            <Input label="SEO Description" value={seo.description || ''} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
            <Input label="SEO Keywords" value={seo.keywords || ''} onChange={(e) => setSeo({ ...seo, keywords: e.target.value })} />
          </div>
        </Card>
      </fieldset>
    </form>
  );
}

