import fs from 'fs/promises';
import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';
import { WhatsAppChat } from '../models/WhatsAppChat.js';
import { LeadDistributionRule } from '../models/LeadDistributionRule.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

const leadSources = {
  website_form: 'Website Form',
  justdial: 'Justdial',
  indiamart: 'IndiaMart',
  zoho: 'Zoho CRM',
  csv_import: 'CSV Import',
  manual_entry: 'Manual Entry'
};

const leadStatuses = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

function normalizeString(value) {
  return String(value ?? '').trim();
}

function normalizePhone(value) {
  return normalizeString(value).replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
}

function normalizeSource(value) {
  const normalized = normalizeString(value).toLowerCase().replace(/[\s/-]+/g, '_');
  if (leadSources[normalized]) return normalized;
  if (normalized === 'website') return 'website_form';
  if (normalized === 'just_dial') return 'justdial';
  if (normalized === 'india_mart') return 'indiamart';
  if (normalized === 'zoho_crm') return 'zoho';
  if (normalized === 'csv') return 'csv_import';
  if (normalized === 'manual') return 'manual_entry';
  return 'manual_entry';
}

function normalizeStatus(value) {
  const normalized = normalizeString(value);
  return leadStatuses.includes(normalized) ? normalized : 'New';
}

function formatLeadDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

function formatRoleName(role) {
  if (!role) return '';
  return role.split('_')
             .map(word => word.charAt(0).toUpperCase() + word.slice(1))
             .join(' ');
}

