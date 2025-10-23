import { MatchingService, Room } from '@/lib/services/matchingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ArrowLeft, Loader, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MatchingScreen() {
  const [isSearching, setIsSearching] = useState(false);
  const [matchingStatus, setMatchingStatus] = useState('探しています...');
  const matchingServiceRef = useRef<MatchingService | null>(null);
  const queueIdRef = useRef<string | null>(null);

  useEffect(() => {
    // マッチングサービスを初期化
    matchingServiceRef.current = new MatchingService();

    // クリーンアップ
    return () => {
      if (matchingServiceRef.current) {
        matchingServiceRef.current.cleanup();
      }
    };
  }, []);

  const handleStartSearch = async () => {
    setIsSearching(true);
    setMatchingStatus('マッチング相手を探しています...');

    try {
      // デモ用のユーザープロフィール（実際にはAsyncStorageやFirebase Authから取得）
      const userId = await getUserId();
      const userProfile = {
        userId,
        name: 'あなた',
        interests: ['音楽', '映画', '旅行'],
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      };

      // 待機キューに参加
      const queueId = await matchingServiceRef.current!.joinQueue(userProfile);
      queueIdRef.current = queueId;

      setMatchingStatus('相手を待っています...');

      // マッチングを監視
      await matchingServiceRef.current!.watchForMatch(
        queueId,
        userId,
        handleMatchSuccess
      );
    } catch (error) {
      console.error('マッチングエラー:', error);
      Alert.alert('エラー', 'マッチングに失敗しました');
      setIsSearching(false);
    }
  };

  /**
   * マッチング成功時の処理
   */
  const handleMatchSuccess = async (room: Room) => {
    console.log('マッチング成功！', room);
    setMatchingStatus('マッチング成功！');

    // ルーム情報を保存
    await AsyncStorage.setItem('current_room', JSON.stringify(room));

    // チャット画面に遷移
    setTimeout(() => {
      setIsSearching(false);
      router.push('/chat');
    }, 1000);
  };

  /**
   * キャンセル処理
   */
  const handleCancel = async () => {
    if (queueIdRef.current && matchingServiceRef.current) {
      await matchingServiceRef.current.leaveQueue(queueIdRef.current);
    }
    setIsSearching(false);
    setMatchingStatus('探しています...');
  };

  /**
   * ユーザーIDを取得（デモ用）
   */
  const getUserId = async (): Promise<string> => {
    let userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('user_id', userId);
    }
    return userId;
  };

  if (isSearching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchingContainer}>
          <Loader size={48} color="#FF6B35" />
          <Text style={styles.searchingTitle}>{matchingStatus}</Text>
          <Text style={styles.searchingSubtitle}>
            他のユーザーを探しています。しばらくお待ちください...
          </Text>
          
          {/* 状態表示 */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusEmoji}>🔍</Text>
              <Text style={styles.statusText}>待機キューに参加中</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusEmoji}>⏳</Text>
              <Text style={styles.statusText}>マッチング処理中</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finding your duo...</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=300' }}
          style={styles.illustration}
        />
        
        <Text style={styles.title}>Hold tight!</Text>
        <Text style={styles.subtitle}>
          We're on the hunt for the perfect human + AI pair for you with AI. It's usually super quick!
        </Text>

        <View style={styles.matchingInfo}>
          <View style={styles.infoItem}>
            <Users size={20} color="#FF6B35" />
            <Text style={styles.infoText}>Matching with humans worldwide</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.aiIcon}>🤖</Text>
            <Text style={styles.infoText}>AI moderator will join to help</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartSearch}
        >
          <Text style={styles.startButtonText}>Start Matching</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Auto-pilot: Matches are always sure we all have a good time!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: 200,
    height: 150,
    borderRadius: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  matchingInfo: {
    width: '100%',
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  aiIcon: {
    fontSize: 20,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
  },
  searchingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  cancelButton: {
    borderColor: '#FF6B35',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    width: '100%',
    marginTop: 32,
    marginBottom: 32,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statusEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
});