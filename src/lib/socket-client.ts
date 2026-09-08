import { io, type Socket } from 'socket.io-client';
import { Task } from '@/types';
import { logger } from '@/lib/logger';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    socket.on('connect', () => {
      logger.info('Connected to Socket.io server');
    });

    socket.on('disconnect', () => {
      logger.info('Disconnected from Socket.io server');
    });
  }
  return socket;
};

export const joinListRoom = (listId: string) => {
  const s = getSocket();
  s.emit('join-list', listId);
};

export const leaveListRoom = (listId: string) => {
  const s = getSocket();
  s.emit('leave-list', listId);
};

export const emitTaskUpdate = (listId: string, type: string, task: Task) => {
  getSocket().emit('task-update', { listId, type, task });
};
