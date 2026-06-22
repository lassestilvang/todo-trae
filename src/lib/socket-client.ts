import { io, type Socket } from 'socket.io-client';
import { Task } from '@/types';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
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
