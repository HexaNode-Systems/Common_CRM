import { useState, useEffect, useRef, useCallback, useId, memo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { socket } from '../services/socket.js';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Send, Paperclip, AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw, X, FileText,
  Video, Image as ImageIcon, Upload, FileSpreadsheet, Sparkles, Play, Trash2, History,
  Link2, Sliders, Users, MessageSquare, Eye,
} from 'lucide-react';

const PAGE_SIZE = 100; // PERF: never render thousands of rows at once

const STATUS_BADGE = {
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  sent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  sending: 'bg-blue-50 text-blue-800 border-blue-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
};
const badgeClass = (s) => STATUS_BADGE[s] || 'bg-rose-50 text-rose-800 border-rose-200';
const textClass = (s) => (s === 'completed' ? 'text-emerald-700' : s === 'sending' ? 'text-blue-700' : 'text-rose-700');
const fmtDate = (d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const tick = () => new Promise((r) => setTimeout(r, 0)); // yield to the browser so the UI never freezes

/* Accessible modal: role=dialog, labelled, Escape closes, focus moves in and returns */
function Modal({ titleId, onClose, size = 'max-w-xl', children }) {
  const ref = useRef(null);
  useEffect(() => {
    const trigger = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      trigger?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex flex-col w-full ${size} max-h-[92dvh] rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-100 outline-none pb-[max(1.25rem,env(safe-area-inset-bottom))]`}
      >
        <button type="button" onClick={onClose} aria-label="Close dialog" className="absolute right-3 top-3 h-11 w-11 sm:h-9 sm:w-9 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 flex items-center justify-center">
          <X size={18} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* PERF: a row only re-renders when its own campaign object changes */
const HistoryRow = memo(function HistoryRow({ cmp, onView }) {
  return (
    <tr className="hover:bg-slate-50">
      <th scope="row" className="p-3 font-bold text-slate-900 text-left">{cmp.name}</th>
      <td className="p-3">{cmp.totalContacts}</td>
      <td className="p-3 font-semibold">
        <span className="text-emerald-700">{cmp.sentCount} sent</span>
        {cmp.failedCount > 0 && <span className="text-rose-700 ml-2">({cmp.failedCount} failed)</span>}
      </td>
      <td className="p-3 text-slate-600">{cmp.ctaType !== 'none' ? cmp.ctaText || 'CTA' : '-'}</td>
      <td className="p-3 text-slate-600 whitespace-nowrap">{fmtDate(cmp.createdAt)}</td>
      <td className="p-3">
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-extrabold uppercase ${badgeClass(cmp.status)}`}>{cmp.status}</span>
      </td>
      <td className="p-3 text-right">
        <button
          type="button"
          onClick={() => onView(cmp)}
          aria-label={`View report for ${cmp.name}`}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200"
        >
          <Eye size={13} aria-hidden="true" /> View report
        </button>
      </td>
    </tr>
  );
});

