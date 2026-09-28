import { memo, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import Button from '../components/Button.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';
import { socket } from '../services/socket.js';
import {
  Globe,
  Copy,
  Check,
  Save,
  Info,
  Code,
  QrCode,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Database
} from 'lucide-react';

const DEFAULT_INTEGRATIONS = {
  justdial: { isActive: false, pollUrl: '', apiToken: '', pollIntervalMs: 300000 },
  indiamart: { isActive: false, apiKey: '' },
  zoho: { isActive: false, clientClientId: '', clientSecret: '', redirectUri: '' },
  website: { isActive: true, webhookSecret: 'secret_key' }
};

const inputCls =
  'w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none';
const upperLabelCls = 'block text-xs font-semibold text-slate-500 uppercase mb-1';
const plainLabelCls = 'mb-1 block text-xs font-medium text-slate-600';

/* ---------- Small reusable, accessible building blocks ---------- */

// Associates a visible <label> with its control via a generated id
function Labeled({ label, upper = false, children }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={upper ? upperLabelCls : plainLabelCls}>
        {label}
      </label>
      {children(id)}
    </div>
  );
}

// Read-only field + copy button (copied state is local, so copying never re-renders the page)
function CopyField({ label, value }) {
  const id = useId();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div>
      <label htmlFor={id} className={upperLabelCls}>
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
        <input
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 truncate bg-transparent font-mono text-2xs outline-none"
        />
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="p-1 text-slate-500 transition hover:text-slate-800"
        >
          {copied ? (
            <Check size={14} className="text-emerald-600" aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
        </button>
        <span className="sr-only" role="status">
          {copied ? 'Copied to clipboard' : ''}
        </span>
      </div>
    </div>
  );
}

// Real switch (keyboard focusable) instead of a clickable <span>
function Toggle({ provider, active, titleId, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!active}
      aria-labelledby={titleId}
      onClick={() => onToggle(provider)}
      className={`flex select-none items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
        active
          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border border-slate-200 bg-slate-100 text-slate-500'
      }`}
    >
      {active ? <CheckCircle size={12} aria-hidden="true" /> : <XCircle size={12} aria-hidden="true" />}
      {active ? 'Active' : 'Inactive'}
    </button>
  );
}

