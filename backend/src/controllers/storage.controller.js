import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { CatalogItem } from '../models/CatalogItem.js';
import { StorageDocument } from '../models/StorageDocument.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const UPLOAD_ROOT = path.resolve('private-storage');
const TABS = {
  all: null,
  hr: 'hr',
  client: 'agreement',
  project: 'project',
  finance: 'invoice'
};

const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv']);

function normalizeTab(value) {
  return TABS[value] || null;
}

function normalizePrivacy(value) {
  const mapping = {
    'Tier 1: Super Admin Only': 'super_admin',
    'Tier 2: HR & Management': 'hr_management',
    'Tier 3: Project Team Collaborative': 'project_team',
    super_admin: 'super_admin',
    hr_management: 'hr_management',
    project_team: 'project_team'
  };
  return mapping[value] || 'project_team';
}

function resolveAccessTier(document, user) {
  if (user.role === 'super_admin') return true;
  if (document.accessTier === 'project_team') return true;
  if (document.accessTier === 'hr_management') return ['project_manager', 'super_admin', 'hr_manager'].includes(user.role);
  return user.role === 'super_admin';
}

function safeFilename(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
  return `${base}-${Date.now()}${ext}`;
}

function archiveLabel(document) {
  return document.isArchived ? 'Archived' : 'Active';
}

function detectOwner(document) {
  if (document.associationType === 'employee') return document.employee?.name || 'Employee';
  return document.project?.title || 'Project';
}

async function enrichStorageDocument(document) {
  const plain = document.toObject();
  if (plain.associationType === 'employee') {
    const employee = await User.findById(plain.associationId).select('name email role');
    plain.association = employee ? { _id: employee._id, name: employee.name, email: employee.email, role: employee.role } : null;
  } else {
    const project = await CatalogItem.findById(plain.associationId).select('title projectStatus client');
    plain.association = project ? { _id: project._id, title: project.title, projectStatus: project.projectStatus, client: project.client } : null;
  }

  plain.accessLabel = plain.accessTier === 'super_admin' ? 'Super Admin Restricted' : plain.accessTier === 'hr_management' ? 'HR Only' : 'Public Internal';
  plain.statusLabel = archiveLabel(plain);
  plain.associationName = detectOwner(plain);
  return plain;
}

async function sanitizeStorageDocument(document) {
  return {
    ...(await enrichStorageDocument(document))
  };
}

async function buildStoragePath(document, fileName) {
  const year = new Date().getFullYear();
  const categoryFolder = document.category;
  const entityFolder = String(document.associationId);
  const relativeDir = path.join(UPLOAD_ROOT, categoryFolder, String(year), entityFolder);
  await fs.mkdir(relativeDir, { recursive: true });
  return path.join(relativeDir, fileName);
}

async function authorizeStorageAccess(user, document) {
  if (user.role === 'super_admin') return;
  if (document.accessTier === 'project_team' && ['project_manager', 'trainer', 'counselor', 'student', 'sales_executive'].includes(user.role)) return;
  if (document.accessTier === 'hr_management' && ['project_manager', 'super_admin'].includes(user.role)) return;
  throw new ApiError(403, 'You do not have access to this document.');
}

async function auditStorageAction({ user, document, action }) {
  await AuditLog.create({
    scope: 'storage',
    actor: user?._id,
    action,
    message: `${user?.name || 'User'} ${action} document ${document.title} on ${new Date().toISOString()}`,
    metadata: { documentId: document._id, title: document.title }
  });
}

async function buildFilters(req) {
  const tab = normalizeTab(req.query.tab);
  const filter = { isArchived: false };
  if (tab) filter.category = tab;
  if (req.query.search) {
    const regex = new RegExp(String(req.query.search).trim(), 'i');
    filter.$or = [{ title: regex }, { originalName: regex }, { storagePath: regex }];
  }
  return filter;
}

