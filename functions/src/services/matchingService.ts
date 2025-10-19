import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

interface UserPreferences {
  language: string;
  interests: string[];
  region?: string;
}

interface QueueEntry {
  userId: string;
  preferences: UserPreferences;
  createdAt: admin.firestore.Timestamp;
}

class MatchingService {
  private db = admin.firestore();

  async joinQueue(userId: string, preferences: UserPreferences) {
    // Check if user is already in queue
    const existingEntry = await this.db.collection('matchingQueue').doc(userId).get();
    if (existingEntry.exists) {
      return { status: 'already_in_queue' };
    }

    // Try to find a match
    const match = await this.findMatch(userId, preferences);
    
    if (match) {
      // Create room with matched user
      const roomId = await this.createRoom([userId, match.userId]);
      
      // Remove both users from queue
      await this.db.collection('matchingQueue').doc(userId).delete();
      await this.db.collection('matchingQueue').doc(match.userId).delete();
      
      return {
        status: 'matched',
        roomId,
        partnerId: match.userId
      };
    } else {
      // Add user to queue
      await this.db.collection('matchingQueue').doc(userId).set({
        userId,
        preferences,
        createdAt: admin.firestore.Timestamp.now()
      });
      
      return { status: 'queued' };
    }
  }

  async leaveQueue(userId: string) {
    await this.db.collection('matchingQueue').doc(userId).delete();
  }

  private async findMatch(userId: string, preferences: UserPreferences): Promise<QueueEntry | null> {
    // Find users with matching language
    const query = this.db.collection('matchingQueue')
      .where('preferences.language', '==', preferences.language)
      .orderBy('createdAt', 'asc')
      .limit(10);
    
    const snapshot = await query.get();
    
    for (const doc of snapshot.docs) {
      const candidate = doc.data() as QueueEntry;
      
      // Skip self
      if (candidate.userId === userId) continue;
      
      // Check for common interests
      const commonInterests = preferences.interests.filter(interest =>
        candidate.preferences.interests.includes(interest)
      );
      
      // Match if at least one common interest or no specific interests
      if (commonInterests.length > 0 || preferences.interests.length === 0) {
        return candidate;
      }
    }
    
    return null;
  }

  private async createRoom(participants: string[]): Promise<string> {
    const roomId = uuidv4();
    const aiAgentId = `ai_moderator_${uuidv4()}`;
    
    await this.db.collection('rooms').doc(roomId).set({
      id: roomId,
      participants,
      aiAgentId,
      state: 'active',
      createdAt: admin.firestore.Timestamp.now(),
      lastActivity: admin.firestore.Timestamp.now()
    });
    
    return roomId;
  }
}

export const matchingService = new MatchingService();