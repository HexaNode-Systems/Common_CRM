import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const vaultCredentialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    platformUrl: { type: String, required: true, trim: true, maxlength: 500 },
    username: { type: String, required: true, trim: true, maxlength: 200 },
    secretCiphertext: { type: String, required: true, select: false },
    secretIv: { type: String, required: true, select: false },
    secretTag: { type: String, required: true, select: false },
    // "v2" = encrypted with VAULT_MASTER_KEY. Empty = saved by the old code (see utils/vaultCrypto.js).
    keyVersion: { type: String, select: false },
    // Role slugs allowed to see this credential. Empty = every role with Vault access.
    accessGroups: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    secretChangedAt: Date
  },
  { timestamps: true }
);

export const VaultCredential = makeTenantModel('VaultCredential', vaultCredentialSchema);
