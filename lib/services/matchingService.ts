/**
 * マッチングサービス
 * Firestoreを使ったリアルタイムマッチング
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

export interface UserProfile {
  userId: string;
  name: string;
  interests?: string[];
  avatar?: string;
}

export interface Room {
  roomId: string;
  participants: UserProfile[];
  createdAt: number;
  status: 'waiting' | 'active' | 'ended';
}

export class MatchingService {
  private queueListenerUnsubscribe?: () => void;
  private roomListenerUnsubscribe?: () => void;

  /**
   * 待機キューに参加
   */
  async joinQueue(user: UserProfile): Promise<string> {
    try {
      // 既に待機中か確認
      const existingQueue = await this.findExistingQueue(user.userId);
      if (existingQueue) {
        return existingQueue;
      }

      // 待機キューに追加
      const queueRef = await addDoc(collection(db, 'waiting_queue'), {
        userId: user.userId,
        name: user.name,
        interests: user.interests || [],
        avatar: user.avatar,
        joinedAt: Timestamp.now(),
      });

      console.log('待機キュー参加:', queueRef.id);
      return queueRef.id;
    } catch (error) {
      console.error('待機キュー参加エラー:', error);
      throw error;
    }
  }

  /**
   * 既存の待機キューを検索
   */
  private async findExistingQueue(userId: string): Promise<string | null> {
    const q = query(
      collection(db, 'waiting_queue'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : snapshot.docs[0].id;
  }

  /**
   * マッチングを監視
   */
  async watchForMatch(
    queueId: string,
    userId: string,
    onMatch: (room: Room) => void
  ): Promise<void> {
    // 自分がマッチングされたルームを監視
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('participantIds', 'array-contains', userId),
      where('status', '==', 'waiting')
    );

    this.roomListenerUnsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const roomDoc = snapshot.docs[0];
        const roomData = roomDoc.data();

        // ルームデータを取得
        const room: Room = {
          roomId: roomDoc.id,
          participants: roomData.participants || [],
          createdAt: roomData.createdAt?.toMillis() || Date.now(),
          status: 'active',
        };

        // ルームをactiveに更新
        await updateDoc(doc(db, 'rooms', roomDoc.id), {
          status: 'active',
        });

        // 待機キューから削除
        await this.leaveQueue(queueId);

        // マッチング成功コールバック
        onMatch(room);
      }
    });

    // 定期的にマッチングを試行（他のユーザーを探す）
    this.tryMatching(queueId, userId);
  }

  /**
   * マッチングを試行
   */
  private async tryMatching(queueId: string, currentUserId: string): Promise<void> {
    try {
      // 待機中の他のユーザーを検索（最も古い人）
      const waitingQuery = query(
        collection(db, 'waiting_queue'),
        orderBy('joinedAt', 'asc'),
        limit(10) // 複数取得して自分以外を探す
      );

      const snapshot = await getDocs(waitingQuery);

      if (!snapshot.empty) {
        // 自分以外のユーザーを探す
        const partnerDoc = snapshot.docs.find(doc => doc.data().userId !== currentUserId);
        
        if (!partnerDoc) {
          // 自分以外のユーザーがいない
          return;
        }
        
        const partnerData = partnerDoc.data();

        // 自分のデータを取得
        const myDoc = await getDoc(doc(db, 'waiting_queue', queueId));
        const myData = myDoc.data();

        if (!myData) return;

        // ルームを作成
        const room = await this.createRoom(
          {
            userId: currentUserId,
            name: myData.name,
            interests: myData.interests,
            avatar: myData.avatar,
          },
          {
            userId: partnerData.userId,
            name: partnerData.name,
            interests: partnerData.interests,
            avatar: partnerData.avatar,
          }
        );

        console.log('マッチング成功！ルームID:', room.roomId);

        // 両方の待機キューから削除
        await deleteDoc(doc(db, 'waiting_queue', queueId));
        await deleteDoc(partnerDoc.ref);
      }
    } catch (error) {
      console.error('マッチング試行エラー:', error);
    }
  }

  /**
   * ルームを作成
   */
  private async createRoom(user1: UserProfile, user2: UserProfile): Promise<Room> {
    const roomRef = await addDoc(collection(db, 'rooms'), {
      participants: [user1, user2],
      participantIds: [user1.userId, user2.userId],
      createdAt: Timestamp.now(),
      status: 'waiting',
      messages: [],
    });

    return {
      roomId: roomRef.id,
      participants: [user1, user2],
      createdAt: Date.now(),
      status: 'waiting',
    };
  }

  /**
   * 待機キューから退出
   */
  async leaveQueue(queueId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'waiting_queue', queueId));
      console.log('待機キュー退出:', queueId);
    } catch (error) {
      console.error('待機キュー退出エラー:', error);
    }
  }

  /**
   * リスナーをクリーンアップ
   */
  cleanup(): void {
    if (this.queueListenerUnsubscribe) {
      this.queueListenerUnsubscribe();
    }
    if (this.roomListenerUnsubscribe) {
      this.roomListenerUnsubscribe();
    }
  }
}
