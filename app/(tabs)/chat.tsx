import { Room } from '@/lib/services/matchingService';
import { webrtcService } from '@/lib/services/webrtcService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ArrowLeft, Mic, MicOff, Phone, Volume2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [partner, setPartner] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('接続中...');

  useEffect(() => {
    loadRoomInfo();
    initializeWebRTC();
    
    return () => {
      // クリーンアップ
      webrtcService.leaveRoom();
    };
  }, []);

  const loadRoomInfo = async () => {
    try {
      const roomData = await AsyncStorage.getItem('current_room');
      if (roomData) {
        const parsedRoom: Room = JSON.parse(roomData);
        setRoom(parsedRoom);
        
        // 現在のユーザーID取得
        const userId = await AsyncStorage.getItem('user_id');
        
        // パートナー情報取得
        const partnerInfo = parsedRoom.participants.find(p => p.userId !== userId);
        setPartner(partnerInfo);
      }
    } catch (error) {
      console.error('ルーム情報読み込みエラー:', error);
    }
  };

  const initializeWebRTC = async () => {
    try {
      // シグナリングサーバーに接続
      await webrtcService.initialize('http://localhost:3001');
      
      // イベントハンドラー設定
      webrtcService.onRemoteStream = (stream) => {
        console.log('リモートストリーム受信:', stream);
        setIsConnected(true);
        setConnectionStatus('通話中');
      };
      
      webrtcService.onAIMessage = (data) => {
        console.log('AI応答受信:', data);
        // AI応答のUI更新
      };
      
      webrtcService.onUserJoined = (userId) => {
        console.log('ユーザー参加:', userId);
        setConnectionStatus('接続中...');
      };
      
      webrtcService.onUserLeft = (userId) => {
        console.log('ユーザー退出:', userId);
        setIsConnected(false);
        setConnectionStatus('接続が切れました');
      };
      
      // ルームに参加
      if (room) {
        const userId = await AsyncStorage.getItem('user_id');
        if (userId) {
          await webrtcService.joinRoom(room.id, userId);
        }
      }
    } catch (error) {
      console.error('WebRTC初期化エラー:', error);
      Alert.alert('エラー', '通話の開始に失敗しました');
    }
  };

  const handleMuteToggle = () => {
    const muted = webrtcService.toggleMute();
    setIsMuted(muted);
  };

  const handleEndCall = () => {
    Alert.alert(
      '通話を終了',
      '通話を終了しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '終了', 
          style: 'destructive',
          onPress: () => {
            webrtcService.leaveRoom();
            router.push('/');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chatting!</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Participants */}
        <View style={styles.participants}>
          <View style={styles.participant}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: partner?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150' }}
                style={styles.avatar}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.participantName}>{partner?.name || 'ゲスト'}</Text>
            <Text style={styles.participantStatus}>
              {partner?.interests?.slice(0, 2).join(' • ') || 'オンライン'}
            </Text>
          </View>

          <View style={styles.participant}>
            <View style={styles.avatarContainer}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>🤖</Text>
              </View>
            </View>
            <Text style={styles.participantName}>ModBot</Text>
            <Text style={styles.participantStatus}>AI司会がサポート中</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isConnected ? '🎉 通話中！' : connectionStatus}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[
              styles.controlButton,
              { backgroundColor: isMuted ? '#FEE2E2' : '#F3F4F6' }
            ]}
            onPress={handleMuteToggle}
          >
            {isMuted ? <MicOff size={24} color="#6B7280" /> : <Mic size={24} color="#6B7280" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Volume2 size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlEmoji}>😀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlEmoji}>🎵</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleEndCall}
          >
            <Phone size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Auto-pilot</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  participants: {
    alignItems: 'center',
    marginBottom: 40,
  },
  participant: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  aiAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarText: {
    fontSize: 32,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  participantName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  participantStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    backgroundColor: '#FEF3F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  statusText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#EF4444',
  },
  controlEmoji: {
    fontSize: 24,
  },
  bottomActions: {
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});