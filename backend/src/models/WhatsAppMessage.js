import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const whatsappMessageSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chatId: { type: String, required: true, index: true },
    fromMe: { type: Boolean, required: true },
    sender: { type: String, required: true },
    body: { type: String, default: '' },
    timestamp: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read'],
      default: 'sent'
    },
    type: { type: String, default: 'chat' }, // chat, image, document, audio, video, sticker, etc.
    mediaUrl: { type: String, default: '' },
    mediaMimeType: { type: String, default: '' }
  },
  { timestamps: true }
);

// Ensure messageId is unique per user
whatsappMessageSchema.index({ userId: 1, messageId: 1 }, { unique: true });

export const WhatsAppMessage = makeTenantModel('WhatsAppMessage', whatsappMessageSchema);
