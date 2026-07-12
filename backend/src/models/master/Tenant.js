import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    tenantId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    companyCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    customDomain: { type: String, sparse: true, lowercase: true, trim: true },
    dbName: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active'
    },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    planExpiresAt: { type: Date },
    subscriptionDuration: { type: Number, default: 1 },
    branding: {
      logo: { type: String, default: '' },
      favicon: { type: String, default: '' },
      primaryColor: { type: String, default: '#2563eb' },
      secondaryColor: { type: String, default: '#0f172a' },
      companyName: { type: String, default: '' }
    },
    settings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    storageUsage: { type: Number, default: 0 } // in bytes
  },
  { timestamps: true }
);

export const Tenant = mongoose.model('Tenant', tenantSchema);
