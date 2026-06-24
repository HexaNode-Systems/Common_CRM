import fs from 'fs/promises';
import path from 'path';
import { CatalogItem } from '../models/CatalogItem.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const documentCategories = new Set(['agreement', 'prd', 'invoice', 'other']);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `project-${Date.now()}`;
}

function parseDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function assertTimeline(startDate, deadline) {
  if (startDate && deadline && deadline <= startDate) {
    throw new ApiError(400, 'Deadline must occur after the Project Start Date.');
  }
}

function buildProjectFilter(req) {
  const filter = { type: 'project' };
  const { status, search, dateFrom, dateTo } = req.query;

  if (status) filter.projectStatus = status;

  if (search) {
    const regex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: regex },
      { 'client.name': regex },
      { 'client.email': regex }
    ];
  }

  const from = parseDate(dateFrom);
  const to = parseDate(dateTo);
  if (from || to) {
    const range = {};
    if (from) range.$gte = from;
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      range.$lte = endOfDay;
    }
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ startDate: range }, { deadline: range }] }
    ];
  }

  return filter;
}

async function buildAssignedTeam(userIds = []) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return [];

  const users = await User.find({ _id: { $in: ids }, isActive: true }).select('name email role');
  return users.map((user) => ({
    user: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    allocationPercent: 100
  }));
}

function parseUserIds(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  }
}

async function projectPayload(body, existingProject) {
  const startDate = parseDate(body.startDate) ?? existingProject?.startDate;
  const deadline = parseDate(body.deadline) ?? existingProject?.deadline;
  assertTimeline(startDate, deadline);

  const assignedUserIds = parseUserIds(body.assignedUserIds);
  const assignedTeam = assignedUserIds.length ? await buildAssignedTeam(assignedUserIds) : existingProject?.assignedTeam || [];
  const title = String(body.title || body.projectName || existingProject?.title || '').trim();
  if (!title) throw new ApiError(400, 'Project name is required');

  const payload = {
    type: 'project',
    title,
    description: body.description || '',
    client: {
      name: String(body.clientName || body.client?.name || '').trim(),
      email: String(body.clientEmail || body.client?.email || '').trim().toLowerCase(),
      phone: String(body.clientPhone || body.client?.phone || '').trim()
    },
    projectStatus: body.projectStatus || body.status || existingProject?.projectStatus || 'Pipeline',
    startDate,
    deadline,
    budget: Number(body.budget || body.price || 0),
    price: Number(body.budget || body.price || 0),
    currency: body.currency || existingProject?.currency || 'INR',
    assignedTeam
  };

  if (!existingProject) payload.slug = `${slugify(title)}-${Date.now()}`;
  return payload;
}

export const listProjects = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = (page - 1) * limit;
  const filter = buildProjectFilter(req);

  const [items, total] = await Promise.all([
    CatalogItem.find(filter).sort('-createdAt').skip(skip).limit(limit),
    CatalogItem.countDocuments(filter)
  ]);

  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getProject = asyncHandler(async (req, res) => {
  const item = await CatalogItem.findOne({ _id: req.params.id, type: 'project' });
  if (!item) throw new ApiError(404, 'Project not found');
  res.json(item);
});

export const createProject = asyncHandler(async (req, res) => {
  const payload = await projectPayload(req.body);
  const item = await CatalogItem.create(payload);
  item.storagePath = `/storage/projects/${item._id}`;
  await item.save();
  res.status(201).json(item);
});

export const updateProject = asyncHandler(async (req, res) => {
  const existing = await CatalogItem.findOne({ _id: req.params.id, type: 'project' });
  if (!existing) throw new ApiError(404, 'Project not found');

  const payload = await projectPayload(req.body, existing);
  const item = await CatalogItem.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  res.json(item);
});

export const removeProject = asyncHandler(async (req, res) => {
  const item = await CatalogItem.findOneAndDelete({ _id: req.params.id, type: 'project' });
  if (!item) throw new ApiError(404, 'Project not found');
  res.json({ message: 'Deleted successfully' });
});

export const checkProjectCapacity = asyncHandler(async (req, res) => {
  const userIds = parseUserIds(req.query.userIds);
  if (!userIds.length) return res.json({ warnings: [] });

  const projects = await CatalogItem.find({
    type: 'project',
    projectStatus: 'Running',
    'assignedTeam.user': { $in: userIds }
  }).select('title assignedTeam');

  const allocations = new Map();
  for (const project of projects) {
    for (const member of project.assignedTeam) {
      const key = String(member.user);
      if (!userIds.map(String).includes(key)) continue;
      const current = allocations.get(key) || { userId: key, name: member.name, allocation: 0, projects: [] };
      current.allocation += member.allocationPercent || 100;
      current.projects.push(project.title);
      allocations.set(key, current);
    }
  }

  const warnings = [...allocations.values()]
    .filter((item) => item.allocation >= 100)
    .map((item) => ({
      ...item,
      message: `Warning: User ${item.name} is currently fully allocated on other running projects.`
    }));

  res.json({ warnings });
});

function safeFilename(filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
  return `${base}-${Date.now()}${ext}`;
}

function parseCategories(bodyValue, count) {
  let categories = [];
  if (Array.isArray(bodyValue)) categories = bodyValue;
  else if (bodyValue) {
    try {
      const parsed = JSON.parse(bodyValue);
      categories = Array.isArray(parsed) ? parsed : [bodyValue];
    } catch {
      categories = [bodyValue];
    }
  }

  return Array.from({ length: count }, (_, index) => {
    const category = categories[index] || categories[0] || 'other';
    return documentCategories.has(category) ? category : 'other';
  });
}

export const uploadProjectDocuments = asyncHandler(async (req, res) => {
  const project = await CatalogItem.findOne({ _id: req.params.id, type: 'project' });
  if (!project) throw new ApiError(404, 'Project not found');
  if (!req.files?.length) throw new ApiError(400, 'At least one document is required');

  const categories = parseCategories(req.body.categories, req.files.length);
  const documents = [];

  for (let index = 0; index < req.files.length; index += 1) {
    const file = req.files[index];
    const category = categories[index];
    const filename = safeFilename(file.originalname);
    const relativeDir = path.join('storage', 'projects', String(project._id), category);
    const absoluteDir = path.resolve(relativeDir);
    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(path.join(absoluteDir, filename), file.buffer);

    documents.push({
      filename,
      originalName: file.originalname,
      category,
      path: `/storage/projects/${project._id}/${category}/${filename}`,
      url: `/storage/projects/${project._id}/${category}/${filename}`,
      mimetype: file.mimetype,
      size: file.size
    });
  }

  project.documents.push(...documents);
  project.storagePath = `/storage/projects/${project._id}`;
  await project.save();

  res.status(201).json({ documents, project });
});
