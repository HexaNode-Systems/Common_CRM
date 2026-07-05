import mongoose from 'mongoose';

const whatsappMessageSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true, index: true },
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

export const WhatsAppMessage = mongoose.model('WhatsAppMessage', whatsappMessageSchema);