export const listStorageDocuments = asyncHandler(async (req, res) => {
  const filter = await buildFilters(req);
  const items = await StorageDocument.find(filter).sort({ createdAt: -1 }).populate('uploadedBy', 'name email role');
  res.json({ items: await Promise.all(items.map((item) => sanitizeStorageDocument(item))) });
});

export const uploadStorageDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Document file is required');

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext === '.exe' || ext === '.bat' || !allowedExtensions.has(ext)) {
    throw new ApiError(400, 'Executable or unsupported file types are blocked.');
  }
  if (req.file.size > 25 * 1024 * 1024) throw new ApiError(400, 'File size cannot exceed 25MB.');

  const title = String(req.body.title || req.file.originalname).trim();
  const category = normalizeTab(req.body.category) || 'project';
  const associationType = String(req.body.associationType || '').trim();
  const associationId = String(req.body.associationId || '').trim();
  const accessTier = normalizePrivacy(req.body.accessTier);

  if (!associationType || !associationId) throw new ApiError(400, 'Association is required.');

  const fileName = safeFilename(req.file.originalname);
  const storagePath = await buildStoragePath({ category, associationId }, fileName);
  await fs.writeFile(storagePath, req.file.buffer);

  const document = await StorageDocument.create({
    title,
    category,
    associationType,
    associationId,
    accessTier,
    filename: fileName,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storagePath,
    uploadedBy: req.user?._id
  });

  await auditStorageAction({ user: req.user, document, action: 'uploaded' });
  res.status(201).json(await sanitizeStorageDocument(document));
});

export const updateStorageDocument = asyncHandler(async (req, res) => {
  const document = await StorageDocument.findById(req.params.id).populate('uploadedBy', 'name email role');
  if (!document) throw new ApiError(404, 'Document not found');
  await authorizeStorageAccess(req.user, document);

  if (req.body.title !== undefined) document.title = String(req.body.title || '').trim();
  if (req.body.accessTier !== undefined) document.accessTier = normalizePrivacy(req.body.accessTier);
  if (req.body.category !== undefined) document.category = normalizeTab(req.body.category) || document.category;
  if (req.body.associationType !== undefined) document.associationType = String(req.body.associationType || '').trim();
  if (req.body.associationId !== undefined) document.associationId = String(req.body.associationId || '').trim();

  await document.save();
  await auditStorageAction({ user: req.user, document, action: 'updated' });
  res.json(await sanitizeStorageDocument(document));
});

export const archiveStorageDocument = asyncHandler(async (req, res) => {
  const document = await StorageDocument.findById(req.params.id);
  if (!document) throw new ApiError(404, 'Document not found');
  await authorizeStorageAccess(req.user, document);
  document.isArchived = true;
  document.archivedAt = new Date();
  await document.save();
  await auditStorageAction({ user: req.user, document, action: 'archived' });
  res.json(await sanitizeStorageDocument(document));
});

export const issueStorageDownload = asyncHandler(async (req, res) => {
  const document = await StorageDocument.findById(req.params.id);
  if (!document) throw new ApiError(404, 'Document not found');
  await authorizeStorageAccess(req.user, document);

  const token = crypto.createHash('sha256').update(`${document._id}:${req.user._id}:${Date.now()}`).digest('hex');
  res.json({ downloadUrl: `/api/v1/storage/${document._id}/download?token=${token}` });
});

export const downloadStorageDocument = asyncHandler(async (req, res) => {
  const document = await StorageDocument.findById(req.params.id);
  if (!document) throw new ApiError(404, 'Document not found');
  await authorizeStorageAccess(req.user, document);

  const stream = await fs.readFile(document.storagePath);
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
  res.send(stream);
});

export const listStorageLookup = asyncHandler(async (req, res) => {
  const category = String(req.query.category || '').trim();
  if (category === 'hr') {
    const items = await User.find({ isActive: true }).select('name email role');
    return res.json({ items });
  }

  if (['agreement', 'project'].includes(category)) {
    const items = await CatalogItem.find({ type: 'project' }).select('title projectStatus client');
    return res.json({ items });
  }

  res.json({ items: [] });
});
