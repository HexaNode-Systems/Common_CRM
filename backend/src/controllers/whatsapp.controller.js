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
import { emitToAll } from '../services/socket.service.js';

export async function getStatus(req, res) {
  try {
    const data = getWhatsAppStatus();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function connect(req, res) {
  try {
    void initializeWhatsApp();
    return res.json({ success: true, message: 'WhatsApp initialization started.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function disconnect(req, res) {
  try {
    await disconnectWhatsApp();
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
    const success = await sendWhatsAppMessage(phone, message);
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
    const { limit = 50, page = 1 } = req.query;

    // Fetch and sync chat history on-demand from Puppeteer
    await fetchChatMessagesOnDemand(chatId, limit);

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await WhatsAppMessage.find({ chatId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const chronological = messages.reverse();
    const total = await WhatsAppMessage.countDocuments({ chatId });

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
    const sentMsg = await sendWhatsAppMessage(chatId, message || '', req.file);
    if (!sentMsg) {
      return res.status(400).json({ message: 'Failed to send WhatsApp message. Is WhatsApp connected?' });
    }

    const messageId = sentMsg.id._serialized;
    let dbMsg = await WhatsAppMessage.findOne({ messageId });
    if (!dbMsg) {
      dbMsg = new WhatsAppMessage({
        messageId,
        chatId,
        fromMe: true,
        sender: sentMsg.from.split('@')[0],
        body: sentMsg.body || (req.file ? `[Media: ${req.file.mimetype}]` : ''),
        timestamp: new Date(),
        status: 'sent',
        type: sentMsg.type
      });
      await dbMsg.save();

      // Ensure the chat is also updated
      let dbChat = await WhatsAppChat.findOne({ chatId });
      if (!dbChat) {
        const leadId = await syncChatWithLead(chatId);
        dbChat = new WhatsAppChat({
          chatId,
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
    const chat = await WhatsAppChat.findOneAndUpdate(
      { chatId },
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
