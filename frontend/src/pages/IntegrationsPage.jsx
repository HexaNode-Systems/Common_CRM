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

// Pausing a source makes its webhook refuse leads (the sender keeps them and retries later).
// Nothing is paused unless someone switches it off here.
const DEFAULT_INTEGRATIONS = {
  justdial: { isActive: false, paused: false, pollUrl: '', apiToken: '', apiTokenSet: false, pollIntervalMs: 300000 },
  indiamart: { paused: false },
  zoho: { paused: false },
  website: { paused: false }
};

const WEBHOOK_KEYS = { justdial: 'justdial', indiamart: 'indiamart', zoho: 'zoho', website: 'website_form' };

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
// Switch for "accepting leads" (on) / "paused" (off).
function Toggle({ provider, active, titleId, onToggle, disabled, onLabel = 'Accepting leads', offLabel = 'Paused' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!active}
      aria-labelledby={titleId}
      disabled={disabled}
      onClick={() => onToggle(provider)}
      className={`flex shrink-0 select-none items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
        active
          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border border-slate-200 bg-slate-100 text-slate-500'
      }`}
    >
      {active ? <CheckCircle size={12} aria-hidden="true" /> : <XCircle size={12} aria-hidden="true" />}
      {active ? onLabel : offLabel}
    </button>
  );
}

