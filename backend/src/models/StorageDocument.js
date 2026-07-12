import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const storageDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['hr', 'agreement', 'project', 'invoice'],
      required: true,
      index: true
    },
    associationType: { type: String, enum: ['employee', 'project'], required: true },
    associationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accessTier: {
      type: String,
      enum: ['super_admin', 'hr_management', 'project_team'],
      default: 'project_team',
      index: true
    },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    archivedAt: Date,
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const StorageDocument = makeTenantModel('StorageDocument', storageDocumentSchema);
