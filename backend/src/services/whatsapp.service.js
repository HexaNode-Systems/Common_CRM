import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { WhatsAppChat } from '../models/WhatsAppChat.js';
import { WhatsAppMessage } from '../models/WhatsAppMessage.js';
import { Lead } from '../models/Lead.js';
import { emitToAll, emitToUser } from './socket.service.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';

const clients = new Map(); // key: userId, value: Client instance
const statuses = new Map(); // key: userId, value: status string
const qrCodes = new Map(); // key: userId, value: QR string
const userTenantContexts = new Map(); // key: userId, value: { tenantId, dbName }
const recentMessageIds = new Set(); // deduplication lock for incoming messages

// One absolute folder for WhatsApp sessions, so the server finds the same sessions no matter
// which directory it was started from. Set WWEBJS_AUTH_DIR on the server to put it on a
// persistent disk (sessions stored on a temporary disk are lost on every restart or deploy).
const AUTH_DIR = path.resolve(process.env.WWEBJS_AUTH_DIR || '.wwebjs_auth');
const sessionDirFor = (uid) => path.join(AUTH_DIR, `session-${uid}`);

// QR codes and connection status go only to the user who owns the session.
// A QR code is enough to take over a WhatsApp account, so it must never be broadcast.
function emitStatus(uid, payload) {
  emitToUser(uid, 'whatsapp:status', { userId: uid, ...payload });
}

// Which tenant database a WhatsApp session belongs to (null = single-tenant / default database).
function sessionTenantDb(uid) {
  const cached = userTenantContexts.get(uid);
  if (cached) return cached.dbName || null;
  try {
    const infoPath = path.join(sessionDirFor(uid), 'tenant_info.json');
    if (fsSync.existsSync(infoPath)) {
      const parsed = JSON.parse(fsSync.readFileSync(infoPath, 'utf-8'));
      if (parsed?.dbName) {
        userTenantContexts.set(uid, parsed);
        return parsed.dbName;
      }
    }
  } catch (_) {}
  return null;
}

