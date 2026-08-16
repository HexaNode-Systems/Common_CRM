import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { socket } from '../services/socket.js';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Send, 
  Paperclip, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Loader2, 
  RefreshCw, 
  Phone,
  X,
  FileText,
  Video,
  Image as ImageIcon,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Play,
  Trash2,
  History,
  Link2,
  Sliders,
  Users,
  MessageSquare,
  Eye
} from 'lucide-react';

export default function WhatsAppCampaignPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('DISCONNECTED');

  // Contacts States
  const [bulkContacts, setBulkContacts] = useState([]);
  const [manualInputText, setManualInputText] = useState('');
  const [contactInputMode, setContactInputMode] = useState('csv'); // 'csv' or 'manual'
  const [showManageContactsModal, setShowManageContactsModal] = useState(false);

  // Campaign Form States
  const [campaignName, setCampaignName] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [campaignMediaFile, setCampaignMediaFile] = useState(null);
  const [ctaType, setCtaType] = useState('none'); // none, url, call, custom
  const [ctaText, setCtaText] = useState('');
  const [ctaValue, setCtaValue] = useState('');
  const [sendDelay, setSendDelay] = useState(1.5); // seconds

  // Execution & Progress States
  const [shooting, setShooting] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(null);
  const [campaignError, setCampaignError] = useState('');
  const [campaignSuccess, setCampaignSuccess] = useState('');

  // History States
  const [campaignsHistory, setCampaignsHistory] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignReport, setSelectedCampaignReport] = useState(null);

  // File Inputs Refs
  const csvFileInputRef = useRef(null);
  const campaignFileInputRef = useRef(null);

  useEffect(() => {
    socket.connect();

    socket.on('whatsapp:status', (data) => {
      if (data.userId && data.userId !== user?._id) return;
      setStatus(data.status);
    });

    socket.on('whatsapp:campaign_progress', (progressData) => {
      setCampaignProgress(progressData);
      if (progressData.status === 'completed' || progressData.status === 'failed') {
        setShooting(false);
        loadCampaignHistory();
      }
    });

    fetchStatus();
    loadCampaignHistory();

    return () => {
      socket.off('whatsapp:status');
      socket.off('whatsapp:campaign_progress');
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/v1/whatsapp/status');
      setStatus(data.status);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const loadCampaignHistory = async () => {
    setLoadingCampaigns(true);
    try {
      const { data } = await api.get('/v1/whatsapp/campaigns');
      setCampaignsHistory(data || []);
    } catch (err) {
      console.error('Failed to load campaign history:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // CSV File Parsing
  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      const parsedContacts = [];
      const seen = new Set(bulkContacts.map(c => c.phone));

      for (let line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
        
        let phone = '';
        let name = '';
        
        for (let part of parts) {
          const cleanPart = part.replace(/\D/g, '');
          if (cleanPart.length >= 10 && cleanPart.length <= 15) {
            phone = cleanPart;
          } else if (part && !name && !/\d{5,}/.test(part)) {
            name = part;
          }
        }

        if (phone && !seen.has(phone)) {
          seen.add(phone);
          parsedContacts.push({ phone, name: name || '' });
        }
      }

      if (parsedContacts.length > 0) {
        setBulkContacts(prev => [...prev, ...parsedContacts]);
        setCampaignSuccess(`Successfully imported ${parsedContacts.length} contacts from CSV!`);
        setTimeout(() => setCampaignSuccess(''), 4000);
      } else {
        setCampaignError('No valid 10+ digit phone numbers found in the uploaded file.');
        setTimeout(() => setCampaignError(''), 4000);
      }
    } catch (err) {
      console.error('CSV Parsing Error:', err);
      setCampaignError('Failed to parse uploaded CSV file.');
    } finally {
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    }
  };

  // Manual Bulk Input Parsing
  const handleAddManualContacts = () => {
    if (!manualInputText.trim()) return;

    const items = manualInputText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    const parsed = [];
    const seen = new Set(bulkContacts.map(c => c.phone));

    for (let item of items) {
      const clean = item.replace(/\D/g, '');
      if (clean.length >= 10 && !seen.has(clean)) {
        seen.add(clean);
        parsed.push({ phone: clean, name: '' });
      }
    }

    if (parsed.length > 0) {
      setBulkContacts(prev => [...prev, ...parsed]);
      setManualInputText('');
      setCampaignSuccess(`Added ${parsed.length} contact numbers!`);
      setTimeout(() => setCampaignSuccess(''), 4000);
    } else {
      setCampaignError('Please enter valid 10+ digit phone numbers.');
      setTimeout(() => setCampaignError(''), 4000);
    }
  };

  const handleClearContacts = () => {
    setBulkContacts([]);
    setCampaignSuccess('Contacts list cleared.');
    setTimeout(() => setCampaignSuccess(''), 3000);
  };

  const handleRemoveContact = (indexToRemove) => {
    setBulkContacts(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Phone\nRajesh Kumar,919876543210\nAnanya Sharma,919812345678\nSuresh Verma,919900112233\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_whatsapp_contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Launch Campaign Submit
  const handleShootCampaign = async (e) => {
    e.preventDefault();
    setCampaignError('');
    setCampaignSuccess('');

    if (status !== 'CONNECTED') {
      setCampaignError('WhatsApp is disconnected. Please scan QR code in Integrations page first.');
      return;
    }

    if (bulkContacts.length === 0) {
      setCampaignError('Please add at least 1 contact number or upload a CSV file.');
      return;
    }

    if (!campaignName.trim()) {
      setCampaignError('Please enter a Campaign Name.');
      return;
    }

    if (!campaignBody.trim()) {
      setCampaignError('Please enter the Message Body content.');
      return;
    }

    setShooting(true);

    const formData = new FormData();
    formData.append('name', campaignName);
    formData.append('contacts', JSON.stringify(bulkContacts));
    formData.append('body', campaignBody);
    formData.append('ctaType', ctaType);
    formData.append('ctaText', ctaText);
    formData.append('ctaValue', ctaValue);
    formData.append('delay', sendDelay);
    if (campaignMediaFile) {
      formData.append('file', campaignMediaFile);
    }

    try {
      const { data } = await api.post('/v1/whatsapp/campaigns/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCampaignSuccess('Bulk campaign launched! Shooting messages in background...');
      setCampaignProgress({
        campaignId: data.campaignId,
        sentCount: 0,
        failedCount: 0,
        totalContacts: data.totalContacts,
        status: 'sending'
      });
    } catch (err) {
      setShooting(false);
      setCampaignError(err.response?.data?.message || 'Failed to shoot campaign.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#20ba59]">
              <Send size={20} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                WhatsApp Bulk Campaign Studio
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Create & shoot high-converting bulk WhatsApp campaigns to imported CSV lists or numbers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active WhatsApp session indicator */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
            <span className={`h-2.5 w-2.5 rounded-full ${
              status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' :
              status === 'QR_RECEIVED' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
            }`} />
            <span>
              {status === 'CONNECTED' ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
            </span>
            {status !== 'CONNECTED' && (
              <Link to="/integrations" className="text-primary hover:underline text-[11px] font-bold ml-1">
                Connect
              </Link>
            )}
          </div>

          <Link
            to="/whatsapp-inbox"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition"
          >
            <MessageSquare size={14} className="text-primary" /> Open WhatsApp Inbox
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {campaignError && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700 border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{campaignError}</span>
          </div>
          <button type="button" onClick={() => setCampaignError('')} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {campaignSuccess && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800 border border-emerald-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{campaignSuccess}</span>
          </div>
          <button type="button" onClick={() => setCampaignSuccess('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Real-time Progress Bar */}
      {campaignProgress && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {shooting ? (
                <Loader2 size={18} className="animate-spin text-primary" />
              ) : campaignProgress.status === 'completed' ? (
                <CheckCircle2 size={18} className="text-emerald-600" />
              ) : (
                <AlertCircle size={18} className="text-rose-600" />
              )}
              <h4 className="text-sm font-bold text-slate-900">
                {shooting ? 'Campaign Shooting in Progress...' : 'Campaign Progress Summary'}
              </h4>
            </div>
            <span className="text-xs font-extrabold text-primary">
              {Math.round((campaignProgress.sentCount + campaignProgress.failedCount) / (campaignProgress.totalContacts || 1) * 100)}%
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ 
                width: `${Math.min(100, Math.round((campaignProgress.sentCount + campaignProgress.failedCount) / (campaignProgress.totalContacts || 1) * 100))}%` 
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>Total Contacts: <strong className="text-slate-900">{campaignProgress.totalContacts}</strong></span>
            <span className="text-emerald-600 font-bold">Sent: {campaignProgress.sentCount}</span>
            <span className="text-rose-600 font-bold">Failed: {campaignProgress.failedCount}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Step 1 Contacts + Step 2 Campaign Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* STEP 1: Contacts Entry (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Users size={16} className="text-primary" /> Step 1: Add Contacts / Numbers
            </h3>
            <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-extrabold">
              {bulkContacts.length} Loaded
            </span>
          </div>

          {/* Contacts Mode Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setContactInputMode('csv')}
              className={`flex-1 py-1.5 font-bold rounded-md transition ${
                contactInputMode === 'csv' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CSV File Upload
            </button>
            <button
              type="button"
              onClick={() => setContactInputMode('manual')}
              className={`flex-1 py-1.5 font-bold rounded-md transition ${
                contactInputMode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manual Bulk Entry
            </button>
          </div>

          {contactInputMode === 'csv' ? (
            <div className="flex-1 flex flex-col justify-between space-y-4 pt-1">
              <div 
                onClick={() => csvFileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center cursor-pointer transition hover:border-primary hover:bg-primary/5"
              >
                <input 
                  type="file" 
                  ref={csvFileInputRef}
                  accept=".csv,.txt"
                  onChange={handleCsvUpload} 
                  className="hidden" 
                />
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <FileSpreadsheet size={24} />
                </div>
                <p className="text-xs font-bold text-slate-800">Upload CSV or TXT File</p>
                <p className="text-[11px] text-slate-400 mt-1">Drag & drop file or click to browse</p>
                <span className="mt-3 rounded-md bg-white border border-slate-200 px-2 py-1 text-[10px] text-slate-500 font-mono">
                  Supported format: Name, Phone (or Phone only)
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Upload size={13} className="rotate-180" /> Sample CSV Template
                </button>

                {bulkContacts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearContacts}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Clear ({bulkContacts.length})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-3 pt-1">
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-600 mb-1 block">
                  Paste Contact Numbers (Comma, space, or newline separated)
                </span>
                <textarea
                  rows="6"
                  placeholder="919876543210&#10;919812345678&#10;919900112233"
                  value={manualInputText}
                  onChange={(e) => setManualInputText(e.target.value)}
                  className="input font-mono text-xs focus:ring-primary focus:border-primary"
                />
              </label>

              <div className="flex items-center justify-between">
                <Button 
                  type="button" 
                  onClick={handleAddManualContacts}
                  className="h-8 text-xs px-3"
                >
                  + Add Numbers
                </Button>

                {bulkContacts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearContacts}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={13} /> Clear ({bulkContacts.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Contacts List Preview */}
          {bulkContacts.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-2">
                <span>Loaded Contacts ({bulkContacts.length})</span>
                <button 
                  type="button" 
                  onClick={() => setShowManageContactsModal(true)}
                  className="text-primary hover:underline text-[11px]"
                >
                  Manage Full List →
                </button>
              </div>
              
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {bulkContacts.slice(0, 15).map((item, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700 shadow-2xs"
                  >
                    {item.phone}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveContact(idx)} 
                      className="text-slate-400 hover:text-slate-600 ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {bulkContacts.length > 15 && (
                  <span className="text-[10px] font-bold text-slate-400 py-0.5 px-1">
                    +{bulkContacts.length - 15} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Campaign Content & CTA Setup (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Sparkles size={16} className="text-primary" /> Step 2: Campaign Details & CTA Button Builder
          </h3>

          <form onSubmit={handleShootCampaign} className="space-y-4">
            
            {/* Campaign Name */}
            <Input
              label="Campaign Name"
              placeholder="e.g. Festival Offer Broadcast"
              required
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />

            {/* Message Body Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">
                  Message Content (Body) <span className="text-rose-500">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCampaignBody(prev => prev + ' {name}')}
                  className="rounded bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-primary"
                >
                  + Insert {"{name}"}
                </button>
              </div>
              <textarea
                rows="4"
                required
                placeholder="Hello {name}, Check out our latest products with special discount offer!"
                value={campaignBody}
                onChange={(e) => setCampaignBody(e.target.value)}
                className="input focus:ring-primary focus:border-primary text-xs leading-relaxed"
              />
            </div>

            {/* Media File Attachment (Image/Video/Doc) */}
            <div>
              <span className="text-sm font-medium text-slate-700 mb-1 block">
                Media File (Image or Video attachment)
              </span>
              
              <input 
                type="file" 
                ref={campaignFileInputRef}
                accept="image/*,video/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setCampaignMediaFile(f);
                }}
                className="hidden"
              />

              {campaignMediaFile ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    {campaignMediaFile.type.startsWith('image/') ? (
                      <ImageIcon size={20} className="text-primary" />
                    ) : campaignMediaFile.type.startsWith('video/') ? (
                      <Video size={20} className="text-primary" />
                    ) : (
                      <FileText size={20} className="text-primary" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800">{campaignMediaFile.name}</p>
                      <p className="text-[10px] text-slate-400">{(campaignMediaFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCampaignMediaFile(null);
                      if (campaignFileInputRef.current) campaignFileInputRef.current.value = '';
                    }}
                    className="h-7 w-7 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => campaignFileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-600 hover:border-primary hover:bg-primary/5 transition"
                >
                  <Paperclip size={16} /> Attach Image / Video / Document
                </button>
              )}
            </div>

            {/* Call To Action (CTA) Button Configuration */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 size={14} className="text-primary" /> Call To Action (CTA) Button
                </span>
                <span className="text-[10px] text-slate-400">Formatted WhatsApp Button</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">CTA Type</label>
                  <select
                    value={ctaType}
                    onChange={(e) => setCtaType(e.target.value)}
                    className="input py-2 text-xs focus:ring-primary focus:border-primary"
                  >
                    <option value="none">No CTA Button</option>
                    <option value="url">Website Link (URL)</option>
                    <option value="call">Call Phone Number</option>
                    <option value="custom">Custom Action</option>
                  </select>
                </div>

                {ctaType !== 'none' && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Button Label Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Visit Website"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        className="input py-2 text-xs focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 mb-1 block">URL / Phone Value</label>
                      <input
                        type="text"
                        placeholder={ctaType === 'url' ? 'https://website.com' : '+919876543210'}
                        value={ctaValue}
                        onChange={(e) => setCtaValue(e.target.value)}
                        className="input py-2 text-xs focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Throttle Delay settings */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-slate-500" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Sending Throttle Delay</p>
                  <p className="text-[10px] text-slate-400">Time gap between each shoot to prevent WhatsApp spam flags</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sendDelay}
                  onChange={(e) => setSendDelay(Number(e.target.value))}
                  className="input py-1.5 text-xs font-bold w-28 text-center"
                >
                  <option value={1}>1 Sec / msg</option>
                  <option value={1.5}>1.5 Sec / msg</option>
                  <option value={2}>2 Sec / msg</option>
                  <option value={3}>3 Sec / msg</option>
                  <option value={5}>5 Sec / msg</option>
                </select>
              </div>
            </div>

            {/* Submit / Shoot Campaign Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={shooting || status !== 'CONNECTED' || bulkContacts.length === 0}
                className="w-full h-11 rounded-xl bg-[#25D366] hover:bg-[#20ba59] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {shooting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Shooting Bulk Campaign...
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" /> Shoot Bulk Campaign Now ({bulkContacts.length} Contacts)
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* CAMPAIGN HISTORY LOGS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History size={16} className="text-primary" /> Campaign History & Reports
          </h3>
          <button
            type="button"
            onClick={loadCampaignHistory}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw size={13} className={loadingCampaigns ? 'animate-spin' : ''} /> Refresh History
          </button>
        </div>

        {loadingCampaigns && campaignsHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} /> Loading campaign history...
          </div>
        ) : campaignsHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
            No campaigns launched yet. Create your first campaign above!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="p-3">Campaign Name</th>
                  <th className="p-3">Target Contacts</th>
                  <th className="p-3">Sent / Failed</th>
                  <th className="p-3">CTA Button</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {campaignsHistory.map(cmp => (
                  <tr key={cmp._id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{cmp.name}</td>
                    <td className="p-3">{cmp.totalContacts}</td>
                    <td className="p-3 font-semibold">
                      <span className="text-emerald-600">{cmp.sentCount} sent</span>
                      {cmp.failedCount > 0 && <span className="text-rose-600 ml-2">({cmp.failedCount} failed)</span>}
                    </td>
                    <td className="p-3 text-slate-500">
                      {cmp.ctaType !== 'none' ? `${cmp.ctaText || 'CTA'}` : '-'}
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(cmp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        cmp.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        cmp.status === 'sending' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {cmp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCampaignReport(cmp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Eye size={13} /> View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Manage / View Contacts Dialog */}
      {showManageContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col max-h-[85vh]">
            <button 
              type="button" 
              onClick={() => setShowManageContactsModal(false)}
              className="absolute right-4 top-4 h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Users size={18} className="text-primary" /> Manage Loaded Contacts ({bulkContacts.length})
            </h3>
            <p className="text-xs text-slate-400 mb-4">Review or remove contact numbers before shooting campaign.</p>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-[50vh]">
              {bulkContacts.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[10px] w-6">#{idx + 1}</span>
                    <span className="font-mono font-bold text-slate-800">{c.phone}</span>
                    {c.name && <span className="text-slate-500">({c.name})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveContact(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={handleClearContacts}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Clear All Contacts
              </button>
              <Button 
                type="button" 
                onClick={() => setShowManageContactsModal(false)}
              >
                Done ({bulkContacts.length} Ready)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Campaign Details & Delivery Report */}
      {selectedCampaignReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
            <button 
              type="button" 
              onClick={() => setSelectedCampaignReport(null)}
              className="absolute right-4 top-4 h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                <Send size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCampaignReport.name}</h3>
                <p className="text-xs text-slate-400">
                  Launched on {new Date(selectedCampaignReport.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Campaign Summary Cards */}
            <div className="grid grid-cols-4 gap-3 my-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Total</span>
                <p className="text-lg font-bold text-slate-900">{selectedCampaignReport.totalContacts}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase">Sent</span>
                <p className="text-lg font-bold text-emerald-600">{selectedCampaignReport.sentCount}</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center">
                <span className="text-[11px] font-semibold text-rose-600 uppercase">Failed</span>
                <p className="text-lg font-bold text-rose-600">{selectedCampaignReport.failedCount}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Status</span>
                <p className={`text-xs font-bold uppercase mt-1 ${
                  selectedCampaignReport.status === 'completed' ? 'text-emerald-600' :
                  selectedCampaignReport.status === 'sending' ? 'text-blue-600' : 'text-rose-600'
                }`}>
                  {selectedCampaignReport.status}
                </p>
              </div>
            </div>

            {/* Message Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs mb-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Message Content</span>
              <p className="text-slate-800 whitespace-pre-wrap font-sans">{selectedCampaignReport.body}</p>
              {selectedCampaignReport.ctaType !== 'none' && selectedCampaignReport.ctaText && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600 font-medium">
                  CTA Button: <strong>{selectedCampaignReport.ctaText}</strong> ({selectedCampaignReport.ctaValue || 'none'})
                </div>
              )}
            </div>

            {/* Detailed Contacts List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600 sticky top-0">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Phone Number</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Error / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(selectedCampaignReport.contacts || []).map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-800">{c.phone}</td>
                      <td className="p-2.5 text-slate-600">{c.name || '-'}</td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          c.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {c.status === 'sent' ? <CheckCircle2 size={10} /> : c.status === 'failed' ? <AlertCircle size={10} /> : <Clock size={10} />}
                          {c.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-500">
                        {c.status === 'sent' && c.sentAt ? (
                          <span className="text-emerald-600">Sent at {new Date(c.sentAt).toLocaleTimeString()}</span>
                        ) : c.error ? (
                          <span className="text-rose-500 font-medium">{c.error}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <Button 
                type="button" 
                onClick={() => setSelectedCampaignReport(null)}
              >
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