export default function WhatsAppCampaignPage() {
  const { user } = useAuth();
  const uid = useId();
  const [status, setStatus] = useState('LOADING');

  const [bulkContacts, setBulkContacts] = useState([]);
  const [manualInputText, setManualInputText] = useState('');
  const [contactInputMode, setContactInputMode] = useState('csv');
  const [showManageContactsModal, setShowManageContactsModal] = useState(false);
  const [manageShown, setManageShown] = useState(PAGE_SIZE);

  const [campaignName, setCampaignName] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [campaignMediaFile, setCampaignMediaFile] = useState(null);
  const [ctaType, setCtaType] = useState('none');
  const [ctaText, setCtaText] = useState('');
  const [ctaValue, setCtaValue] = useState('');
  const [sendDelay, setSendDelay] = useState(1.5);

  const [shooting, setShooting] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(null);
  const [campaignError, setCampaignError] = useState('');
  const [campaignSuccess, setCampaignSuccess] = useState('');

  const [campaignsHistory, setCampaignsHistory] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [selectedCampaignReport, setSelectedCampaignReport] = useState(null);
  const [reportShown, setReportShown] = useState(PAGE_SIZE);

  const csvFileInputRef = useRef(null);
  const campaignFileInputRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;
  const pendingProgress = useRef(null);
  const flushTimer = useRef(null);

  const loadCampaignHistory = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const { data } = await api.get('/v1/whatsapp/campaigns');
      setCampaignsHistory(data || []);
    } catch (err) {
      console.error('Failed to load campaign history:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  /* Sockets: subscribed ONCE (old code re-subscribed whenever user changed and connected before first paint) */
  useEffect(() => {
    const start = () => socket.connect();
    const idle = 'requestIdleCallback' in window ? window.requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300);
    const mine = (id) => !id || !userRef.current?._id || id === userRef.current._id;

    const onStatus = (d) => mine(d.userId) && setStatus(d.status);

    const onProgress = (d) => {
      if (!mine(d.userId)) return;
      pendingProgress.current = d;
      const done = d.status === 'completed' || d.status === 'failed';
      if (done) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
        setCampaignProgress(d);
        setShooting(false);
        loadCampaignHistory();
      } else if (!flushTimer.current) {
        // PERF: max ~3 renders/sec even if the server emits progress for every message
        flushTimer.current = setTimeout(() => {
          flushTimer.current = null;
          setCampaignProgress(pendingProgress.current);
        }, 300);
      }
    };

    socket.on('whatsapp:status', onStatus);
    socket.on('whatsapp:campaign_progress', onProgress);

    api.get('/v1/whatsapp/status').then(({ data }) => setStatus(data.status)).catch((err) => {
      console.error('Failed to fetch status:', err);
      setStatus('DISCONNECTED');
    });
    loadCampaignHistory(); // parallel with status

    return () => {
      'cancelIdleCallback' in window ? window.cancelIdleCallback(idle) : clearTimeout(idle);
      clearTimeout(flushTimer.current);
      socket.off('whatsapp:status', onStatus);
      socket.off('whatsapp:campaign_progress', onProgress);
      socket.disconnect();
    };
  }, [loadCampaignHistory]);

  // Auto-dismiss messages, with proper timer cleanup
  useEffect(() => {
    if (!campaignSuccess) return undefined;
    const t = setTimeout(() => setCampaignSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [campaignSuccess]);
  useEffect(() => {
    if (!campaignError) return undefined;
    const t = setTimeout(() => setCampaignError(''), 6000);
    return () => clearTimeout(t);
  }, [campaignError]);

  /* ---------- contacts ---------- */

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      const parsed = [];
      const seen = new Set(bulkContacts.map((c) => c.phone));

      for (let i = 0; i < lines.length; i++) {
        if (i > 0 && i % 2000 === 0) await tick(); // PERF: break big files into small tasks (no long task / frozen UI)
        const line = lines[i];
        if (!line.trim()) continue;
        const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        let phone = '';
        let name = '';
        for (const part of parts) {
          const clean = part.replace(/\D/g, '').replace(/^0+/, '');
          if (clean.length >= 7 && clean.length <= 15) phone = clean;
          else if (part && !name && !/\d{5,}/.test(part)) name = part;
        }
        if (phone && !seen.has(phone)) {
          seen.add(phone);
          parsed.push({ phone, name });
        }
      }

      if (parsed.length) {
        setBulkContacts((prev) => [...prev, ...parsed]);
        setCampaignSuccess(`Successfully imported ${parsed.length} contacts from CSV!`);
      } else {
        setCampaignError('No valid phone numbers found in the uploaded file.');
      }
    } catch (err) {
      console.error('CSV Parsing Error:', err);
      setCampaignError('Failed to parse uploaded CSV file.');
    } finally {
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    }
  };

  const handleAddManualContacts = () => {
    if (!manualInputText.trim()) return;
    const items = manualInputText.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    const parsed = [];
    const seen = new Set(bulkContacts.map((c) => c.phone));
    for (const item of items) {
      const clean = item.replace(/\D/g, '').replace(/^0+/, '');
      if (clean.length >= 7 && !seen.has(clean)) {
        seen.add(clean);
        parsed.push({ phone: clean, name: '' });
      }
    }
    if (parsed.length) {
      setBulkContacts((prev) => [...prev, ...parsed]);
      setManualInputText('');
      setCampaignSuccess(`Added ${parsed.length} contact numbers!`);
    } else {
      setCampaignError('Please enter valid 10+ digit phone numbers.');
    }
  };

  const handleClearContacts = () => {
    setBulkContacts([]);
    setCampaignSuccess('Contacts list cleared.');
  };
  const handleRemoveContact = (i) => setBulkContacts((prev) => prev.filter((_, idx) => idx !== i));

  const downloadSampleCsv = () => {
    const blob = new Blob(['Name,Phone\nRajesh Kumar,919876543210\nAnanya Sharma,919812345678\nSuresh Verma,919900112233\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_whatsapp_contacts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShootCampaign = async (e) => {
    e.preventDefault();
    setCampaignError('');
    setCampaignSuccess('');
    if (status !== 'CONNECTED') return setCampaignError('WhatsApp is disconnected. Please scan QR code in Integrations page first.');
    if (bulkContacts.length === 0) return setCampaignError('Please add at least 1 contact number or upload a CSV file.');
    if (!campaignName.trim()) return setCampaignError('Please enter a Campaign Name.');
    if (!campaignBody.trim()) return setCampaignError('Please enter the Message Body content.');

    setShooting(true);
    const formData = new FormData();
    formData.append('name', campaignName);
    formData.append('contacts', JSON.stringify(bulkContacts));
    formData.append('body', campaignBody);
    formData.append('ctaType', ctaType);
    formData.append('ctaText', ctaText);
    formData.append('ctaValue', ctaValue);
    formData.append('delay', sendDelay);
    if (campaignMediaFile) formData.append('file', campaignMediaFile);

    try {
      const { data } = await api.post('/v1/whatsapp/campaigns/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCampaignSuccess('Bulk campaign launched! Shooting messages in background...');
      setCampaignProgress({ campaignId: data.campaignId, sentCount: 0, failedCount: 0, totalContacts: data.totalContacts, status: 'sending' });
    } catch (err) {
      setShooting(false);
      setCampaignError(err.response?.data?.message || 'Failed to shoot campaign.');
    }
  };

  const closeManage = useCallback(() => setShowManageContactsModal(false), []);
  const closeReport = useCallback(() => setSelectedCampaignReport(null), []);
  const [loadingReport, setLoadingReport] = useState(false);
  // List no longer carries every contact: open the report at once, then fetch the details on demand
  const openReport = useCallback(async (cmp) => {
    setReportShown(PAGE_SIZE);
    setSelectedCampaignReport(cmp);
    if (cmp.contacts) return;
    setLoadingReport(true);
    try {
      const { data } = await api.get(`/v1/whatsapp/campaigns/${cmp._id}`);
      setSelectedCampaignReport((cur) => (cur && cur._id === cmp._id ? { ...cur, ...data } : cur));
    } catch (err) {
      console.error('Failed to load campaign report:', err);
      setCampaignError('Failed to load campaign report details.');
    } finally {
      setLoadingReport(false);
    }
  }, []);
  const openManage = () => { setManageShown(PAGE_SIZE); setShowManageContactsModal(true); };

  const connected = status === 'CONNECTED';
  const canConnect = status === 'DISCONNECTED' || status === 'QR_RECEIVED';
  const pct = campaignProgress
    ? Math.min(100, Math.round(((campaignProgress.sentCount + campaignProgress.failedCount) / (campaignProgress.totalContacts || 1)) * 100))
    : 0;

  const id = (s) => `${uid}-${s}`;
  const linkBtn = 'text-xs font-bold text-slate-900 underline underline-offset-2 py-1';
  const fieldLabel = 'text-xs font-semibold text-slate-700 mb-1 block';

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* ===== Header ===== */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
            <Send size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">WhatsApp Bulk Campaign Studio</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Create and send bulk WhatsApp campaigns to imported CSV lists or numbers.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div role="status" className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-600' : status === 'QR_RECEIVED' ? 'bg-amber-500' : status === 'LOADING' ? 'bg-slate-400' : 'bg-rose-600'}`} />
            <span>{status === 'LOADING' ? 'Checking WhatsApp…' : connected ? 'WhatsApp connected' : 'WhatsApp disconnected'}</span>
            {canConnect && <Link to="/integrations" className="text-slate-900 underline underline-offset-2 text-xs font-bold ml-1">Connect</Link>}
          </div>
          <Link to="/whatsapp-inbox" className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800">
            <MessageSquare size={14} aria-hidden="true" /> Open WhatsApp Inbox
          </Link>
        </div>
      </header>

      {/* ===== Alerts ===== */}
      {campaignError && (
        <div role="alert" className="flex items-center justify-between gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          <div className="flex items-center gap-2"><AlertCircle size={16} aria-hidden="true" /><span>{campaignError}</span></div>
          <button type="button" onClick={() => setCampaignError('')} aria-label="Dismiss error" className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full hover:bg-red-100"><X size={16} aria-hidden="true" /></button>
        </div>
      )}
      {campaignSuccess && (
        <div role="status" className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900 border border-emerald-200">
          <div className="flex items-center gap-2"><CheckCircle2 size={16} aria-hidden="true" /><span>{campaignSuccess}</span></div>
          <button type="button" onClick={() => setCampaignSuccess('')} aria-label="Dismiss message" className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full hover:bg-emerald-100"><X size={16} aria-hidden="true" /></button>
        </div>
      )}

      {/* ===== Progress ===== */}
      {campaignProgress && (
        <section aria-labelledby={id('progress')} className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {shooting ? <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" />
                : campaignProgress.status === 'completed' ? <CheckCircle2 size={18} className="text-emerald-700" aria-hidden="true" />
                : <AlertCircle size={18} className="text-rose-700" aria-hidden="true" />}
              {/* H2 (was H4 – skipped H2 and H3) */}
              <h2 id={id('progress')} className="text-sm font-bold text-slate-900">{shooting ? 'Campaign sending in progress…' : 'Campaign progress summary'}</h2>
            </div>
            <span className="text-xs font-extrabold text-slate-900">{pct}%</span>
          </div>

          <div role="progressbar" aria-labelledby={id('progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            {/* PERF: transform is GPU-composited; animating `width` forces layout every update */}
            <div className="bg-primary h-full w-full origin-left rounded-full transition-transform duration-300 motion-reduce:transition-none" style={{ transform: `scaleX(${pct / 100})` }} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-700 pt-1">
            <span>Total contacts: <strong className="text-slate-900">{campaignProgress.totalContacts}</strong></span>
            <span className="text-emerald-700 font-bold">Sent: {campaignProgress.sentCount}</span>
            <span className="text-rose-700 font-bold">Failed: {campaignProgress.failedCount}</span>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* ===== Step 1 ===== */}
        <section aria-labelledby={id('step1')} className="lg:col-span-5 flex flex-col space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 id={id('step1')} className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Users size={16} aria-hidden="true" /> Step 1: Add contacts / numbers
            </h2>
            <span className="rounded-full bg-primary/10 text-slate-900 px-2.5 py-0.5 text-xs font-extrabold shrink-0">{bulkContacts.length} loaded</span>
          </div>

          <div role="group" aria-label="Contact input method" className="flex rounded-lg bg-slate-100 p-1 text-xs">
            {[['csv', 'CSV file upload'], ['manual', 'Manual bulk entry']].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setContactInputMode(mode)}
                aria-pressed={contactInputMode === mode}
                className={`flex-1 py-2 font-bold rounded-md ${contactInputMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {contactInputMode === 'csv' ? (
            <div className="flex-1 flex flex-col space-y-4 pt-1">
              <input id={id('csv')} type="file" ref={csvFileInputRef} accept=".csv,.txt" onChange={handleCsvUpload} className="sr-only" tabIndex={-1} aria-label="Upload CSV or TXT contacts file" />
              {/* Real <button>, not a clickable <div> */}
              <button
                type="button"
                onClick={() => csvFileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6 text-center hover:border-primary hover:bg-primary/5"
              >
                <span aria-hidden="true" className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2"><FileSpreadsheet size={24} /></span>
                <span className="text-sm font-bold text-slate-900">Upload CSV or TXT file</span>
                <span className="text-xs text-slate-600 mt-1">Tap to browse your files</span>
                <span className="mt-3 rounded-md bg-white border border-slate-200 px-2 py-1 text-xs text-slate-700 font-mono">Format: Name, Phone (or Phone only)</span>
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={downloadSampleCsv} className={`${linkBtn} flex items-center gap-1`}>
                  <Upload size={13} className="rotate-180" aria-hidden="true" /> Sample CSV template
                </button>
                {bulkContacts.length > 0 && (
                  <button type="button" onClick={handleClearContacts} className="text-xs font-bold text-rose-700 underline underline-offset-2 py-1 flex items-center gap-1">
                    <Trash2 size={13} aria-hidden="true" /> Clear ({bulkContacts.length})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-3 pt-1">
              <div>
                <label htmlFor={id('manual')} className={fieldLabel}>Paste contact numbers (comma, space, or newline separated)</label>
                <textarea
                  id={id('manual')}
                  rows="6"
                  placeholder={'919876543210\n919812345678\n919900112233'}
                  value={manualInputText}
                  onChange={(e) => setManualInputText(e.target.value)}
                  className="input font-mono text-base sm:text-xs placeholder:text-slate-500 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="button" onClick={handleAddManualContacts} className="h-10 text-xs px-3">+ Add numbers</Button>
                {bulkContacts.length > 0 && (
                  <button type="button" onClick={handleClearContacts} className="text-xs font-bold text-rose-700 underline underline-offset-2 py-1 flex items-center gap-1">
                    <Trash2 size={13} aria-hidden="true" /> Clear ({bulkContacts.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {bulkContacts.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
                <span>Loaded contacts ({bulkContacts.length})</span>
                <button type="button" onClick={openManage} className={linkBtn}>Manage full list</button>
              </div>
              <ul className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {bulkContacts.slice(0, 15).map((item, idx) => (
                  <li key={item.phone} className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 pl-2 text-xs font-mono font-medium text-slate-800">
                    {item.phone}
                    <button type="button" onClick={() => handleRemoveContact(idx)} aria-label={`Remove ${item.phone}`} className="h-8 w-8 flex items-center justify-center text-slate-600 hover:text-slate-900">
                      <X size={12} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {bulkContacts.length > 15 && <li className="text-xs font-bold text-slate-600 py-1 px-1">+{bulkContacts.length - 15} more</li>}
              </ul>
            </div>
          )}
        </section>

        {/* ===== Step 2 ===== */}
        <section aria-labelledby={id('step2')} className="lg:col-span-7 flex flex-col space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 id={id('step2')} className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Sparkles size={16} aria-hidden="true" /> Step 2: Campaign details and CTA button
          </h2>

          <form onSubmit={handleShootCampaign} className="space-y-4">
            <div>
              <label htmlFor={id('name')} className="mb-1 block text-sm font-medium text-slate-800">Campaign name <span aria-hidden="true" className="text-rose-700">*</span></label>
              <input id={id('name')} required placeholder="e.g. Festival Offer Broadcast" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="input text-base sm:text-sm placeholder:text-slate-500" />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                {/* Was a <span>: now a real label tied to the textarea */}
                <label htmlFor={id('body')} className="text-sm font-medium text-slate-800">Message content (body) <span aria-hidden="true" className="text-rose-700">*</span></label>
                <button type="button" onClick={() => setCampaignBody((p) => `${p} {name}`)} className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1.5 text-xs font-bold text-slate-900">
                  + Insert {'{name}'}
                </button>
              </div>
              <textarea
                id={id('body')}
                rows="4"
                required
                placeholder="Hello {name}, Check out our latest products with special discount offer!"
                value={campaignBody}
                onChange={(e) => setCampaignBody(e.target.value)}
                className="input text-base sm:text-sm leading-relaxed placeholder:text-slate-500 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <span id={id('media-label')} className="text-sm font-medium text-slate-800 mb-1 block">Media file (image, video or PDF)</span>
              <input
                type="file"
                ref={campaignFileInputRef}
                accept="image/*,video/*,application/pdf"
                aria-labelledby={id('media-label')}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setCampaignMediaFile(f); }}
                className="sr-only"
                tabIndex={-1}
              />
              {campaignMediaFile ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {campaignMediaFile.type.startsWith('image/') ? <ImageIcon size={20} aria-hidden="true" />
                      : campaignMediaFile.type.startsWith('video/') ? <Video size={20} aria-hidden="true" />
                      : <FileText size={20} aria-hidden="true" />}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{campaignMediaFile.name}</p>
                      <p className="text-xs text-slate-600">{(campaignMediaFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCampaignMediaFile(null); if (campaignFileInputRef.current) campaignFileInputRef.current.value = ''; }}
                    aria-label="Remove attached file"
                    className="h-10 w-10 shrink-0 text-slate-700 rounded-full hover:bg-slate-200 flex items-center justify-center"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => campaignFileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-400 py-3 text-xs font-semibold text-slate-800 hover:border-primary hover:bg-primary/5">
                  <Paperclip size={16} aria-hidden="true" /> Attach image / video / document
                </button>
              )}
            </div>

            <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 min-w-0">
              <legend className="px-1 text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 size={14} aria-hidden="true" /> Call to action (CTA) button
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor={id('cta-type')} className={fieldLabel}>CTA type</label>
                  <select id={id('cta-type')} value={ctaType} onChange={(e) => setCtaType(e.target.value)} className="input py-2 text-base sm:text-xs focus:ring-primary focus:border-primary">
                    <option value="none">No CTA button</option>
                    <option value="url">Website link (URL)</option>
                    <option value="call">Call phone number</option>
                    <option value="custom">Custom action</option>
                  </select>
                </div>
                {ctaType !== 'none' && (
                  <>
                    <div>
                      <label htmlFor={id('cta-text')} className={fieldLabel}>Button label text</label>
                      <input id={id('cta-text')} type="text" placeholder="e.g. Visit Website" value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="input py-2 text-base sm:text-xs placeholder:text-slate-500" />
                    </div>
                    <div>
                      <label htmlFor={id('cta-value')} className={fieldLabel}>URL / phone value</label>
                      <input id={id('cta-value')} type="text" placeholder={ctaType === 'url' ? 'https://website.com' : '+919876543210'} value={ctaValue} onChange={(e) => setCtaValue(e.target.value)} className="input py-2 text-base sm:text-xs placeholder:text-slate-500" />
                    </div>
                  </>
                )}
              </div>
            </fieldset>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <Sliders size={16} className="text-slate-700 mt-0.5" aria-hidden="true" />
                <div>
                  <label htmlFor={id('delay')} className="text-xs font-bold text-slate-900 block">Sending throttle delay</label>
                  <p id={id('delay-hint')} className="text-xs text-slate-600">Gap between each message to prevent WhatsApp spam flags</p>
                </div>
              </div>
              <select id={id('delay')} aria-describedby={id('delay-hint')} value={sendDelay} onChange={(e) => setSendDelay(Number(e.target.value))} className="input py-2 text-base sm:text-xs font-bold sm:w-32 text-center">
                <option value={1}>1 sec / msg</option>
                <option value={1.5}>1.5 sec / msg</option>
                <option value={2}>2 sec / msg</option>
                <option value={3}>3 sec / msg</option>
                <option value={5}>5 sec / msg</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={shooting || !connected || bulkContacts.length === 0}
              className="w-full min-h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 px-3"
            >
              {shooting ? (
                <><Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" /> Sending bulk campaign…</>
              ) : (
                <><Play size={18} fill="currentColor" aria-hidden="true" /> Send bulk campaign now ({bulkContacts.length} contacts)</>
              )}
            </button>
          </form>
        </section>
      </div>

      {/* ===== History ===== */}
      <section aria-labelledby={id('history')} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id={id('history')} className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History size={16} aria-hidden="true" /> Campaign history and reports
          </h2>
          <button type="button" onClick={loadCampaignHistory} className={`${linkBtn} flex items-center gap-1`}>
            <RefreshCw size={13} className={loadingCampaigns ? 'motion-safe:animate-spin' : ''} aria-hidden="true" /> Refresh history
          </button>
        </div>

        {loadingCampaigns && campaignsHistory.length === 0 ? (
          <div role="status" className="py-6 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="motion-safe:animate-spin" size={16} aria-hidden="true" /> Loading campaign history…
          </div>
        ) : campaignsHistory.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-600">No campaigns launched yet. Create your first campaign above!</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-xs">
              <caption className="sr-only">Campaign history with sent and failed counts</caption>
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-700">
                <tr>
                  <th scope="col" className="p-3">Campaign name</th>
                  <th scope="col" className="p-3">Target contacts</th>
                  <th scope="col" className="p-3">Sent / failed</th>
                  <th scope="col" className="p-3">CTA button</th>
                  <th scope="col" className="p-3">Date</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {campaignsHistory.map((cmp) => <HistoryRow key={cmp._id} cmp={cmp} onView={openReport} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== Modal: manage contacts ===== */}
      {showManageContactsModal && (
        <Modal titleId={id('manage-title')} onClose={closeManage}>
          <h2 id={id('manage-title')} className="text-base font-bold text-slate-900 mb-1 pr-10 flex items-center gap-1.5">
            <Users size={18} aria-hidden="true" /> Manage loaded contacts ({bulkContacts.length})
          </h2>
          <p className="text-xs text-slate-600 mb-4">Review or remove contact numbers before sending the campaign.</p>

          <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl min-h-0">
            {bulkContacts.slice(0, manageShown).map((c, idx) => (
              <li key={c.phone} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 44px' }}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-slate-600 font-mono text-xs w-8 shrink-0">#{idx + 1}</span>
                  <span className="font-mono font-bold text-slate-900">{c.phone}</span>
                  {c.name && <span className="text-slate-700 truncate">({c.name})</span>}
                </div>
                <button type="button" onClick={() => handleRemoveContact(idx)} aria-label={`Remove ${c.phone}`} className="text-rose-700 h-10 w-10 shrink-0 flex items-center justify-center rounded hover:bg-rose-50">
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
            {bulkContacts.length > manageShown && (
              <li className="p-3 text-center">
                <button type="button" onClick={() => setManageShown((n) => n + PAGE_SIZE)} className={linkBtn}>
                  Show more ({bulkContacts.length - manageShown} remaining)
                </button>
              </li>
            )}
          </ul>

          <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-slate-100 mt-4">
            <button type="button" onClick={handleClearContacts} className="text-xs font-bold text-rose-700 underline underline-offset-2 py-2">Clear all contacts</button>
            <Button type="button" onClick={closeManage}>Done ({bulkContacts.length} ready)</Button>
          </div>
        </Modal>
      )}

      {/* ===== Modal: campaign report ===== */}
      {selectedCampaignReport && (
        <Modal titleId={id('report-title')} onClose={closeReport} size="max-w-2xl">
          <div className="flex items-center gap-2 mb-1 pr-10">
            <span aria-hidden="true" className="p-2 rounded-lg bg-primary/10 text-slate-900"><Send size={18} /></span>
            <div className="min-w-0">
              <h2 id={id('report-title')} className="text-base font-bold text-slate-900 truncate">{selectedCampaignReport.name}</h2>
              <p className="text-xs text-slate-600">Launched on {new Date(selectedCampaignReport.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            {[
              ['Total', selectedCampaignReport.totalContacts, 'text-slate-900'],
              ['Sent', selectedCampaignReport.sentCount, 'text-emerald-700'],
              ['Failed', selectedCampaignReport.failedCount, 'text-rose-700'],
              ['Status', selectedCampaignReport.status, `${textClass(selectedCampaignReport.status)} uppercase text-sm`],
            ].map(([label, value, cls]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <dt className="text-xs font-semibold text-slate-700 uppercase">{label}</dt>
                <dd className={`text-lg font-bold ${cls}`}>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs mb-4">
            <p className="text-xs font-bold uppercase text-slate-700 mb-1">Message content</p>
            <p className="text-slate-900 whitespace-pre-wrap break-words">{selectedCampaignReport.body}</p>
            {selectedCampaignReport.ctaType !== 'none' && selectedCampaignReport.ctaText && (
              <p className="mt-2 pt-2 border-t border-slate-200 text-slate-700 font-medium">
                CTA button: <strong>{selectedCampaignReport.ctaText}</strong> ({selectedCampaignReport.ctaValue || 'none'})
              </p>
            )}
          </div>

          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl min-h-0">
            <table className="w-full min-w-[520px] text-left text-xs">
              <caption className="sr-only">Delivery status for each contact</caption>
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-700 sticky top-0">
                <tr>
                  <th scope="col" className="p-2.5">#</th>
                  <th scope="col" className="p-2.5">Phone number</th>
                  <th scope="col" className="p-2.5">Name</th>
                  <th scope="col" className="p-2.5">Status</th>
                  <th scope="col" className="p-2.5">Error / details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {(selectedCampaignReport.contacts || []).slice(0, reportShown).map((c, idx) => (
                  <tr key={`${c.phone}-${idx}`} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-600 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">{c.phone}</td>
                    <td className="p-2.5 text-slate-700">{c.name || '-'}</td>
                    <td className="p-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${badgeClass(c.status)}`}>
                        {c.status === 'sent' ? <CheckCircle2 size={10} aria-hidden="true" /> : c.status === 'failed' ? <AlertCircle size={10} aria-hidden="true" /> : <Clock size={10} aria-hidden="true" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-xs text-slate-700">
                      {c.status === 'sent' && c.sentAt ? <span className="text-emerald-700">Sent at {new Date(c.sentAt).toLocaleTimeString()}</span>
                        : c.error ? <span className="text-rose-700 font-medium">{c.error}</span> : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loadingReport && (
              <p role="status" className="p-4 text-center text-sm text-slate-600 flex items-center justify-center gap-2">
                <Loader2 className="motion-safe:animate-spin" size={16} aria-hidden="true" /> Loading contact details…
              </p>
            )}
            {(selectedCampaignReport.contacts || []).length > reportShown && (
              <div className="p-3 text-center border-t border-slate-100">
                <button type="button" onClick={() => setReportShown((n) => n + PAGE_SIZE)} className={linkBtn}>
                  Show more ({selectedCampaignReport.contacts.length - reportShown} remaining)
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
            <Button type="button" onClick={closeReport}>Close report</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}