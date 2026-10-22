import crypto from 'crypto';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { Lead, LEAD_SOURCES, LEAD_STATUSES } from '../models/Lead.js';
import { User } from '../models/User.js';
import { WhatsAppChat } from '../models/WhatsAppChat.js';
import { LeadDistributionRule } from '../models/LeadDistributionRule.js';
import { Tenant } from '../models/master/Tenant.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';
import { hasAccess } from '../middleware/auth.middleware.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';
import { readIntegrationSettings } from './settings.controller.js';

/* ------------------------------------------------------------------ */
/* Constants and parsing                                               */
/* ------------------------------------------------------------------ */

const SOURCE_LABELS = {
  website_form: 'Website Form',
  justdial: 'Justdial',
  indiamart: 'IndiaMart',
  zoho: 'Zoho CRM',
  csv_import: 'CSV Import',
  manual_entry: 'Manual Entry'
};

const SOURCE_ALIASES = {
  website: 'website_form',
  web: 'website_form',
  form: 'website_form',
  just_dial: 'justdial',
  india_mart: 'indiamart',
  zoho_crm: 'zoho',
  csv: 'csv_import',
  manual: 'manual_entry'
};

// Sources that may push leads through the webhook (CSV and manual entry have their own screens).
const WEBHOOK_SOURCES = ['website_form', 'justdial', 'indiamart', 'zoho'];
const NON_ASSIGNABLE_ROLES = ['customer', 'super_admin'];
const LEAD_TZ = process.env.LEAD_TZ || process.env.PAYROLL_TZ || 'Asia/Kolkata';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_WEBHOOK_BATCH = 100;
const MAX_CSV_ROWS = 5000;

function str(value) {
  return String(value ?? '').trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns a known source code or null. Accepts labels and common spellings. */
export function parseSource(value) {
  const key = str(value).toLowerCase().replace(/[\s/-]+/g, '_');
  if (LEAD_SOURCES.includes(key)) return key;
  return SOURCE_ALIASES[key] || null;
}

/** Returns the canonical status ("won" → "Won") or null when it is not a real status. */
export function parseStatus(value) {
  const key = str(value).toLowerCase();
  return LEAD_STATUSES.find((s) => s.toLowerCase() === key) || null;
}

function looksLikeExcelNumber(raw) {
  return /^\d+(\.\d+)?e\+?\d+$/i.test(str(raw));
}

/**
 * Canonical phone used for duplicate checks: digits only; Indian numbers written as
 * +91 98765 43210, 0919876543210, 09876543210 or 9876543210 all become 9876543210.
 * Returns '' when the value can't be a phone number.
 */
export function canonicalPhone(raw) {
  if (looksLikeExcelNumber(raw)) return '';
  let digits = str(raw).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length < 7 || digits.length > 15) return '';
  return digits;
}

// Forms the same number may have been stored in before canonical numbers were introduced.
function phoneVariants(canonical) {
  const set = new Set([canonical, `+${canonical}`]);
  if (canonical.length === 10) ['+91', '91', '0', '091', '+910'].forEach((p) => set.add(p + canonical));
  return [...set];
}

function phoneError(raw) {
  if (!str(raw)) return 'Phone number is required.';
  if (looksLikeExcelNumber(raw)) return `Phone "${str(raw)}" is in Excel scientific format. Format the column as Text and export again.`;
  return `"${str(raw)}" is not a valid phone number.`;
}

function formatNoteLabel(name, role, date) {
  const when = new Intl.DateTimeFormat('en-GB', {
    timeZone: LEAD_TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  }).format(date).replace(',', ' at').toUpperCase().replace(' AT ', ' at ');
  const displayRole = String(role || '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return `[Added by ${name} (${displayRole}) on ${when}]`;
}

function actorOf(user) {
  return user ? { by: user._id, byName: user.name || 'User' } : { by: null, byName: 'System' };
}

function logActivity(lead, user, type, message, extra = {}) {
  if (!Array.isArray(lead.activity)) lead.activity = [];
  lead.activity.push({ type, message, ...extra, ...actorOf(user), at: new Date() });
}

function isValidId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || '')) && String(value).length === 24;
}

/* ------------------------------------------------------------------ */
/* Access                                                              */
/* ------------------------------------------------------------------ */

// Full Access on Leads (or super admin) = manager: sees every lead, routes leads, manages rules.
// Everyone else works only on leads assigned to them.
async function isLeadManager(user) {
  return hasAccess(user, 'leads:delete');
}

async function loadLeadForUser(id, user, manager) {
  if (!isValidId(id)) throw new ApiError(404, 'Lead not found');
  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (!manager && String(lead.assignee || '') !== String(user._id)) {
    throw new ApiError(403, 'You can only access leads assigned to you.');
  }
  return lead;
}

async function getAssignableUser(id) {
  if (!isValidId(id)) throw new ApiError(400, 'Choose a valid employee.');
  const user = await User.findOne({ _id: id, isActive: true, role: { $nin: NON_ASSIGNABLE_ROLES } }).select('name email role isActive phone');
  if (!user) throw new ApiError(400, 'Choose an active employee (customers and inactive users can’t own leads).');
  return user;
}

/* ------------------------------------------------------------------ */
/* Serialising                                                         */
/* ------------------------------------------------------------------ */

async function populateLead(lead) {
  await Lead.populate(lead, [
    { path: 'assignee', select: 'name email role isActive' },
    { path: 'createdBy', select: 'name email role isActive' }
  ]);
  return lead;
}

