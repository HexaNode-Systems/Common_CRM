import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: String,
    price: { type: Number, required: true, default: 0 },
    billingCycle: { type: String, enum: ['monthly', 'yearly', 'lifetime'], default: 'monthly' },
    limits: {
      maxUsers: { type: Number, default: 5 },
      maxStorage: { type: Number, default: 1073741824 }, // in bytes (default 1GB)
      maxEmployees: { type: Number, default: 10 },
      maxCustomers: { type: Number, default: 100 },
      maxLeads: { type: Number, default: 500 },
      maxProjects: { type: Number, default: 10 }
    },
    features: {
      reports: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      vault: { type: Boolean, default: false },
      storage: { type: Boolean, default: false },
      support: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false }
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
