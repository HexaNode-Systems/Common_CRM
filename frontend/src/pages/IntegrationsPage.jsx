import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';
import { socket } from '../services/socket.js';
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
  Code,
  QrCode,
  RefreshCw,
  LogOut,
  Loader2,
  Send,
  AlertCircle,
  ShoppingBag,
  Database
} from 'lucide-react';

export default function IntegrationsPage() {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [copiedText, setCopiedText] = useState({});

  // WhatsApp connection states
  const [waStatus, setWaStatus] = useState('DISCONNECTED');
  const [waQrCode, setWaQrCode] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState('');
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waTestMsg, setWaTestMsg] = useState('Hello from Common CRM integration page!');
  const [waSendingTest, setWaSendingTest] = useState(false);

  useEffect(() => {
    socket.connect();
    
    socket.on('whatsapp:status', (data) => {
      setWaStatus(data.status);
      setWaQrCode(data.qrCode);
      if (data.status === 'CONNECTED') {
        setWaSuccess('WhatsApp connected successfully!');
        setWaError('');
      } else if (data.status === 'DISCONNECTED') {
        setWaSuccess('');
      }
    });

    const getInitialStatus = async () => {
      try {
        const { data } = await api.get('/v1/whatsapp/status');
        setWaStatus(data.status);
        setWaQrCode(data.qrCode);
      } catch (err) {
        console.error('Failed to load initial status', err);
      }
    };
    
    getInitialStatus();

    return () => {
      socket.off('whatsapp:status');
    };
  }, []);

  const handleWaConnect = async () => {
    setWaLoading(true);
    setWaError('');
    setWaSuccess('');
    try {
      await api.post('/v1/whatsapp/connect');
      setWaStatus('INITIALIZING');
      setWaSuccess('WhatsApp client starting. Please wait for the QR code...');
    } catch (err) {
      setWaError(err.response?.data?.message || 'Failed to start WhatsApp client.');
    } finally {
      setWaLoading(false);
    }
  };

  const handleWaDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp? This will log out the session.')) {
      return;
    }
    setWaLoading(true);
    setWaError('');
    setWaSuccess('');
    try {
      await api.post('/v1/whatsapp/disconnect');
      setWaStatus('DISCONNECTED');
      setWaQrCode('');
      setWaSuccess('WhatsApp disconnected successfully.');
    } catch (err) {
      setWaError(err.response?.data?.message || 'Failed to disconnect WhatsApp.');
    } finally {
      setWaLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!waTestPhone) return;
    setWaSendingTest(true);
    setWaError('');
    setWaSuccess('');
    try {
      const { data } = await api.post('/v1/whatsapp/test', {
        phone: waTestPhone,
        message: waTestMsg
      });
      if (data.success) {
        setWaSuccess('Test message sent successfully!');
      } else {
        setWaError('Failed to send test message.');
      }
    } catch (err) {
      setWaError(err.response?.data?.message || 'Error sending test message.');
    } finally {
      setWaSendingTest(false);
    }
  };

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
                  <h3 className="font-bold text-slate-900 text-base">Justdial Integration</h3>
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
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">IndiaMart Integration</h3>
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
                  <h3 className="font-bold text-slate-900 text-base">Website Form Integration</h3>
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
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Zoho CRM Integration</h3>
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

        {hasPermission(user, 'whatsapp_integration', 'read') && (
          /* WhatsApp Integration Card */
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between md:col-span-2">
            <div>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 border border-emerald-100">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">WhatsApp QR Code Connection</h3>
                    <p className="text-xs text-slate-500">Link your WhatsApp account via QR Scan to automate alerts and reply via Inbox</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1 transition ${
                    waStatus === 'CONNECTED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : waStatus === 'QR_RECEIVED'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    waStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' :
                    waStatus === 'QR_RECEIVED' ? 'bg-amber-500 animate-pulse' :
                    waStatus === 'DISCONNECTED' ? 'bg-rose-500' : 'bg-blue-500 animate-spin'
                  }`} />
                  {waStatus === 'CONNECTED' ? 'Connected' :
                   waStatus === 'QR_RECEIVED' ? 'Scan QR' :
                   waStatus === 'DISCONNECTED' ? 'Disconnected' :
                   waStatus === 'INITIALIZING' ? 'Initializing...' : 'Loading Session...'}
                </span>
              </div>

              {waError && (
                <div className="mt-4 flex items-start gap-3 rounded-theme bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                  <AlertCircle className="shrink-0 mt-0.5" size={14} />
                  <div>{waError}</div>
                </div>
              )}

              {waSuccess && (
                <div className="mt-4 flex items-start gap-3 rounded-theme bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                  <CheckCircle className="shrink-0 mt-0.5" size={14} />
                  <div>{waSuccess}</div>
                </div>
              )}

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {/* QR / Status Display column */}
                <div className="md:col-span-2 flex flex-col items-center justify-center border border-slate-100 rounded-2xl bg-slate-50/50 p-6 min-h-[250px]">
                  {waStatus === 'CONNECTED' ? (
                    <div className="text-center space-y-3">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">WhatsApp is Linked</p>
                        <p className="text-xs text-slate-500 mt-0.5">Your session is preserved. CRM can now send notifications and receive messages.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleWaDisconnect} 
                        disabled={waLoading || !hasPermission(user, 'whatsapp_integration', 'update')}
                        className="rounded-theme bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        Disconnect WhatsApp Session
                      </button>
                    </div>
                  ) : waStatus === 'INITIALIZING' || waStatus === 'LOADING' ? (
                    <div className="text-center space-y-3">
                      <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {waStatus === 'INITIALIZING' ? 'Starting Chromium...' : 'Restoring Session Cache...'}
                        </p>
                        <p className="text-xs text-slate-400">Please wait. This takes about 5 to 15 seconds...</p>
                      </div>
                    </div>
                  ) : waStatus === 'QR_RECEIVED' ? (
                    <div className="text-center space-y-3 w-full">
                      <p className="text-xs text-slate-500 font-bold">Scan the QR code below from your phone:</p>
                      {waQrCode ? (
                        <div className="mx-auto max-w-[200px] border-4 border-slate-900 p-1.5 rounded-xl bg-white shadow-md">
                          <img src={waQrCode} alt="WhatsApp Web QR Code" className="w-full h-auto" />
                        </div>
                      ) : (
                        <div className="mx-auto flex h-[200px] w-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                          <Loader2 size={24} className="animate-spin text-slate-400" />
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={handleWaDisconnect} 
                        disabled={waLoading || !hasPermission(user, 'whatsapp_integration', 'update')}
                        className="rounded-theme border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition"
                      >
                        Cancel Connection
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <p className="text-xs text-slate-500">Link device session using unofficial WhatsApp web framework.</p>
                      <button 
                        type="button" 
                        onClick={handleWaConnect} 
                        disabled={waLoading || !hasPermission(user, 'whatsapp_integration', 'update')}
                        className="rounded-theme bg-[#25D366] hover:bg-[#20ba59] px-5 py-2.5 text-xs font-bold text-white transition flex items-center gap-1.5 mx-auto disabled:opacity-50"
                      >
                        <QrCode size={14} /> Connect WhatsApp Client
                      </button>
                    </div>
                  )}
                </div>

                {/* Test form column */}
                <div className="border border-slate-100 rounded-2xl bg-white p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Test Connectivity</h4>
                    <p className="text-[11px] text-slate-400 mb-4">Send a direct dry-run notification message to any phone number.</p>
                    
                    <div className="space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Phone Number</span>
                        <input 
                          className="input text-xs py-1.5" 
                          placeholder="e.g. 919876543210" 
                          value={waTestPhone}
                          onChange={(e) => setWaTestPhone(e.target.value)}
                          disabled={waStatus !== 'CONNECTED' || waSendingTest}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Test Message</span>
                        <textarea 
                          rows="2" 
                          className="input text-xs py-1.5" 
                          value={waTestMsg}
                          onChange={(e) => setWaTestMsg(e.target.value)}
                          disabled={waStatus !== 'CONNECTED' || waSendingTest}
                        />
                      </label>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleSendTest}
                    disabled={waStatus !== 'CONNECTED' || waSendingTest || !waTestPhone || !hasPermission(user, 'whatsapp_integration', 'update')}
                    className="w-full rounded-theme bg-primary hover:bg-primary/95 text-white px-3 py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 mt-4 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {waSendingTest ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Send Test Message
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-xl">
              <Info size={14} className="shrink-0 text-primary mt-0.5" />
              <span>This connects via Puppeteer headless browser cache. The session `.wwebjs_auth` is persisted. Make sure your phone remains connected to the internet.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