function serializeLead(lead) {
  const plain = typeof lead.toObject === 'function' ? lead.toObject() : lead;
  return {
    ...plain,
    sourceLabel: SOURCE_LABELS[plain.source] || 'Manual Entry',
    latestSourceLabel: SOURCE_LABELS[plain.latestSource || plain.source] || 'Manual Entry',
    assigneeLabel: plain.assignee?.name || 'Unassigned',
    isUnassigned: !plain.assignee,
    noteCount: plain.notes?.length || 0
  };
}

/* ------------------------------------------------------------------ */
/* Mapping incoming data                                               */
/* ------------------------------------------------------------------ */

function pick(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && str(value) !== '') return str(value);
  }
  return '';
}

/** Maps a website / IndiaMart / Justdial / Zoho payload (or manual form) to lead fields. */
export function mapExternalLeadPayload(body = {}) {
  let data = typeof body === 'string' ? { message: body } : (body || {});
  // IndiaMart push API wraps the lead in RESPONSE; some tools wrap in data/lead.
  if (data.RESPONSE && typeof data.RESPONSE === 'object') data = data.RESPONSE;
  else if (data.lead && typeof data.lead === 'object') data = data.lead;

  const zohoName = `${pick(data, 'First_Name', 'first_name')} ${pick(data, 'Last_Name', 'last_name')}`.trim();
  const companyName = pick(data, 'SENDER_COMPANY', 'sender_company', 'SENDERCOMPANY', 'Company', 'company', 'companyName', 'company_name');
  const contactName = pick(data, 'SENDER_NAME', 'sender_name', 'SENDERNAME') || zohoName
    || pick(data, 'Full_Name', 'full_name', 'contactName', 'contact', 'name', 'lead_name', 'caller_name', 'customer_name');
  const phone = pick(data, 'SENDER_MOBILE', 'sender_mobile', 'SENDERMOBILE', 'MOBILE', 'Mobile', 'mobile', 'Phone', 'phone', 'phoneNumber', 'phone_number', 'caller_number');
  const email = pick(data, 'SENDER_EMAIL', 'sender_email', 'SENDEREMAIL', 'Email', 'email', 'emailAddress', 'email_address').toLowerCase();
  const requirements = pick(data, 'QUERY_MESSAGE', 'query_message', 'QUERYMESSAGE', 'QUERY', 'query', 'Description', 'description',
    'requirements', 'message', 'notes', 'Subject', 'subject', 'QUERY_PRODUCT_NAME');
  const whatsapp = pick(data, 'whatsapp', 'whatsappNumber', 'whatsapp_number') || phone;

  return {
    companyName: companyName || contactName || phone,
    contactName: contactName || companyName,
    phone,
    whatsapp,
    email,
    requirements,
    sourcePayload: data
  };
}

function validateLeadFields(fields) {
  if (!str(fields.companyName) && !str(fields.contactName)) throw new ApiError(400, 'Lead / company name is required.');
  const canonical = canonicalPhone(fields.phone);
  if (!canonical) throw new ApiError(400, phoneError(fields.phone));
  if (fields.email && !EMAIL_RE.test(fields.email)) throw new ApiError(400, `"${fields.email}" is not a valid email address.`);
  return canonical;
}

/* ------------------------------------------------------------------ */
/* WhatsApp notification                                               */
/* ------------------------------------------------------------------ */

// Sends from the person who made the change when their WhatsApp is linked; otherwise from a
// linked session of the same company. Never blocks or fails the request.
function notifyAssignee(assignee, lead, { actor = null, auto = false } = {}) {
  if (!assignee?.phone) return;
  const message = `Hello *${assignee.name}*,\n\nYou have been assigned ${auto ? 'a new lead automatically' : 'a lead'}: *${lead.companyName || 'No Company'}*.\n\n*Source:* ${SOURCE_LABELS[lead.latestSource || lead.source] || lead.source}\n*Contact Name:* ${lead.contactName || 'N/A'}\n*Phone:* ${lead.phone}\n*Requirements:* ${lead.requirements || 'N/A'}\n\nPlease check your Lead Management dashboard.`;
  (async () => {
    let sent = null;
    if (actor?._id) sent = await sendWhatsAppMessage(String(actor._id), assignee.phone, message);
    if (!sent) await sendWhatsAppMessage(assignee.phone, message);
  })().catch((err) => console.error('Lead WhatsApp notification failed:', err?.message || err));
}

/* ------------------------------------------------------------------ */
/* Distribution                                                        */
/* ------------------------------------------------------------------ */

async function activeEligible(ids = []) {
  const clean = ids.map((v) => String(v?._id || v)).filter(isValidId);
  if (!clean.length) return [];
  const users = await User.find({ _id: { $in: clean }, isActive: true, role: { $nin: NON_ASSIGNABLE_ROLES } }).select('name email role isActive phone');
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return clean.map((id) => byId.get(id)).filter(Boolean); // keep queue order
}

/**
 * Picks the owner for a new lead: the rule for its source first, then the "All Sources" rule.
 * A rule whose agents are all inactive is skipped instead of leaving the lead unassigned.
 * Round robin uses an atomic counter so simultaneous leads are spread evenly.
 */
