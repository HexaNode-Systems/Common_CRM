import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Plus, RefreshCw, Search, X, AlertCircle, Clock } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import {
  PROJECT_STATUSES, formatMoney, formatDate, initials, categoryLabel,
  downloadProjectDocument, blobErrorMessage
} from '../utils/projects.js';

const PAGE_SIZE = 25;

const STATUS_STYLES = {
  Running: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Finished: 'bg-slate-100 text-slate-600 border border-slate-200',
  Blocked: 'bg-red-50 text-red-700 border border-red-200',
  Pipeline: 'bg-blue-50 text-blue-700 border border-blue-200'
};

function StatusIcon({ status }) {
  if (status === 'Running') return <Clock size={14} className="mr-1 inline" />;
  if (status === 'Finished') return <CheckCircle2 size={14} className="mr-1 inline" />;
  if (status === 'Blocked') return <AlertCircle size={14} className="mr-1 inline" />;
  return null;
}

function TeamStack({ team = [] }) {
  if (!team.length) return <span className="text-xs italic text-slate-500">Unassigned</span>;
  const visible = team.slice(0, 3);
  const remaining = team.length - visible.length;
  return (
    <div className="flex items-center gap-1">
      {visible.map((member, index) => (
        <div
          key={member.user || member.email || index}
          title={`${member.name}${member.role ? ` - ${member.role}` : ''}${member.allocationPercent ? ` (${member.allocationPercent}%)` : ''}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-[10px] font-bold text-white shadow-sm"
        >
          {initials(member.name)}
        </div>
      ))}
      {remaining > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-300 text-[10px] font-bold text-slate-700 shadow-sm" title={`+${remaining} more`}>
          +{remaining}
        </div>
      )}
    </div>
  );
}

// In-page list of a project's documents. Names are rendered as text by React (no HTML injection),
// and files download with the user's token.
function DocumentsModal({ project, onClose }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const documents = project.documents || [];

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function download(doc) {
    setError('');
    setBusy(doc.filename);
    try {
      await downloadProjectDocument(project._id, doc);
    } catch (err) {
      setError(await blobErrorMessage(err));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-theme border border-slate-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Project documents">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">Documents</h2>
            <p className="truncate text-sm text-slate-500">{project.title}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-theme border border-slate-200 text-slate-500 hover:bg-slate-50" title="Close">
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {error && <p className="mb-2 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {documents.length ? (
            <ul className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <li key={doc.filename} className="flex items-center justify-between gap-3 px-2 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText size={18} className="flex-shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.originalName || doc.filename}</p>
                      <p className="text-[11px] font-semibold uppercase text-slate-400">{categoryLabel(doc.category)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled={busy === doc.filename} onClick={() => download(doc)} className="gap-1.5">
                    <Download size={13} />{busy === doc.filename ? 'Downloading' : 'Download'}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-6 text-center text-sm text-slate-500">No documents uploaded for this project.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docsProject, setDocsProject] = useState(null);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: '', search: searchParams.get('search') || '' });

  const can = (action) => user?.role === 'super_admin' || Boolean(user?.permissions?.includes(`catalog:${action}`));
  const canCreate = can('create');
  const canEdit = can('update');
  const hasFilters = Boolean(filters.dateFrom || filters.dateTo || filters.status || filters.search.trim());

  async function loadProjects(nextFilters = filters, nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/catalog', { params: { ...nextFilters, page: nextPage, limit: PAGE_SIZE } });
      setProjects(data.items || []);
      setPagination(data.pagination || { page: nextPage, pages: 1, total: (data.items || []).length });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal !== null) setFilters((current) => ({ ...current, search: searchVal }));
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadProjects(filters, page), 250);
    return () => window.clearTimeout(timer);
  }, [filters, page]);

  function updateFilter(field, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters({ dateFrom: '', dateTo: '', status: '', search: '' });
  }

  const firstRow = pagination.total ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const lastRow = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <div>
      <PageHeader
        label="Delivery"
        title="Projects Management"
        description="Track project delivery, client documents, team assignments and deadlines."
        actions={
          <>
            <Button variant="outline" onClick={() => loadProjects()} className="gap-2"><RefreshCw size={15} />Refresh</Button>
            {canCreate && <Button onClick={() => navigate('/catalog/create')} className="gap-2"><Plus size={15} />New Project</Button>}
          </>
        }
      />

      <div className="sticky top-16 z-10 mb-4 rounded-theme border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_220px_1.4fr]">
          <label className="relative block">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input className="input pl-10 text-sm" type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} title="Projects running on or after this date" />
          </label>
          <label className="relative block">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input className="input pl-10 text-sm" type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(e) => updateFilter('dateTo', e.target.value)} title="Projects running on or before this date" />
          </label>
          <select className="input text-sm" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} title="Filter by status">
            <option value="">All Statuses</option>
            {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input className="input pl-10 text-sm" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search by name, client, or email..." title="Search projects" />
          </label>
        </div>
      </div>

      {error && <p className="mb-4 rounded-theme bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="w-16 px-3 py-3">S.No.</th>
                <th className="px-3 py-3">Project & Client</th>
                <th className="px-3 py-3">Timeline & Status</th>
                <th className="px-3 py-3">Budget & Team</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5"><Loader label="Loading projects" /></td></tr>
              ) : projects.length ? projects.map((project, index) => (
                <tr key={project._id} className="transition hover:bg-slate-50">
                  <td className="px-3 py-4 font-medium text-slate-500">{firstRow + index}</td>
                  <td className="px-3 py-4">
                    <p className="font-semibold text-slate-900">{project.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{project.client?.name || '-'}</p>
                    <p className="text-xs text-slate-400">{project.client?.email || ''}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-sm font-medium text-slate-800">{formatDate(project.startDate)} to {formatDate(project.deadline)}</p>
                    <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[project.projectStatus] || STATUS_STYLES.Pipeline}`}>
                      <StatusIcon status={project.projectStatus} />{project.projectStatus || 'Pipeline'}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <p className="mb-2 font-semibold text-slate-900">{formatMoney(project.budget ?? project.price, project.currency)}</p>
                    <TeamStack team={project.assignedTeam} />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => navigate(`/catalog/${project._id}`)} className="font-semibold text-primary transition hover:underline">View</button>
                      {canEdit && <button type="button" onClick={() => navigate(`/catalog/edit/${project._id}`)} className="font-semibold text-primary transition hover:underline">Edit</button>}
                      <button type="button" onClick={() => setDocsProject(project)} className="inline-flex items-center gap-1 font-semibold text-primary transition hover:underline">
                        <FileText size={15} />Documents{project.documents?.length ? ` (${project.documents.length})` : ''}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-500" colSpan="5">
                    {hasFilters ? (
                      <>No projects match these filters. <button type="button" onClick={clearFilters} className="font-semibold text-primary hover:underline">Clear filters</button></>
                    ) : canCreate ? 'No projects yet. Create your first one with “New Project”.' : 'You haven’t been added to any projects yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && pagination.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-3 py-3 text-sm text-slate-500">
            <span>Showing {firstRow}–{lastRow} of {pagination.total}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="gap-1"><ChevronLeft size={14} />Prev</Button>
              <span className="px-1">Page {pagination.page} of {pagination.pages}</span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="gap-1">Next<ChevronRight size={14} /></Button>
            </div>
          </div>
        )}
      </Card>

      {docsProject && <DocumentsModal project={docsProject} onClose={() => setDocsProject(null)} />}
    </div>
  );
}