function formatNoteLabel(actorName, actorRole, createdAt) {
  const d = new Date(createdAt);
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${pad(hours)}:${minutes} ${ampm}`;
  const displayRole = formatRoleName(actorRole);
  return `[Added by ${actorName} (${displayRole}) on ${day}/${month}/${year} at ${timeStr}]`;
}

function buildAssigneeFilter(req) {
  if (req.user.role === 'super_admin') return null;
  return req.user._id;
}

function buildLeadFilter(req) {
  const filter = {};
  const assigneeFilter = buildAssigneeFilter(req);
  if (assigneeFilter) filter.assignee = assigneeFilter;

  if (req.query.source) filter.source = normalizeSource(req.query.source);
  if (req.query.status) filter.status = normalizeStatus(req.query.status);
  if (req.query.assignee && req.user.role === 'super_admin') filter.assignee = req.query.assignee;
  if (req.query.from || req.query.to) {
    filter.ingestedAt = {};
    if (req.query.from) filter.ingestedAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.ingestedAt.$lte = new Date(req.query.to);
  }
  if (req.query.search) {
    const regex = new RegExp(String(req.query.search).trim(), 'i');
    filter.$or = [
      { companyName: regex },
      { contactName: regex },
      { phone: regex },
      { email: regex },
      { requirements: regex }
    ];
  }

  return filter;
}

async function populateLead(lead) {
  return lead.populate([
    { path: 'assignee', select: 'name email role isActive' },
    { path: 'createdBy', select: 'name email role isActive' }
  ]);
}

function serializeLead(lead) {
  const plain = lead.toObject();
  return {
    ...plain,
    sourceLabel: leadSources[plain.source] || 'Manual Entry',
    assigneeLabel: plain.assignee?.name || 'Unassigned',
    statusLabel: plain.status,
    isUnassigned: !plain.assignee,
    noteCount: plain.notes?.length || 0
  };
}

function parseCsv(text) {
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const rows = [];
  let current = [];
  let value = '';
  let inQuotes = false;

  const pushValue = () => {
    current.push(value);
    value = '';
  };

  const pushRow = () => {
    if (current.length) rows.push(current);
    current = [];
  };

  for (const line of lines) {
    current = [];
    value = '';
    inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];

      if (char === '"' && inQuotes && next === '"') {
        value += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        pushValue();
        continue;
      }

      value += char;
    }

    pushValue();
    pushRow();
  }

  if (!rows.length) return [];
  const [headerRow, ...dataRows] = rows;
  const headerMap = headerRow.map((column) => String(column || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ''));

  return dataRows.map((row) => headerMap.reduce((acc, header, index) => {
    acc[header] = row[index] ?? '';
    return acc;
  }, {}));
}

function mapCsvLead(row) {
  const companyName = normalizeString(row.name || row.companyname || row.company || row.leadname);
  const phone = normalizeString(row.phone || row.mobile || row.phonenumber);
  const email = normalizeString(row.email || row.emailaddress);
  const requirements = normalizeString(row.requirements || row.notes || row.query || row.message);

  if (!companyName) throw new ApiError(400, 'CSV row is missing the Name column.');
  if (!phone) throw new ApiError(400, 'CSV row is missing the Phone column.');

  return {
    companyName,
    contactName: companyName,
    phone,
    phoneNormalized: normalizePhone(phone),
    email,
    requirements,
    source: 'csv_import',
    status: 'New',
    sourcePayload: row
  };
}

function mapExternalLeadPayload(body = {}, source = 'manual_entry') {
  const flattened = typeof body === 'string' ? { message: body } : body;

  // IndiaMart specific keys
  const imName = flattened.SENDER_NAME || flattened.sender_name || flattened.SENDERNAME;
  const imCompany = flattened.SENDER_COMPANY || flattened.sender_company || flattened.SENDERCOMPANY;
  const imPhone = flattened.SENDER_MOBILE || flattened.sender_mobile || flattened.SENDERMOBILE || flattened.MOBILE || flattened.mobile;
  const imEmail = flattened.SENDER_EMAIL || flattened.sender_email || flattened.SENDEREMAIL;
  const imReq = flattened.QUERY_MESSAGE || flattened.query_message || flattened.QUERYMESSAGE || flattened.QUERY || flattened.query;

  // Zoho specific keys
  const zohoCompany = flattened.Company || flattened.company;
  const zohoFirstName = flattened.First_Name || flattened.first_name || '';
  const zohoLastName = flattened.Last_Name || flattened.last_name || '';
  const zohoName = (zohoFirstName + ' ' + zohoLastName).trim() || flattened.Full_Name || flattened.full_name;
  const zohoPhone = flattened.Phone || flattened.Mobile || flattened.phone || flattened.mobile;
  const zohoEmail = flattened.Email || flattened.email;
  const zohoReq = flattened.Description || flattened.description || flattened.Subject || flattened.subject;

  const companyName = normalizeString(
    imCompany || zohoCompany || flattened.companyName || flattened.company || flattened.name || flattened.lead_name || flattened.caller_name || flattened.customer_name
  );
  const contactName = normalizeString(
    imName || zohoName || flattened.contactName || flattened.contact || flattened.name || flattened.caller_name || flattened.customer_name || companyName
  );
  const phone = normalizeString(
    imPhone || zohoPhone || flattened.phone || flattened.mobile || flattened.phoneNumber || flattened.phone_number
  );
  const whatsapp = normalizeString(flattened.whatsapp || flattened.whatsappNumber || flattened.whatsapp_number || phone);
  const email = normalizeString(
    imEmail || zohoEmail || flattened.email || flattened.emailAddress || flattened.email_address
  );
  const requirements = normalizeString(
    imReq || zohoReq || flattened.requirements || flattened.query || flattened.message || flattened.notes || flattened.description
  );

  if (!companyName && !contactName && !phone) {
    throw new ApiError(400, 'Lead payload is missing core contact data.');
  }

  const leadName = companyName || contactName || phone;
  return {
    companyName: leadName,
    contactName: contactName || leadName,
    phone,
    phoneNormalized: normalizePhone(phone),
    whatsapp,
    email,
    requirements,
    source: normalizeSource(source),
    status: 'New',
    sourcePayload: flattened
  };
}

async function resolveLeadUpsert(payload, { source = 'manual_entry', createdBy = null, overwrite = true, user = null } = {}) {
  const leadPayload = typeof payload.phoneNormalized === 'string' ? payload : mapExternalLeadPayload(payload, source);
  if (!leadPayload.phoneNormalized) throw new ApiError(400, 'Phone number is required.');

  const existing = await Lead.findOne({ phoneNormalized: leadPayload.phoneNormalized });
  if (existing) {
    if (user && user.role !== 'super_admin') {
      throw new ApiError(400, 'Lead with this phone number already exists.');
    }

    if (!overwrite) return { action: 'skipped', lead: existing };

    existing.companyName = leadPayload.companyName || existing.companyName;
    existing.contactName = leadPayload.contactName || existing.contactName;
    existing.phone = leadPayload.phone || existing.phone;
    existing.phoneNormalized = leadPayload.phoneNormalized;
    existing.email = leadPayload.email || existing.email;
    existing.whatsapp = leadPayload.whatsapp || existing.whatsapp;
    existing.requirements = leadPayload.requirements || existing.requirements;
    existing.source = leadPayload.source || existing.source;
    existing.sourcePayload = leadPayload.sourcePayload ?? existing.sourcePayload;
    if (leadPayload.assignee !== undefined) existing.assignee = leadPayload.assignee || null;
    if (createdBy && !existing.createdBy) existing.createdBy = createdBy;
    await existing.save();

    // Link WhatsApp Chat if it exists
    const last10 = leadPayload.phoneNormalized.slice(-10);
    if (last10.length >= 10) {
      await WhatsAppChat.findOneAndUpdate(
        { phone: new RegExp(last10 + '$') },
        { lead: existing._id }
      );
    }

    return { action: 'updated', lead: existing };
  }

  const created = await Lead.create({
    ...leadPayload,
    assignee: leadPayload.assignee || null,
    createdBy,
    ingestedAt: new Date()
  });

  // Link WhatsApp Chat if it exists
  const last10 = leadPayload.phoneNormalized.slice(-10);
  if (last10.length >= 10) {
    await WhatsAppChat.findOneAndUpdate(
      { phone: new RegExp(last10 + '$') },
      { lead: created._id }
    );
  }

  return { action: 'created', lead: created };
}

async function loadLeadForUser(id, user) {
  const lead = await Lead.findById(id)
    .populate('assignee', 'name email role isActive')
    .populate('createdBy', 'name email role isActive');
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (user.role !== 'super_admin' && String(lead.assignee?._id || lead.assignee) !== String(user._id)) {
    throw new ApiError(403, 'You can only access leads assigned to you.');
  }
  return lead;
}

async function getActiveAssignee(assigneeId) {
  const assignee = await User.findOne({ _id: assigneeId, isActive: true }).select('name email role isActive phone');
  if (!assignee) throw new ApiError(400, 'Choose an active employee assignee.');
  return assignee;
}

export async function assignLeadViaRules(lead) {
  try {
    let rule = await LeadDistributionRule.findOne({ triggerSource: lead.source, isActive: true })
      .populate('salespersons', 'name email role isActive phone')
      .populate('singleAssignee', 'name email role isActive phone');

    if (!rule) {
      rule = await LeadDistributionRule.findOne({ triggerSource: 'all', isActive: true })
        .populate('salespersons', 'name email role isActive phone')
        .populate('singleAssignee', 'name email role isActive phone');
    }

    if (!rule) return lead;

    let assigneeId = null;
    let assigneeObj = null;

    if (rule.distributionType === 'single_assignee') {
      if (rule.singleAssignee && rule.singleAssignee.isActive) {
        assigneeId = rule.singleAssignee._id;
        assigneeObj = rule.singleAssignee;
      }
    } else if (rule.distributionType === 'round_robin' && rule.salespersons && rule.salespersons.length > 0) {
      const totalSales = rule.salespersons.length;
      let selectedSalesperson = null;

      for (let i = 0; i < totalSales; i++) {
        const checkIndex = (rule.currentIndex + i) % totalSales;
        const candidate = rule.salespersons[checkIndex];
        if (candidate && candidate.isActive) {
          selectedSalesperson = candidate;
          rule.currentIndex = (checkIndex + 1) % totalSales;
          await rule.save();
          break;
        }
      }

      if (selectedSalesperson) {
        assigneeId = selectedSalesperson._id;
        assigneeObj = selectedSalesperson;
      }
    }

    if (assigneeId) {
      lead.assignee = assigneeId;
      await lead.save();

      if (assigneeObj && assigneeObj.phone) {
        const leadMessage = `Hello *${assigneeObj.name}*,\n\nYou have been assigned a new lead automatically: *${lead.companyName || 'No Company'}*.\n\n*Source:* ${leadSources[lead.source] || lead.source}\n*Contact Name:* ${lead.contactName || 'N/A'}\n*Phone:* ${lead.phone}\n*Requirements:* ${lead.requirements || 'N/A'}\n\nPlease check your Lead Management dashboard.`;
        void sendWhatsAppMessage(assigneeObj.phone, leadMessage);
      }
    }

    return lead;
  } catch (error) {
    console.error('Failed to auto-assign lead:', error);
    return lead;
  }
}

export async function ingestLeadRecord(payload, options = {}) {
  const result = await resolveLeadUpsert(payload, options);
  if (result.action === 'skipped') return result;

  if (result.action === 'created' && !result.lead.assignee) {
    const assigned = await assignLeadViaRules(result.lead);
    if (assigned) {
      result.lead = assigned;
    }
  }

  const populated = await populateLead(await Lead.findById(result.lead._id));
  return { ...result, lead: serializeLead(populated) };
}

export const listLeads = asyncHandler(async (req, res) => {
  const filter = buildLeadFilter(req);
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Lead.find(filter).sort({ ingestedAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Lead.countDocuments(filter)
  ]);

  await Lead.populate(items, [
    { path: 'assignee', select: 'name email role isActive' },
    { path: 'createdBy', select: 'name email role isActive' }
  ]);

  res.json({ items: items.map(serializeLead), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await loadLeadForUser(req.params.id, req.user);
  res.json(serializeLead(lead));
});

export const listLeadAssignees = asyncHandler(async (req, res) => {
  const items = await User.find({ isActive: true, role: { $ne: 'super_admin' } }).select('name email role isActive').sort({ name: 1 });
  res.json({ items });
});

export const createLead = asyncHandler(async (req, res) => {
  const payload = mapExternalLeadPayload(req.body, req.body.source || 'manual_entry');
  const assigneeId = req.body.assigneeId || req.body.assignee;
  let assignee = null;
  if (assigneeId) {
    assignee = await getActiveAssignee(assigneeId);
    payload.assignee = assignee._id;
  } else if (req.user.role !== 'super_admin') {
    payload.assignee = req.user._id;
  }

  const result = await ingestLeadRecord(payload, { source: payload.source, createdBy: req.user?._id, user: req.user, overwrite: true });

  // Send WhatsApp notification if assignee exists and has a phone
  if (assignee && assignee.phone) {
    const leadMessage = `Hello *${assignee.name}*,\n\nYou have been assigned a new lead: *${payload.companyName || 'No Company'}*.\n\n*Contact Name:* ${payload.contactName || 'N/A'}\n*Phone:* ${payload.phone}\n*Requirements:* ${payload.requirements || 'N/A'}\n\nPlease check your Lead Management dashboard.`;
    void sendWhatsAppMessage(assignee.phone, leadMessage);
  } else if (!assigneeId && req.user.role !== 'super_admin') {
    const selfUser = await User.findById(req.user._id).select('name phone');
    if (selfUser && selfUser.phone) {
      const leadMessage = `Hello *${selfUser.name}*,\n\nYou have been assigned a new lead: *${payload.companyName || 'No Company'}*.\n\n*Contact Name:* ${payload.contactName || 'N/A'}\n*Phone:* ${payload.phone}\n*Requirements:* ${payload.requirements || 'N/A'}\n\nPlease check your Lead Management dashboard.`;
      void sendWhatsAppMessage(selfUser.phone, leadMessage);
    }
  }

  res.status(result.action === 'created' ? 201 : 200).json(result.lead);
});

export const importLeadsCsv = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required.');

  const parsed = parseCsv(req.file.buffer.toString('utf8'));
  if (!parsed.length) throw new ApiError(400, 'CSV file is empty.');

  const batch = parsed.map(mapCsvLead);
  const seenPhones = new Set();
  const batchDuplicates = [];
  const uniqueRows = [];

  for (const row of batch) {
    if (seenPhones.has(row.phoneNormalized)) {
      batchDuplicates.push({ phone: row.phone, companyName: row.companyName, reason: 'batch' });
      continue;
    }
    seenPhones.add(row.phoneNormalized);
    uniqueRows.push(row);
  }

  const existingMatches = await Lead.find({ phoneNormalized: { $in: uniqueRows.map((row) => row.phoneNormalized) } }).select('phoneNormalized companyName status');
  const existingByPhone = new Map(existingMatches.map((lead) => [lead.phoneNormalized, lead]));
  const existingDuplicates = uniqueRows
    .filter((row) => existingByPhone.has(row.phoneNormalized))
    .map((row) => ({ phone: row.phone, companyName: row.companyName, reason: 'database' }));

  const mode = normalizeString(req.body.mode).toLowerCase();
  const duplicates = [...batchDuplicates, ...existingDuplicates];
  if (duplicates.length && !['skip', 'overwrite'].includes(mode)) {
    return res.status(409).json({
      message: 'Skip duplicates or overwrite existing leads?',
      duplicates,
      total: batch.length,
      imported: 0
    });
  }

  const imported = [];
  const skipped = [];
  for (const row of uniqueRows) {
    const exists = existingByPhone.get(row.phoneNormalized);
    if (exists && mode === 'skip') {
      skipped.push({ phone: row.phone, companyName: row.companyName, reason: 'database' });
      continue;
    }

    const result = await resolveLeadUpsert(row, { source: 'csv_import', createdBy: req.user?._id, overwrite: true, user: req.user });
    if (result.action === 'skipped') {
      skipped.push({ phone: row.phone, companyName: row.companyName, reason: 'database' });
      continue;
    }
    imported.push(result.lead);
  }

  res.status(201).json({
    message: 'CSV import completed.',
    total: batch.length,
    imported: imported.length,
    skipped,
    duplicates,
    items: imported
  });
});

export const receiveLeadWebhook = asyncHandler(async (req, res) => {
  const sourceProvider = normalizeSource(req.params.sourceProvider);
  const payloads = Array.isArray(req.body) ? req.body : [req.body];
  const items = [];

  for (const payload of payloads) {
    const result = await ingestLeadRecord(mapExternalLeadPayload(payload, sourceProvider), { source: sourceProvider, overwrite: true });
    if (result.action !== 'skipped') items.push(result.lead);
  }

  res.status(201).json({ message: 'Webhook accepted.', items });
});

export const addLeadNote = asyncHandler(async (req, res) => {
  const lead = await loadLeadForUser(req.params.id, req.user);
  const message = normalizeString(req.body.message);
  if (!message) throw new ApiError(400, 'Note message is required.');

  const note = {
    message,
    addedBy: req.user._id,
    addedByName: req.user.name,
    addedByRole: req.user.role,
    label: formatNoteLabel(req.user.name, req.user.role, new Date())
  };

  lead.notes.push(note);
  await lead.save();
  const populated = await populateLead(lead);
  res.status(201).json(serializeLead(populated));
});

export const updateLeadStatus = asyncHandler(async (req, res) => {
  const lead = await loadLeadForUser(req.params.id, req.user);
  const nextStatus = normalizeStatus(req.body.status);
  lead.status = nextStatus;
  await lead.save();
  const populated = await populateLead(lead);
  res.json(serializeLead(populated));
});

export const routeLeadAssignee = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id).populate('assignee', 'name email role isActive phone').populate('createdBy', 'name email role isActive');
  if (!lead) throw new ApiError(404, 'Lead not found');

  let assignee = null;
  if (!req.body.assigneeId) {
    lead.assignee = null;
  } else {
    assignee = await getActiveAssignee(req.body.assigneeId);
    lead.assignee = assignee._id;
  }

  await lead.save();
  const refreshed = await populateLead(lead);

  // Send WhatsApp notification
  if (assignee && assignee.phone) {
    const leadMessage = `Hello *${assignee.name}*,\n\nYou have been assigned a new lead: *${refreshed.companyName || 'No Company'}*.\n\n*Contact Name:* ${refreshed.contactName || 'N/A'}\n*Phone:* ${refreshed.phone}\n*Requirements:* ${refreshed.requirements || 'N/A'}\n\nPlease check your Lead Management dashboard.`;
    void sendWhatsAppMessage(assignee.phone, leadMessage);
  }

  res.json(serializeLead(refreshed));
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw new ApiError(404, 'Lead not found');

  const { companyName, contactName, phone, email, whatsapp, requirements, source, status, assigneeId, note } = req.body;

  if (companyName !== undefined) lead.companyName = normalizeString(companyName);
  if (contactName !== undefined) lead.contactName = normalizeString(contactName);
  if (phone !== undefined) {
    lead.phone = normalizeString(phone);
    lead.phoneNormalized = normalizePhone(phone);
  }
  if (email !== undefined) lead.email = normalizeString(email);
  if (whatsapp !== undefined) lead.whatsapp = normalizeString(whatsapp);
  if (requirements !== undefined) lead.requirements = normalizeString(requirements);
  if (source !== undefined) lead.source = normalizeSource(source);
  if (status !== undefined) lead.status = normalizeStatus(status);

  if (assigneeId !== undefined) {
    if (!assigneeId) {
      lead.assignee = null;
    } else {
      const assignee = await getActiveAssignee(assigneeId);
      lead.assignee = assignee._id;
    }
  }

  if (note && String(note).trim()) {
    lead.notes.push({
      message: String(note).trim(),
      addedBy: req.user._id,
      addedByName: req.user.name,
      addedByRole: req.user.role,
      label: formatNoteLabel(req.user.name, req.user.role, new Date())
    });
  }

  await lead.save();
  const refreshed = await populateLead(lead);
  res.json(serializeLead(refreshed));
});

export const deleteLead = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') throw new ApiError(403, 'Access Denied');
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.json({ message: 'Lead deleted successfully.' });
});

export async function seedLeadFromJustdialPayload(payload) {
  return ingestLeadRecord(payload, { source: 'justdial', overwrite: true });
}

export async function readLeadCsv(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return parseCsv(content);
}

// Lead distribution rules CRUD
export const listDistributionRules = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Only supervisors can manage lead distribution rules.');
  }

  const rules = await LeadDistributionRule.find()
    .populate('salespersons', 'name email role isActive')
    .populate('singleAssignee', 'name email role isActive')
    .sort({ createdAt: -1 });

  res.json({ items: rules });
});

export const createDistributionRule = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Only supervisors can manage lead distribution rules.');
  }

  const { name, isActive, triggerSource, distributionType, salespersons, singleAssignee } = req.body;

  if (!name) throw new ApiError(400, 'Rule name is required.');

  if (isActive !== false) {
    const existingActive = await LeadDistributionRule.findOne({ triggerSource, isActive: true });
    if (existingActive) {
      throw new ApiError(400, `An active distribution rule for source "${triggerSource}" already exists.`);
    }
  }

  const rule = await LeadDistributionRule.create({
    name,
    isActive: isActive !== false,
    triggerSource: triggerSource || 'all',
    distributionType: distributionType || 'round_robin',
    salespersons: salespersons || [],
    singleAssignee: singleAssignee || null
  });

  const populated = await LeadDistributionRule.findById(rule._id)
    .populate('salespersons', 'name email role isActive')
    .populate('singleAssignee', 'name email role isActive');

  res.status(201).json(populated);
});

export const updateDistributionRule = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Only supervisors can manage lead distribution rules.');
  }

  const rule = await LeadDistributionRule.findById(req.params.id);
  if (!rule) throw new ApiError(404, 'Rule not found.');

  const { name, isActive, triggerSource, distributionType, salespersons, singleAssignee } = req.body;

  if (name !== undefined) rule.name = name;
  if (isActive !== undefined) {
    rule.isActive = isActive;
    if (isActive) {
      const sourceToCheck = triggerSource !== undefined ? triggerSource : rule.triggerSource;
      const existingActive = await LeadDistributionRule.findOne({
        _id: { $ne: rule._id },
        triggerSource: sourceToCheck,
        isActive: true
      });
      if (existingActive) {
        throw new ApiError(400, `An active distribution rule for source "${sourceToCheck}" already exists.`);
      }
    }
  }
  if (triggerSource !== undefined) {
    rule.triggerSource = triggerSource;
    const activeToCheck = isActive !== undefined ? isActive : rule.isActive;
    if (activeToCheck) {
      const existingActive = await LeadDistributionRule.findOne({
        _id: { $ne: rule._id },
        triggerSource,
        isActive: true
      });
      if (existingActive) {
        throw new ApiError(400, `An active distribution rule for source "${triggerSource}" already exists.`);
      }
    }
  }
  if (distributionType !== undefined) rule.distributionType = distributionType;
  if (salespersons !== undefined) rule.salespersons = salespersons;
  if (singleAssignee !== undefined) rule.singleAssignee = singleAssignee || null;

  await rule.save();

  const populated = await LeadDistributionRule.findById(rule._id)
    .populate('salespersons', 'name email role isActive')
    .populate('singleAssignee', 'name email role isActive');

  res.json(populated);
});

export const deleteDistributionRule = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Only supervisors can manage lead distribution rules.');
  }

  const rule = await LeadDistributionRule.findByIdAndDelete(req.params.id);
  if (!rule) throw new ApiError(404, 'Rule not found.');

  res.json({ message: 'Lead distribution rule deleted successfully.' });
});