async function pickAssigneeByRules(source) {
  const rules = [];
  const sourceRule = await LeadDistributionRule.findOne({ triggerSource: source, isActive: true });
  if (sourceRule) rules.push(sourceRule);
  const allRule = await LeadDistributionRule.findOne({ triggerSource: 'all', isActive: true });
  if (allRule) rules.push(allRule);

  for (const rule of rules) {
    if (rule.distributionType === 'single_assignee') {
      const [user] = await activeEligible([rule.singleAssignee]);
      if (user) return { user, rule };
      continue;
    }
    const agents = await activeEligible(rule.salespersons || []);
    if (!agents.length) continue;
    const counted = await LeadDistributionRule.findOneAndUpdate({ _id: rule._id }, { $inc: { currentIndex: 1 } }, { new: true });
    const turn = ((counted?.currentIndex ?? 1) - 1) % agents.length;
    return { user: agents[turn], rule };
  }
  return null;
}

async function linkWhatsAppChat(lead) {
  const last10 = String(lead.phoneNormalized).slice(-10);
  if (last10.length < 10 || !/^\d+$/.test(last10)) return;
  try {
    await WhatsAppChat.findOneAndUpdate({ phone: new RegExp(`${last10}$`) }, { lead: lead._id });
  } catch { /* linking is best effort */ }
}

/* ------------------------------------------------------------------ */
/* Ingest (create / re-enquiry / overwrite)                             */
/* ------------------------------------------------------------------ */

async function findByPhone(canonical) {
  return Lead.findOne({ phoneNormalized: { $in: phoneVariants(canonical) } });
}

/**
 * mode:
 *  - 'create'    manual Add New: an existing number is an error (nothing is overwritten)
 *  - 'reenquiry' webhook / Justdial: existing lead keeps its owner, name and first source;
 *                empty fields are filled, the new enquiry is added to its history
 *  - 'overwrite' CSV "Overwrite": replaces contact details, keeps first source and owner
 *  - 'skip'      CSV "Skip": existing leads are left alone
 * assignTo: a user to own new leads (null = use distribution rules).
 */
async function ingestLead(fields, { source, mode, actor = null, assignTo = null, autoAssign = true, manager = false }, retried = false) {
  const canonical = validateLeadFields(fields);
  const existing = await findByPhone(canonical);

  if (existing) {
    if (mode === 'create') {
      const owner = existing.assignee ? await User.findById(existing.assignee).select('name') : null;
      const detail = manager ? ` (${existing.companyName}, ${owner ? `owned by ${owner.name}` : 'unassigned'})` : '';
      const err = new ApiError(409, `A lead with this phone number already exists${detail}.${manager ? '' : ' Ask your manager to assign it to you.'}`);
      if (manager) err.existingId = String(existing._id);
      throw err;
    }
    if (mode === 'skip') return { action: 'skipped', lead: existing };
    if (mode === 'overwrite' && !manager && String(existing.assignee || '') !== String(actor?._id || '')) {
      return { action: 'skipped', lead: existing, reason: 'Belongs to another agent' };
    }

    if (mode === 'overwrite') {
      for (const key of ['companyName', 'contactName', 'email', 'whatsapp', 'requirements']) {
        if (str(fields[key])) existing[key] = str(fields[key]);
      }
      existing.phone = str(fields.phone);
      logActivity(existing, actor, 'import', `Details overwritten by ${SOURCE_LABELS[source]} import`);
    } else {
      for (const key of ['contactName', 'email', 'whatsapp']) {
        if (!str(existing[key]) && str(fields[key])) existing[key] = str(fields[key]);
      }
      logActivity(existing, actor, 'reenquiry', fields.requirements ? `Enquired again: ${str(fields.requirements).slice(0, 500)}` : 'Enquired again', { to: source });
    }
    existing.phoneNormalized = canonical;
    existing.latestSource = source;
    existing.sourceHistory = [...(existing.sourceHistory || []), { source, at: new Date() }];
    existing.sourcePayload = fields.sourcePayload ?? existing.sourcePayload;

    let assigned = null;
    if (!existing.assignee && autoAssign) {
      assigned = assignTo ? { user: assignTo } : await pickAssigneeByRules(source);
      if (assigned) {
        existing.assignee = assigned.user._id;
        logActivity(existing, actor, 'assigned', assigned.rule ? `Routed by rule "${assigned.rule.name}"` : 'Assigned', { to: assigned.user.name });
      }
    }
    try {
      await existing.save();
    } catch (err) {
      if (err?.code === 11000) throw new ApiError(409, 'Another lead already uses this phone number.');
      throw err;
    }
    if (assigned) notifyAssignee(assigned.user, existing, { actor, auto: Boolean(assigned.rule) });
    await linkWhatsAppChat(existing);
    return { action: 'updated', lead: existing };
  }

  const assigned = assignTo ? { user: assignTo } : (autoAssign ? await pickAssigneeByRules(source) : null);
  const now = new Date();
  const doc = {
    companyName: str(fields.companyName) || str(fields.contactName),
    contactName: str(fields.contactName) || str(fields.companyName),
    phone: str(fields.phone),
    phoneNormalized: canonical,
    email: str(fields.email).toLowerCase(),
    whatsapp: str(fields.whatsapp) || str(fields.phone),
    requirements: str(fields.requirements),
    source,
    latestSource: source,
    sourceHistory: [{ source, at: now }],
    status: 'New',
    assignee: assigned?.user?._id || null,
    createdBy: actor?._id || null,
    sourcePayload: fields.sourcePayload,
    ingestedAt: now,
    notes: [],
    activity: [{ type: 'created', message: `Created from ${SOURCE_LABELS[source]}`, ...actorOf(actor), at: now }]
  };
  if (assigned) {
    doc.activity.push({ type: 'assigned', message: assigned.rule ? `Routed by rule "${assigned.rule.name}"` : 'Assigned', to: assigned.user.name, ...actorOf(actor), at: now });
  }

  let created;
  try {
    created = await Lead.create(doc);
  } catch (err) {
    // Same number arrived twice at the same moment: treat the second one as a re-enquiry.
    if (err?.code === 11000 && !retried) return ingestLead(fields, { source, mode: mode === 'create' ? 'create' : 'reenquiry', actor, assignTo, autoAssign, manager }, true);
    throw err;
  }
  if (assigned) notifyAssignee(assigned.user, created, { actor, auto: Boolean(assigned.rule) });
  await linkWhatsAppChat(created);
  return { action: 'created', lead: created };
}