function CardShell({ id, icon, iconClass, title, subtitle, provider, active, onToggle, note, children }) {
  const titleId = `${id}-title`;
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl border p-2.5 ${iconClass}`} aria-hidden="true">
              {icon}
            </div>
            <div>
              <h2 id={titleId} className="text-base font-bold text-slate-900">
                {title}
              </h2>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <Toggle provider={provider} active={active} titleId={titleId} onToggle={onToggle} />
        </div>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
      <div className="mt-6 flex items-start gap-2 rounded-xl border-t border-slate-100 bg-slate-50 p-3 pt-4 text-xs text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span>{note}</span>
      </div>
    </section>
  );
}

/* ---------- Provider cards (memoized: typing in one card doesn't re-render the others) ---------- */

const JustdialCard = memo(function JustdialCard({ config, onChange, onToggle, webhookBaseUrl }) {
  return (
    <CardShell
      id="justdial"
      icon={<Globe size={24} />}
      iconClass="bg-orange-50 text-orange-600 border-orange-100"
      title="Justdial Integration"
      subtitle="Poll or push real-time Justdial campaign leads"
      provider="justdial"
      active={config?.isActive}
      onToggle={onToggle}
      note="Copy the Webhook URL and paste it into your Justdial campaign dashboard to receive leads in real-time."
    >
      <CopyField label="Webhook Target URL" value={`${webhookBaseUrl}/justdial`} />

      <div className="space-y-3">
        <Labeled label="Polling Endpoint API URL">
          {(id) => (
            <input
              id={id}
              className={inputCls}
              placeholder="https://api.justdial.com/leads..."
              value={config?.pollUrl || ''}
              onChange={(e) => onChange('justdial', 'pollUrl', e.target.value)}
            />
          )}
        </Labeled>
        <div className="grid grid-cols-2 gap-4">
          <Labeled label="Client / API Token">
            {(id) => (
              <input
                id={id}
                className={inputCls}
                type="password"
                autoComplete="off"
                value={config?.apiToken || ''}
                onChange={(e) => onChange('justdial', 'apiToken', e.target.value)}
              />
            )}
          </Labeled>
          <Labeled label="Interval (Minutes)">
            {(id) => (
              <select
                id={id}
                className={inputCls}
                value={config?.pollIntervalMs || 300000}
                onChange={(e) => onChange('justdial', 'pollIntervalMs', Number(e.target.value))}
              >
                <option value={60000}>1 Min</option>
                <option value={300000}>5 Min</option>
                <option value={900000}>15 Min</option>
              </select>
            )}
          </Labeled>
        </div>
      </div>
    </CardShell>
  );
});

const IndiaMartCard = memo(function IndiaMartCard({ config, onChange, onToggle, webhookBaseUrl }) {
  return (
    <CardShell
      id="indiamart"
      icon={<ShoppingBag size={24} />}
      iconClass="bg-teal-50 text-teal-600 border-teal-100"
      title="IndiaMart Integration"
      subtitle="Capture IndiaMart leads automatically via webhook"
      provider="indiamart"
      active={config?.isActive}
      onToggle={onToggle}
      note="Provides direct webhook integration for IndiaMart inquiries. IndiaMart fields (SENDER_NAME, SENDER_MOBILE) are auto-mapped."
    >
      <CopyField label="Webhook URL" value={`${webhookBaseUrl}/indiamart`} />
      <Labeled label="IndiaMart CRM API Key (Optional)" upper>
        {(id) => (
          <input
            id={id}
            type="password"
            autoComplete="off"
            placeholder="Enter IndiaMart API Key"
            value={config?.apiKey || ''}
            onChange={(e) => onChange('indiamart', 'apiKey', e.target.value)}
            className={inputCls}
          />
        )}
      </Labeled>
    </CardShell>
  );
});

const WebsiteCard = memo(function WebsiteCard({ config, onChange, onToggle, webhookBaseUrl }) {
  return (
    <CardShell
      id="website"
      icon={<Code size={24} />}
      iconClass="bg-purple-50 text-purple-600 border-purple-100"
      title="Website Form Integration"
      subtitle="Ingest contact forms directly into CRM"
      provider="website"
      active={config?.isActive}
      onToggle={onToggle}
      note="Connect landing pages or business websites. Submit forms directly via JSON POST request payloads."
    >
      <CopyField label="Webhook POST Endpoint" value={`${webhookBaseUrl}/website`} />
      <Labeled label="Secure Request Secret (Optional)" upper>
        {(id) => (
          <input
            id={id}
            type="password"
            autoComplete="off"
            placeholder="Enter Secret Key Header"
            value={config?.webhookSecret || ''}
            onChange={(e) => onChange('website', 'webhookSecret', e.target.value)}
            className={inputCls}
          />
        )}
      </Labeled>
    </CardShell>
  );
});

const ZohoCard = memo(function ZohoCard({ config, onChange, onToggle, webhookBaseUrl }) {
  return (
    <CardShell
      id="zoho"
      icon={<Database size={24} />}
      iconClass="bg-blue-50 text-blue-600 border-blue-100"
      title="Zoho CRM Integration"
      subtitle="Map Zoho CRM module leads"
      provider="zoho"
      active={config?.isActive}
      onToggle={onToggle}
      note="Map modules from your Zoho CRM panel. Set up a workflow rule in Zoho CRM to push HTTP Post webhooks to this endpoint."
    >
      <CopyField label="Webhook URL" value={`${webhookBaseUrl}/zoho`} />
      <div className="grid grid-cols-2 gap-4">
        <Labeled label="Client ID" upper>
          {(id) => (
            <input
              id={id}
              type="password"
              autoComplete="off"
              placeholder="Zoho Client ID"
              value={config?.clientClientId || ''}
              onChange={(e) => onChange('zoho', 'clientClientId', e.target.value)}
              className={inputCls}
            />
          )}
        </Labeled>
        <Labeled label="Client Secret" upper>
          {(id) => (
            <input
              id={id}
              type="password"
              autoComplete="off"
              placeholder="Zoho Client Secret"
              value={config?.clientSecret || ''}
              onChange={(e) => onChange('zoho', 'clientSecret', e.target.value)}
              className={inputCls}
            />
          )}
        </Labeled>
      </div>
    </CardShell>
  );
});

/* ---------- WhatsApp card: owns ALL its state, so socket/QR updates never re-render other cards ---------- */

const STATUS_LABEL = {
  CONNECTED: 'Connected',
  QR_RECEIVED: 'Scan QR',
  DISCONNECTED: 'Disconnected',
  INITIALIZING: 'Initializing...'
};

const WhatsAppCard = memo(function WhatsAppCard({ userId, canUpdate }) {
  const [waStatus, setWaStatus] = useState('DISCONNECTED');
  const [waQrCode, setWaQrCode] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState('');
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waTestMsg, setWaTestMsg] = useState('Hello from Common CRM integration page!');
  const [waSendingTest, setWaSendingTest] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const onStatus = (data) => {
      if (data.userId && data.userId !== userId) return;
      setWaStatus(data.status);
      setWaQrCode(data.qrCode || '');
      if (data.status === 'CONNECTED') {
        setWaSuccess('WhatsApp connected successfully!');
        setWaError('');
      } else if (data.status === 'DISCONNECTED') {
        setWaSuccess('');
      }
    };

    socket.on('whatsapp:status', onStatus);
    if (!socket.connected) socket.connect();

    // Non-blocking: the card renders immediately with the default state
    api
      .get('/v1/whatsapp/status', { signal: controller.signal })
      .then(({ data }) => {
        setWaStatus(data.status);
        setWaQrCode(data.qrCode || '');
      })
      .catch((err) => {
        if (err?.code !== 'ERR_CANCELED') console.error('Failed to load initial status', err);
      });

    return () => {
      controller.abort();
      socket.off('whatsapp:status', onStatus);
    };
  }, [userId]);

  const handleConnect = async () => {
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

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp? This will log out the session.')) return;
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
      const { data } = await api.post('/v1/whatsapp/test', { phone: waTestPhone, message: waTestMsg });
      if (data.success) setWaSuccess('Test message sent successfully!');
      else setWaError('Failed to send test message.');
    } catch (err) {
      setWaError(err.response?.data?.message || 'Error sending test message.');
    } finally {
      setWaSendingTest(false);
    }
  };

  const badgeCls =
    waStatus === 'CONNECTED'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : waStatus === 'QR_RECEIVED'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-slate-100 text-slate-500';

  const dotCls =
    waStatus === 'CONNECTED'
      ? 'bg-emerald-500 animate-pulse'
      : waStatus === 'QR_RECEIVED'
      ? 'bg-amber-500 animate-pulse'
      : waStatus === 'DISCONNECTED'
      ? 'bg-rose-500'
      : 'bg-blue-500 animate-pulse';

  return (
    <section
      aria-labelledby="whatsapp-title"
      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs md:col-span-2"
    >
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-600" aria-hidden="true">
              <QrCode size={24} />
            </div>
            <div>
              <h2 id="whatsapp-title" className="text-base font-bold text-slate-900">
                WhatsApp QR Code Connection
              </h2>
              <p className="text-xs text-slate-500">
                Link your WhatsApp account via QR Scan to automate alerts and reply via Inbox
              </p>
            </div>
          </div>
          <span
            role="status"
            className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeCls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} aria-hidden="true" />
            {STATUS_LABEL[waStatus] || 'Loading Session...'}
          </span>
        </div>

        {waError && (
          <div role="alert" className="mt-4 flex items-start gap-3 rounded-theme border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
            <div>{waError}</div>
          </div>
        )}

        {waSuccess && (
          <div role="status" className="mt-4 flex items-start gap-3 rounded-theme border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
            <div>{waSuccess}</div>
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* QR / status column */}
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:col-span-2">
            {waStatus === 'CONNECTED' ? (
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600" aria-hidden="true">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">WhatsApp is Linked</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Your session is preserved. CRM can now send notifications and receive messages.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={waLoading || !canUpdate}
                  className="rounded-theme bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  Disconnect WhatsApp Session
                </button>
              </div>
            ) : waStatus === 'INITIALIZING' || waStatus === 'LOADING' ? (
              <div className="space-y-3 text-center">
                <Loader2 size={32} className="mx-auto animate-spin text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {waStatus === 'INITIALIZING' ? 'Starting Chromium...' : 'Restoring Session Cache...'}
                  </p>
                  <p className="text-xs text-slate-400">Please wait. This takes about 5 to 15 seconds...</p>
                </div>
              </div>
            ) : waStatus === 'QR_RECEIVED' ? (
              <div className="w-full space-y-3 text-center">
                <p className="text-xs font-bold text-slate-500">Scan the QR code below from your phone:</p>
                {waQrCode ? (
                  <div className="mx-auto max-w-[200px] rounded-xl border-4 border-slate-900 bg-white p-1.5 shadow-md">
                    <img
                      src={waQrCode}
                      alt="WhatsApp Web QR code. Scan it with WhatsApp on your phone to link this session."
                      width="200"
                      height="200"
                      className="h-auto w-full"
                    />
                  </div>
                ) : (
                  <div className="mx-auto flex h-[200px] w-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                    <Loader2 size={24} className="animate-spin text-slate-400" aria-label="Loading QR code" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={waLoading || !canUpdate}
                  className="rounded-theme border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel Connection
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-slate-500">Link device session using unofficial WhatsApp web framework.</p>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={waLoading || !canUpdate}
                  className="mx-auto flex items-center gap-1.5 rounded-theme bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#20ba59] disabled:opacity-50"
                >
                  <QrCode size={14} aria-hidden="true" /> Connect WhatsApp Client
                </button>
              </div>
            )}
          </div>

          {/* Test form column */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-900">Test Connectivity</h3>
              <p className="mb-4 text-[11px] text-slate-400">
                Send a direct dry-run notification message to any phone number.
              </p>

              <div className="space-y-3">
                <Labeled label="Phone Number">
                  {(id) => (
                    <input
                      id={id}
                      className="input py-1.5 text-xs"
                      placeholder="e.g. 919876543210"
                      inputMode="tel"
                      value={waTestPhone}
                      onChange={(e) => setWaTestPhone(e.target.value)}
                      disabled={waStatus !== 'CONNECTED' || waSendingTest}
                    />
                  )}
                </Labeled>
                <Labeled label="Test Message">
                  {(id) => (
                    <textarea
                      id={id}
                      rows={2}
                      className="input py-1.5 text-xs"
                      value={waTestMsg}
                      onChange={(e) => setWaTestMsg(e.target.value)}
                      disabled={waStatus !== 'CONNECTED' || waSendingTest}
                    />
                  )}
                </Labeled>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendTest}
              disabled={waStatus !== 'CONNECTED' || waSendingTest || !waTestPhone || !canUpdate}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-theme bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/95 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {waSendingTest ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={12} aria-hidden="true" />
              )}
              Send Test Message
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-xl border-t border-slate-100 bg-slate-50 p-3 pt-4 text-xs text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span>
          This connects via Puppeteer headless browser cache. The session .wwebjs_auth is persisted. Make sure your
          phone remains connected to the internet.
        </span>
      </div>
    </section>
  );
});

/* ---------- Page ---------- */

export default function IntegrationsPage() {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [integrations, setIntegrations] = useState(() => ({
    ...DEFAULT_INTEGRATIONS,
    ...(settings?.integrations || {})
  }));

  // Settings may load after first render; keep local state in sync
  useEffect(() => {
    if (settings?.integrations) {
      setIntegrations({ ...DEFAULT_INTEGRATIONS, ...settings.integrations });
    }
  }, [settings?.integrations]);

  const webhookBaseUrl = useMemo(
    () => window.location.origin.replace('3000', '5000').replace('5173', '5000') + '/api/leads/webhook',
    []
  );

  const canEdit = hasPermission(user, 'settings', 'update');
  const canReadWa = hasPermission(user, 'whatsapp_integration', 'read');
  const canUpdateWa = hasPermission(user, 'whatsapp_integration', 'update');

  const handleToggle = useCallback((provider) => {
    setIntegrations((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], isActive: !prev[provider]?.isActive }
    }));
  }, []);

  const handleChange = useCallback((provider, field, value) => {
    setIntegrations((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value }
    }));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      await updateSettings({ integrations });
      setMessage('Integrations settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to update integration settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Third-Party Integrations</h1>
          <p className="text-sm text-slate-500">
            Configure webhooks and API credentials to ingest leads from external platforms.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-white">
          <Save size={16} aria-hidden="true" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Always in the DOM so screen readers announce changes */}
      <div role="status" aria-live="polite">
        {message && (
          <div className="rounded-xl bg-slate-900 p-3 text-sm font-semibold text-white shadow-md">{message}</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {canEdit && (
          <>
            <JustdialCard
              config={integrations.justdial}
              onChange={handleChange}
              onToggle={handleToggle}
              webhookBaseUrl={webhookBaseUrl}
            />
            <IndiaMartCard
              config={integrations.indiamart}
              onChange={handleChange}
              onToggle={handleToggle}
              webhookBaseUrl={webhookBaseUrl}
            />
            <WebsiteCard
              config={integrations.website}
              onChange={handleChange}
              onToggle={handleToggle}
              webhookBaseUrl={webhookBaseUrl}
            />
            <ZohoCard
              config={integrations.zoho}
              onChange={handleChange}
              onToggle={handleToggle}
              webhookBaseUrl={webhookBaseUrl}
            />
          </>
        )}

        {canReadWa && <WhatsAppCard userId={user?._id} canUpdate={canUpdateWa} />}
      </div>
    </div>
  );
}