import { Server } from 'socket.io';
import { createServer } from 'http';
import { logger } from './logger';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('join-list', (listId: string) => {
    socket.join(listId);
    logger.debug('Client joined list', { socketId: socket.id, listId });
  });

  socket.on('leave-list', (listId: string) => {
    socket.leave(listId);
    logger.debug('Client left list', { socketId: socket.id, listId });
  });

  socket.on('task-update', (data: { listId: string; type: string; task: unknown }) => {
    // Broadcast to everyone in the room except the sender
    socket.to(data.listId).emit('task-updated', data);
    logger.debug('Task update broadcast', { listId: data.listId, type: data.type });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info('Socket.io server running', { port: PORT });
});