/* ------------------------------------------------------------------ */
/* Listing and reading                                                 */
/* ------------------------------------------------------------------ */

function parseDateParam(value, name) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `"${value}" is not a valid ${name} date.`);
  return date;
}

async function buildLeadFilter(req, manager) {
  const and = [];
  if (!manager) and.push({ assignee: req.user._id });

  if (req.query.source) {
    const source = parseSource(req.query.source);
    if (!source) throw new ApiError(400, 'Unknown lead source filter.');
    and.push({ source });
  }
  if (req.query.status) {
    const status = parseStatus(req.query.status);
    if (!status) throw new ApiError(400, 'Unknown lead status filter.');
    and.push({ status });
  }
  if (manager && req.query.assignee) {
    if (req.query.assignee === 'unassigned') and.push({ assignee: null });
    else if (isValidId(req.query.assignee)) and.push({ assignee: req.query.assignee });
    else throw new ApiError(400, 'Unknown assignee filter.');
  }
  const from = parseDateParam(req.query.from, 'from');
  const to = parseDateParam(req.query.to, 'to');
  if (from || to) {
    const range = {};
    if (from) range.$gte = from;
    if (to) range.$lte = to;
    and.push({ ingestedAt: range });
  }
  const search = str(req.query.search).slice(0, 100);
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const or = [{ companyName: regex }, { contactName: regex }, { phone: regex }, { email: regex }, { requirements: regex }];
    const digits = canonicalPhone(search);
    if (digits) or.push({ phoneNormalized: new RegExp(escapeRegex(digits)) });
    and.push({ $or: or });
  }
  return and.length ? { $and: and } : {};
}

