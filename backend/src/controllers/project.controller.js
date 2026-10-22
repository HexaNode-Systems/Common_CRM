import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { CatalogItem } from '../models/CatalogItem.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hasAccess } from '../middleware/auth.middleware.js';

const documentCategories = new Set(['agreement', 'prd', 'invoice', 'other']);
const PROJECT_STATUSES = ['Pipeline', 'Running', 'Finished', 'Blocked'];
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods',
  '.png', '.jpg', '.jpeg', '.webp', '.zip',
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROJECTS_DIR = path.resolve('storage', 'projects');
const NON_EMPLOYEE_ROLES = ['customer', 'super_admin'];

/* ------------------------------------------------------------------ */
/* Access                                                               */
/* ------------------------------------------------------------------ */
// Who sees which projects:
// - Super admin and roles with Full Access on Projects: every project.
// - Everyone else: only projects they are on the team of, or that they created.
//   Team members can open their own projects even without the Projects permission.
async function seesAllProjects(user) {
  return user?.role === 'super_admin' || hasAccess(user, 'catalog:delete');
}

const isMember = (project, user) =>
  (project.assignedTeam || []).some((member) => String(member.user) === String(user._id)) ||
  String(project.createdBy || '') === String(user._id);

async function scopeFilter(user) {
  if (await seesAllProjects(user)) return {};
  return { $or: [{ 'assignedTeam.user': user._id }, { createdBy: user._id }] };
}

// Loads a project the user may see; 404 (not 403) for others so ids can't be probed.
async function loadVisibleProject(req) {
  const project = await CatalogItem.findOne({ _id: req.params.id, type: 'project' });
  if (!project) throw new ApiError(404, 'Project not found');
  if (!(await seesAllProjects(req.user)) && !isMember(project, req.user)) throw new ApiError(404, 'Project not found');
  return project;
}

// Editing needs the Projects "Update" permission AND being able to see the project.
async function loadEditableProject(req) {
  const project = await loadVisibleProject(req);
  if (!(await seesAllProjects(req.user)) && !(await hasAccess(req.user, 'catalog:update'))) {
    throw new ApiError(403, 'You can view this project but not edit it.');
  }
  return project;
}

