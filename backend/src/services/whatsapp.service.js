import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { WhatsAppChat } from '../models/WhatsAppChat.js';
import { WhatsAppMessage } from '../models/WhatsAppMessage.js';
import { Lead } from '../models/Lead.js';
import { emitToAll } from './socket.service.js';

let client = null;
let qrCodeDataUrl = '';
let status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_RECEIVED, CONNECTED, LOADING

export function getWhatsAppStatus() {
  return { status, qrCode: qrCodeDataUrl };
}

// Map ack code to readable status string
function mapAckStatus(ack) {
  if (ack === 1) return 'sent';
  if (ack === 2) return 'delivered';
  if (ack === 3) return 'read';
  return 'sent';
}

// Match phone number with CRM Lead and return lead ID
export async function syncChatWithLead(chatId) {
  try {
    const phone = chatId.split('@')[0];
    const last10 = phone.slice(-10);
    if (last10.length < 10) return null;
    
    const lead = await Lead.findOne({
      phoneNormalized: new RegExp(last10 + '$')
    });
    return lead ? lead._id : null;
  } catch (error) {
    return null;
  }
}

// Download and save media to disk, returning URL details
async function saveMediaMessage(msg) {
  if (!msg.hasMedia) return null;
  try {
    const media = await msg.downloadMedia();
    if (!media || !media.data) return null;

    const folderPath = path.join('storage', 'whatsapp');
    await fs.mkdir(folderPath, { recursive: true });

    const ext = media.mimetype.split('/')[1]?.split(';')[0] || 'bin';
    const cleanId = msg.id.id.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${cleanId}.${ext}`;
    const filePath = path.join(folderPath, fileName);

    const buffer = Buffer.from(media.data, 'base64');
    await fs.writeFile(filePath, buffer);

    return {
      mediaUrl: `/storage/whatsapp/${fileName}`,
      mediaMimeType: media.mimetype
    };
  } catch (err) {
    return null;
  }
}

// Sync single chat metadata (instant, no deep history fetch)
async function syncChatMetadata(chat) {
  try {
    const chatId = chat.id._serialized;
    const phone = chat.id.user;
    const contactName = chat.name || phone;
    const isGroup = chat.isGroup;

    const leadId = await syncChatWithLead(chatId);

    let dbChat = await WhatsAppChat.findOne({ chatId });
    if (!dbChat) {
      dbChat = new WhatsAppChat({
        chatId,
        phone,
        contactName,
        isGroup,
        lead: leadId
      });
    } else {
      dbChat.contactName = contactName;
      dbChat.lead = leadId;
    }

    dbChat.unreadCount = chat.unreadCount;

    if (chat.lastMessage) {
      dbChat.lastMessage = chat.lastMessage.body || (chat.lastMessage.hasMedia ? `[Media: ${chat.lastMessage.type}]` : '');
      dbChat.lastMessageTime = new Date(chat.lastMessage.timestamp * 1000);
    }

    await dbChat.save();
    emitToAll('whatsapp:chat_updated', dbChat);
  } catch (error) {
    // Keep logs quiet
  }
}

// Background worker to sync all chats metadata (fast connection initialization)
async function syncAllChats() {
  if (!client) return;
  try {
    const chats = await client.getChats();
    for (const chat of chats) {
      await syncChatMetadata(chat);
    }
  } catch (error) {
    // Keep logs quiet
  }
}

// Handler for incoming or outgoing messages
async function handleNewMessage(msg) {
  try {
    const messageId = msg.id._serialized;
    const chatId = msg.to === client.info.wid._serialized && !msg.fromMe ? msg.from : msg.to;
    const phone = chatId.split('@')[0];

    let dbMsg = await WhatsAppMessage.findOne({ messageId });
    if (dbMsg) return;

    let mediaDetails = null;
    if (msg.hasMedia) {
      mediaDetails = await saveMediaMessage(msg);
    }

    dbMsg = new WhatsAppMessage({
      messageId,
      chatId,
      fromMe: msg.fromMe,
      sender: msg.from.split('@')[0],
      body: msg.body || (mediaDetails ? `[Media: ${msg.type}]` : ''),
      timestamp: new Date(msg.timestamp * 1000),
      status: mapAckStatus(msg.ack),
      type: msg.type,
      mediaUrl: mediaDetails?.mediaUrl || '',
      mediaMimeType: mediaDetails?.mediaMimeType || ''
    });
    await dbMsg.save();

    let dbChat = await WhatsAppChat.findOne({ chatId });
    if (!dbChat) {
      const chatDetails = await msg.getChat();
      const leadId = await syncChatWithLead(chatId);
      dbChat = new WhatsAppChat({
        chatId,
        phone,
        contactName: chatDetails?.name || phone,
        isGroup: chatDetails?.isGroup || false,
        lead: leadId
      });
    }

    dbChat.lastMessage = dbMsg.body;
    dbChat.lastMessageTime = dbMsg.timestamp;
    
    if (!msg.fromMe) {
      dbChat.unreadCount += 1;
    }

    await dbChat.save();

    emitToAll('whatsapp:message_received', dbMsg);
    emitToAll('whatsapp:chat_updated', dbChat);
  } catch (error) {
    // Keep logs quiet
  }
}

export async function initializeWhatsApp() {
  if (client && status === 'CONNECTED') {
    return;
  }

  if (client) {
    try {
      await client.destroy();
    } catch (e) {
      // Quiet
    }
    client = null;
  }

  status = 'INITIALIZING';
  qrCodeDataUrl = '';
  emitToAll('whatsapp:status', { status, qrCode: qrCodeDataUrl });

  try {
    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
      }),
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1039435889-alpha.html'
      },
      puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          '--window-position=-10000,-10000',
          '--window-size=0,0'
        ]
      }
    });

    client.on('qr', async (qr) => {
      status = 'QR_RECEIVED';
      try {
        qrCodeDataUrl = await qrcode.toDataURL(qr);
        emitToAll('whatsapp:status', { status, qrCode: qrCodeDataUrl });
      } catch (err) {
        // Quiet
      }
    });

    client.on('ready', async () => {
      status = 'CONNECTED';
      qrCodeDataUrl = '';
      emitToAll('whatsapp:status', { status, qrCode: qrCodeDataUrl });
      void syncAllChats();
    });

    client.on('authenticated', () => {
      status = 'LOADING';
      emitToAll('whatsapp:status', { status, qrCode: '' });
    });

    client.on('auth_failure', () => {
      status = 'DISCONNECTED';
      qrCodeDataUrl = '';
      client = null;
      emitToAll('whatsapp:status', { status, qrCode: '' });
    });

    client.on('disconnected', () => {
      status = 'DISCONNECTED';
      qrCodeDataUrl = '';
      client = null;
      emitToAll('whatsapp:status', { status, qrCode: '' });
    });

    client.on('message', handleNewMessage);
    client.on('message_create', handleNewMessage);

    client.on('message_ack', async (msg, ack) => {
      try {
        const messageId = msg.id._serialized;
        const mappedAck = mapAckStatus(ack);
        const dbMsg = await WhatsAppMessage.findOneAndUpdate(
          { messageId },
          { status: mappedAck },
          { new: true }
        );
        if (dbMsg) {
          emitToAll('whatsapp:message_ack', { messageId, status: mappedAck, chatId: dbMsg.chatId });
        }
      } catch (error) {
        // Quiet
      }
    });

    await client.initialize();
  } catch (error) {
    status = 'DISCONNECTED';
    client = null;
    emitToAll('whatsapp:status', { status, qrCode: '' });
  }
}

export async function disconnectWhatsApp() {
  if (client) {
    try {
      await client.logout();
      await client.destroy();
    } catch (err) {
      // Quiet
    }
    client = null;
    status = 'DISCONNECTED';
    qrCodeDataUrl = '';
    emitToAll('whatsapp:status', { status, qrCode: '' });
  }
}

// Function to send message from backend
export async function sendWhatsAppMessage(to, message, mediaFile = null) {
  if (status !== 'CONNECTED' || !client) {
    return null;
  }

  try {
    let chatId = to.toString();
    // Validate JID format
    if (!chatId.includes('@')) {
      let cleanNumber = chatId.replace(/\D/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
      }
      chatId = cleanNumber + '@c.us';
    }

    let sentMsg = null;
    if (mediaFile) {
      const base64Data = mediaFile.buffer.toString('base64');
      const media = new MessageMedia(mediaFile.mimetype, base64Data, mediaFile.originalname);
      sentMsg = await client.sendMessage(chatId, media, { caption: message });
    } else {
      sentMsg = await client.sendMessage(chatId, message);
    }

    return sentMsg;
  } catch (error) {
    return null;
  }
}

// Fetch and sync chat history on-demand (when chat is opened)
export async function fetchChatMessagesOnDemand(chatId, limit = 50) {
  if (status !== 'CONNECTED' || !client) return;
  try {
    const chat = await client.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit: Number(limit) });
    for (const msg of messages) {
      const messageId = msg.id._serialized;
      let dbMsg = await WhatsAppMessage.findOne({ messageId });
      if (!dbMsg) {
        let mediaDetails = null;
        if (msg.hasMedia) {
          mediaDetails = {
            mediaUrl: 'historical_placeholder',
            mediaMimeType: msg.type || 'image'
          };
        }
        dbMsg = new WhatsAppMessage({
          messageId,
          chatId,
          fromMe: msg.fromMe,
          sender: msg.from.split('@')[0],
          body: msg.body || (msg.hasMedia ? `[Media: ${msg.type}]` : ''),
          timestamp: new Date(msg.timestamp * 1000),
          status: mapAckStatus(msg.ack),
          type: msg.type,
          mediaUrl: mediaDetails?.mediaUrl || '',
          mediaMimeType: mediaDetails?.mediaMimeType || ''
        });
        await dbMsg.save();
      }
    }
  } catch (error) {
    // Quiet
  }
}

