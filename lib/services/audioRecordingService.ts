class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;

  async initialize() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.setupRecorderListeners();
      return true;
    } catch (error) {
      console.error('Error initializing audio recording:', error);
      return false;
    }
  }

  private setupRecorderListeners() {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];
      this.onRecordingComplete?.(audioBlob);
    };
  }

  startRecording() {
    if (!this.mediaRecorder || this.isRecording) return false;

    this.audioChunks = [];
    this.mediaRecorder.start(1000); // Collect data every second
    this.isRecording = true;
    return true;
  }

  stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) return false;

    this.mediaRecorder.stop();
    this.isRecording = false;
    return true;
  }

  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  getAudioLevel(): number {
    if (!this.stream) return 0;

    // Create audio context for level monitoring
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(this.stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    return average / 255; // Normalize to 0-1
  }

  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.stopRecording();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.isRecording = false;
  }

  // Event handler
  onRecordingComplete?: (audioBlob: Blob) => void;
}

export const audioRecordingService = new AudioRecordingService();