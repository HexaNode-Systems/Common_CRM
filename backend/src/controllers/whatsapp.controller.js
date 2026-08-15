import fs from 'fs/promises';
import path from 'path';
import { 
  getWhatsAppStatus, 
  initializeWhatsApp, 
  disconnectWhatsApp, 
  sendWhatsAppMessage,
  syncChatWithLead,
  fetchChatMessagesOnDemand
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
    void initializeWhatsApp(req.user._id);
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
    const success = await sendWhatsAppMessage(req.user._id, phone, message);
    if (success) {
      return res.json({ success: true, message: 'Test message sent successfully.' });
    } else {
      return res.status(400).json({ success: false, message: 'Failed to send message. Is WhatsApp connected?' });
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

    // If not super_admin, restrict to user's own chats
    if (req.user.role !== 'super_admin') {
      query.userId = req.user._id;
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

    const messages = await WhatsAppMessage.find({ userId: targetUserId, chatId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const chronological = messages.reverse();
    const total = await WhatsAppMessage.countDocuments({ userId: targetUserId, chatId });

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
    // let persistentMediaUrl = '';
    let mediaMimeType = '';
    if (req.file) {
      try {
        const folderPath = path.join('storage', 'whatsapp');
        await fs.mkdir(folderPath, { recursive: true });
        const ext = req.file.originalname.split('.').pop() || 'bin';
        const fileName = `sent_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(folderPath, fileName);
        await fs.writeFile(filePath, req.file.buffer);
        // persistentMediaUrl = `/storage/whatsapp/${fileName}`;
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

      emitToAll('whatsapp:chat_updated', dbChat);
      emitToAll('whatsapp:message_received', dbMsg);
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
    
    let targetUserId = req.user._id;
    if (req.user.role === 'super_admin') {
      const chatObj = await WhatsAppChat.findOne({ chatId });
      if (chatObj) {
        targetUserId = chatObj.userId;
      }
    }

    const chat = await WhatsAppChat.findOneAndUpdate(
      { userId: targetUserId, chatId },
      { unreadCount: 0 },
      { new: true }
    ).populate('lead', 'companyName contactName status phone');

    if (chat) {
      emitToAll('whatsapp:chat_updated', chat);
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

    // Verify WhatsApp is connected for user
    const currentStatusData = getWhatsAppStatus(req.user._id);
    if (currentStatusData.status !== 'CONNECTED') {
      return res.status(400).json({ message: 'WhatsApp session is not connected. Please scan QR code in Integrations first.' });
    }

    let contactsList = [];
    try {
      contactsList = typeof rawContacts === 'string' ? JSON.parse(rawContacts) : rawContacts;
    } catch (e) {
      return res.status(400).json({ message: 'Invalid contacts list format.' });
    }

    if (!Array.isArray(contactsList) || contactsList.length === 0) {
      return res.status(400).json({ message: 'At least one target contact is required.' });
    }

    let targetUserId = req.user._id;

    // Save uploaded media file persistently if present
    let persistentMediaUrl = '';
    let mediaMimeType = '';
    if (req.file) {
      try {
        const folderPath = path.join('storage', 'whatsapp');
        await fs.mkdir(folderPath, { recursive: true });
        const ext = req.file.originalname.split('.').pop() || 'bin';
        const fileName = `campaign_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = path.join(folderPath, fileName);
        await fs.writeFile(filePath, req.file.buffer);
        persistentMediaUrl = `/storage/whatsapp/${fileName}`;
        mediaMimeType = req.file.mimetype;
      } catch (err) {
        console.error('Failed to save campaign media file:', err);
      }
    }

    // Prepare campaign record
    const formattedContacts = contactsList.map(c => ({
      phone: typeof c === 'string' ? c : c.phone,
      name: typeof c === 'object' && c.name ? c.name : '',
      status: 'pending'
    }));

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
        let rawPhone = item.phone.toString().trim();
        let cleanNumber = rawPhone.replace(/\D/g, '');
        if (cleanNumber.length === 10) {
          cleanNumber = '91' + cleanNumber;
        }
        
        if (!cleanNumber || cleanNumber.length < 10) {
          item.status = 'failed';
          item.error = 'Invalid phone number format';
          campaign.failedCount += 1;
          await campaign.save();
          continue;
        }

        const chatId = cleanNumber + '@c.us';

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
            item.error = 'WhatsApp send failed (Service unavailable or disconnected)';
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

