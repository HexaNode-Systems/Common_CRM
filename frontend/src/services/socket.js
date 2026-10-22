import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export const socket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  // Sends the login token with every (re)connect so the server can deliver private events
  // (WhatsApp QR code and connection status) only to this user.
  auth: (cb) => {
    let token = null;
    try {
      token = localStorage.getItem('crm_token');
    } catch {
      /* storage blocked */
    }
    cb({ token });
  },
});