export const listLeads = asyncHandler(async (req, res) => {
  const manager = await isLeadManager(req.user);
  const filter = await buildLeadFilter(req, manager);
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const limit = Math.min(Math.max(1, Math.floor(Number(req.query.limit)) || 50), 100);

  const [items, total] = await Promise.all([
    Lead.find(filter).select('-sourcePayload').sort({ ingestedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Lead.countDocuments(filter)
  ]);
  await Lead.populate(items, [
    { path: 'assignee', select: 'name email role isActive' },
    { path: 'createdBy', select: 'name email role isActive' }
  ]);

  res.json({
    items: items.map(serializeLead),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    scope: manager ? 'all' : 'own'
  });
});

export const getLead = asyncHandler(async (req, res) => {
  const manager = await isLeadManager(req.user);
  const lead = await loadLeadForUser(req.params.id, req.user, manager);
  await populateLead(lead);
  res.json({ ...serializeLead(lead), canRoute: manager });
});

export const listLeadAssignees = asyncHandler(async (req, res) => {
  const items = await User.find({ isActive: true, role: { $nin: NON_ASSIGNABLE_ROLES } }).select('name email role isActive').sort({ name: 1 });
  res.json({ items });
});

/* ------------------------------------------------------------------ */
/* Create / import / webhook                                           */
/* ------------------------------------------------------------------ */

export const createLead = asyncHandler(async (req, res) => {
  const manager = await isLeadManager(req.user);
  const body = req.body || {};
  const source = body.source ? parseSource(body.source) : 'manual_entry';
  if (!source) throw new ApiError(400, 'Unknown lead source.');

  const fields = {
    companyName: str(body.companyName),
    contactName: str(body.contactName),
    phone: str(body.phone),
    email: str(body.email).toLowerCase(),
    whatsapp: str(body.whatsapp),
    requirements: str(body.requirements)
  };

  // Managers may pick an owner (or leave it to the rules); agents always own what they add.
  let assignTo = null;
  const requested = body.assigneeId || body.assignee;
  if (manager) {
    if (requested) assignTo = await getAssignableUser(requested);
  } else {
    assignTo = await User.findById(req.user._id).select('name email role isActive phone');
  }

  try {
    const result = await ingestLead(fields, { source, mode: 'create', actor: req.user, assignTo, manager });
    await populateLead(result.lead);
    res.status(201).json(serializeLead(result.lead));
  } catch (err) {
    if (err.statusCode === 409) return res.status(409).json({ message: err.message, existingId: err.existingId });
    throw err;
  }
});

/** CSV parser that handles quoted commas, doubled quotes and line breaks inside quotes. */
export function parseCsvRows(text) {
  const input = String(text || '').replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { value += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else value += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(value); value = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i += 1;
      row.push(value); value = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else value += ch;
  }
  row.push(value);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function parseCsv(text) {
  const rows = parseCsvRows(text);
  if (!rows.length) return [];
  const [header, ...data] = rows;
  const keys = header.map((c) => String(c || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ''));
  // Row numbers match the spreadsheet: header is row 1.
  return data.map((cells, index) => ({
    rowNumber: index + 2,
    values: keys.reduce((acc, key, i) => { if (key) acc[key] = cells[i] ?? ''; return acc; }, {})
  }));
}

function mapCsvRow(values) {
  const name = str(values.name || values.companyname || values.company || values.leadname);
  return {
    companyName: name,
    contactName: str(values.contactname || values.contact) || name,
    phone: str(values.phone || values.mobile || values.phonenumber),
    email: str(values.email || values.emailaddress).toLowerCase(),
    whatsapp: str(values.whatsapp),
    requirements: str(values.requirements || values.notes || values.query || values.message),
    sourcePayload: values
  };
}

export const importLeadsCsv = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required.');
  const manager = await isLeadManager(req.user);
  const parsed = parseCsv(req.file.buffer.toString('utf8'));
  if (!parsed.length) throw new ApiError(400, 'The CSV has no data rows.');
  if (parsed.length > MAX_CSV_ROWS) throw new ApiError(400, `Import at most ${MAX_CSV_ROWS} rows at a time.`);

  // Check every row first; bad rows are reported with their row number and the rest still import.
  const errors = [];
  const valid = [];
  const seen = new Map();
  const batchDuplicates = [];
  for (const { rowNumber, values } of parsed) {
    const fields = mapCsvRow(values);
    try {
      if (!fields.companyName) throw new ApiError(400, 'Name is empty.');
      const canonical = validateLeadFields(fields);
      if (seen.has(canonical)) {
        batchDuplicates.push({ row: rowNumber, phone: fields.phone, companyName: fields.companyName, reason: `Same number as row ${seen.get(canonical)}` });
        continue;
      }
      seen.set(canonical, rowNumber);
      valid.push({ rowNumber, fields, canonical });
    } catch (err) {
      errors.push({ row: rowNumber, message: err.message });
    }
  }

  const existingDuplicates = [];
  for (const item of valid) {
    const existing = await findByPhone(item.canonical);
    if (existing) {
      item.existing = true;
      existingDuplicates.push({ row: item.rowNumber, phone: item.fields.phone, companyName: item.fields.companyName, reason: `Already in leads as "${existing.companyName}"` });
    }
  }

  const mode = str(req.body?.mode).toLowerCase();
  if (existingDuplicates.length && !['skip', 'overwrite'].includes(mode)) {
    return res.status(409).json({
      message: 'Some numbers are already in your leads. Skip them or overwrite their details?',
      duplicates: [...existingDuplicates, ...batchDuplicates],
      errors,
      total: parsed.length,
      imported: 0
    });
  }

  // Agents own what they import; managers' imports go through the distribution rules.
  const assignTo = manager ? null : await User.findById(req.user._id).select('name email role isActive phone');
  let created = 0;
  let updated = 0;
  const skipped = [...batchDuplicates];
  for (const item of valid) {
    try {
      const result = await ingestLead(item.fields, { source: 'csv_import', mode: mode || 'skip', actor: req.user, assignTo, manager });
      if (result.action === 'created') created += 1;
      else if (result.action === 'updated') updated += 1;
      else skipped.push({ row: item.rowNumber, phone: item.fields.phone, companyName: item.fields.companyName, reason: result.reason || 'Already in leads' });
    } catch (err) {
      errors.push({ row: item.rowNumber, message: err.message });
    }
  }

  res.status(201).json({
    message: `Imported ${created} new lead(s)${updated ? `, updated ${updated}` : ''}${skipped.length ? `, skipped ${skipped.length}` : ''}${errors.length ? `, ${errors.length} row(s) had errors` : ''}.`,
    total: parsed.length,
    imported: created,
    updated,
    skipped,
    errors
  });
});

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Runs `fn` inside the company that owns `token`; returns false when the token is unknown. */
async function runAsWebhookOwner(token, fn) {
  if (!token || String(token).length < 20) return false;
  const tenant = await Tenant.findOne({ leadWebhookToken: String(token), status: 'active' }).select('tenantId dbName');
  if (tenant) {
    const connection = getTenantDbConnection(tenant.dbName);
    await tenantStorage.run({ connection, tenantId: tenant.tenantId, dbName: tenant.dbName }, fn);
    return true;
  }
  // Single-company installs (no tenants): a fixed token from .env, using the default database.
  if (process.env.LEAD_WEBHOOK_TOKEN && safeEqual(token, process.env.LEAD_WEBHOOK_TOKEN)) {
    await fn();
    return true;
  }
  return false;
}

export const receiveLeadWebhook = asyncHandler(async (req, res) => {
  const source = parseSource(req.params.sourceProvider);
  if (!source || !WEBHOOK_SOURCES.includes(source)) {
    throw new ApiError(400, `Unknown lead source "${req.params.sourceProvider}". Use one of: ${WEBHOOK_SOURCES.join(', ')}.`);
  }

  let payloads = Array.isArray(req.body) ? req.body : [req.body];
  if (!Array.isArray(req.body) && Array.isArray(req.body?.RESPONSE)) payloads = req.body.RESPONSE; // IndiaMart batch
  if (!payloads.length) throw new ApiError(400, 'No leads in the request.');
  if (payloads.length > MAX_WEBHOOK_BATCH) throw new ApiError(413, `Send at most ${MAX_WEBHOOK_BATCH} leads per request.`);

  let summary = null;
  const ok = await runAsWebhookOwner(req.params.token, async () => {
    // A source switched off ("paused") on the Integrations page is refused, so the sender keeps it and retries later.
    const integrations = await readIntegrationSettings().catch(() => ({}));
    const providerKey = source === 'website_form' ? 'website' : source;
    if (integrations?.[providerKey]?.paused) {
      summary = { paused: true };
      return;
    }
    const result = { received: payloads.length, created: 0, updated: 0, failed: [] };
    // Each lead is handled on its own: one bad lead doesn't fail (and trigger a retry of) the batch.
    for (let index = 0; index < payloads.length; index += 1) {
      try {
        const fields = mapExternalLeadPayload(payloads[index]);
        const out = await ingestLead(fields, { source, mode: 'reenquiry' });
        if (out.action === 'created') result.created += 1;
        else result.updated += 1;
      } catch (err) {
        result.failed.push({ index, message: err.message });
      }
    }
    summary = result;
  });
  if (!ok) throw new ApiError(401, 'Invalid webhook key. Copy the current URL from Lead Distribution.');
  if (summary.paused) throw new ApiError(423, `Leads from ${SOURCE_LABELS[source]} are paused in Integrations.`);

  if (summary.failed.length === payloads.length) {
    return res.status(400).json({ message: summary.failed[0].message, ...summary });
  }
  res.status(200).json({ message: 'Webhook accepted.', ...summary });
});

export const legacyWebhookGone = (req, res) => {
  res.status(410).json({ message: 'This webhook URL is no longer active. Copy the new URL (with its secret key) from Leads → Lead Distribution.' });
};

async function webhookTokenFor(req, rotate = false) {
  if (req.tenantId) {
    const tenant = await Tenant.findOne({ tenantId: req.tenantId }).select('+leadWebhookToken');
    if (!tenant) throw new ApiError(404, 'Company not found.');
    if (!tenant.leadWebhookToken || rotate) {
      tenant.leadWebhookToken = crypto.randomBytes(24).toString('hex');
      await tenant.save();
    }
    return { token: tenant.leadWebhookToken, canRotate: true };
  }
  if (rotate) throw new ApiError(400, 'This server uses LEAD_WEBHOOK_TOKEN from .env. Change it there and restart.');
  return { token: process.env.LEAD_WEBHOOK_TOKEN || null, canRotate: false };
}

export const getWebhookInfo = asyncHandler(async (req, res) => {
  const info = await webhookTokenFor(req, false);
  res.json({
    ...info,
    sources: WEBHOOK_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value], path: `/leads/webhook/${value}/${info.token || '<LEAD_WEBHOOK_TOKEN>'}` })),
    message: info.token ? null : 'Webhooks are off. Set LEAD_WEBHOOK_TOKEN (at least 20 characters) in the server .env and restart.'
  });
});

