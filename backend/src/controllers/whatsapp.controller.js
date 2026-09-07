import fs from 'fs/promises';
import path from 'path';
import { 
  getWhatsAppStatus, 
  initializeWhatsApp, 
  disconnectWhatsApp, 
  sendWhatsAppMessage,
  syncChatWithLead,
  fetchChatMessagesOnDemand,
  formatWhatsAppJid
} from '../services/whatsapp.service.js';
import { WhatsAppChat } from '../models/WhatsAppChat.js';
import { WhatsAppMessage } from '../models/WhatsAppMessage.js';
import { WhatsAppCampaign } from '../models/WhatsAppCampaign.js';
import { emitToAll } from '../services/socket.service.js';

export async function getStatus(req, res) {
  try {
    const data = getWhatsAppStatus(req.user._id);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function connect(req, res) {
  try {
    void initializeWhatsApp(req.user._id, {
      tenantId: req.tenantId,
      dbName: req.tenantDbName
    });
    return res.json({ success: true, message: 'WhatsApp initialization started.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function disconnect(req, res) {
  try {
    await disconnectWhatsApp(req.user._id);
    return res.json({ success: true, message: 'WhatsApp disconnected successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function sendTestMessage(req, res) {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ message: 'Phone number and message are required.' });
  }

  try {
    const statusData = getWhatsAppStatus(req.user._id);
    if (statusData.status !== 'CONNECTED') {
      return res.status(400).json({ success: false, message: 'WhatsApp is not connected. Please scan the QR code first.' });
    }

    const sentMsg = await sendWhatsAppMessage(req.user._id, phone, message);
    if (sentMsg) {
      return res.json({ success: true, message: 'Test message sent successfully.' });
    } else {
      return res.status(400).json({ success: false, message: 'Failed to send message. Please ensure the phone number is on WhatsApp and includes country code.' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// List all synced conversations with filters, search, and pagination
export async function listChats(req, res) {
  try {
    const { filter = 'all', search = '', limit = 50, page = 1 } = req.query;
    const query = {};

    // Privacy isolation: Non-super_admin users can ONLY see their own WhatsApp chats
    if (req.user.role !== 'super_admin') {
      query.userId = req.user._id;
    } else if (req.query.userId) {
      query.userId = req.query.userId;
    }

    if (filter === 'unread') {
      query.unreadCount = { $gt: 0 };
    } else if (filter === 'leads') {
      query.lead = { $ne: null };
    } else if (filter === 'unassigned') {
      query.lead = null;
      query.isGroup = false;
    }

    if (search) {
      query.$or = [
        { contactName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const chats = await WhatsAppChat.find(query)
      .populate('lead', 'companyName contactName status phone')
      .populate('userId', 'name email')
      .sort({ lastMessageTime: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await WhatsAppChat.countDocuments(query);

    return res.json({
      items: chats,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Get messages for a specific chat sorted chronologically (paginated)
export async function getMessages(req, res) {
  try {
    const { chatId } = req.params;
    const { limit = 50, page = 1, ownerId } = req.query;

    const targetUserId = (req.user.role === 'super_admin' && ownerId) ? ownerId : req.user._id;

    // Fetch and sync chat history on-demand from Puppeteer
    await fetchChatMessagesOnDemand(targetUserId, chatId, limit);

    const skip = (Number(page) - 1) * Number(limit);
    const query = { chatId };

    // Privacy isolation: Non-super_admin users can ONLY see messages for their own WhatsApp session
    if (req.user.role !== 'super_admin') {
      query.userId = req.user._id;
    } else if (ownerId) {
      query.userId = ownerId;
    }

    const messages = await WhatsAppMessage.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const chronological = messages.reverse();
    const total = await WhatsAppMessage.countDocuments(query);

    return res.json({
      items: chronological,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Send message (text + file upload) to a specific WhatsApp recipient
export async function sendMessage(req, res) {
  const { chatId, message } = req.body;
  if (!chatId) {
    return res.status(400).json({ message: 'Chat ID is required.' });
  }

  try {
    const phone = chatId.split('@')[0];
    
    // Find who owns the chat session. If admin, use the chat's actual owner. Otherwise use logged-in user.
    let targetUserId = req.user._id;
    if (req.user.role === 'super_admin') {
      const chat = await WhatsAppChat.findOne({ chatId });
      if (chat) {
        targetUserId = chat.userId;
      }
    }

    // Save uploaded media file persistently if present
    let persistentMediaUrl = '';
    let mediaMimeType = '';
    if (req.file) {
      try {
        const folderPath = path.join('storage', 'whatsapp');
        await fs.mkdir(folderPath, { recursive: true });
        const ext = req.file.originalname.split('.').pop() || 'bin';
        const fileName = `sent_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(folderPath, fileName);
        await fs.writeFile(filePath, req.file.buffer);
        persistentMediaUrl = `/storage/whatsapp/${fileName}`;
        mediaMimeType = req.file.mimetype;
      } catch (err) {
        console.error('Failed to save sent media file:', err);
      }
    }

    const sentMsg = await sendWhatsAppMessage(targetUserId, chatId, message || '', req.file);
    if (!sentMsg) {
      return res.status(400).json({ message: 'Failed to send WhatsApp message. Is WhatsApp connected?' });
    }

    const messageId = sentMsg.id._serialized;
    let dbMsg = await WhatsAppMessage.findOne({ userId: targetUserId, messageId });
    if (!dbMsg) {
      dbMsg = new WhatsAppMessage({
        messageId,
        userId: targetUserId,
        chatId,
        fromMe: true,
        sender: sentMsg.from ? sentMsg.from.split('@')[0] : targetUserId.toString(),
        body: sentMsg.body || (req.file ? `[Media: ${req.file.mimetype}]` : ''),
        timestamp: new Date(),
        status: 'sent',
        type: sentMsg.type || (req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype.startsWith('video/') ? 'video' : 'document') : 'chat'),
        mediaUrl: persistentMediaUrl,
        mediaMimeType
      });
      await dbMsg.save();

      // Ensure the chat is also updated
      let dbChat = await WhatsAppChat.findOne({ userId: targetUserId, chatId });
      if (!dbChat) {
        const leadId = await syncChatWithLead(chatId);
        dbChat = new WhatsAppChat({
          chatId,
          userId: targetUserId,
          phone,
          contactName: phone,
          isGroup: false,
          lead: leadId
        });
      }
      dbChat.lastMessage = dbMsg.body;
      dbChat.lastMessageTime = dbMsg.timestamp;
      await dbChat.save();

      const populatedChat = await WhatsAppChat.findById(dbChat._id)
        .populate('lead', 'companyName contactName status phone')
        .populate('userId', 'name email');

      emitToAll('whatsapp:chat_updated', populatedChat?.toObject ? populatedChat.toObject() : (dbChat.toObject ? dbChat.toObject() : dbChat));
      emitToAll('whatsapp:message_received', dbMsg?.toObject ? dbMsg.toObject() : dbMsg);
    }

    return res.json(dbMsg);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Reset unread count for a chat
export async function markChatAsRead(req, res) {
  try {
    const { chatId } = req.params;
    
    const chat = await WhatsAppChat.findOneAndUpdate(
      { chatId },
      { unreadCount: 0 },
      { new: true }
    ).populate('lead', 'companyName contactName status phone')
     .populate('userId', 'name email');

    if (chat) {
      emitToAll('whatsapp:chat_updated', chat?.toObject ? chat.toObject() : chat);
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Launch Bulk Campaign Shoot
export async function sendBulkCampaign(req, res) {
  try {
    const { name, contacts: rawContacts, body, ctaType = 'none', ctaText = '', ctaValue = '', delay = 1.5 } = req.body;
    
    if (!name || !body || !rawContacts) {
      return res.status(400).json({ message: 'Campaign name, message content, and contact numbers are required.' });
    }

    // Verify WhatsApp is genuinely connected for user
    const currentStatusData = getWhatsAppStatus(req.user._id);
    if (currentStatusData.status !== 'CONNECTED') {
      return res.status(400).json({ message: 'WhatsApp session is not connected. Please scan QR code in Integrations first.' });
    }

    let contactsList = [];
    if (typeof rawContacts === 'string') {
      let trimmed = rawContacts.trim();
      try {
        contactsList = JSON.parse(trimmed);
      } catch (e1) {
        try {
          const unescaped = trimmed.replace(/\\"/g, '"').replace(/^"|"$/g, '');
          contactsList = JSON.parse(unescaped);
        } catch (e2) {
          const matches = trimmed.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,13}/g);
          if (matches && matches.length > 0) {
            contactsList = matches.map(m => ({ phone: m.replace(/\D/g, ''), name: '' }));
          } else {
            contactsList = trimmed
              .split(/[\r\n,;]+/)
              .map(p => p.trim())
              .filter(Boolean)
              .map(p => ({ phone: p, name: '' }));
          }
        }
      }
    } else if (Array.isArray(rawContacts)) {
      contactsList = rawContacts;
    } else if (typeof rawContacts === 'object' && rawContacts !== null) {
      contactsList = [rawContacts];
    }

    // Clean and validate all contacts
    const formattedContacts = [];
    for (const c of contactsList) {
      let phone = '';
      let name = '';
      if (typeof c === 'object' && c !== null) {
        phone = c.phone || c.number || c.mobile || '';
        name = c.name || '';
      } else if (typeof c === 'string') {
        let str = c.trim();
        if (str.startsWith('{') && str.endsWith('}')) {
          try {
            const parsed = JSON.parse(str);
            phone = parsed.phone || parsed.number || '';
            name = parsed.name || '';
          } catch (_) {
            phone = str;
          }
        } else {
          phone = str;
        }
      }

      phone = phone ? phone.toString().trim() : '';
      let clean = phone.replace(/\D/g, '').replace(/^0+/, '');
      if (clean.length >= 7) {
        formattedContacts.push({
          phone: clean,
          name: name ? name.toString().trim() : '',
          status: 'pending'
        });
      }
    }

    if (formattedContacts.length === 0) {
      return res.status(400).json({ message: 'At least one valid phone number is required.' });
    }

    let targetUserId = req.user._id;

    // Save uploaded media file persistently if present
    let persistentMediaUrl = '';
    let mediaMimeType = '';
    if (req.file) {
      try {
        const folderPath = path.join('storage', 'whatsapp');
        await fs.mkdir(folderPath, { recursive: true });
        const ext = req.file.originalname?.split('.').pop() || 'bin';
        const fileName = `campaign_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(folderPath, fileName);
        await fs.writeFile(filePath, req.file.buffer);
        persistentMediaUrl = `/storage/whatsapp/${fileName}`;
        mediaMimeType = req.file.mimetype;
      } catch (err) {
        console.error('Failed to save campaign media file:', err);
      }
    }

    const campaign = new WhatsAppCampaign({
      name,
      userId: targetUserId,
      totalContacts: formattedContacts.length,
      sentCount: 0,
      failedCount: 0,
      status: 'sending',
      body,
      ctaType,
      ctaText,
      ctaValue,
      mediaUrl: persistentMediaUrl,
      mediaMimeType,
      contacts: formattedContacts
    });

    await campaign.save();

    // Send HTTP response back to client immediately
    res.json({
      success: true,
      message: 'Campaign shooting launched successfully.',
      campaignId: campaign._id,
      totalContacts: campaign.totalContacts
    });

    // Process bulk send asynchronously in background thread
    (async () => {
      const delayMs = Math.max(Number(delay) * 1000, 500);

      for (let i = 0; i < campaign.contacts.length; i++) {
        const item = campaign.contacts[i];
        const chatId = formatWhatsAppJid(item.phone);
        
        if (!chatId) {
          item.status = 'failed';
          item.error = 'Invalid phone number format';
          campaign.failedCount += 1;
          campaign.markModified('contacts');
          await campaign.save();
          continue;
        }

        // Check if WhatsApp session is still active
        const currentSession = getWhatsAppStatus(targetUserId);
        if (currentSession.status !== 'CONNECTED') {
          item.status = 'failed';
          item.error = 'WhatsApp disconnected during campaign shoot';
          campaign.failedCount += 1;
          campaign.markModified('contacts');
          await campaign.save();

          emitToAll('whatsapp:campaign_progress', {
            userId: targetUserId,
            campaignId: campaign._id,
            sentCount: campaign.sentCount,
            failedCount: campaign.failedCount,
            totalContacts: campaign.totalContacts,
            status: 'failed',
            latestContact: item
          });
          break;
        }

        // Build complete message text (with template tag replacement & CTA button formatting)
        let fullMessage = body;
        if (item.name) {
          fullMessage = fullMessage.replace(/\{name\}/gi, item.name);
        }
        if (ctaType !== 'none' && ctaText) {
          if (ctaType === 'url') {
            fullMessage += `\n\n*${ctaText}*\nLink: ${ctaValue}`;
          } else if (ctaType === 'call') {
            fullMessage += `\n\n*${ctaText}*: ${ctaValue}`;
          } else {
            fullMessage += `\n\n*${ctaText}*${ctaValue ? `\nLink: ${ctaValue}` : ''}`;
          }
        }

        try {
          const mediaPayload = req.file || persistentMediaUrl || null;
          const sentMsg = await sendWhatsAppMessage(targetUserId, chatId, fullMessage, mediaPayload);
          if (sentMsg) {
            item.status = 'sent';
            item.sentAt = new Date();
            item.error = '';
            campaign.sentCount += 1;

            // Save WhatsAppMessage and update chat in background without crashing status
            try {
              const cleanNumber = chatId.split('@')[0];
              const messageId = sentMsg.id?._serialized || `campaign_msg_${Date.now()}_${i}`;
              const dbMsg = new WhatsAppMessage({
                messageId,
                userId: targetUserId,
                chatId,
                fromMe: true,
                sender: targetUserId.toString(),
                body: fullMessage || (persistentMediaUrl ? `[Media: ${mediaMimeType}]` : ''),
                timestamp: new Date(),
                status: 'sent',
                type: mediaMimeType ? (mediaMimeType.startsWith('image/') ? 'image' : mediaMimeType.startsWith('video/') ? 'video' : 'document') : 'chat',
                mediaUrl: persistentMediaUrl,
                mediaMimeType
              });
              await dbMsg.save();

              let dbChat = await WhatsAppChat.findOne({ userId: targetUserId, chatId });
              if (!dbChat) {
                const leadId = await syncChatWithLead(chatId);
                dbChat = new WhatsAppChat({
                  chatId,
                  userId: targetUserId,
                  phone: cleanNumber,
                  contactName: item.name || cleanNumber,
                  isGroup: false,
                  lead: leadId
                });
              }
              dbChat.lastMessage = dbMsg.body;
              dbChat.lastMessageTime = dbMsg.timestamp;
              await dbChat.save();

              emitToAll('whatsapp:message_received', dbMsg);
              emitToAll('whatsapp:chat_updated', dbChat);
            } catch (chatDbErr) {
              console.error('Error logging campaign message to chat DB:', chatDbErr);
            }
          } else {
            item.status = 'failed';
            item.error = 'WhatsApp send failed (Number not on WhatsApp or disconnected)';
            campaign.failedCount += 1;
          }
        } catch (err) {
          console.error('Campaign contact send error:', err);
          item.status = 'failed';
          item.error = err.message || 'Send error';
          campaign.failedCount += 1;
        }

        campaign.markModified('contacts');
        await campaign.save();

        // Broadcast progress over sockets
        emitToAll('whatsapp:campaign_progress', {
          userId: targetUserId,
          campaignId: campaign._id,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
          totalContacts: campaign.totalContacts,
          status: i === campaign.contacts.length - 1 ? (campaign.sentCount > 0 ? 'completed' : 'failed') : 'sending',
          latestContact: item
        });

        // Throttle delay between messages
        if (i < campaign.contacts.length - 1) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }

      campaign.status = campaign.sentCount > 0 ? 'completed' : 'failed';
      campaign.markModified('contacts');
      await campaign.save();

      // Final progress broadcast
      emitToAll('whatsapp:campaign_progress', {
        userId: targetUserId,
        campaignId: campaign._id,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        totalContacts: campaign.totalContacts,
        status: campaign.status
      });
    })();

  } catch (error) {
    console.error('sendBulkCampaign error:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Fetch Campaign History Logs
export async function listCampaigns(req, res) {
  try {
    const query = {};
    if (req.user.role !== 'super_admin') {
      query.userId = req.user._id;
    }
    const campaigns = await WhatsAppCampaign.find(query)
      .sort({ createdAt: -1 })
      .limit(30);
    return res.json(campaigns);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

