import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, CheckCircle2, FileText, AlertCircle, Clock,
  Wallet, Users, Tag, Package, Hash, Layers, Mail, Phone, Download, Pencil
} from 'lucide-react';
import { api } from '../api/client.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import Loader from '../components/Loader.jsx';
import { formatMoney, initials, categoryLabel, downloadProjectDocument, blobErrorMessage } from '../utils/projects.js';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function getStatusBadge(status) {
  const styles = {
    Running: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Finished: 'bg-slate-100 text-slate-600 border border-slate-200',
    Blocked: 'bg-red-50 text-red-700 border border-red-200',
    Pipeline: 'bg-blue-50 text-blue-700 border border-blue-200'
  };
  return styles[status] || 'bg-blue-50 text-blue-700 border border-blue-200';
}

function getStatusIcon(status) {
  if (status === 'Running') return <Clock size={16} className="inline mr-1.5" />;
  if (status === 'Finished') return <CheckCircle2 size={16} className="inline mr-1.5" />;
  if (status === 'Blocked') return <AlertCircle size={16} className="inline mr-1.5" />;
  return null;
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docError, setDocError] = useState('');
  const [downloading, setDownloading] = useState('');

  async function openDocument(doc) {
    setDocError('');
    setDownloading(doc.filename);
    try {
      await downloadProjectDocument(project._id, doc);
    } catch (err) {
      setDocError(await blobErrorMessage(err));
    } finally {
      setDownloading('');
    }
  }

  async function loadProjectDetails() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/catalog/${id}`);
      setProject(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load project details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjectDetails();
  }, [id]);

  if (loading) {
    return (
      <Loader label="Loading project details" fill />
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to Load Details</h2>
        <p className="mt-2 text-sm text-slate-600">{error || 'Project not found.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/catalog')}>Back to Projects</Button>
          <Button onClick={loadProjectDetails}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Calculate project progress percentage
  let progressPercent = 0;
  if (project.startDate && project.deadline) {
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.deadline).getTime();
    const now = Date.now();
    if (now >= end) progressPercent = 100;
    else if (now <= start) progressPercent = 0;
    else {
      progressPercent = Math.round(((now - start) / (end - start)) * 100);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <Link
            to="/catalog"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            title="Back to Projects"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">ID: {project._id}</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{project.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {project.canEdit && (
            <Button variant="outline" onClick={() => navigate(`/catalog/edit/${project._id}`)} className="gap-2"><Pencil size={14} />Edit</Button>
          )}
          {project.projectStatus && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(project.projectStatus)}`}>
              {getStatusIcon(project.projectStatus)}
              {project.projectStatus}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left 2 Columns: Core Description, Team, Specs, Documents */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Description Card */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Description & Scope</h2>
            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 whitespace-pre-line">
              {project.description || 'No description provided for this project.'}
            </div>
            
            {project.shortDescription && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Short Summary</h4>
                <p className="text-sm text-slate-600">{project.shortDescription}</p>
              </div>
            )}
          </Card>

          {/* Product Specifications Card (if type is product or service, or has these fields) */}
          {(project.sku || project.stock > 0 || project.category || (project.tags && project.tags.length > 0)) && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Specifications & Classification</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {project.sku && (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Hash size={18} />
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-400">SKU / Code</span>
                      <span className="text-sm font-semibold text-slate-800">{project.sku}</span>
                    </div>
                  </div>
                )}
                
                {project.stock !== undefined && (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package size={18} />
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-400">Inventory Stock</span>
                      <span className="text-sm font-semibold text-slate-800">{project.stock} units</span>
                    </div>
                  </div>
                )}

                {project.category && (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Layers size={18} />
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-400">Category</span>
                      <span className="text-sm font-semibold text-slate-800">{project.category}</span>
                    </div>
                  </div>
                )}

                {project.duration && (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-slate-400">Service Duration</span>
                      <span className="text-sm font-semibold text-slate-800">{project.duration}</span>
                    </div>
                  </div>
                )}
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Associated Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Assigned Team Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Assigned Delivery Team</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {project.assignedTeam?.length || 0} Members
              </span>
            </div>
            
            {project.assignedTeam && project.assignedTeam.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {project.assignedTeam.map((member) => (
                  <div key={member.user} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:bg-slate-50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
                      {initials(member.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-slate-900">{member.name}</h4>
                      <p className="truncate text-xs text-slate-500">{member.role || 'Team Member'}</p>
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="mt-1 flex items-center gap-1 text-[11px] text-primary hover:underline truncate">
                          <Mail size={10} />
                          {member.email}
                        </a>
                      )}
                    </div>
                    {member.allocationPercent && (
                      <div className="text-right">
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                          {member.allocationPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-slate-500 bg-slate-50/30">
                <Users className="mx-auto mb-2 text-slate-400" size={24} />
                <p className="text-sm font-medium">No team members assigned to this project.</p>
              </div>
            )}
          </Card>

          {/* Project Documents Card */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Project Attachments & Documents</h2>
            {docError && <p className="mb-3 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{docError}</p>}
            
            {project.documents && project.documents.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/20">
                {project.documents.map((doc) => (
                  <div key={doc.filename} className="flex items-center justify-between p-3.5 transition hover:bg-slate-50/60">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => openDocument(doc)}
                          className="block max-w-full truncate text-left text-sm font-semibold text-slate-800 hover:text-primary transition hover:underline"
                        >
                          {doc.originalName || doc.filename}
                        </button>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <span>{categoryLabel(doc.category)}</span>
                          {Number(doc.size) > 0 && (<><span>•</span><span>{(doc.size / 1024).toFixed(1)} KB</span></>)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDocument(doc)}
                      disabled={downloading === doc.filename}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-50"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-slate-500 bg-slate-50/30">
                <FileText className="mx-auto mb-2 text-slate-400" size={24} />
                <p className="text-sm font-medium">No documents uploaded yet.</p>
              </div>
            )}
          </Card>

        </div>

        {/* Right 1 Column: Budget, Timeline, Client Details */}
        <div className="space-y-6">
          
          {/* Budget / Price Card */}
          <Card className="overflow-hidden border border-slate-150 shadow-md">
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 px-6 py-6 text-white">
              <div className="flex items-center justify-between opacity-85">
                <span className="text-xs font-semibold uppercase tracking-wider">Financial Statement</span>
                <Wallet size={16} />
              </div>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight">
                {formatMoney(project.budget ?? project.price, project.currency)}
              </h3>
              
              {project.salePrice !== undefined && project.salePrice > 0 && (
                <div className="mt-2 text-xs opacity-90">
                  <span className="line-through text-slate-400 mr-2">Regular: {formatMoney(project.price, project.currency)}</span>
                  <span className="font-semibold text-emerald-400">Sale: {formatMoney(project.salePrice, project.currency)}</span>
                </div>
              )}

              <p className="mt-4 text-[11px] text-slate-400">
                Created on {formatDate(project.createdAt)}
              </p>
            </div>

            <div className="bg-white px-6 py-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Currency</span>
                <span className="font-semibold text-slate-700">{project.currency || 'INR'}</span>
              </div>
            </div>
          </Card>

          {/* Timeline Card */}
          {project.startDate && project.deadline && (
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-4">Project Timeline</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="block font-medium text-slate-400">Start Date</span>
                    <span className="font-semibold text-slate-800">{formatDate(project.startDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-medium text-slate-400">Target Deadline</span>
                    <span className="font-semibold text-slate-800">{formatDate(project.deadline)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Progress Time elapsed</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.projectStatus === 'Blocked' ? 'bg-red-500' :
                        project.projectStatus === 'Finished' ? 'bg-slate-400' :
                        'bg-primary'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-center text-xs text-slate-600">
                  {new Date(project.deadline).getTime() > Date.now() ? (
                    <span className="font-medium">
                      {Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Days Remaining
                    </span>
                  ) : (
                    <span className="font-medium text-red-600">
                      Deadline passed {Math.abs(Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days Ago
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Client Contacts Card */}
          {project.client && (project.client.name || project.client.email || project.client.phone) && (
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-4">Client Contact Info</h3>
              <div className="space-y-3.5">
                {project.client.name && (
                  <div>
                    <span className="block text-[11px] font-medium text-slate-400">Company / Client Name</span>
                    <span className="text-sm font-semibold text-slate-800">{project.client.name}</span>
                  </div>
                )}

                {project.client.email && (
                  <div className="border-t border-slate-50 pt-2.5">
                    <span className="block text-[11px] font-medium text-slate-400">Point of Contact Email</span>
                    <a 
                      href={`mailto:${project.client.email}`} 
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <Mail size={13} />
                      {project.client.email}
                    </a>
                  </div>
                )}

                {project.client.phone && (
                  <div className="border-t border-slate-50 pt-2.5">
                    <span className="block text-[11px] font-medium text-slate-400">Phone / WhatsApp Link</span>
                    <a 
                      href={`tel:${project.client.phone}`} 
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:underline"
                    >
                      <Phone size={13} className="text-slate-500" />
                      {project.client.phone}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

        </div>

      </div>
    </div>
  );
}
