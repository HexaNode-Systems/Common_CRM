import { useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import {
  Globe,
  Phone,
  Layers,
  CheckCircle,
  XCircle,
  Copy,
  Save,
  Info,
  ExternalLink,
  Code
} from 'lucide-react';

export default function IntegrationsPage() {
  const { settings, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [copiedText, setCopiedText] = useState({});

  // Local state for all integrations parameters
  const [integrations, setIntegrations] = useState(
    settings?.integrations || {
      justdial: { isActive: false, pollUrl: '', apiToken: '', pollIntervalMs: 300000 },
      indiamart: { isActive: false, apiKey: '' },
      zoho: { isActive: false, clientClientId: '', clientSecret: '', redirectUri: '' },
      website: { isActive: true, webhookSecret: 'secret_key' }
    }
  );

  const [message, setMessage] = useState('');

  const webhookBaseUrl = window.location.origin.replace('3000', '5000').replace('5173', '5000') + '/api/leads/webhook';

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedText((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleToggle = (provider) => {
    setIntegrations((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        isActive: !prev[provider].isActive
      }
    }));
  };

  const handleChange = (provider, field, value) => {
    setIntegrations((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      await updateSettings({ integrations });
      setMessage('✅ Integrations settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to update integration settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Third-Party Integrations</h1>
          <p className="text-sm text-slate-500">Configure webhooks and API credentials to ingest leads from external platforms.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {message && (
        <div className="rounded-xl bg-slate-900 text-white p-3 text-sm font-semibold flex items-center justify-between shadow-md">
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Justdial Integration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600 border border-orange-100">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">☎️ Justdial Integration</h3>
                  <p className="text-xs text-slate-500">Automatic polling or webhook lead ingestion</p>
                </div>
              </div>
              <span
                onClick={() => handleToggle('justdial')}
                className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold select-none flex items-center gap-1 transition ${
                  integrations.justdial?.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {integrations.justdial?.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {integrations.justdial?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Webhook URL</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                  <span className="flex-1 font-mono text-2xs truncate select-all">{`${webhookBaseUrl}/justdial`}</span>
                  <button
                    onClick={() => copyToClipboard(`${webhookBaseUrl}/justdial`, 'jd_webhook')}
                    className="p-1 text-slate-500 hover:text-slate-800 transition"
                  >
                    <Copy size={14} className={copiedText.jd_webhook ? 'text-emerald-600' : ''} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">JD API Polling URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://api.justdial.com/leads..."
                  value={integrations.justdial?.pollUrl || ''}
                  onChange={(e) => handleChange('justdial', 'pollUrl', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">API Token</label>
                  <input
                    type="password"
                    placeholder="JD Token"
                    value={integrations.justdial?.apiToken || ''}
                    onChange={(e) => handleChange('justdial', 'apiToken', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Interval (ms)</label>
                  <input
                    type="number"
                    placeholder="300000"
                    value={integrations.justdial?.pollIntervalMs || 300000}
                    onChange={(e) => handleChange('justdial', 'pollIntervalMs', Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
            <Info size={14} className="shrink-0 text-primary mt-0.5" />
            <span>Copy the Webhook URL and paste it into your Justdial campaign dashboard to receive leads in real-time.</span>
          </div>
        </div>

        {/* IndiaMart Integration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600 border border-teal-100">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">🛒 IndiaMart Integration</h3>
                  <p className="text-xs text-slate-500">Real-time webhook ingestion</p>
                </div>
              </div>
              <span
                onClick={() => handleToggle('indiamart')}
                className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold select-none flex items-center gap-1 transition ${
                  integrations.indiamart?.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {integrations.indiamart?.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {integrations.indiamart?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Webhook URL</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                  <span className="flex-1 font-mono text-2xs truncate select-all">{`${webhookBaseUrl}/indiamart`}</span>
                  <button
                    onClick={() => copyToClipboard(`${webhookBaseUrl}/indiamart`, 'im_webhook')}
                    className="p-1 text-slate-500 hover:text-slate-800 transition"
                  >
                    <Copy size={14} className={copiedText.im_webhook ? 'text-emerald-600' : ''} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">IndiaMart CRM API Key (Optional)</label>
                <input
                  type="password"
                  placeholder="Enter IndiaMart API Key"
                  value={integrations.indiamart?.apiKey || ''}
                  onChange={(e) => handleChange('indiamart', 'apiKey', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
            <Info size={14} className="shrink-0 text-primary mt-0.5" />
            <span>Provides direct webhook integration for IndiaMart inquiries. IndiaMart fields (`SENDER_NAME`, `SENDER_MOBILE`) are auto-mapped.</span>
          </div>
        </div>

        {/* Website Integration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 border border-purple-100">
                  <Code size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">🌐 Website Form Integration</h3>
                  <p className="text-xs text-slate-500">Ingest contact forms directly into CRM</p>
                </div>
              </div>
              <span
                onClick={() => handleToggle('website')}
                className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold select-none flex items-center gap-1 transition ${
                  integrations.website?.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {integrations.website?.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {integrations.website?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Webhook URL</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                  <span className="flex-1 font-mono text-2xs truncate select-all">{`${webhookBaseUrl}/website`}</span>
                  <button
                    onClick={() => copyToClipboard(`${webhookBaseUrl}/website`, 'web_webhook')}
                    className="p-1 text-slate-500 hover:text-slate-800 transition"
                  >
                    <Copy size={14} className={copiedText.web_webhook ? 'text-emerald-600' : ''} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Security Webhook Secret</label>
                <input
                  type="text"
                  placeholder="Webhook Secret"
                  value={integrations.website?.webhookSecret || ''}
                  onChange={(e) => handleChange('website', 'webhookSecret', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
            <Info size={14} className="shrink-0 text-primary mt-0.5" />
            <span>Connect landing pages or business websites. Submit forms directly via JSON POST request payloads.</span>
          </div>
        </div>

        {/* Zoho CRM Integration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 border border-blue-100">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">💼 Zoho CRM Integration</h3>
                  <p className="text-xs text-slate-500">Map Zoho CRM module leads</p>
                </div>
              </div>
              <span
                onClick={() => handleToggle('zoho')}
                className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold select-none flex items-center gap-1 transition ${
                  integrations.zoho?.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {integrations.zoho?.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {integrations.zoho?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Webhook URL</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                  <span className="flex-1 font-mono text-2xs truncate select-all">{`${webhookBaseUrl}/zoho`}</span>
                  <button
                    onClick={() => copyToClipboard(`${webhookBaseUrl}/zoho`, 'zoho_webhook')}
                    className="p-1 text-slate-500 hover:text-slate-800 transition"
                  >
                    <Copy size={14} className={copiedText.zoho_webhook ? 'text-emerald-600' : ''} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Client ID</label>
                  <input
                    type="password"
                    placeholder="Zoho Client ID"
                    value={integrations.zoho?.clientClientId || ''}
                    onChange={(e) => handleChange('zoho', 'clientClientId', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Client Secret</label>
                  <input
                    type="password"
                    placeholder="Zoho Client Secret"
                    value={integrations.zoho?.clientSecret || ''}
                    onChange={(e) => handleChange('zoho', 'clientSecret', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
            <Info size={14} className="shrink-0 text-primary mt-0.5" />
            <span>Map modules from your Zoho CRM panel. Set up a workflow rule in Zoho CRM to push HTTP Post webhooks to this endpoint.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
