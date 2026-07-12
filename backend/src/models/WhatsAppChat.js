import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const whatsappChatSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true, unique: true, index: true },
    unreadCount: { type: Number, default: 0 },
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: Date, default: Date.now },
    contactName: { type: String, default: '' },
    phone: { type: String, required: true, index: true },
    isGroup: { type: Boolean, default: false },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null }
  },
  { timestamps: true }
);

export const WhatsAppChat = makeTenantModel('WhatsAppChat', whatsappChatSchema);
