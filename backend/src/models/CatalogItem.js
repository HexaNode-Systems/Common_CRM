import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const assignedTeamSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: String,
    role: String,
    allocationPercent: { type: Number, default: 100, min: 0, max: 100 }
  },
  { _id: false }
);

const projectDocumentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: String,
    category: {
      type: String,
      enum: ['agreement', 'prd', 'invoice', 'other'],
      default: 'other'
    },
    path: { type: String, required: true },
    url: { type: String, required: true },
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const catalogItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['product', 'service', 'project'], default: 'project', index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: String,
    shortDescription: String,
    images: [{ url: String, publicId: String }],
    price: { type: Number, default: 0 },
    salePrice: Number,
    sku: String,
    stock: { type: Number, default: 0 },
    duration: String,
    category: String,
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    client: {
      name: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      phone: { type: String, trim: true }
    },
    projectStatus: {
      type: String,
      enum: ['Pipeline', 'Running', 'Finished', 'Blocked'],
      default: 'Pipeline',
      index: true
    },
    startDate: Date,
    deadline: Date,
    budget: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    assignedTeam: [assignedTeamSchema],
    documents: [projectDocumentSchema],
    storagePath: String,
    // Who created the project; they can always see it, like team members
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    seo: {
      title: String,
      description: String,
      keywords: String
    }
  },
  { timestamps: true }
);

catalogItemSchema.index({ type: 1, 'assignedTeam.user': 1 });

export const CatalogItem = makeTenantModel('CatalogItem', catalogItemSchema);
