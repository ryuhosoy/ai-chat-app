import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

class AudioService {
  private storage = admin.storage();
  private db = admin.firestore();

  async processAudio(audioData: string, roomId: string, userId: string) {
    try {
      // Save audio file to Firebase Storage
      const audioUrl = await this.saveAudioFile(audioData, roomId, userId);
      
      // Save audio metadata to Firestore
      await this.saveAudioMetadata(roomId, userId, audioUrl);
      
      return {
        success: true,
        audioUrl
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }

  private async saveAudioFile(audioData: string, roomId: string, userId: string): Promise<string> {
    const fileName = `${roomId}/${userId}/${uuidv4()}.webm`;
    const file = this.storage.bucket().file(`audio/${fileName}`);
    
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // Upload file
    await file.save(audioBuffer, {
      metadata: {
        contentType: 'audio/webm',
        metadata: {
          roomId,
          userId,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    // Make file publicly readable
    await file.makePublic();
    
    return `https://storage.googleapis.com/${this.storage.bucket().name}/audio/${fileName}`;
  }

  private async saveAudioMetadata(roomId: string, userId: string, audioUrl: string) {
    await this.db.collection('rooms').doc(roomId)
      .collection('audioFiles').add({
        userId,
        audioUrl,
        createdAt: admin.firestore.Timestamp.now()
      });
  }

  async getAudioHistory(roomId: string, userId: string) {
    const snapshot = await this.db.collection('rooms').doc(roomId)
      .collection('audioFiles')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async deleteAudioFile(roomId: string, audioFileId: string) {
    // Delete from Firestore
    await this.db.collection('rooms').doc(roomId)
      .collection('audioFiles').doc(audioFileId).delete();
    
    // Note: Storage file deletion would require additional metadata tracking
    // For now, we'll keep the storage files for potential future use
  }
}

export const audioService = new AudioService();