function CardShell({ id, icon, iconClass, title, subtitle, provider, active, onToggle, disabled, note, children }) {
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
          <Toggle provider={provider} active={active} titleId={titleId} onToggle={onToggle} disabled={disabled} />
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

// The real webhook URL (with the company's secret key) from Lead Distribution, or why it isn't shown.
function WebhookUrl({ webhook, provider }) {
  if (webhook?.error) {
    return <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{webhook.error}</p>;
  }
  if (!webhook) return <p className="text-xs text-slate-500">Loading webhook URL…</p>;
  const source = webhook.sources?.find((s) => s.value === WEBHOOK_KEYS[provider]);
  if (!webhook.token || !source) {
    return <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{webhook.message || 'Webhooks are not set up on this server yet.'}</p>;
  }
  return <CopyField label="Webhook URL (keep private)" value={webhook.base + source.path} />;
}

/* ---------- Provider cards (memoized: typing in one card doesn't re-render the others) ---------- */

const JustdialCard = memo(function JustdialCard({ config, onChange, onToggle, webhook, canEdit }) {
  const id = useId();
  return (
    <CardShell
      id={id}
      icon={<Globe size={20} />}
      iconClass="border-orange-100 bg-orange-50 text-orange-600"
      title="Justdial"
      subtitle="Receive Justdial enquiries by webhook or polling"
      provider="justdial"
      active={!config?.paused}
      onToggle={onToggle}
      disabled={!canEdit}
      note="Paste the webhook URL into your Justdial dashboard, or switch on polling if Justdial gives you a lead feed URL. Repeat enquiries from a known number are added to that lead's history."
    >
      <WebhookUrl webhook={webhook} provider="justdial" />
      <div className="space-y-3 rounded-xl border border-slate-100 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase text-slate-500">Polling</span>
          <Toggle provider="justdial-poll" active={config?.isActive} titleId={`${id}-title`} onToggle={() => onChange('justdial', 'isActive', !config?.isActive)} disabled={!canEdit} onLabel="On" offLabel="Off" />
        </div>
        <Labeled label="Lead feed URL">
          {(fid) => (
            <input id={fid} type="url" className={inputCls} placeholder="https://..." disabled={!canEdit} value={config?.pollUrl || ''} onChange={(e) => onChange('justdial', 'pollUrl', e.target.value)} />
          )}
        </Labeled>
        <Labeled label="API token">
          {(fid) => (
            <input
              id={fid}
              type="password"
              autoComplete="new-password"
              className={inputCls}
              disabled={!canEdit}
              placeholder={config?.apiTokenSet ? 'Saved. Type a new token to replace it.' : 'Token from Justdial (optional)'}
              value={config?.apiToken || ''}
              onChange={(e) => onChange('justdial', 'apiToken', e.target.value)}
            />
          )}
        </Labeled>
        <Labeled label="Check every (minutes)">
          {(fid) => (
            <input
              id={fid}
              type="number"
              min="1"
              max="1440"
              className={inputCls}
              disabled={!canEdit}
              value={Math.round((config?.pollIntervalMs || 300000) / 60000)}
              onChange={(e) => onChange('justdial', 'pollIntervalMs', Math.max(1, Number(e.target.value) || 1) * 60000)}
            />
          )}
        </Labeled>
      </div>
    </CardShell>
  );
});

const SimpleSourceCard = memo(function SimpleSourceCard({ provider, title, subtitle, icon, iconClass, note, config, onToggle, webhook, canEdit, children }) {
  const id = useId();
  return (
    <CardShell id={id} icon={icon} iconClass={iconClass} title={title} subtitle={subtitle} provider={provider} active={!config?.paused} onToggle={onToggle} disabled={!canEdit} note={note}>
      <WebhookUrl webhook={webhook} provider={provider} />
      {children}
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

  // Safety net for production: while a QR code is on screen or the session is starting, also ask
  // the server for the status every 3 seconds. WhatsApp replaces the QR code about every 20 seconds;
  // if a live socket update is missed (proxy without WebSocket support, dropped connection), the page
  // would keep showing an expired QR code and the phone would fail to link.
  useEffect(() => {
    if (!['INITIALIZING', 'LOADING', 'QR_RECEIVED'].includes(waStatus)) return undefined;
    const timer = setInterval(() => {
      api
        .get('/v1/whatsapp/status')
        .then(({ data }) => {
          setWaStatus(data.status);
          setWaQrCode(data.qrCode || '');
          if (data.status === 'CONNECTED') {
            setWaSuccess('WhatsApp connected successfully!');
            setWaError('');
          }
        })
        .catch(() => {
          /* keep the current state; the next tick retries */
        });
    }, 3000);
    return () => clearInterval(timer);
  }, [waStatus]);

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
  const { updateSettings } = useSettings();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [webhook, setWebhook] = useState(null);

  const canReadSettings = hasPermission(user, 'settings', 'read');
  const canEdit = hasPermission(user, 'settings', 'update');
  const canReadWa = hasPermission(user, 'whatsapp_integration', 'read');
  const canUpdateWa = hasPermission(user, 'whatsapp_integration', 'update');
  const apiBase = String(api.defaults.baseURL || '').replace(/\/+$/, '').replace(/\/v1$/, '');

  // Integration settings (secrets come back masked) and the real webhook URLs.
  useEffect(() => {
    if (!canReadSettings) return;
    api.get('/settings/integrations')
      .then(({ data }) => setIntegrations({ ...DEFAULT_INTEGRATIONS, ...(data.integrations || {}) }))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load integration settings.'));
    api.get('/leads/webhook-info')
      .then(({ data }) => setWebhook({ ...data, base: apiBase.startsWith('http') ? apiBase : `${window.location.origin}${apiBase}` }))
      .catch((err) => setWebhook({
        error: err.response?.status === 403
          ? 'Webhook URLs contain a secret key, so only Leads managers (Full access) can see them. Ask one to copy it from Leads → Lead Distribution.'
          : err.response?.data?.message || 'Unable to load the webhook URL.'
      }));
  }, [canReadSettings, apiBase]);

  const handleToggle = useCallback((provider) => {
    setIntegrations((prev) => ({ ...prev, [provider]: { ...prev[provider], paused: !prev[provider]?.paused } }));
  }, []);

  const handleChange = useCallback((provider, field, value) => {
    setIntegrations((prev) => ({ ...prev, [provider]: { ...prev[provider], [field]: value } }));
  }, []);

  const handleSave = async () => {
    const jd = integrations.justdial || {};
    if (jd.isActive && !/^https?:\/\//i.test(jd.pollUrl || '')) {
      setError('Justdial polling needs a lead feed URL starting with https://');
      return;
    }
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const payload = {
        justdial: { isActive: !!jd.isActive, paused: !!jd.paused, pollUrl: jd.pollUrl || '', pollIntervalMs: jd.pollIntervalMs || 300000, ...(jd.apiToken ? { apiToken: jd.apiToken } : {}) },
        indiamart: { paused: !!integrations.indiamart?.paused },
        zoho: { paused: !!integrations.zoho?.paused },
        website: { paused: !!integrations.website?.paused }
      };
      const data = await updateSettings({ integrations: payload });
      setIntegrations({ ...DEFAULT_INTEGRATIONS, ...(data.integrations || {}) });
      setMessage('Integration settings saved.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update integration settings.');
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
            Connect lead sources and WhatsApp. Lead routing rules live in Leads → Lead Distribution.
          </p>
        </div>
        {canEdit ? (
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-white">
            <Save size={16} aria-hidden="true" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        ) : null}
      </div>

      <div role="status" aria-live="polite">
        {message && <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</div>}
      </div>
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {canReadSettings && !canEdit ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">View only. You need Settings update access to change integrations.</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {canReadSettings && (
          <>
            <JustdialCard config={integrations.justdial} onChange={handleChange} onToggle={handleToggle} webhook={webhook} canEdit={canEdit} />
            <SimpleSourceCard
              provider="indiamart"
              title="IndiaMart"
              subtitle="Capture IndiaMart enquiries by webhook"
              icon={<ShoppingBag size={20} />}
              iconClass="border-emerald-100 bg-emerald-50 text-emerald-600"
              note="Paste this URL as the Push API / CRM integration URL in IndiaMart. SENDER_NAME, SENDER_MOBILE, SENDER_EMAIL and QUERY_MESSAGE are mapped automatically."
              config={integrations.indiamart}
              onToggle={handleToggle}
              webhook={webhook}
              canEdit={canEdit}
            />
            <SimpleSourceCard
              provider="website"
              title="Website Forms"
              subtitle="Send your contact form submissions here"
              icon={<Code size={20} />}
              iconClass="border-blue-100 bg-blue-50 text-blue-600"
              note="POST JSON or form data with name, phone, email and message. One lead or a list of up to 100."
              config={integrations.website}
              onToggle={handleToggle}
              webhook={webhook}
              canEdit={canEdit}
            >
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-2xs text-slate-100">{`{ "name": "Asha", "phone": "+91 98765 43210",\n  "email": "asha@example.com", "message": "Need a quote" }`}</pre>
            </SimpleSourceCard>
            <SimpleSourceCard
              provider="zoho"
              title="Zoho CRM"
              subtitle="Push Zoho leads with a workflow webhook"
              icon={<Database size={20} />}
              iconClass="border-purple-100 bg-purple-50 text-purple-600"
              note="In Zoho CRM: Setup → Automation → Workflow Rules → Webhook, method POST, this URL. Send First_Name, Last_Name, Company, Phone, Email and Description."
              config={integrations.zoho}
              onToggle={handleToggle}
              webhook={webhook}
              canEdit={canEdit}
            />
          </>
        )}
        {canReadWa && <WhatsAppCard userId={user?._id} canUpdate={canUpdateWa} />}
      </div>
    </div>
  );
}
