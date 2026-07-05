import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Check, Calendar, Users, FileText, UploadCloud, X, 
  AlertCircle, DollarSign, Briefcase, UserCheck, ShieldAlert 
} from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';

const PROJECT_STATUSES = ['Pipeline', 'Running', 'Finished', 'Blocked'];
const PROJECT_TYPES = [
  { value: 'project', label: 'Project' },
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' }
];

const DOC_CATEGORIES = [
  { value: 'agreement', label: 'Agreement / Contract' },
  { value: 'prd', label: 'PRD (Product Requirement Document)' },
  { value: 'invoice', label: 'Invoice / Financial Record' },
  { value: 'other', label: 'Other Attachments' }
];

const emptyForm = {
  type: 'project',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  title: '',
  description: '',
  startDate: '',
  deadline: '',
  budget: '',
  currency: 'INR',
  projectStatus: 'Pipeline',
  assignedUserIds: []
};

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [capacityWarnings, setCapacityWarnings] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Load project details if editing
  async function loadProjectDetails() {
    try {
      const { data: project } = await api.get(`/catalog/${id}`);
      setForm({
        type: project.type || 'project',
        clientName: project.client?.name || '',
        clientEmail: project.client?.email || '',
        clientPhone: project.client?.phone || '',
        title: project.title || '',
        description: project.description || '',
        startDate: toDateInput(project.startDate),
        deadline: toDateInput(project.deadline),
        budget: project.budget || project.price || '',
        currency: project.currency || 'INR',
        projectStatus: project.projectStatus || 'Pipeline',
        assignedUserIds: (project.assignedTeam || []).map((member) => String(member.user))
      });
      setExistingDocuments(project.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load project details.');
    } finally {
      setLoading(false);
    }
  }

  // Load active users list
  async function loadUsers() {
    try {
      const { data } = await api.get('/users', { params: { limit: 100 } });
      setUsers((data.items || []).filter((user) => user.isActive));
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    loadUsers();
    if (isEditMode) {
      loadProjectDetails();
    }
  }, [id]);

  // Load resource capacity warning
  useEffect(() => {
    if (!form.assignedUserIds.length) {
      setCapacityWarnings([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get('/catalog/capacity', {
          params: { userIds: JSON.stringify(form.assignedUserIds) }
        });
        setCapacityWarnings(data.warnings || []);
      } catch {
        setCapacityWarnings([]);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [form.assignedUserIds]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleUser(userId) {
    setForm((current) => ({
      ...current,
      assignedUserIds: current.assignedUserIds.includes(userId)
        ? current.assignedUserIds.filter((id) => id !== userId)
        : [...current.assignedUserIds, userId]
    }));
  }

  // Files handling
  function addFiles(fileList) {
    const incoming = Array.from(fileList || []).map((file) => ({ file, category: 'other' }));
    setFiles((current) => [...current, ...incoming]);
  }

  function updateFileCategory(index, category) {
    setFiles((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, category } : item
    )));
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function removeExistingDocument(docIndex) {
    if (!window.confirm('Are you sure you want to remove this document? This will update the catalog item immediately.')) return;
    
    try {
      const updatedDocs = existingDocuments.filter((_, idx) => idx !== docIndex);
      // Construct payload with updated documents
      const payload = {
        ...form,
        budget: Number(form.budget || 0),
        documents: updatedDocs
      };
      await api.put(`/catalog/${id}`, payload);
      setExistingDocuments(updatedDocs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove document.');
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(e.dataTransfer.files);
    }
  }

  // Steps verification
  function validateStep(step) {
    setError('');
    if (step === 1) {
      if (!form.clientName.trim()) {
        setError('Client/Company Name is required.');
        return false;
      }
      if (!form.clientEmail.trim()) {
        setError('Point of Contact Email is required.');
        return false;
      }
    }
    if (step === 2) {
      if (!form.title.trim()) {
        setError('Project Name / Title is required.');
        return false;
      }
      if (!form.startDate) {
        setError('Start Date is required.');
        return false;
      }
      if (!form.deadline) {
        setError('Deadline is required.');
        return false;
      }
      if (new Date(form.deadline) <= new Date(form.startDate)) {
        setError('Deadline must occur after the Project Start Date.');
        return false;
      }
    }
    return true;
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  }

  function prevStep() {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  async function saveProject() {
    if (!validateStep(1) || !validateStep(2)) return;

    setSaving(true);
    setError('');
    try {
      const payload = { ...form, budget: Number(form.budget || 0) };
      const { data: savedProject } = isEditMode
        ? await api.put(`/catalog/${id}`, payload)
        : await api.post('/catalog', payload);

      if (files.length) {
        const body = new FormData();
        files.forEach((item) => body.append('documents', item.file));
        body.append('categories', JSON.stringify(files.map((item) => item.category)));
        await api.post(`/catalog/${savedProject._id}/documents`, body, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate('/catalog');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-600">Loading catalog item...</p>
        </div>
      </div>
    );
  }

  // Step definition for Stepper Header
  const steps = [
    { number: 1, label: 'Client Details', desc: 'Contact details' },
    { number: 2, label: 'Project Info', desc: 'Scope, timelines & budget' },
    { number: 3, label: 'Team Allocation', desc: 'Assign members' },
    { number: 4, label: 'Attachments', desc: 'Contracts & Uploads' }
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
        <Link
          to="/catalog"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          title="Back to Catalog"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? `Edit Catalog Item: ${form.title}` : 'Add New Catalog Item'}
          </h1>
          <p className="text-sm text-slate-500">
            Fill in the details below step-by-step to configure your project, product, or service.
          </p>
        </div>
      </div>

      {/* Stepper Navigation bar */}
      <div className="rounded-xl border border-slate-150 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => {
                  // Allow jumping to steps that are already completed or just the next step
                  if (step.number < currentStep || step.number === currentStep) {
                    setCurrentStep(step.number);
                  } else if (step.number === currentStep + 1 && validateStep(currentStep)) {
                    setCurrentStep(step.number);
                  }
                }}
                className={`flex items-center gap-3 text-left focus:outline-none transition group ${
                  isActive || isCompleted ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div 
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold border transition ${
                    isCompleted ? 'bg-primary border-primary text-white' :
                    isActive ? 'border-primary bg-primary/5 text-primary shadow-sm' :
                    'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-slate-300'
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : step.number}
                </div>
                <div>
                  <span className={`block text-xs font-semibold uppercase tracking-wider ${
                    isActive ? 'text-primary' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                  <span className="block text-[11px] text-slate-400 font-medium">{step.desc}</span>
                </div>
                
                {/* Horizontal Divider between steps in desktop view */}
                {step.number < 4 && (
                  <div className="hidden md:block w-12 h-0.5 bg-slate-100 ml-4 group-last:hidden" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Form Steps Content */}
      <Card className="p-6 md:p-8">
        
        {/* Step 1: Client details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Briefcase size={20} className="text-primary" /> Client Profile & Primary Contact
              </h2>
              <p className="text-xs text-slate-500 mt-1">Specify client company particulars and point of contact info.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Client / Company Name *</span>
                <input 
                  className="input py-2.5" 
                  value={form.clientName} 
                  onChange={(e) => updateField('clientName', e.target.value)} 
                  placeholder="Client company or individual name" 
                  required 
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Point of Contact Email *</span>
                <input 
                  className="input py-2.5" 
                  type="email" 
                  value={form.clientEmail} 
                  onChange={(e) => updateField('clientEmail', e.target.value)} 
                  placeholder="client@example.com" 
                  required 
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Phone / WhatsApp Number</span>
                <input 
                  className="input py-2.5" 
                  value={form.clientPhone} 
                  onChange={(e) => updateField('clientPhone', e.target.value.replace(/[^0-9+ -]/g, ''))} 
                  placeholder="+91 98765 43210" 
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Project Parameters */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Calendar size={20} className="text-primary" /> Catalog Item Parameters & Financials
              </h2>
              <p className="text-xs text-slate-500 mt-1">Specify item details, timeline, and budget allocations.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Catalog Item Type</span>
                <select 
                  className="input py-2.5" 
                  value={form.type} 
                  onChange={(e) => updateField('type', e.target.value)}
                >
                  {PROJECT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Item Status</span>
                <select 
                  className="input py-2.5" 
                  value={form.projectStatus} 
                  onChange={(e) => updateField('projectStatus', e.target.value)}
                >
                  {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Title / Project Name *</span>
                <input 
                  className="input py-2.5" 
                  value={form.title} 
                  onChange={(e) => updateField('title', e.target.value)} 
                  placeholder="Website Development / CRM Integration" 
                  required 
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Detailed Description</span>
                <textarea 
                  className="input min-h-24 py-2" 
                  value={form.description} 
                  onChange={(e) => updateField('description', e.target.value)} 
                  placeholder="Define work deliverables, scope constraints, and expectations..." 
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Start Date *</span>
                <input 
                  className="input py-2.5" 
                  type="date" 
                  value={form.startDate} 
                  onChange={(e) => updateField('startDate', e.target.value)} 
                  required 
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Deadline / Target End Date *</span>
                <input 
                  className="input py-2.5" 
                  type="date" 
                  value={form.deadline} 
                  min={form.startDate}
                  onChange={(e) => updateField('deadline', e.target.value)} 
                  required 
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Budget / Total Contract Value</span>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    {form.currency === 'INR' ? '₹' : '$'}
                  </div>
                  <input 
                    className="input pl-8 py-2.5" 
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
                <select 
                  className="input py-2.5" 
                  value={form.currency} 
                  onChange={(e) => updateField('currency', e.target.value)}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Team allocation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Users size={20} className="text-primary" /> Operational Resource Allocation
                </h2>
                <p className="text-xs text-slate-500 mt-1">Assign active staff members to execute delivery.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {form.assignedUserIds.length} Assigned
              </span>
            </div>

            {/* Capacity warning alert */}
            {capacityWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <ShieldAlert size={16} className="text-amber-600" /> Resource Over-Allocation warning
                </p>
                <ul className="space-y-1">
                  {capacityWarnings.map((warning) => (
                    <li key={warning.userId} className="text-xs text-amber-800 font-medium">• {warning.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
              {users.length ? users.map((user) => {
                const isChecked = form.assignedUserIds.includes(String(user._id));
                return (
                  <label 
                    key={user._id} 
                    className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 cursor-pointer transition ${
                      isChecked ? 'bg-white border border-primary/20 shadow-sm' : 'hover:bg-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase ${
                        isChecked ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {initials(user.name)}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                        <span className="block text-xs text-slate-500">{user.role} • {user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isChecked && (
                        <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                          <UserCheck size={12} /> Assigned
                        </span>
                      )}
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary" 
                        checked={isChecked} 
                        onChange={() => toggleUser(String(user._id))} 
                      />
                    </div>
                  </label>
                );
              }) : (
                <div className="text-center py-6 text-slate-500 text-sm">No active users available in system.</div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Documents upload */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <FileText size={20} className="text-primary" /> Unified Attachments & Document Repository
              </h2>
              <p className="text-xs text-slate-500 mt-1">Upload project agreements, invoices, scope PDFs, or other relevant items.</p>
            </div>

            {/* Existing Documents (If Editing) */}
            {isEditMode && existingDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Currently Stored Documents</h4>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-150 bg-white shadow-sm">
                  {existingDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText size={18} className="text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <a 
                            href={`${baseUrl}${doc.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block truncate text-sm font-medium text-slate-700 hover:text-primary hover:underline"
                          >
                            {doc.originalName || doc.filename}
                          </a>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {DOC_CATEGORIES.find((c) => c.value === doc.category)?.label || doc.category}
                          </span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeExistingDocument(idx)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete document"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drag and Drop Container */}
            <div className="space-y-3">
              {isEditMode && existingDocuments.length > 0 && (
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4">Upload New Documents</h4>
              )}
              <label 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 bg-slate-50 hover:bg-white'
                }`}
              >
                <UploadCloud className={`mb-2 ${dragActive ? 'text-primary' : 'text-slate-400'}`} size={32} />
                <span className="text-sm font-semibold text-slate-700">Drop files here or click to select files</span>
                <span className="mt-1 text-xs text-slate-500 font-medium">Supports contract PDFs, invoices, image screenshots etc.</span>
                <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
            </div>

            {/* New Files List */}
            {files.length > 0 && (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-2 space-y-2">
                {files.map((item, index) => (
                  <div key={`${item.file.name}-${index}`} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{item.file.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{(item.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        className="input text-xs sm:text-sm py-1.5 w-48" 
                        value={item.category} 
                        onChange={(e) => updateFileCategory(index, e.target.value)}
                      >
                        {DOC_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => removeFile(index)} 
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-600" 
                        title="Remove file"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-150 pt-5">
          <div>
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={prevStep} 
                className="rounded-lg border border-slate-250 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/catalog" 
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
            
            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep} className="px-5 py-2">
                Next Step
              </Button>
            ) : (
              <Button disabled={saving} onClick={saveProject} className="px-5 py-2">
                {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Item'}
              </Button>
            )}
          </div>
        </div>

      </Card>
    </div>
  );
}
