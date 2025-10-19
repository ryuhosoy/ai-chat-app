import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { matchingService } from './services/matchingService';
import { aiService } from './services/aiService';
import { audioService } from './services/audioService';

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// HTTP endpoints
app.post('/api/join-queue', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    const result = await matchingService.joinQueue(userId, preferences);
    res.json(result);
  } catch (error) {
    console.error('Error joining queue:', error);
    res.status(500).json({ error: 'Failed to join queue' });
  }
});

app.post('/api/leave-queue', async (req, res) => {
  try {
    const { userId } = req.body;
    await matchingService.leaveQueue(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving queue:', error);
    res.status(500).json({ error: 'Failed to leave queue' });
  }
});

app.post('/api/process-audio', async (req, res) => {
  try {
    const { audioData, roomId, userId } = req.body;
    const result = await audioService.processAudio(audioData, roomId, userId);
    res.json(result);
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

// WebRTC Signaling Server
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async (data) => {
    const { roomId, userId } = data;
    socket.join(roomId);
    
    // Notify other participants
    socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
    
    // Initialize AI moderator if needed
    await aiService.initializeRoom(roomId);
  });

  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  socket.on('audio-data', async (data) => {
    const { roomId, audioData, userId } = data;
    
    // Process audio through AI service
    const aiResponse = await aiService.processUserAudio(roomId, userId, audioData);
    
    if (aiResponse) {
      // Send AI response to all participants
      io.to(roomId).emit('ai-response', aiResponse);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export const api = functions.https.onRequest(app);
export const signaling = functions.https.onRequest(server);

// Scheduled function to clean up old rooms
export const cleanupRooms = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const db = admin.firestore();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  const oldRooms = await db.collection('rooms')
    .where('createdAt', '<', cutoff)
    .where('state', '==', 'closed')
    .get();
  
  const batch = db.batch();
  oldRooms.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleaned up ${oldRooms.size} old rooms`);
});