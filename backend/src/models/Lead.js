import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

export const LEAD_SOURCES = ['website_form', 'justdial', 'indiamart', 'zoho', 'csv_import', 'manual_entry'];
export const LEAD_STATUSES = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

// Notes can only be added, never edited or removed (no API changes them).
const leadNoteSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedByName: { type: String, required: true, trim: true },
    addedByRole: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true }
  },
  { timestamps: true, _id: false }
);

// System history: who changed status, owner, details, and every re-enquiry. Written only by the server.
const leadActivitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['created', 'status', 'assigned', 'edited', 'reenquiry', 'import'], required: true },
    message: { type: String, trim: true },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    byName: { type: String, trim: true, default: 'System' },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, maxlength: 200 },
    contactName: { type: String, trim: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true },
    // Canonical number used for duplicate checks: digits only, Indian numbers reduced to 10 digits.
    phoneNormalized: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    requirements: { type: String, trim: true, maxlength: 5000 },
    // The source the lead FIRST came from. Never overwritten by later enquiries.
    source: { type: String, enum: LEAD_SOURCES, default: 'manual_entry' },
    latestSource: { type: String, enum: LEAD_SOURCES },
    sourceHistory: [{ source: { type: String, enum: LEAD_SOURCES }, at: { type: Date, default: Date.now }, _id: false }],
    status: { type: String, enum: LEAD_STATUSES, default: 'New' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sourcePayload: mongoose.Schema.Types.Mixed,
    ingestedAt: { type: Date, default: Date.now },
    notes: [leadNoteSchema],
    activity: [leadActivitySchema]
  },
  { timestamps: true }
);

leadSchema.index({ phoneNormalized: 1 }, { unique: true, sparse: true });
leadSchema.index({ assignee: 1, status: 1, source: 1, ingestedAt: -1 });

export const Lead = makeTenantModel('Lead', leadSchema);
