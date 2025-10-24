import {
  mediaDevices,
  MediaStream,
  RTCPeerConnection
} from 'react-native-webrtc';
import { io, Socket } from 'socket.io-client';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;

  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  async initialize(serverUrl: string) {
    this.socket = io(serverUrl);
    this.setupSocketListeners();
  }

  async joinRoom(roomId: string, userId: string) {
    if (!this.socket) throw new Error('Socket not initialized');
    
    this.roomId = roomId;
    this.userId = userId;
    
    // Get user media (React Native)
    this.localStream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });

    // Create peer connection
    this.peerConnection = new RTCPeerConnection(this.config);
    this.setupPeerConnectionListeners();

    // Add local stream to peer connection
    this.localStream.getTracks().forEach(track => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });

    // Join room via socket
    this.socket.emit('join-room', { roomId, userId });
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('user-joined', async (data) => {
      console.log('User joined:', data);
      // Create and send offer
      await this.createOffer();
    });

    this.socket.on('offer', async (data) => {
      console.log('Received offer');
      await this.handleOffer(data.offer);
    });

    this.socket.on('answer', async (data) => {
      console.log('Received answer');
      await this.handleAnswer(data.answer);
    });

    this.socket.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate');
      await this.handleIceCandidate(data.candidate);
    });

    this.socket.on('ai-response', (data) => {
      console.log('AI response:', data);
      this.handleAIResponse(data);
    });
  }

  private setupPeerConnectionListeners() {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket && this.roomId) {
        this.socket.emit('ice-candidate', {
          roomId: this.roomId,
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(this.remoteStream);
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };
  }

  private async createOffer() {
    if (!this.peerConnection || !this.socket || !this.roomId) return;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.socket.emit('offer', {
      roomId: this.roomId,
      offer
    });
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection || !this.socket || !this.roomId) return;

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.socket.emit('answer', {
      roomId: this.roomId,
      answer
    });
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(answer);
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(candidate);
  }

  private handleAIResponse(data: any) {
    // Play AI audio response
    if (data.audio) {
      this.playAIAudio(data.audio);
    }
    
    // Trigger UI update for AI message
    this.onAIMessage?.(data);
  }

  private playAIAudio(audioData: string) {
    // React Native用の音声再生
    // 実際の実装では react-native-sound や expo-av を使用
    console.log('AI音声再生:', audioData);
  }

  async sendAudioData(audioData: string) {
    if (!this.socket || !this.roomId || !this.userId) return;

    this.socket.emit('audio-data', {
      roomId: this.roomId,
      userId: this.userId,
      audioData
    });
  }

  toggleMute() {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled; // Return muted state
    }
    return false;
  }

  async leaveRoom() {
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.roomId = null;
    this.userId = null;
  }

  // Event handlers (to be set by the UI)
  onRemoteStream?: (stream: MediaStream) => void;
  onAIMessage?: (data: any) => void;
  onUserJoined?: (userId: string) => void;
  onUserLeft?: (userId: string) => void;
}

export const webrtcService = new WebRTCService();