import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const whatsappCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    totalContacts: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['sending', 'completed', 'failed', 'stopped'],
      default: 'sending'
    },
    body: { type: String, default: '' },
    ctaType: { type: String, default: 'none' }, // none, url, call, custom
    ctaText: { type: String, default: '' },
    ctaValue: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    mediaMimeType: { type: String, default: '' },
    contacts: [
      {
        phone: { type: String, required: true },
        name: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
        error: { type: String, default: '' },
        sentAt: { type: Date }
      }
    ]
  },
  { timestamps: true }
);

export const WhatsAppCampaign = makeTenantModel('WhatsAppCampaign', whatsappCampaignSchema);