export const rotateWebhookToken = asyncHandler(async (req, res) => {
  const info = await webhookTokenFor(req, true);
  res.json({ ...info, sources: WEBHOOK_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value], path: `/leads/webhook/${value}/${info.token}` })) });
});

/* ------------------------------------------------------------------ */
/* Updates                                                             */
/* ------------------------------------------------------------------ */

export const addLeadNote = asyncHandler(async (req, res) => {
  const manager = await isLeadManager(req.user);
  const lead = await loadLeadForUser(req.params.id, req.user, manager);
  const message = str(req.body?.message);
  if (!message) throw new ApiError(400, 'Note message is required.');
  if (message.length > 5000) throw new ApiError(400, 'Notes can be at most 5000 characters.');

  lead.notes.push({
    message,
    addedBy: req.user._id,
    addedByName: req.user.name,
    addedByRole: req.user.role,
    label: formatNoteLabel(req.user.name, req.user.role, new Date())
  });
  await lead.save();
  await populateLead(lead);
  res.status(201).json(serializeLead(lead));
});

export const updateLeadStatus = asyncHandler(async (req, res) => {
  const manager = await isLeadManager(req.user);
  const lead = await loadLeadForUser(req.params.id, req.user, manager);
  const status = parseStatus(req.body?.status);
  if (!status) throw new ApiError(400, `"${str(req.body?.status)}" is not a lead status. Use: ${LEAD_STATUSES.join(', ')}.`);
  if (status !== lead.status) {
    logActivity(lead, req.user, 'status', null, { from: lead.status, to: status });
    lead.status = status;
    await lead.save();
  }
  await populateLead(lead);
  res.json(serializeLead(lead));
});

async function applyAssignee(lead, assigneeId, user) {
  const previous = lead.assignee ? await User.findById(lead.assignee).select('name') : null;
  if (!assigneeId) {
    if (!lead.assignee) return null;
    lead.assignee = null;
    logActivity(lead, user, 'assigned', 'Unassigned', { from: previous?.name || '', to: '' });
    return null;
  }
  const assignee = await getAssignableUser(assigneeId);
  if (String(lead.assignee || '') === String(assignee._id)) return null;
  lead.assignee = assignee._id;
  logActivity(lead, user, 'assigned', 'Reassigned', { from: previous?.name || 'Unassigned', to: assignee.name });
  return assignee;
}

