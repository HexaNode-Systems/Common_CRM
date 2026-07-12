import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

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

const leadSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    phoneNormalized: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    requirements: { type: String, trim: true },
    source: {
      type: String,
      enum: ['website_form', 'justdial', 'indiamart', 'zoho', 'csv_import', 'manual_entry'],
      default: 'manual_entry'
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
      default: 'New'
    },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sourcePayload: mongoose.Schema.Types.Mixed,
    ingestedAt: { type: Date, default: Date.now },
    notes: [leadNoteSchema]
  },
  { timestamps: true }
);

leadSchema.index({ phoneNormalized: 1 }, { unique: true, sparse: true });
leadSchema.index({ assignee: 1, status: 1, source: 1, ingestedAt: -1 });

export const Lead = makeTenantModel('Lead', leadSchema);