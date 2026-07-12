import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const vaultCredentialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    platformUrl: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    secretCiphertext: { type: String, required: true, select: false },
    secretIv: { type: String, required: true, select: false },
    secretTag: { type: String, required: true, select: false },
    accessGroups: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const VaultCredential = makeTenantModel('VaultCredential', vaultCredentialSchema);