export const routeLeadAssignee = asyncHandler(async (req, res) => {
  if (!(await isLeadManager(req.user))) throw new ApiError(403, 'Only managers with Full access on Leads can reassign leads.');
  const lead = await loadLeadForUser(req.params.id, req.user, true);
  const newOwner = await applyAssignee(lead, req.body?.assigneeId, req.user);
  await lead.save();
  if (newOwner) notifyAssignee(newOwner, lead, { actor: req.user });
  await populateLead(lead);
  res.json(serializeLead(lead));
});

export const updateLead = asyncHandler(async (req, res) => {
  const manager = await isLeadManager(req.user);
  const lead = await loadLeadForUser(req.params.id, req.user, manager);
  const body = req.body || {};
  const changed = [];

  const setText = (key, label, max = 200) => {
    if (body[key] === undefined) return;
    const value = str(body[key]);
    if (value.length > max) throw new ApiError(400, `${label} can be at most ${max} characters.`);
    if (value !== str(lead[key])) { lead[key] = value; changed.push(label); }
  };

  if (body.companyName !== undefined && !str(body.companyName)) throw new ApiError(400, 'Lead / company name is required.');
  setText('companyName', 'Company');
  setText('contactName', 'Contact');
  setText('whatsapp', 'WhatsApp', 30);
  setText('requirements', 'Requirements', 5000);

  if (body.email !== undefined) {
    const email = str(body.email).toLowerCase();
    if (email && !EMAIL_RE.test(email)) throw new ApiError(400, `"${email}" is not a valid email address.`);
    if (email !== str(lead.email)) { lead.email = email; changed.push('Email'); }
  }

  if (body.phone !== undefined && str(body.phone) !== str(lead.phone)) {
    const canonical = canonicalPhone(body.phone);
    if (!canonical) throw new ApiError(400, phoneError(body.phone));
    const clash = await findByPhone(canonical);
    if (clash && String(clash._id) !== String(lead._id)) {
      throw new ApiError(409, manager ? `Another lead ("${clash.companyName}") already uses this phone number.` : 'Another lead already uses this phone number.');
    }
    lead.phone = str(body.phone);
    lead.phoneNormalized = canonical;
    changed.push('Phone');
  }

  // The first source is the lead's origin; only managers may correct it.
  if (body.source !== undefined && body.source !== lead.source) {
    if (!manager) throw new ApiError(403, 'Only managers can change where a lead came from.');
    const source = parseSource(body.source);
    if (!source) throw new ApiError(400, 'Unknown lead source.');
    if (source !== lead.source) { changed.push(`Source (${SOURCE_LABELS[lead.source]} → ${SOURCE_LABELS[source]})`); lead.source = source; }
  }

  if (body.status !== undefined) {
    const status = parseStatus(body.status);
    if (!status) throw new ApiError(400, `"${str(body.status)}" is not a lead status.`);
    if (status !== lead.status) {
      logActivity(lead, req.user, 'status', null, { from: lead.status, to: status });
      lead.status = status;
    }
  }

  let newOwner = null;
  if (body.assigneeId !== undefined && String(body.assigneeId || '') !== String(lead.assignee || '')) {
    if (!manager) throw new ApiError(403, 'Only managers with Full access on Leads can reassign leads.');
    newOwner = await applyAssignee(lead, body.assigneeId, req.user);
  }

  if (changed.length) logActivity(lead, req.user, 'edited', `Changed ${changed.join(', ')}`);

  if (str(body.note)) {
    lead.notes.push({
      message: str(body.note).slice(0, 5000),
      addedBy: req.user._id,
      addedByName: req.user.name,
      addedByRole: req.user.role,
      label: formatNoteLabel(req.user.name, req.user.role, new Date())
    });
  }

  try {
    await lead.save();
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, 'Another lead already uses this phone number.');
    throw err;
  }
  if (newOwner) notifyAssignee(newOwner, lead, { actor: req.user });
  await populateLead(lead);
  res.json(serializeLead(lead));
});

export const deleteLead = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new ApiError(404, 'Lead not found');
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.json({ message: 'Lead deleted successfully.' });
});

/* ------------------------------------------------------------------ */
/* Justdial poller                                                     */
/* ------------------------------------------------------------------ */

export async function seedLeadFromJustdialPayload(payload) {
  return ingestLead(mapExternalLeadPayload(payload), { source: 'justdial', mode: 'reenquiry' });
}

export async function readLeadCsv(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return parseCsv(content).map((row) => row.values);
}

/* ------------------------------------------------------------------ */
/* Distribution rules                                                  */
/* ------------------------------------------------------------------ */

const RULE_SOURCES = ['all', ...LEAD_SOURCES];

function parseBool(value, fallback) {
  if (value === undefined) return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new ApiError(400, 'Active must be true or false.');
}

async function validateRuleMembers(ids, label) {
  const list = [...new Set((ids || []).map((v) => String(v?._id || v)))];
  if (list.some((id) => !isValidId(id))) throw new ApiError(400, `${label}: invalid user.`);
  const ok = await activeEligible(list);
  if (ok.length !== list.length) {
    const okIds = new Set(ok.map((u) => String(u._id)));
    const bad = await User.find({ _id: { $in: list.filter((id) => !okIds.has(id)) } }).select('name');
    const names = bad.map((u) => u.name).join(', ') || 'unknown user';
    throw new ApiError(400, `${label}: ${names} can’t receive leads (inactive, a customer, or super admin). Remove them first.`);
  }
  return list;
}