/* ------------------------------------------------------------------ */
/* Parsing and validation                                               */
/* ------------------------------------------------------------------ */
function slugify(value) {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `project-${Date.now()}`
  );
}

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Dates are stored as UTC midnight of the chosen day.
function parseDate(value) {
  if (!value) return undefined;
  const key = String(value).slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(key) ? new Date(`${key}T00:00:00.000Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function assertTimeline(startDate, deadline) {
  // Same-day projects are allowed.
  if (startDate && deadline && deadline < startDate) {
    throw new ApiError(400, 'Deadline cannot be before the start date.');
  }
}

function parseJsonList(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  }
}

// Team from the request: `team: [{ user, allocationPercent }]` (preferred) or `assignedUserIds: [...]`.
// Returns null when the request doesn't mention the team (keep the current one).
function parseTeamInput(body) {
  if (body.team !== undefined) {
    return parseJsonList(body.team).map((entry) =>
      typeof entry === 'object' ? { user: String(entry.user || entry._id || ''), allocationPercent: entry.allocationPercent } : { user: String(entry) }
    );
  }
  if (body.assignedUserIds !== undefined) return parseJsonList(body.assignedUserIds).map((id) => ({ user: String(id) }));
  return null;
}

function parseAllocation(value) {
  if (value === undefined || value === null || value === '') return 100;
  const percent = Number(value);
  if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
    throw new ApiError(400, 'Allocation must be between 1 and 100%.');
  }
  return Math.round(percent);
}

async function buildAssignedTeam(entries) {
  const byUser = new Map();
  for (const entry of entries) {
    if (entry.user) byUser.set(entry.user, parseAllocation(entry.allocationPercent));
  }
  if (!byUser.size) return [];

  const users = await User.find({ _id: { $in: [...byUser.keys()] }, isActive: true, role: { $nin: ['customer'] } }).select('name email role');
  if (users.length !== byUser.size) throw new ApiError(400, 'Some selected team members are inactive or no longer exist.');

  return users.map((user) => ({
    user: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    allocationPercent: byUser.get(String(user._id)),
  }));
}

async function projectPayload(body, existing) {
  const pick = (key, fallback) => (body[key] !== undefined ? body[key] : fallback);

  const startDate = body.startDate !== undefined ? parseDate(body.startDate) : existing?.startDate;
  const deadline = body.deadline !== undefined ? parseDate(body.deadline) : existing?.deadline;
  assertTimeline(startDate, deadline);

  const title = String(pick('title', body.projectName ?? existing?.title ?? '')).trim();
  if (!title) throw new ApiError(400, 'Project name is required.');
  if (title.length > 200) throw new ApiError(400, 'Project name is too long (200 characters max).');

  const clientEmail = String(pick('clientEmail', body.client?.email ?? existing?.client?.email ?? '')).trim().toLowerCase();
  if (clientEmail && !EMAIL_PATTERN.test(clientEmail)) throw new ApiError(400, 'Client email is not a valid email address.');

  const rawBudget = pick('budget', body.price ?? existing?.budget ?? 0);
  const budget = Number(rawBudget || 0);
  if (!Number.isFinite(budget) || budget < 0) throw new ApiError(400, 'Budget must be zero or a positive amount.');

  const currency = String(pick('currency', existing?.currency || 'INR')).toUpperCase();
  if (!CURRENCIES.includes(currency)) throw new ApiError(400, `Currency must be one of ${CURRENCIES.join(', ')}.`);

  const projectStatus = pick('projectStatus', body.status ?? existing?.projectStatus ?? 'Pipeline');
  if (!PROJECT_STATUSES.includes(projectStatus)) throw new ApiError(400, 'Unknown project status.');

  const teamInput = parseTeamInput(body);
  const assignedTeam = teamInput === null ? existing?.assignedTeam || [] : await buildAssignedTeam(teamInput);

  const payload = {
    type: 'project',
    title,
    description: String(pick('description', existing?.description ?? '')),
    client: {
      name: String(pick('clientName', body.client?.name ?? existing?.client?.name ?? '')).trim(),
      email: clientEmail,
      phone: String(pick('clientPhone', body.client?.phone ?? existing?.client?.phone ?? '')).trim(),
    },
    projectStatus,
    startDate,
    deadline,
    budget,
    price: budget,
    currency,
    assignedTeam,
  };

  if (!existing) payload.slug = `${slugify(title)}-${Date.now()}`;
  return payload;
}

function buildProjectFilter(req) {
  const filter = { type: 'project' };
  const { status, search, dateFrom, dateTo } = req.query;

  if (status) filter.projectStatus = status;

  if (search && String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim().slice(0, 100)), 'i');
    filter.$and = [{ $or: [{ title: regex }, { 'client.name': regex }, { 'client.email': regex }] }];
  }

  // A project matches a date range when it overlaps it (starts before the range ends and
  // ends after the range starts), so long projects show up for any month they span.
  const from = parseDate(dateFrom);
  const to = parseDate(dateTo);
  if (from || to) {
    const overlap = [];
    if (to) overlap.push({ $or: [{ startDate: { $lte: new Date(to.getTime() + 86_399_999) } }, { startDate: null }] });
    if (from) overlap.push({ $or: [{ deadline: { $gte: from } }, { deadline: null }] });
    filter.$and = [...(filter.$and || []), ...overlap];
  }

  return filter;
}

/* ------------------------------------------------------------------ */
/* Projects                                                             */
/* ------------------------------------------------------------------ */
export const listProjects = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 25), 200);
  const skip = (page - 1) * limit;

  const scope = await scopeFilter(req.user);
  const filter = buildProjectFilter(req);
  if (scope.$or) filter.$and = [...(filter.$and || []), scope];

  const [items, total] = await Promise.all([
    CatalogItem.find(filter).sort('-createdAt').skip(skip).limit(limit),
    CatalogItem.countDocuments(filter),
  ]);

  res.json({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  const canEdit = (await seesAllProjects(req.user)) || (await hasAccess(req.user, 'catalog:update'));
  res.json({ ...project.toObject(), canEdit });
});

export const createProject = asyncHandler(async (req, res) => {
  const payload = await projectPayload(req.body);
  const item = await CatalogItem.create({ ...payload, createdBy: req.user._id });
  item.storagePath = `/api/catalog/${item._id}/documents`;
  await item.save();
  res.status(201).json(item);
});

export const updateProject = asyncHandler(async (req, res) => {
  const existing = await loadEditableProject(req);
  const payload = await projectPayload(req.body, existing);
  const item = await CatalogItem.findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true });
  res.json(item);
});

// Deleting is refused while tasks still point at the project, and removes its files.
export const removeProject = asyncHandler(async (req, res) => {
  const project = await loadEditableProject(req);
  const taskCount = await Task.countDocuments({ project: project._id });
  if (taskCount > 0) {
    throw new ApiError(400, `This project has ${taskCount} task(s). Move or delete them first, or mark the project Finished.`);
  }
  await CatalogItem.deleteOne({ _id: project._id });
  await fs.rm(path.join(PROJECTS_DIR, String(project._id)), { recursive: true, force: true });
  res.json({ message: 'Deleted successfully' });
});

// Active staff that can be put on a project. Needs Projects "Update", not Users access.
export const listAssignableUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 100);
  const filter = { isActive: true, role: { $nin: NON_EMPLOYEE_ROLES } };
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  const ids = parseJsonList(req.query.include);
  const [items, selected] = await Promise.all([
    User.find(filter).select('name email role').sort('name').limit(limit),
    ids.length ? User.find({ _id: { $in: ids } }).select('name email role isActive') : [],
  ]);
  res.json({ items, selected });
});

// Warns when adding someone would take them over 100% across running projects.
// Query: team=[{user, allocationPercent}] (or userIds), excludeId=<project being edited>.
export const checkProjectCapacity = asyncHandler(async (req, res) => {
  const team = parseTeamInput({ team: req.query.team, assignedUserIds: req.query.userIds }) || [];
  if (!team.length) return res.json({ warnings: [] });

  const requested = new Map(team.filter((t) => t.user).map((t) => [t.user, parseAllocation(t.allocationPercent)]));
  const filter = { type: 'project', projectStatus: 'Running', 'assignedTeam.user': { $in: [...requested.keys()] } };
  if (req.query.excludeId) filter._id = { $ne: req.query.excludeId };

  const projects = await CatalogItem.find(filter).select('title assignedTeam');
  const load = new Map();
  for (const project of projects) {
    for (const member of project.assignedTeam) {
      const key = String(member.user);
      if (!requested.has(key)) continue;
      const current = load.get(key) || { userId: key, name: member.name, allocation: 0, projects: [] };
      current.allocation += member.allocationPercent || 100;
      current.projects.push(project.title);
      load.set(key, current);
    }
  }

  const warnings = [...load.values()]
    .map((item) => ({ ...item, total: item.allocation + requested.get(item.userId) }))
    .filter((item) => item.total > 100)
    .map((item) => ({
      ...item,
      message: `${item.name} is already at ${item.allocation}% on ${item.projects.length} running project(s) (${item.projects.join(', ')}). Adding ${requested.get(item.userId)}% here makes ${item.total}%.`,
    }));

  res.json({ warnings });
});

/* ------------------------------------------------------------------ */
/* Documents (private: only downloadable by people who can see the project) */
/* ------------------------------------------------------------------ */
function safeFilename(filename, index) {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'document';
  return `${base}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}${ext}`;
}

function parseCategories(bodyValue, count) {
  const categories = parseJsonList(bodyValue);
  return Array.from({ length: count }, (_, index) => {
    const category = categories[index] || categories[0] || 'other';
    return documentCategories.has(category) ? category : 'other';
  });
}

function documentFile(project, doc) {
  const full = path.resolve(PROJECTS_DIR, String(project._id), doc.category || 'other', doc.filename);
  if (!full.startsWith(PROJECTS_DIR + path.sep)) throw new ApiError(400, 'Invalid document path.');
  return full;
}

export const uploadProjectDocuments = asyncHandler(async (req, res) => {
  const project = await loadEditableProject(req);
  if (!req.files?.length) throw new ApiError(400, 'At least one document is required.');

  const rejected = req.files.filter((file) => !ALLOWED_EXTENSIONS.has(path.extname(file.originalname).toLowerCase()));
  if (rejected.length) {
    throw new ApiError(400, `File type not allowed: ${rejected.map((f) => f.originalname).join(', ')}. Use PDF, Office, text, image or ZIP files.`);
  }

  const categories = parseCategories(req.body.categories, req.files.length);
  const documents = [];

  for (let index = 0; index < req.files.length; index += 1) {
    const file = req.files[index];
    const category = categories[index];
    const filename = safeFilename(file.originalname, index);
    const dir = path.join(PROJECTS_DIR, String(project._id), category);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), file.buffer);

    const downloadPath = `/api/catalog/${project._id}/documents/${encodeURIComponent(filename)}`;
    documents.push({
      filename,
      originalName: String(file.originalname).slice(0, 200),
      category,
      path: downloadPath,
      url: downloadPath,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  project.documents.push(...documents);
  await project.save();
  res.status(201).json({ documents, project });
});

export const downloadProjectDocument = asyncHandler(async (req, res) => {
  const project = await loadVisibleProject(req);
  const doc = project.documents.find((d) => d.filename === req.params.filename);
  if (!doc) throw new ApiError(404, 'Document not found');

  const file = documentFile(project, doc);
  if (!fsSync.existsSync(file)) throw new ApiError(404, 'The file is missing on the server.');
  res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(file, doc.originalName || doc.filename);
});

export const deleteProjectDocument = asyncHandler(async (req, res) => {
  const project = await loadEditableProject(req);
  const doc = project.documents.find((d) => d.filename === req.params.filename);
  if (!doc) throw new ApiError(404, 'Document not found');

  await fs.rm(documentFile(project, doc), { force: true });
  project.documents = project.documents.filter((d) => d.filename !== doc.filename);
  await project.save();
  res.json({ message: 'Document removed', documents: project.documents });
});
