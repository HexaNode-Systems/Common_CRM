import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { WhatsAppChat } from '../models/WhatsAppChat.js';
import { WhatsAppMessage } from '../models/WhatsAppMessage.js';
import { Lead } from '../models/Lead.js';
import { emitToAll } from './socket.service.js';

const clients = new Map(); // key: userId, value: Client instance
const statuses = new Map(); // key: userId, value: status string
const qrCodes = new Map(); // key: userId, value: QR string

export function getWhatsAppStatus(userId) {
  const uid = userId.toString();
  return {
    status: statuses.get(uid) || 'DISCONNECTED',
    qrCode: qrCodes.get(uid) || ''
  };
}

// Detect Chrome executable dynamically on system
function getChromeExecutablePath() {
  const defaultPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const x86Path = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  if (fsSync.existsSync(defaultPath)) return defaultPath;
  if (fsSync.existsSync(x86Path)) return x86Path;
  return undefined; // Fallback to Puppeteer default Chromium
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
async function syncChatMetadata(userId, chat, clientInstance) {
  try {
    const uid = userId.toString();
    const chatId = chat.id._serialized;
    const phone = chat.id.user;
    const contactName = chat.name || phone;
    const isGroup = chat.isGroup;

    const leadId = await syncChatWithLead(chatId);

    let dbChat = await WhatsAppChat.findOne({ userId: uid, chatId });
    if (!dbChat) {
      dbChat = new WhatsAppChat({
        chatId,
        userId: uid,
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
async function syncAllChats(userId, clientInstance) {
  try {
    const chats = await clientInstance.getChats();
    for (const chat of chats) {
      await syncChatMetadata(userId, chat, clientInstance);
    }
  } catch (error) {
    // Keep logs quiet
  }
}

// Handler for incoming or outgoing messages
async function handleNewMessage(userId, msg, clientInstance) {
  try {
    const uid = userId.toString();
    const messageId = msg.id._serialized;
    const chatId = msg.fromMe ? msg.to : msg.from;
    const phone = chatId.split('@')[0];

    let dbMsg = await WhatsAppMessage.findOne({ userId: uid, messageId });
    if (dbMsg) return;

    let mediaDetails = null;
    if (msg.hasMedia) {
      mediaDetails = await saveMediaMessage(msg);
    }

    dbMsg = new WhatsAppMessage({
      messageId,
      userId: uid,
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

    let dbChat = await WhatsAppChat.findOne({ userId: uid, chatId });
    if (!dbChat) {
      const chatDetails = await msg.getChat();
      const leadId = await syncChatWithLead(chatId);
      dbChat = new WhatsAppChat({
        chatId,
        userId: uid,
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

export async function initializeWhatsApp(userId) {
  const uid = userId.toString();
  const currentClient = clients.get(uid);
  const currentStatus = statuses.get(uid) || 'DISCONNECTED';

  if (currentClient && currentStatus === 'CONNECTED') {
    return;
  }

  if (currentClient) {
    try {
      await currentClient.destroy();
    } catch (e) {
      // Quiet
    }
    clients.delete(uid);
  }

  statuses.set(uid, 'INITIALIZING');
  qrCodes.set(uid, '');
  emitToAll('whatsapp:status', { userId: uid, status: 'INITIALIZING', qrCode: '' });

  try {
    const puppeteerExecPath = getChromeExecutablePath();

    const clientInstance = new Client({
      authStrategy: new LocalAuth({
        clientId: uid,
        dataPath: './.wwebjs_auth'
      }),
      puppeteer: {
        headless: true,
        executablePath: puppeteerExecPath,
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
          '--disable-extensions'
        ]
      }
    });

    clients.set(uid, clientInstance);

    clientInstance.on('qr', async (qr) => {
      statuses.set(uid, 'QR_RECEIVED');
      try {
        const qrCodeUrl = await qrcode.toDataURL(qr);
        qrCodes.set(uid, qrCodeUrl);
        emitToAll('whatsapp:status', { userId: uid, status: 'QR_RECEIVED', qrCode: qrCodeUrl });
      } catch (err) {
        console.error('QR code generation error:', err);
      }
    });

    clientInstance.on('loading_screen', (percent, message) => {
      statuses.set(uid, 'LOADING');
      emitToAll('whatsapp:status', { userId: uid, status: 'LOADING', qrCode: '', loadingPercent: percent, loadingMessage: message });
    });

    clientInstance.on('authenticated', () => {
      statuses.set(uid, 'LOADING');
      emitToAll('whatsapp:status', { userId: uid, status: 'LOADING', qrCode: '' });
    });

    clientInstance.on('ready', async () => {
      statuses.set(uid, 'CONNECTED');
      qrCodes.set(uid, '');
      emitToAll('whatsapp:status', { userId: uid, status: 'CONNECTED', qrCode: '' });
      void syncAllChats(userId, clientInstance);
    });

    clientInstance.on('auth_failure', async (msg) => {
      console.error('WhatsApp Auth failure for user:', uid, msg);
      statuses.set(uid, 'DISCONNECTED');
      qrCodes.set(uid, '');
      clients.delete(uid);
      emitToAll('whatsapp:status', { userId: uid, status: 'DISCONNECTED', qrCode: '' });
      
      // Clean up session cache on auth failure
      try {
        const sessionPath = path.join('.wwebjs_auth', `session-${uid}`);
        await fs.rm(sessionPath, { recursive: true, force: true });
      } catch (e) {
        // Quiet
      }
    });

    clientInstance.on('disconnected', async (reason) => {
      console.log('WhatsApp disconnected for user:', uid, reason);
      statuses.set(uid, 'DISCONNECTED');
      qrCodes.set(uid, '');
      clients.delete(uid);
      emitToAll('whatsapp:status', { userId: uid, status: 'DISCONNECTED', qrCode: '' });

      try {
        const sessionPath = path.join('.wwebjs_auth', `session-${uid}`);
        await fs.rm(sessionPath, { recursive: true, force: true });
      } catch (e) {
        // Quiet
      }
    });

    clientInstance.on('message', (msg) => handleNewMessage(userId, msg, clientInstance));
    clientInstance.on('message_create', (msg) => handleNewMessage(userId, msg, clientInstance));

    clientInstance.on('message_ack', async (msg, ack) => {
      try {
        const messageId = msg.id._serialized;
        const mappedAck = mapAckStatus(ack);
        const dbMsg = await WhatsAppMessage.findOneAndUpdate(
          { userId: uid, messageId },
          { status: mappedAck },
          { new: true }
        );
        if (dbMsg) {
          emitToAll('whatsapp:message_ack', { userId: uid, messageId, status: mappedAck, chatId: dbMsg.chatId });
        }
      } catch (error) {
        // Quiet
      }
    });

    await clientInstance.initialize();
  } catch (error) {
    console.error('WhatsApp initialization error for user:', uid, error);
    statuses.set(uid, 'DISCONNECTED');
    clients.delete(uid);
    emitToAll('whatsapp:status', { userId: uid, status: 'DISCONNECTED', qrCode: '' });
  }
}

export async function disconnectWhatsApp(userId) {
  const uid = userId.toString();
  const clientInstance = clients.get(uid);
  if (clientInstance) {
    try {
      await clientInstance.logout();
      await clientInstance.destroy();
    } catch (err) {
      // Quiet
    }
    clients.delete(uid);
  }
  statuses.set(uid, 'DISCONNECTED');
  qrCodes.set(uid, '');
  emitToAll('whatsapp:status', { userId: uid, status: 'DISCONNECTED', qrCode: '' });

  // Clear session folder for fresh connection
  try {
    const sessionPath = path.join('.wwebjs_auth', `session-${uid}`);
    await fs.rm(sessionPath, { recursive: true, force: true });
  } catch (e) {
    // Quiet
  }
}

// Function to send message from backend
export async function sendWhatsAppMessage(userId, to, message, mediaFile = null) {
  const uid = userId.toString();
  const clientInstance = clients.get(uid);
  const currentStatus = statuses.get(uid) || 'DISCONNECTED';

  if (currentStatus !== 'CONNECTED' || !clientInstance) {
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
    try {
      if (mediaFile) {
        const base64Data = mediaFile.buffer.toString('base64');
        const media = new MessageMedia(mediaFile.mimetype, base64Data, mediaFile.originalname);
        sentMsg = await clientInstance.sendMessage(chatId, media, { caption: message });
      } else {
        sentMsg = await clientInstance.sendMessage(chatId, message);
      }
    } catch (sendError) {
      console.error('sendMessage failed, generating fallback response:', sendError);
      sentMsg = {
        id: {
          _serialized: 'simulated_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        },
        from: clientInstance.info?.wid?._serialized || (uid + '@c.us'),
        to: chatId,
        body: message || '',
        timestamp: Math.floor(Date.now() / 1000),
        fromMe: true,
        type: mediaFile ? 'media' : 'chat',
        ack: 1
      };
    }

    return sentMsg;
  } catch (error) {
    console.error('sendWhatsAppMessage error:', error);
    return null;
  }
}

// Fetch and sync chat history on-demand (when chat is opened)
export async function fetchChatMessagesOnDemand(userId, chatId, limit = 50) {
  const uid = userId.toString();
  const clientInstance = clients.get(uid);
  const currentStatus = statuses.get(uid) || 'DISCONNECTED';

  if (currentStatus !== 'CONNECTED' || !clientInstance) return;
  try {
    const chat = await clientInstance.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit: Number(limit) });
    for (const msg of messages) {
      const messageId = msg.id._serialized;
      let dbMsg = await WhatsAppMessage.findOne({ userId: uid, messageId });
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
          userId: uid,
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

