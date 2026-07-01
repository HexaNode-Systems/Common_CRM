import { getWhatsAppStatus, initializeWhatsApp, disconnectWhatsApp, sendWhatsAppMessage } from '../services/whatsapp.service.js';

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
    // Start initialization asynchronously in background
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
