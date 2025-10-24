import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = createServer(app);

// CORS設定
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

// Socket.IO設定
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ルーム管理
const rooms = new Map<string, Set<string>>();

// 接続管理
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ルーム参加
  socket.on('join-room', (data: { roomId: string; userId: string }) => {
    const { roomId, userId } = data;
    
    // ルームに参加
    socket.join(roomId);
    
    // ルーム管理
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(userId);
    
    console.log(`User ${userId} joined room ${roomId}`);
    
    // 他のユーザーに通知
    socket.to(roomId).emit('user-joined', { userId });
    
    // ルーム内のユーザー数を返す
    socket.emit('room-info', {
      roomId,
      userCount: rooms.get(roomId)!.size,
      users: Array.from(rooms.get(roomId)!)
    });
  });

  // WebRTCオファー転送
  socket.on('offer', (data: { roomId: string; offer: RTCSessionDescriptionInit }) => {
    console.log('Forwarding offer to room:', data.roomId);
    socket.to(data.roomId).emit('offer', data);
  });

  // WebRTCアンサー転送
  socket.on('answer', (data: { roomId: string; answer: RTCSessionDescriptionInit }) => {
    console.log('Forwarding answer to room:', data.roomId);
    socket.to(data.roomId).emit('answer', data);
  });

  // ICE候補転送
  socket.on('ice-candidate', (data: { roomId: string; candidate: RTCIceCandidateInit }) => {
    console.log('Forwarding ICE candidate to room:', data.roomId);
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  // 音声データ転送（AI処理用）
  socket.on('audio-data', (data: { roomId: string; userId: string; audioData: string }) => {
    console.log('Received audio data from:', data.userId);
    // 他のユーザーに音声データを転送
    socket.to(data.roomId).emit('audio-data', data);
  });

  // AI応答転送
  socket.on('ai-response', (data: { roomId: string; response: any }) => {
    console.log('Broadcasting AI response to room:', data.roomId);
    io.to(data.roomId).emit('ai-response', data.response);
  });

  // マイク状態変更
  socket.on('mic-toggle', (data: { roomId: string; userId: string; muted: boolean }) => {
    console.log(`User ${data.userId} mic ${data.muted ? 'muted' : 'unmuted'}`);
    socket.to(data.roomId).emit('mic-toggle', data);
  });

  // 接続切断
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // 全ルームから削除
    for (const [roomId, users] of rooms.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit('user-left', { userId: socket.id });
        
        // ルームが空になったら削除
        if (users.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });

  // ルーム退出
  socket.on('leave-room', (data: { roomId: string; userId: string }) => {
    const { roomId, userId } = data;
    
    socket.leave(roomId);
    
    if (rooms.has(roomId)) {
      rooms.get(roomId)!.delete(userId);
      socket.to(roomId).emit('user-left', { userId });
      
      // ルームが空になったら削除
      if (rooms.get(roomId)!.size === 0) {
        rooms.delete(roomId);
      }
    }
    
    console.log(`User ${userId} left room ${roomId}`);
  });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size,
    connections: io.engine.clientsCount 
  });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
});

export default server;
