import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function GeneralSettings({ title }) {
  const { settings, updateSettings } = useSettings();
  const [content, setContent] = useState({});
  const [contact, setContact] = useState({});
  const [social, setSocial] = useState({});
  const [seo, setSeo] = useState({});

  useEffect(() => {
    setContent(settings?.content || {});
    setContact(settings?.contact || {});
    setSocial(settings?.social || {});
    setSeo(settings?.seo || {});
  }, [settings]);

  async function submit(event) {
    event.preventDefault();
    await updateSettings({ content, contact, social, seo });
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button type="submit" className="px-4 py-2">Save Settings</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
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
      </div>
    </form>
  );
}

