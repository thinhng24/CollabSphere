const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-whiteboard', (data) => {
    const { roomId, userId, color, userName } = data;
    
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Map(),
        canvasData: null
      });
    }
    
    const room = rooms.get(roomId);
    room.users.set(userId, {
      id: userId,
      name: userName || `User-${userId.substring(0, 4)}`,
      color: color || '#000000',
      socketId: socket.id
    });
    
    // Gửi danh sách users mới cho tất cả trong room
    io.to(roomId).emit('users-update', Array.from(room.users.values()));
    
    // Gửi trạng thái canvas hiện tại cho user mới
    if (room.canvasData) {
      socket.emit('initial-state', { canvasData: room.canvasData });
    }
    
    console.log(`User ${userId} joined room ${roomId}`);
  });

  socket.on('drawing', (data) => {
    const { roomId, ...drawingData } = data;
    socket.to(roomId).emit('drawing', drawingData);
  });

  socket.on('clear-canvas', (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    if (room) {
      room.canvasData = null;
    }
    io.to(roomId).emit('clear-canvas');
  });

  socket.on('undo', (data) => {
    const { roomId } = data;
    io.to(roomId).emit('undo');
  });

  socket.on('redo', (data) => {
    const { roomId } = data;
    io.to(roomId).emit('redo');
  });

  socket.on('save-canvas', (data) => {
    const { roomId, canvasData } = data;
    const room = rooms.get(roomId);
    if (room) {
      room.canvasData = canvasData;
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Xóa user khỏi tất cả các rooms
    rooms.forEach((room, roomId) => {
      room.users.forEach((user, userId) => {
        if (user.socketId === socket.id) {
          room.users.delete(userId);
          io.to(roomId).emit('users-update', Array.from(room.users.values()));
        }
      });
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});