// Helper to run database operations inside user's tenant context if applicable
export async function runWithUserTenantContext(userId, callback) {
  const uid = userId ? userId.toString() : '';
  let context = userTenantContexts.get(uid);

  // If not in memory, try reading persisted tenant_info.json from session
  if (!context && uid) {
    try {
      const infoPath = path.join(sessionDirFor(uid), 'tenant_info.json');
      if (fsSync.existsSync(infoPath)) {
        const raw = await fs.readFile(infoPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.dbName) {
          context = parsed;
          userTenantContexts.set(uid, context);
        }
      }
    } catch (_) {}
  }

  // If still not found, check if this user belongs to any active tenant
  if (!context && uid && mongoose.Types.ObjectId.isValid(uid)) {
    try {
      const { Tenant } = await import('../models/master/Tenant.js');
      const tenants = await Tenant.find({ status: 'active' });
      for (const t of tenants) {
        try {
          const conn = getTenantDbConnection(t.dbName);
          const userSchema = mongoose.model('User').schema;
          const TenantUser = conn.models['User'] || conn.model('User', userSchema);
          const found = await TenantUser.findById(uid).select('_id');
          if (found) {
            context = { tenantId: t.tenantId, dbName: t.dbName };
            userTenantContexts.set(uid, context);
            break;
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  if (context && context.dbName) {
    try {
      const connection = getTenantDbConnection(context.dbName);
      return await tenantStorage.run({ connection, tenantId: context.tenantId, dbName: context.dbName }, callback);
    } catch (err) {
      console.error(`Error running in tenant context (${context.dbName}):`, err);
    }
  }

  return await callback();
}

// Clean and format phone number into a standard WhatsApp JID (e.g. 919876543210@c.us)
export function formatWhatsAppJid(to) {
  if (!to) return null;
  let str = to.toString().trim();
  if (str.includes('@')) {
    return str;
  }
  let clean = str.replace(/\D/g, '');
  // Remove leading zeros (e.g. 09876543210 -> 9876543210)
  clean = clean.replace(/^0+/, '');
  if (!clean || clean.length < 7) {
    return null;
  }
  // Default 10-digit Indian numbers to 91 prefix
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean + '@c.us';
}

export function getWhatsAppStatus(userId) {
  const uid = userId ? userId.toString() : '';

  if (uid) {
    if (statuses.has(uid)) {
      return {
        status: statuses.get(uid) || 'DISCONNECTED',
        qrCode: qrCodes.get(uid) || ''
      };
    }

    // Auto-restore from disk if session folder exists
    const sessionPath = sessionDirFor(uid);
    if (fsSync.existsSync(sessionPath) && !clients.has(uid)) {
      void initializeWhatsApp(uid);
      return {
        status: 'INITIALIZING',
        qrCode: ''
      };
    }

    return {
      status: 'DISCONNECTED',
      qrCode: ''
    };
  }

  // Fallback for system checks with no specific user: check if any client in memory is connected
  for (const [key, status] of statuses.entries()) {
    if (status === 'CONNECTED') {
      return {
        status: 'CONNECTED',
        qrCode: ''
      };
    }
  }

  return {
    status: 'DISCONNECTED',
    qrCode: ''
  };
}

// Auto-restore all saved sessions from disk on server startup
export async function restoreAllWhatsAppSessions() {
  try {
    const authDir = AUTH_DIR;
    if (!fsSync.existsSync(authDir)) return;
    const entries = await fs.readdir(authDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('session-')) {
        const uid = entry.name.replace('session-', '');
        if (uid && !clients.has(uid)) {
          console.log(`Auto-restoring WhatsApp session for user: ${uid}`);
          void initializeWhatsApp(uid);
        }
      }
    }
  } catch (err) {
    console.error('Error auto-restoring WhatsApp sessions:', err);
  }
}

// Detect Chrome executable dynamically on system
function getChromeExecutablePath() {
  // 1. Explicit path from the server environment (recommended in production)
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (fromEnv && fsSync.existsSync(fromEnv)) return fromEnv;

  // 2. Common Linux install locations (VPS, Docker, Render, Railway)
  const linuxPaths = ['/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const candidate of linuxPaths) {
    if (fsSync.existsSync(candidate)) return candidate;
  }

  // 3. Windows (local development)
  const defaultPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const x86Path = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  const localAppData = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe') : null;
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fsSync.existsSync(defaultPath)) return defaultPath;
  if (fsSync.existsSync(x86Path)) return x86Path;
  if (localAppData && fsSync.existsSync(localAppData)) return localAppData;
  if (fsSync.existsSync(edgePath)) return edgePath;
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
  return runWithUserTenantContext(userId, async () => {
    try {
      const uid = userId.toString();
      const chatId = chat.id._serialized;
      const phone = chat.id.user;
      const contactName = chat.name || phone;
      const isGroup = !!chat.isGroup;

      let leadId = null;
      try {
        leadId = await syncChatWithLead(chatId);
      } catch (_) {}

      let dbChat = await WhatsAppChat.findOne({ userId: uid, chatId });
      if (!dbChat) {
        dbChat = new WhatsAppChat({
          chatId,
          userId: uid,
          phone,
          contactName,
          isGroup,
          lead: leadId,
          unreadCount: Number(chat.unreadCount) || 0
        });
      } else {
        dbChat.contactName = contactName;
        if (leadId) dbChat.lead = leadId;
      }

      dbChat.unreadCount = Number(chat.unreadCount) || 0;

      if (chat.lastMessage) {
        dbChat.lastMessage = chat.lastMessage.body || (chat.lastMessage.hasMedia ? `[Media: ${chat.lastMessage.type || 'media'}]` : '');
        const rawTs = chat.lastMessage.timestamp ? Number(chat.lastMessage.timestamp) : Date.now();
        const msgDate = rawTs > 1e11 ? new Date(rawTs) : new Date(rawTs * 1000);
        dbChat.lastMessageTime = isNaN(msgDate.getTime()) ? new Date() : msgDate;
      }

      await dbChat.save();

      const populatedChat = await WhatsAppChat.findById(dbChat._id)
        .populate('lead', 'companyName contactName status phone')
        .populate('userId', 'name email');

      emitToAll('whatsapp:chat_updated', populatedChat?.toObject ? populatedChat.toObject() : (dbChat.toObject ? dbChat.toObject() : dbChat));
    } catch (error) {
      console.error('Error syncing chat metadata:', error);
    }
  });
}

// Background worker to sync all chats metadata (fast connection initialization)
async function syncAllChats(userId, clientInstance) {
  try {
    const chats = await clientInstance.getChats();
    for (const chat of chats) {
      await syncChatMetadata(userId, chat, clientInstance);
    }
  } catch (error) {
    console.error('Error in syncAllChats:', error);
  }
}

// Handler for incoming or outgoing messages
async function handleNewMessage(userId, msg, clientInstance) {
  return runWithUserTenantContext(userId, async () => {
    try {
      const uid = userId ? userId.toString() : '';
      if (!uid || !msg || !msg.id) return;

      const messageId = msg.id._serialized;
      if (recentMessageIds.has(messageId)) {
        return;
      }
      recentMessageIds.add(messageId);
      setTimeout(() => recentMessageIds.delete(messageId), 60000);

      const chatId = msg.fromMe ? msg.to : msg.from;
      if (!chatId) return;
      const phone = chatId.split('@')[0];

      let dbMsg = await WhatsAppMessage.findOne({ userId: uid, messageId });
      if (dbMsg) {
        let dbChat = await WhatsAppChat.findOne({ userId: uid, chatId });
        if (dbChat) {
          dbChat.lastMessage = dbMsg.body || (dbMsg.mediaUrl ? '[Media]' : '');
          dbChat.lastMessageTime = dbMsg.timestamp;
          await dbChat.save();
          const populatedChat = await WhatsAppChat.findById(dbChat._id)
            .populate('lead', 'companyName contactName status phone')
            .populate('userId', 'name email');
          emitToAll('whatsapp:chat_updated', populatedChat?.toObject ? populatedChat.toObject() : (dbChat.toObject ? dbChat.toObject() : dbChat));
        }
        return;
      }

      let mediaDetails = null;
      if (msg.hasMedia) {
        try {
          mediaDetails = await saveMediaMessage(msg);
        } catch (mediaErr) {
          console.error('Failed to download media for message:', mediaErr);
        }
      }

      const rawTs = msg.timestamp ? Number(msg.timestamp) : Date.now();
      const msgDate = rawTs > 1e11 ? new Date(rawTs) : new Date(rawTs * 1000);
      const validDate = isNaN(msgDate.getTime()) ? new Date() : msgDate;

      dbMsg = new WhatsAppMessage({
        messageId,
        userId: uid,
        chatId,
        fromMe: !!msg.fromMe,
        sender: msg.from ? msg.from.split('@')[0] : phone,
        body: msg.body || (mediaDetails ? `[Media: ${msg.type || 'media'}]` : (msg.hasMedia ? `[Media: ${msg.type || 'media'}]` : '')),
        timestamp: validDate,
        status: mapAckStatus(msg.ack),
        type: msg.type || (mediaDetails ? 'image' : 'chat'),
        mediaUrl: mediaDetails?.mediaUrl || '',
        mediaMimeType: mediaDetails?.mediaMimeType || ''
      });
      await dbMsg.save();

      let dbChat = await WhatsAppChat.findOne({ userId: uid, chatId });
      if (!dbChat) {
        let contactName = phone;
        let isGroup = chatId.endsWith('@g.us');
        try {
          const chatDetails = await msg.getChat();
          if (chatDetails?.name) contactName = chatDetails.name;
          if (typeof chatDetails?.isGroup === 'boolean') isGroup = chatDetails.isGroup;
        } catch (chatErr) {
          // Safe fallback
        }

        let leadId = null;
        try {
          leadId = await syncChatWithLead(chatId);
        } catch (leadErr) {
          // Safe fallback
        }

        dbChat = new WhatsAppChat({
          chatId,
          userId: uid,
          phone,
          contactName: contactName || phone,
          isGroup: !!isGroup,
          lead: leadId,
          unreadCount: 0
        });
      }

      dbChat.lastMessage = dbMsg.body || (dbMsg.mediaUrl ? '[Media]' : '');
      dbChat.lastMessageTime = dbMsg.timestamp;
      
      if (!msg.fromMe) {
        dbChat.unreadCount = (Number(dbChat.unreadCount) || 0) + 1;
      }

      await dbChat.save();

      const populatedChat = await WhatsAppChat.findById(dbChat._id)
        .populate('lead', 'companyName contactName status phone')
        .populate('userId', 'name email');

      const chatPayload = populatedChat ? (populatedChat.toObject ? populatedChat.toObject() : populatedChat) : (dbChat.toObject ? dbChat.toObject() : dbChat);
      const msgPayload = dbMsg.toObject ? dbMsg.toObject() : dbMsg;

      emitToAll('whatsapp:message_received', msgPayload);
      emitToAll('whatsapp:chat_updated', chatPayload);
    } catch (error) {
      console.error('Error in handleNewMessage:', error);
    }
  });
}

export async function initializeWhatsApp(userId, tenantInfo = null) {
  const uid = userId.toString();
  if (tenantInfo && tenantInfo.dbName) {
    userTenantContexts.set(uid, tenantInfo);
    try {
      const sessionDir = sessionDirFor(uid);
      await fs.mkdir(sessionDir, { recursive: true });
      await fs.writeFile(path.join(sessionDir, 'tenant_info.json'), JSON.stringify(tenantInfo, null, 2));
    } catch (_) {}
  }

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
  emitStatus(uid, { status: 'INITIALIZING', qrCode: '' });

  try {
    const puppeteerExecPath = getChromeExecutablePath();

    const clientInstance = new Client({
      authStrategy: new LocalAuth({
        clientId: uid,
        dataPath: AUTH_DIR
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
    console.log(`[WhatsApp ${uid}] Starting browser (${puppeteerExecPath || 'bundled Chromium'}), sessions in ${AUTH_DIR}`);

    clientInstance.on('change_state', (state) => {
      console.log(`[WhatsApp ${uid}] State changed: ${state}`);
    });

    clientInstance.on('qr', async (qr) => {
      console.log(`[WhatsApp ${uid}] QR code generated`);
      statuses.set(uid, 'QR_RECEIVED');
      try {
        const qrCodeUrl = await qrcode.toDataURL(qr);
        qrCodes.set(uid, qrCodeUrl);
        emitStatus(uid, { status: 'QR_RECEIVED', qrCode: qrCodeUrl });
      } catch (err) {
        console.error('QR code generation error:', err);
      }
    });

    clientInstance.on('loading_screen', (percent, message) => {
      console.log(`[WhatsApp ${uid}] Loading ${percent}% ${message || ''}`);
      statuses.set(uid, 'LOADING');
      emitStatus(uid, { status: 'LOADING', qrCode: '', loadingPercent: percent, loadingMessage: message });
    });

    clientInstance.on('authenticated', () => {
      console.log(`[WhatsApp ${uid}] QR scanned, phone authenticated; loading chats`);
      statuses.set(uid, 'LOADING');
      emitStatus(uid, { status: 'LOADING', qrCode: '' });
    });

    clientInstance.on('ready', async () => {
      console.log(`[WhatsApp ${uid}] Connected and ready`);
      statuses.set(uid, 'CONNECTED');
      qrCodes.set(uid, '');
      emitStatus(uid, { status: 'CONNECTED', qrCode: '' });
      void syncAllChats(userId, clientInstance);
    });

    clientInstance.on('auth_failure', async (msg) => {
      console.error('WhatsApp Auth failure for user:', uid, msg);
      statuses.set(uid, 'DISCONNECTED');
      qrCodes.set(uid, '');
      clients.delete(uid);
      emitStatus(uid, { status: 'DISCONNECTED', qrCode: '' });
      
      // Clean up session cache on auth failure
      try {
        const sessionPath = sessionDirFor(uid);
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
      emitStatus(uid, { status: 'DISCONNECTED', qrCode: '' });

      try {
        const sessionPath = sessionDirFor(uid);
        await fs.rm(sessionPath, { recursive: true, force: true });
      } catch (e) {
        // Quiet
      }
    });

    // Handle incoming messages
    clientInstance.on('message', async (msg) => {
      try {
        await handleNewMessage(userId, msg, clientInstance);
      } catch (err) {
        console.error('Error in message listener:', err);
      }
    });

    // Handle outgoing messages sent directly from the connected phone
    clientInstance.on('message_create', async (msg) => {
      if (msg.fromMe) {
        try {
          await handleNewMessage(userId, msg, clientInstance);
        } catch (err) {
          console.error('Error in message_create listener:', err);
        }
      }
    });

    clientInstance.on('message_ack', async (msg, ack) => {
      await runWithUserTenantContext(userId, async () => {
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
    });

    await clientInstance.initialize();
  } catch (error) {
    console.error('WhatsApp initialization error for user:', uid, error);
    statuses.set(uid, 'DISCONNECTED');
    clients.delete(uid);
    emitStatus(uid, { status: 'DISCONNECTED', qrCode: '' });
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
  userTenantContexts.delete(uid);
  emitStatus(uid, { status: 'DISCONNECTED', qrCode: '' });

  // Clear session folder for fresh connection
  try {
    const sessionPath = sessionDirFor(uid);
    await fs.rm(sessionPath, { recursive: true, force: true });
  } catch (e) {
    // Quiet
  }
}

// Function to send message from backend (supports (userId, to, message, mediaFile) and overloaded (to, message, mediaFile))
export async function sendWhatsAppMessage(...args) {
  let targetUid = null;
  let targetTo = null;
  let targetMsg = '';
  let targetMedia = null;

  if (args.length === 2) {
    // sendWhatsAppMessage(to, message)
    targetTo = args[0];
    targetMsg = args[1] || '';
  } else if (args.length === 3 && typeof args[0] === 'string' && (args[0].includes('@') || /^\+?\d{7,15}$/.test(args[0]))) {
    // sendWhatsAppMessage(to, message, mediaFile)
    targetTo = args[0];
    targetMsg = args[1] || '';
    targetMedia = args[2];
  } else {
    // sendWhatsAppMessage(userId, to, message, mediaFile)
    targetUid = args[0] ? args[0].toString() : null;
    targetTo = args[1];
    targetMsg = args[2] || '';
    targetMedia = args[3] || null;
  }

  // If targetTo is missing or in wrong order:
  if (!targetTo && targetUid && (targetUid.includes('@') || /^\+?\d{7,15}$/.test(targetUid))) {
    targetTo = targetUid;
    targetUid = null;
  }

  if (!targetTo) {
    console.error('sendWhatsAppMessage: recipient "to" phone is missing.');
    return null;
  }

  const chatId = formatWhatsAppJid(targetTo);
  if (!chatId) {
    console.error('sendWhatsAppMessage: invalid recipient phone format:', targetTo);
    return null;
  }

  let clientInstance = targetUid ? clients.get(targetUid) : null;
  let currentStatus = targetUid ? (statuses.get(targetUid) || 'DISCONNECTED') : 'DISCONNECTED';

  // No sender given (system notification from the task/lead/user controllers): use a connected
  // session that belongs to the SAME company as the current request. Never borrow another
  // company's WhatsApp number.
  if (!targetUid || currentStatus !== 'CONNECTED' || !clientInstance) {
    if (!targetUid) {
      const currentDb = tenantStorage.getStore()?.dbName || null;
      for (const [key, client] of clients.entries()) {
        if (statuses.get(key) === 'CONNECTED' && client && sessionTenantDb(key) === currentDb) {
          clientInstance = client;
          currentStatus = 'CONNECTED';
          targetUid = key;
          break;
        }
      }
    }
  }

  if (!clientInstance || currentStatus !== 'CONNECTED') {
    console.error(`sendWhatsAppMessage: WhatsApp client not connected for user ${targetUid || 'system'}`);
    return null;
  }

  try {
    let sentMsg = null;
    if (targetMedia) {
      let base64Data = '';
      let mimetype = targetMedia.mimetype || 'image/png';
      let originalname = targetMedia.originalname || 'media.png';

      if (Buffer.isBuffer(targetMedia)) {
        base64Data = targetMedia.toString('base64');
      } else if (targetMedia.buffer && Buffer.isBuffer(targetMedia.buffer)) {
        base64Data = targetMedia.buffer.toString('base64');
      } else if (typeof targetMedia === 'string') {
        // File path on disk (e.g. /storage/whatsapp/campaign_123.png)
        try {
          const diskPath = targetMedia.startsWith('/') ? targetMedia.slice(1) : targetMedia;
          const fileBuf = await fs.readFile(diskPath);
          base64Data = fileBuf.toString('base64');
          const ext = diskPath.split('.').pop()?.toLowerCase();
          if (ext === 'jpg' || ext === 'jpeg') mimetype = 'image/jpeg';
          else if (ext === 'png') mimetype = 'image/png';
          else if (ext === 'pdf') mimetype = 'application/pdf';
          else if (ext === 'mp4') mimetype = 'video/mp4';
        } catch (readErr) {
          console.error('Failed reading media file from disk:', targetMedia, readErr);
        }
      }

      if (base64Data) {
        const media = new MessageMedia(mimetype, base64Data, originalname);
        sentMsg = await clientInstance.sendMessage(chatId, media, { caption: targetMsg || '' });
      } else {
        sentMsg = await clientInstance.sendMessage(chatId, targetMsg || '');
      }
    } else {
      sentMsg = await clientInstance.sendMessage(chatId, targetMsg || '');
    }

    return sentMsg;
  } catch (sendError) {
    console.error('WhatsApp sendMessage failed for chatId:', chatId, sendError);
    return null;
  }
}

// Fetch and sync chat history on-demand (when chat is opened)
export async function fetchChatMessagesOnDemand(userId, chatId, limit = 50) {
  return runWithUserTenantContext(userId, async () => {
    const uid = userId ? userId.toString() : '';
    let clientInstance = uid ? clients.get(uid) : null;
    let currentStatus = uid ? (statuses.get(uid) || 'DISCONNECTED') : 'DISCONNECTED';

    // Fallback to any connected client in CRM if targetUid client is not connected
    if (currentStatus !== 'CONNECTED' || !clientInstance) {
      for (const [key, client] of clients.entries()) {
        if (statuses.get(key) === 'CONNECTED' && client) {
          clientInstance = client;
          currentStatus = 'CONNECTED';
          break;
        }
      }
    }

    if (currentStatus !== 'CONNECTED' || !clientInstance) return;
    try {
      const chat = await clientInstance.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit: Number(limit) });
      for (const msg of messages) {
        const messageId = msg.id._serialized;
        let dbMsg = await WhatsAppMessage.findOne({ messageId });
        if (!dbMsg) {
          let mediaDetails = null;
          if (msg.hasMedia) {
            mediaDetails = {
              mediaUrl: '',
              mediaMimeType: msg.type || 'image'
            };
          }
          const rawTs = msg.timestamp ? Number(msg.timestamp) : Date.now();
          const msgDate = rawTs > 1e11 ? new Date(rawTs) : new Date(rawTs * 1000);
          dbMsg = new WhatsAppMessage({
            messageId,
            userId: uid || (msg.from ? msg.from.split('@')[0] : 'system'),
            chatId,
            fromMe: !!msg.fromMe,
            sender: msg.from ? msg.from.split('@')[0] : '',
            body: msg.body || (msg.hasMedia ? `[Media: ${msg.type || 'media'}]` : ''),
            timestamp: isNaN(msgDate.getTime()) ? new Date() : msgDate,
            status: mapAckStatus(msg.ack),
            type: msg.type || 'chat',
            mediaUrl: mediaDetails?.mediaUrl || '',
            mediaMimeType: mediaDetails?.mediaMimeType || ''
          });
          await dbMsg.save();
        }
      }
    } catch (error) {
      console.error('fetchChatMessagesOnDemand error:', error);
    }
  });
}


