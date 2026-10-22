import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Check, Calendar, Users, FileText, UploadCloud, X,
  AlertCircle, Briefcase, ShieldAlert, Search, Download, RefreshCw
} from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';
import {
  PROJECT_STATUSES, CURRENCIES, DOC_CATEGORIES, MAX_DOCS_PER_UPLOAD,
  currencySymbol, categoryLabel, initials, checkDocumentFile,
  downloadProjectDocument, blobErrorMessage
} from '../utils/projects.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  title: '',
  description: '',
  startDate: '',
  deadline: '',
  budget: '',
  currency: 'INR',
  projectStatus: 'Pipeline'
};

const STEPS = [
  { number: 1, label: 'Client Details', desc: 'Contact details' },
  { number: 2, label: 'Project Info', desc: 'Scope, timeline & budget' },
  { number: 3, label: 'Team', desc: 'Members & allocation' },
  { number: 4, label: 'Documents', desc: 'Contracts & uploads' }
];

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function errorMessage(err, fallback) {
  return err?.response?.data?.message || fallback;
}

/** Returns the first problem with a step, or '' when the step is valid. */
function stepError(step, form) {
  if (step === 1) {
    if (!form.clientName.trim()) return 'Client / company name is required.';
    if (!form.clientEmail.trim()) return 'Point of contact email is required.';
    if (!EMAIL_RE.test(form.clientEmail.trim())) return 'Enter a valid email address, like client@example.com.';
    const digits = form.clientPhone.replace(/\D/g, '');
    if (form.clientPhone.trim() && (digits.length < 7 || digits.length > 15)) return 'Phone number should have 7 to 15 digits.';
  }
  if (step === 2) {
    if (!form.title.trim()) return 'Project name is required.';
    if (form.title.trim().length > 200) return 'Project name can be at most 200 characters.';
    if (!form.startDate) return 'Start date is required.';
    if (!form.deadline) return 'Deadline is required.';
    if (form.deadline < form.startDate) return 'Deadline can’t be before the start date.';
    if (form.budget !== '' && (!Number.isFinite(Number(form.budget)) || Number(form.budget) < 0)) return 'Budget must be 0 or more.';
  }
  return '';
}

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // The id the project is saved under. Set after the first successful create so a retry
  // updates that project instead of creating a second one.
  const [savedId, setSavedId] = useState(id || null);
  const isEditMode = Boolean(savedId);

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [team, setTeam] = useState([]); // [{ user, name, email, role, allocationPercent, inactive }]
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [readOnly, setReadOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadFailed, setUploadFailed] = useState(false);
  const [capacityWarnings, setCapacityWarnings] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Load the project when opening edit mode.
  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: project } = await api.get(`/catalog/${id}`);
        if (cancelled) return;
        setSavedId(id);
        setReadOnly(project.canEdit === false);
        setForm({
          clientName: project.client?.name || '',
          clientEmail: project.client?.email || '',
          clientPhone: project.client?.phone || '',
          title: project.title || '',
          description: project.description || '',
          startDate: toDateInput(project.startDate),
          deadline: toDateInput(project.deadline),
          budget: project.budget ?? project.price ?? '',
          currency: project.currency || 'INR',
          projectStatus: project.projectStatus || 'Pipeline'
        });
        const members = (project.assignedTeam || []).map((m) => ({
          user: String(m.user),
          name: m.name,
          email: m.email,
          role: m.role,
          allocationPercent: m.allocationPercent || 100
        }));
        setTeam(members);
        setExistingDocuments(project.documents || []);

        // Flag members who have since been deactivated: the server won't accept them again.
        if (members.length && project.canEdit !== false) {
          try {
            const { data } = await api.get('/catalog/assignable-users', {
              params: { limit: 1, include: JSON.stringify(members.map((m) => m.user)) }
            });
            const active = new Set((data.selected || []).filter((u) => u.isActive).map((u) => String(u._id)));
            if (!cancelled) setTeam((current) => current.map((m) => ({ ...m, inactive: !active.has(m.user) })));
          } catch { /* not critical */ }
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Unable to load project details.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Search people who can be assigned (only while on the team step).
  useEffect(() => {
    if (currentStep !== 3 || readOnly) return undefined;
    const timer = window.setTimeout(async () => {
      setUsersLoading(true);
      try {
        const { data } = await api.get('/catalog/assignable-users', { params: { q: userQuery, limit: 50 } });
        setUserResults(data.items || []);
      } catch (err) {
        setUserResults([]);
        setError(errorMessage(err, 'Unable to load team members.'));
      } finally {
        setUsersLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [userQuery, currentStep, readOnly]);

  // Over-allocation warning, counting each member's % on this project.
  useEffect(() => {
    if (!team.length) {
      setCapacityWarnings([]);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get('/catalog/capacity', {
          params: {
            team: JSON.stringify(team.map((m) => ({ user: m.user, allocationPercent: Number(m.allocationPercent) || 100 }))),
            ...(savedId ? { excludeId: savedId } : {})
          }
        });
        setCapacityWarnings(data.warnings || []);
      } catch {
        setCapacityWarnings([]);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [team, savedId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleUser(user) {
    const userId = String(user._id);
    setTeam((current) => (
      current.some((m) => m.user === userId)
        ? current.filter((m) => m.user !== userId)
        : [...current, { user: userId, name: user.name, email: user.email, role: user.role, allocationPercent: 100 }]
    ));
  }

  function setAllocation(userId, value) {
    const clean = value === '' ? '' : Math.min(100, Math.max(1, Math.round(Number(value) || 0)));
    setTeam((current) => current.map((m) => (m.user === userId ? { ...m, allocationPercent: clean } : m)));
  }

  function removeMember(userId) {
    setTeam((current) => current.filter((m) => m.user !== userId));
  }

  // Files
  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const problems = incoming.map(checkDocumentFile).filter(Boolean);
    const good = incoming.filter((file) => !checkDocumentFile(file));
    const room = MAX_DOCS_PER_UPLOAD - files.length;
    if (good.length > room) problems.push(`You can upload up to ${MAX_DOCS_PER_UPLOAD} files at a time.`);
    setFiles((current) => [...current, ...good.slice(0, Math.max(room, 0)).map((file) => ({ file, category: 'other' }))]);
    setError(problems.join(' '));
  }

  function updateFileCategory(index, category) {
    setFiles((current) => current.map((item, i) => (i === index ? { ...item, category } : item)));
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  async function removeExistingDocument(doc) {
    if (!window.confirm(`Remove "${doc.originalName || doc.filename}"? The file is deleted immediately.`)) return;
    setError('');
    try {
      const { data } = await api.delete(`/catalog/${savedId}/documents/${encodeURIComponent(doc.filename)}`);
      setExistingDocuments(data.documents || existingDocuments.filter((d) => d.filename !== doc.filename));
    } catch (err) {
      setError(errorMessage(err, 'Unable to remove the document.'));
    }
  }

  async function openDocument(doc) {
    setError('');
    try {
      await downloadProjectDocument(savedId, doc);
    } catch (err) {
      setError(await blobErrorMessage(err));
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function validateStep(step) {
    const message = stepError(step, form);
    setError(message);
    return !message;
  }

  function goToStep(step) {
    if (step <= currentStep) {
      setError('');
      setCurrentStep(step);
      return;
    }
    // Moving forward: every step in between must be valid.
    for (let s = currentStep; s < step; s += 1) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }
    setCurrentStep(step);
  }

  async function uploadFiles(projectId) {
    const body = new FormData();
    files.forEach((item) => body.append('documents', item.file));
    body.append('categories', JSON.stringify(files.map((item) => item.category)));
    const { data } = await api.post(`/catalog/${projectId}/documents`, body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }

  async function saveProject() {
    for (const step of [1, 2]) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }
    if (team.some((m) => m.allocationPercent === '')) {
      setCurrentStep(3);
      setError('Enter an allocation between 1 and 100% for every team member.');
      return;
    }

    setSaving(true);
    setError('');
    setUploadFailed(false);

    let projectId = savedId;
    try {
      const payload = {
        ...form,
        clientEmail: form.clientEmail.trim(),
        title: form.title.trim(),
        budget: form.budget === '' ? 0 : Number(form.budget),
        team: team.map((m) => ({ user: m.user, allocationPercent: Number(m.allocationPercent) || 100 }))
      };
      if (projectId) {
        await api.put(`/catalog/${projectId}`, payload);
      } else {
        const { data } = await api.post('/catalog', payload);
        projectId = String(data._id);
        setSavedId(projectId); // from now on Save/Retry update this project, never create another
      }
    } catch (err) {
      setError(errorMessage(err, 'Unable to save project.'));
      setSaving(false);
      return;
    }

    if (files.length) {
      try {
        const data = await uploadFiles(projectId);
        setFiles([]);
        setExistingDocuments(data.project?.documents || []);
      } catch (err) {
        setUploadFailed(true);
        setCurrentStep(4);
        setError(`Project saved, but ${files.length} file(s) failed to upload: ${errorMessage(err, 'upload error')}. Fix the files and retry, or skip them.`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    navigate('/catalog');
  }

  async function retryUpload() {
    setSaving(true);
    setError('');
    try {
      await uploadFiles(savedId);
      setFiles([]);
      setUploadFailed(false);
      navigate('/catalog');
    } catch (err) {
      setError(`Upload failed again: ${errorMessage(err, 'upload error')}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader label="Loading project" fill />;

  if (readOnly) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="p-6">
          <p className="flex items-center gap-2 font-semibold text-slate-900"><AlertCircle size={18} className="text-amber-600" /> You can view this project but not edit it.</p>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/catalog/${id}`)}>Open project</Button>
            <Button variant="outline" onClick={() => navigate('/catalog')}>Back to Projects</Button>
          </div>
        </Card>
      </div>
    );
  }

  const teamIds = new Set(team.map((m) => m.user));
  const symbol = currencySymbol(form.currency);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
        <Link
          to="/catalog"
          className="inline-flex h-9 w-9 items-center justify-center rounded-theme border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          title="Back to Projects"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-slate-900">
            {isEditMode ? `Edit Project${form.title ? `: ${form.title}` : ''}` : 'New Project'}
          </h1>
          <p className="text-sm text-slate-500">Client, scope, team and documents, one step at a time.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="rounded-theme border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => goToStep(step.number)}
                className="group flex items-center gap-3 text-left transition focus:outline-none"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition ${
                    isCompleted ? 'border-primary bg-primary text-white'
                      : isActive ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-slate-300'
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : step.number}
                </div>
                <div>
                  <span className={`block text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-primary' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-400">{step.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-theme border border-red-200 bg-red-50 px-4 py-3 shadow-sm" role="alert">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <Card className="p-6 md:p-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <Briefcase size={20} className="text-primary" /> Client & Primary Contact
              </h2>
              <p className="mt-1 text-xs text-slate-500">Who the project is for and who to contact.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Client / Company Name *</span>
                <input className="input py-2.5" value={form.clientName} maxLength={200} onChange={(e) => updateField('clientName', e.target.value)} placeholder="Client company or individual name" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Point of Contact Email *</span>
                <input className="input py-2.5" type="email" value={form.clientEmail} onChange={(e) => updateField('clientEmail', e.target.value)} placeholder="client@example.com" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Phone / WhatsApp Number</span>
                <input className="input py-2.5" value={form.clientPhone} maxLength={20} onChange={(e) => updateField('clientPhone', e.target.value.replace(/[^0-9+ -]/g, ''))} placeholder="+91 98765 43210" />
              </label>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <Calendar size={20} className="text-primary" /> Scope, Timeline & Budget
              </h2>
              <p className="mt-1 text-xs text-slate-500">What is being delivered, by when, and for how much.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Project Name *</span>
                <input className="input py-2.5" value={form.title} maxLength={200} onChange={(e) => updateField('title', e.target.value)} placeholder="Website Development / CRM Integration" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Description</span>
                <textarea className="input min-h-24 py-2" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Deliverables, scope limits and expectations..." />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Start Date *</span>
                <input className="input py-2.5" type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Deadline *</span>
                <input className="input py-2.5" type="date" value={form.deadline} min={form.startDate || undefined} onChange={(e) => updateField('deadline', e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Project Status</span>
                <select className="input py-2.5" value={form.projectStatus} onChange={(e) => updateField('projectStatus', e.target.value)}>
                  {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Budget / Contract Value</span>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{symbol}</div>
                    <input
                      className={`input py-2.5 ${symbol.length > 1 ? 'pl-12' : 'pl-8'}`}
                      type="number"
                      min="0"
                      step="1"
                      value={form.budget}
                      onChange={(e) => updateField('budget', e.target.value)}
                      placeholder="100000"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Currency</span>
                  <select className="input py-2.5" value={form.currency} onChange={(e) => updateField('currency', e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                  <Users size={20} className="text-primary" /> Team & Allocation
                </h2>
                <p className="mt-1 text-xs text-slate-500">Pick who works on this and how much of their time it takes.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{team.length} assigned</span>
            </div>

            {capacityWarnings.length > 0 && (
              <div className="rounded-theme border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <ShieldAlert size={16} className="text-amber-600" /> Over-allocation
                </p>
                <ul className="space-y-1">
                  {capacityWarnings.map((w) => <li key={w.userId} className="text-xs font-medium text-amber-800">• {w.message}</li>)}
                </ul>
              </div>
            )}

            {team.length > 0 && (
              <div className="divide-y divide-slate-100 rounded-theme border border-slate-200 bg-white">
                {team.map((member) => (
                  <div key={member.user} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-white">{initials(member.name)}</div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{member.name}</span>
                      <span className="block truncate text-xs text-slate-500">{member.role}{member.email ? ` • ${member.email}` : ''}</span>
                      {member.inactive && <span className="text-xs font-semibold text-red-600">Deactivated: remove before saving</span>}
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      Allocation
                      <input
                        className="input w-20 py-1.5 text-right"
                        type="number"
                        min="1"
                        max="100"
                        value={member.allocationPercent}
                        onChange={(e) => setAllocation(member.user, e.target.value)}
                      />
                      %
                    </label>
                    <button type="button" onClick={() => removeMember(member.user)} className="inline-flex h-8 w-8 items-center justify-center rounded-theme border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-600" title="Remove from team">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="input pl-9 text-sm" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search people by name or email" />
            </label>

            <div className="max-h-80 space-y-1 overflow-y-auto rounded-theme border border-slate-200 bg-slate-50/50 p-2">
              {usersLoading && !userResults.length ? (
                <Loader label="Loading people" />
              ) : userResults.length ? userResults.map((user) => {
                const isChecked = teamIds.has(String(user._id));
                return (
                  <label
                    key={user._id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-theme border px-4 py-2.5 transition ${isChecked ? 'border-primary/20 bg-white shadow-sm' : 'border-transparent hover:bg-white'}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase ${isChecked ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {initials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">{user.name}</span>
                        <span className="block truncate text-xs text-slate-500">{user.role} • {user.email}</span>
                      </div>
                    </div>
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={isChecked} onChange={() => toggleUser(user)} />
                  </label>
                );
              }) : (
                <div className="py-6 text-center text-sm text-slate-500">{userQuery ? 'No one matches that search.' : 'No active staff to assign.'}</div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <FileText size={20} className="text-primary" /> Documents
              </h2>
              <p className="mt-1 text-xs text-slate-500">Agreements, PRDs, invoices. Only people on this project can download them.</p>
            </div>

            {isEditMode && existingDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stored documents</h4>
                <div className="divide-y divide-slate-100 rounded-theme border border-slate-200 bg-white shadow-sm">
                  {existingDocuments.map((doc) => (
                    <div key={doc.filename} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <FileText size={18} className="text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => openDocument(doc)} className="block max-w-full truncate text-left text-sm font-medium text-slate-700 hover:text-primary hover:underline">
                            {doc.originalName || doc.filename}
                          </button>
                          <span className="text-[10px] font-semibold uppercase text-slate-400">{categoryLabel(doc.category)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openDocument(doc)} className="inline-flex h-8 w-8 items-center justify-center rounded-theme border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-primary" title="Download">
                          <Download size={14} />
                        </button>
                        <button type="button" onClick={() => removeExistingDocument(doc)} className="inline-flex h-8 w-8 items-center justify-center rounded-theme border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-600" title="Delete document">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-theme border-2 border-dashed px-4 py-8 text-center transition ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 bg-slate-50 hover:bg-white'}`}
            >
              <UploadCloud className={`mb-2 ${dragActive ? 'text-primary' : 'text-slate-400'}`} size={32} />
              <span className="text-sm font-semibold text-slate-700">Drop files here or click to choose</span>
              <span className="mt-1 text-xs font-medium text-slate-500">PDF, Office, text, images or ZIP · up to 5 MB each · {MAX_DOCS_PER_UPLOAD} files at a time</span>
              <input type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </label>

            {files.length > 0 && (
              <div className="space-y-2 rounded-theme border border-slate-200 bg-white p-2">
                {files.map((item, index) => (
                  <div key={`${item.file.name}-${index}`} className="flex flex-col gap-3 rounded-theme bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{item.file.name}</p>
                      <p className="text-xs font-medium text-slate-400">{(item.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="input w-48 py-1.5 text-xs sm:text-sm" value={item.category} onChange={(e) => updateFileCategory(index, e.target.value)}>
                        {DOC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <button type="button" onClick={() => removeFile(index)} className="inline-flex h-8 w-8 items-center justify-center rounded-theme border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-600" title="Remove file">
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={() => goToStep(currentStep - 1)}>Back</Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {uploadFailed ? (
              <>
                <Button type="button" variant="outline" onClick={() => navigate('/catalog')}>Skip files</Button>
                <Button type="button" disabled={saving || !files.length} onClick={retryUpload} className="gap-2">
                  <RefreshCw size={15} />{saving ? 'Uploading...' : 'Retry upload'}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => navigate('/catalog')}>Cancel</Button>
                {currentStep < 4 ? (
                  <Button type="button" onClick={() => goToStep(currentStep + 1)}>Next Step</Button>
                ) : (
                  <Button type="button" disabled={saving} onClick={saveProject}>
                    {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Project'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
