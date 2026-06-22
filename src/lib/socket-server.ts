import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-list', (listId: string) => {
    socket.join(listId);
    console.log(`Client ${socket.id} joined list: ${listId}`);
  });

  socket.on('leave-list', (listId: string) => {
    socket.leave(listId);
    console.log(`Client ${socket.id} left list: ${listId}`);
  });

  socket.on('task-update', (data: { listId: string; type: string; task: unknown }) => {
    // Broadcast to everyone in the room except the sender
    socket.to(data.listId).emit('task-updated', data);
    console.log(`Task update in list ${data.listId}: ${data.type}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
