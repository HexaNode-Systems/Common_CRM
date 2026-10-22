import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { CatalogItem } from '../models/CatalogItem.js';
import { StorageDocument } from '../models/StorageDocument.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hasAccess } from '../middleware/auth.middleware.js';

export const UPLOAD_ROOT = path.resolve('private-storage');
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

const CATEGORIES = ['hr', 'agreement', 'project', 'invoice'];
const CATEGORY_ALIASES = { client: 'agreement', finance: 'invoice' };
const TIERS = ['super_admin', 'hr_management', 'project_team'];
const TIER_LABELS = {
  super_admin: 'Super Admin only',
  hr_management: 'HR & Management',
  project_team: 'Project / employee team'
};

// Type is decided from the extension on the server, never from what the browser claims.
const MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};
export const ALLOWED_EXTENSIONS = Object.keys(MIME_BY_EXT);

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || '')) && String(value).length === 24;
}

function parseCategory(value, required = true) {
  const raw = String(value ?? '').trim().toLowerCase();
  const category = CATEGORY_ALIASES[raw] || raw;
  if (CATEGORIES.includes(category)) return category;
  if (!required && !raw) return null;
  throw new ApiError(400, 'Choose a category: HR, Agreement, Project or Invoice.');
}

const tabToCategory = (tab) => (!tab || tab === 'all' ? null : parseCategory(tab));
const associationTypeFor = (category) => (category === 'hr' ? 'employee' : 'project');

function parseTier(value) {
  const map = {
    'Tier 1: Super Admin Only': 'super_admin',
    'Tier 2: HR & Management': 'hr_management',
    'Tier 3: Project Team Collaborative': 'project_team'
  };
  const tier = map[value] || String(value ?? '').trim();
  if (!TIERS.includes(tier)) throw new ApiError(400, 'Choose a valid privacy tier.');
  return tier;
}

function parseTitle(value, fallback) {
  const title = String(value ?? '').trim() || String(fallback || '').trim();
  if (!title) throw new ApiError(400, 'Title is required.');
  if (title.length > 200) throw new ApiError(400, 'Title can be at most 200 characters.');
  return title;
}

function checkFile(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!MIME_BY_EXT[ext]) throw new ApiError(400, `"${file.originalname}" isn't an allowed type. Use PDF, Word, Excel, PowerPoint, text, CSV or images.`);
  if (file.size > MAX_FILE_SIZE) throw new ApiError(400, 'Files can be at most 25 MB.');
  return ext;
}

/* ------------------------------------------------------------------ */
/* Access                                                              */
/* ------------------------------------------------------------------ */

/**
 * Who sees a document:
 *  - Super Admin only    → super admin
 *  - HR & Management     → storage managers (Full access on Storage) and super admin
 *  - Project / employee  → the above, the uploader, the project's team (or the employee
 *                          the HR file is about), and people with Full access on Projects
 */
async function accessContext(user) {
  const [manager, projectsAll] = await Promise.all([hasAccess(user, 'storage:delete'), hasAccess(user, 'catalog:delete')]);
  let myProjects = new Set();
  if (!projectsAll) {
    const projects = await CatalogItem.find({ $or: [{ 'assignedTeam.user': user._id }, { createdBy: user._id }] }).select('_id');
    myProjects = new Set(projects.map((p) => String(p._id)));
  }
  return { user, superAdmin: user.role === 'super_admin', manager, projectsAll, myProjects };
}

function canAccess(ctx, doc) {
  if (ctx.superAdmin) return true;
  if (doc.accessTier === 'super_admin') return false;
  if (ctx.manager) return true;
  if (doc.accessTier === 'hr_management') return false;
  if (String(doc.uploadedBy?._id || doc.uploadedBy || '') === String(ctx.user._id)) return true;
  if (doc.associationType === 'employee') return String(doc.associationId) === String(ctx.user._id);
  return ctx.projectsAll || ctx.myProjects.has(String(doc.associationId));
}

// A user may only pick a tier they can see themselves.
function assertTierAllowed(ctx, tier) {
  if (tier === 'super_admin' && !ctx.superAdmin) throw new ApiError(403, 'Only the super admin can use "Super Admin only".');
  if (tier === 'hr_management' && !ctx.manager && !ctx.superAdmin) throw new ApiError(403, 'Only storage managers (Full access) can use "HR & Management".');
}

async function loadAccessible(id, ctx, { archived = false } = {}) {
  if (!isId(id)) throw new ApiError(404, 'Document not found');
  const doc = await StorageDocument.findById(id).populate('uploadedBy', 'name email role');
  // Documents a user can't open answer "not found" so their existence isn't revealed.
  if (!doc || !canAccess(ctx, doc)) throw new ApiError(404, 'Document not found');
  if (!archived && doc.isArchived) throw new ApiError(404, 'Document not found');
  return doc;
}

