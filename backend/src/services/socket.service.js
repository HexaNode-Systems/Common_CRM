import { Server } from 'socket.io';

let io = null;

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL?.split(',') || '*',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

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
