import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export interface MatchingPreferences {
  language: string;
  interests: string[];
  region?: string;
}

export interface MatchingResult {
  status: 'queued' | 'matched' | 'already_in_queue';
  roomId?: string;
  partnerId?: string;
}

class MatchingService {
  private joinQueueFunction = httpsCallable(functions, 'api');
  private leaveQueueFunction = httpsCallable(functions, 'api');

  async joinQueue(userId: string, preferences: MatchingPreferences): Promise<MatchingResult> {
    try {
      const response = await fetch('/api/join-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, preferences })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error joining queue:', error);
      throw error;
    }
  }

  async leaveQueue(userId: string): Promise<void> {
    try {
      await fetch('/api/leave-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error('Error leaving queue:', error);
      throw error;
    }
  }
}

export const matchingService = new MatchingService();