async function validateAssociation(category, associationId, ctx) {
  if (!isId(associationId)) throw new ApiError(400, category === 'hr' ? 'Choose the employee this file is about.' : 'Choose the project this file belongs to.');
  if (category === 'hr') {
    const employee = await User.findOne({ _id: associationId, role: { $ne: 'customer' } }).select('_id');
    if (!employee) throw new ApiError(400, 'Employee not found.');
    return employee._id;
  }
  const project = await CatalogItem.findOne({ _id: associationId, type: 'project' }).select('_id');
  if (!project) throw new ApiError(400, 'Project not found.');
  if (!ctx.superAdmin && !ctx.manager && !ctx.projectsAll && !ctx.myProjects.has(String(project._id))) {
    throw new ApiError(403, 'You can only file documents under projects you are on.');
  }
  return project._id;
}

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* ------------------------------------------------------------------ */

function insideRoot(target) {
  const resolved = path.resolve(target);
  return resolved === UPLOAD_ROOT || resolved.startsWith(UPLOAD_ROOT + path.sep);
}

async function writeFile(category, associationId, file, ext) {
  // Folder parts are a fixed category, a year and a checked ObjectId; the name is random.
  const dir = path.join(UPLOAD_ROOT, category, String(new Date().getFullYear()), String(associationId));
  const base = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'document';
  const target = path.join(dir, `${base}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  if (!insideRoot(target)) throw new ApiError(400, 'Invalid file location.');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(target, file.buffer);
  return target;
}

async function removeFile(target) {
  if (target && insideRoot(target)) await fs.rm(target, { force: true }).catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

async function present(doc, ctx) {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete plain.storagePath; // never send server paths to the browser
  if (plain.associationType === 'employee') {
    const employee = await User.findById(plain.associationId).select('name email role');
    plain.association = employee ? { _id: employee._id, name: employee.name, role: employee.role } : null;
    plain.associationName = employee?.name || 'Employee (removed)';
  } else {
    const project = await CatalogItem.findById(plain.associationId).select('title projectStatus');
    plain.association = project ? { _id: project._id, title: project.title, projectStatus: project.projectStatus } : null;
    plain.associationName = project?.title || 'Project (removed)';
  }
  plain.accessLabel = TIER_LABELS[plain.accessTier] || plain.accessTier;
  plain.statusLabel = plain.isArchived ? 'Archived' : 'Active';
  plain.canManage = ctx.superAdmin || ctx.manager;
  return plain;
}

async function audit(user, doc, action, extra = {}) {
  await AuditLog.create({
    scope: 'storage',
    actor: user?._id,
    action,
    message: `${user?.name || 'User'} ${action} document "${doc.title}"`,
    metadata: { documentId: doc._id, title: doc.title, ...extra }
  });
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

export const listStorageDocuments = asyncHandler(async (req, res) => {
  const ctx = await accessContext(req.user);
  const archived = req.query.archived === 'true' || req.query.archived === '1';
  if (archived && !ctx.manager && !ctx.superAdmin) throw new ApiError(403, 'Only storage managers can see archived documents.');

  const and = [{ isArchived: archived }];
  const category = tabToCategory(req.query.tab);
  if (category) and.push({ category });
  const search = String(req.query.search || '').trim().slice(0, 100);
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    and.push({ $or: [{ title: regex }, { originalName: regex }] });
  }

  const docs = await StorageDocument.find({ $and: and }).sort({ createdAt: -1 }).populate('uploadedBy', 'name email role');
  const visible = docs.filter((doc) => canAccess(ctx, doc));
  res.json({ items: await Promise.all(visible.map((doc) => present(doc, ctx))), canManage: ctx.manager || ctx.superAdmin, isSuperAdmin: ctx.superAdmin });
});

export const uploadStorageDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose a file to upload.');
  const ctx = await accessContext(req.user);
  const ext = checkFile(req.file);
  const category = parseCategory(req.body.category);
  const accessTier = parseTier(req.body.accessTier || 'project_team');
  assertTierAllowed(ctx, accessTier);
  const associationId = await validateAssociation(category, req.body.associationId, ctx);
  const title = parseTitle(req.body.title, req.file.originalname);

  // Everything is checked before anything touches the disk.
  const storagePath = await writeFile(category, associationId, req.file, ext);
  let doc;
  try {
    doc = await StorageDocument.create({
      title,
      category,
      associationType: associationTypeFor(category),
      associationId,
      accessTier,
      filename: path.basename(storagePath),
      originalName: String(req.file.originalname).slice(0, 255),
      mimeType: MIME_BY_EXT[ext],
      size: req.file.size,
      storagePath,
      uploadedBy: req.user._id,
      isArchived: false
    });
  } catch (err) {
    await removeFile(storagePath);
    throw err;
  }
  await audit(req.user, doc, 'uploaded');
  res.status(201).json(await present(doc, ctx));
});

export const updateStorageDocument = asyncHandler(async (req, res) => {
  const ctx = await accessContext(req.user);
  const doc = await loadAccessible(req.params.id, ctx);
  const body = req.body || {};
  const changed = [];

  if (body.title !== undefined) {
    const title = parseTitle(body.title);
    if (title !== doc.title) { doc.title = title; changed.push('title'); }
  }

  const category = body.category !== undefined ? parseCategory(body.category) : doc.category;
  const associationChanged = body.associationId !== undefined && String(body.associationId) !== String(doc.associationId);
  if (category !== doc.category || associationChanged) {
    if (associationTypeFor(category) !== doc.associationType && !associationChanged) {
      throw new ApiError(400, category === 'hr' ? 'Moving a file to HR needs the employee it is about.' : 'Moving a file out of HR needs the project it belongs to.');
    }
    doc.associationId = await validateAssociation(category, associationChanged ? body.associationId : doc.associationId, ctx);
    doc.associationType = associationTypeFor(category);
    if (category !== doc.category) changed.push('category');
    if (associationChanged) changed.push('linked to');
    doc.category = category;
  }

  if (body.accessTier !== undefined) {
    const tier = parseTier(body.accessTier);
    if (tier !== doc.accessTier) {
      if (!ctx.manager && !ctx.superAdmin) throw new ApiError(403, 'Only storage managers (Full access) can change who can see a document.');
      assertTierAllowed(ctx, tier);
      changed.push(`privacy ${doc.accessTier} → ${tier}`);
      doc.accessTier = tier;
    }
  }

  let oldPath = null;
  if (req.file) {
    const ext = checkFile(req.file);
    oldPath = doc.storagePath;
    doc.storagePath = await writeFile(doc.category, doc.associationId, req.file, ext);
    doc.filename = path.basename(doc.storagePath);
    doc.originalName = String(req.file.originalname).slice(0, 255);
    doc.mimeType = MIME_BY_EXT[ext];
    doc.size = req.file.size;
    changed.push('file replaced');
  }

  try {
    await doc.save();
  } catch (err) {
    if (oldPath) await removeFile(doc.storagePath);
    throw err;
  }
  if (oldPath) await removeFile(oldPath);
  if (changed.length) await audit(req.user, doc, 'updated', { changed });
  res.json(await present(doc, ctx));
});

export const archiveStorageDocument = asyncHandler(async (req, res) => {
  const ctx = await accessContext(req.user);
  const doc = await loadAccessible(req.params.id, ctx);
  doc.isArchived = true;
  doc.archivedAt = new Date();
  await doc.save();
  await audit(req.user, doc, 'archived');
  res.json(await present(doc, ctx));
});

export const restoreStorageDocument = asyncHandler(async (req, res) => {
  const ctx = await accessContext(req.user);
  const doc = await loadAccessible(req.params.id, ctx, { archived: true });
  if (!doc.isArchived) return res.json(await present(doc, ctx));
  doc.isArchived = false;
  doc.archivedAt = undefined;
  await doc.save();
  await audit(req.user, doc, 'restored');
  res.json(await present(doc, ctx));
});

// Permanent: removes the record and the file. Only for archived documents.
export const deleteStorageDocument = asyncHandler(async (req, res) => {
  const ctx = await accessContext(req.user);
  const doc = await loadAccessible(req.params.id, ctx, { archived: true });
  if (!doc.isArchived) throw new ApiError(400, 'Archive the document first, then delete it from the archive.');
  await StorageDocument.deleteOne({ _id: doc._id });
  await removeFile(doc.storagePath);
  await audit(req.user, doc, 'deleted');
  res.json({ message: 'Document deleted permanently.' });
});

export const downloadStorageDocument = asyncHandler(async (req, res) => {
  const ctx = await accessContext(req.user);
  const doc = await loadAccessible(req.params.id, ctx, { archived: ctx.manager || ctx.superAdmin });
  if (!insideRoot(doc.storagePath)) throw new ApiError(404, 'File not found on the server.');
  try {
    await fs.access(doc.storagePath);
  } catch {
    throw new ApiError(404, 'The file is missing on the server.');
  }
  await audit(req.user, doc, 'downloaded');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // res.download encodes any file name (Hindi, emoji, quotes) safely in Content-Disposition.
  res.download(doc.storagePath, doc.originalName || doc.filename);
});

// Employees (for HR files) and projects the user can file under.
export const listStorageLookup = asyncHandler(async (req, res) => {
  const ctx = await accessContext(req.user);
  const category = parseCategory(req.query.category);
  if (category === 'hr') {
    const items = await User.find({ isActive: true, role: { $nin: ['customer'] } }).select('name email role').sort({ name: 1 });
    return res.json({ items });
  }
  const filter = { type: 'project' };
  if (!ctx.superAdmin && !ctx.manager && !ctx.projectsAll) filter._id = { $in: [...ctx.myProjects] };
  const items = await CatalogItem.find(filter).select('title projectStatus').sort({ title: 1 });
  res.json({ items });
});