async function decorateRules(rules) {
  const ids = rules.flatMap((r) => [...(r.salespersons || []), r.singleAssignee].filter(Boolean).map(String));
  const users = ids.length ? await User.find({ _id: { $in: [...new Set(ids)] } }).select('name email role isActive') : [];
  const byId = new Map(users.map((u) => [String(u._id), u]));
  const eligible = (u) => u && u.isActive && !NON_ASSIGNABLE_ROLES.includes(u.role);
  return rules.map((rule) => {
    const plain = typeof rule.toObject === 'function' ? rule.toObject() : rule;
    const members = (plain.salespersons || []).map((id) => byId.get(String(id))).filter(Boolean);
    const single = plain.singleAssignee ? byId.get(String(plain.singleAssignee)) : null;
    const active = members.filter(eligible);
    const next = plain.distributionType === 'single_assignee'
      ? (eligible(single) ? single : null)
      : (active.length ? active[(plain.currentIndex || 0) % active.length] : null);
    return {
      ...plain,
      salespersons: members,
      singleAssignee: single,
      inactiveMembers: (plain.distributionType === 'single_assignee' ? [single] : members).filter((u) => u && !eligible(u)).map((u) => ({ _id: u._id, name: u.name })),
      nextAssignee: next ? { _id: next._id, name: next.name } : null
    };
  });
}

export const listDistributionRules = asyncHandler(async (req, res) => {
  const rules = await LeadDistributionRule.find().sort({ createdAt: -1 });
  res.json({ items: await decorateRules(rules) });
});

async function assertSingleActive(triggerSource, excludeId) {
  const filter = { triggerSource, isActive: true };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await LeadDistributionRule.findOne(filter)) {
    throw new ApiError(400, `Another active flow already handles "${triggerSource === 'all' ? 'All Sources' : SOURCE_LABELS[triggerSource]}". Turn it off first.`);
  }
}

async function ruleFields(body, current = {}) {
  const name = body.name !== undefined ? str(body.name) : current.name;
  if (!name) throw new ApiError(400, 'Rule name is required.');
  if (name.length > 100) throw new ApiError(400, 'Rule name can be at most 100 characters.');
  const triggerSource = body.triggerSource !== undefined ? str(body.triggerSource) : (current.triggerSource || 'all');
  if (!RULE_SOURCES.includes(triggerSource)) throw new ApiError(400, 'Unknown trigger source.');
  const distributionType = body.distributionType !== undefined ? str(body.distributionType) : (current.distributionType || 'round_robin');
  if (!['round_robin', 'single_assignee'].includes(distributionType)) throw new ApiError(400, 'Unknown distribution type.');
  const isActive = parseBool(body.isActive, current.isActive ?? true);

  let salespersons = current.salespersons || [];
  let singleAssignee = current.singleAssignee || null;
  if (distributionType === 'round_robin') {
    if (body.salespersons !== undefined) salespersons = await validateRuleMembers(body.salespersons, 'Round robin queue');
    if (!salespersons.length) throw new ApiError(400, 'Add at least one agent to the round robin queue.');
    singleAssignee = null;
  } else {
    if (body.singleAssignee !== undefined) singleAssignee = body.singleAssignee ? (await validateRuleMembers([body.singleAssignee], 'Assignee'))[0] : null;
    if (!singleAssignee) throw new ApiError(400, 'Choose the agent who receives these leads.');
    salespersons = [];
  }
  return { name, triggerSource, distributionType, isActive, salespersons, singleAssignee };
}

export const createDistributionRule = asyncHandler(async (req, res) => {
  const fields = await ruleFields(req.body || {});
  if (fields.isActive) await assertSingleActive(fields.triggerSource);
  const rule = await LeadDistributionRule.create({ ...fields, currentIndex: 0 });
  const [decorated] = await decorateRules([rule]);
  res.status(201).json(decorated);
});

export const updateDistributionRule = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new ApiError(404, 'Rule not found.');
  const rule = await LeadDistributionRule.findById(req.params.id);
  if (!rule) throw new ApiError(404, 'Rule not found.');

  // Turning a rule on/off alone must work even if its queue later gained an inactive member.
  const onlyToggle = Object.keys(req.body || {}).every((k) => k === 'isActive');
  const current = typeof rule.toObject === 'function' ? rule.toObject() : rule;
  const fields = onlyToggle
    ? { isActive: parseBool(req.body.isActive, rule.isActive), triggerSource: rule.triggerSource }
    : await ruleFields(req.body || {}, { ...current, salespersons: (current.salespersons || []).map(String), singleAssignee: current.singleAssignee ? String(current.singleAssignee) : null });
  if (fields.isActive) await assertSingleActive(fields.triggerSource, rule._id);

  if (!onlyToggle && (String(fields.salespersons) !== String((current.salespersons || []).map(String)))) fields.currentIndex = 0;
  Object.assign(rule, fields);
  await rule.save();
  const [decorated] = await decorateRules([rule]);
  res.json(decorated);
});

export const deleteDistributionRule = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new ApiError(404, 'Rule not found.');
  const rule = await LeadDistributionRule.findByIdAndDelete(req.params.id);
  if (!rule) throw new ApiError(404, 'Rule not found.');
  res.json({ message: 'Lead distribution rule deleted successfully.' });
});
