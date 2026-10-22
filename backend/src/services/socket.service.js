import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { corsOptions } from '../config/cors.js';

let io = null;

const userRoom = (userId) => `user:${userId}`;

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: corsOptions
  });

  // Identify the signed-in user from the JWT the frontend sends in the handshake, so events
  // meant for one user (WhatsApp QR codes and connection status) only go to that user.
  // Connections without a valid token are still accepted; they just get no private events.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) socket.data.userId = decoded.id.toString();
      } catch (_) {
        // Expired or invalid token: treat as anonymous
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.data.userId) socket.join(userRoom(socket.data.userId));
    console.log(`Socket client connected: ${socket.id}${socket.data.userId ? ` (user ${socket.data.userId})` : ''}`);

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIo() {
  return io;
}

export function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

// Send an event only to the sockets of one signed-in user.
export function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(userRoom(userId.toString())).emit(event, data);
  }
}
