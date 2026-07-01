import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

let client = null;
let qrCodeDataUrl = '';
let status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_RECEIVED, CONNECTED, LOADING

export function getWhatsAppStatus() {
  return { status, qrCode: qrCodeDataUrl };
}

export async function initializeWhatsApp() {
  if (client) {
    console.log('WhatsApp Client already exists. Status:', status);
    return;
  }

  status = 'INITIALIZING';
  qrCodeDataUrl = '';

  console.log('Initializing WhatsApp Client...');

  try {
    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
      }),
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
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
          '--single-process', // helpful in low memory environments
          '--disable-gpu',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
        ]
      }
    });

    client.on('qr', async (qr) => {
      console.log('WhatsApp QR Code received');
      status = 'QR_RECEIVED';
      try {
        qrCodeDataUrl = await qrcode.toDataURL(qr);
      } catch (err) {
        console.error('Error generating QR Data URL', err);
      }
    });

    client.on('ready', () => {
      console.log('WhatsApp Client is ready!');
      status = 'CONNECTED';
      qrCodeDataUrl = '';
    });

    client.on('authenticated', () => {
      console.log('WhatsApp Client authenticated');
      status = 'LOADING';
    });

    client.on('auth_failure', (msg) => {
      console.error('WhatsApp Authentication failure:', msg);
      status = 'DISCONNECTED';
      qrCodeDataUrl = '';
      client = null;
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp Client was logged out:', reason);
      status = 'DISCONNECTED';
      qrCodeDataUrl = '';
      client = null;
    });

    await client.initialize();
  } catch (error) {
    console.error('Failed to initialize WhatsApp client:', error);
    status = 'DISCONNECTED';
    client = null;
  }
}

export async function disconnectWhatsApp() {
  if (client) {
    try {
      await client.logout();
      await client.destroy();
    } catch (err) {
      console.error('Error disconnecting WhatsApp:', err);
    }
    client = null;
    status = 'DISCONNECTED';
    qrCodeDataUrl = '';
  }
}

export async function sendWhatsAppMessage(to, message) {
  if (status !== 'CONNECTED' || !client) {
    console.warn(`WhatsApp not connected. Cannot send message to: ${to}. Message: ${message}`);
    return false;
  }

  try {
    if (!to) {
      console.warn('Cannot send WhatsApp message: phone number is empty.');
      return false;
    }

    // Format the number: remove non-digits
    let cleanNumber = to.toString().replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91 as default if length is 10)
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }

    const chatId = cleanNumber + '@c.us';
    await client.sendMessage(chatId, message);
    console.log(`WhatsApp message sent successfully to ${chatId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${to}:`, error);
    return false;
  }
}
