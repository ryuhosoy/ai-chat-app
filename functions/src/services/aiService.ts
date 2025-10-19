import OpenAI from 'openai';
import * as admin from 'firebase-admin';
import { audioService } from './audioService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ConversationContext {
  roomId: string;
  participants: string[];
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: admin.firestore.Timestamp;
    speaker?: string;
  }>;
  silenceCount: number;
  lastActivity: admin.firestore.Timestamp;
}

class AIService {
  private db = admin.firestore();
  private conversations = new Map<string, ConversationContext>();

  async initializeRoom(roomId: string) {
    const roomDoc = await this.db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) return;

    const roomData = roomDoc.data()!;
    const participants = roomData.participants;

    // Get participant profiles
    const profiles = await Promise.all(
      participants.map(async (userId: string) => {
        const userDoc = await this.db.collection('users').doc(userId).get();
        return userDoc.data();
      })
    );

    const context: ConversationContext = {
      roomId,
      participants,
      messages: [{
        role: 'system',
        content: this.generateSystemPrompt(profiles),
        timestamp: admin.firestore.Timestamp.now()
      }],
      silenceCount: 0,
      lastActivity: admin.firestore.Timestamp.now()
    };

    this.conversations.set(roomId, context);

    // Send initial greeting
    const greeting = await this.generateGreeting(profiles);
    await this.sendAIMessage(roomId, greeting);
  }

  async processUserAudio(roomId: string, userId: string, audioData: string) {
    try {
      // Convert audio to text using Whisper
      const transcription = await this.transcribeAudio(audioData);
      
      if (!transcription || transcription.trim().length === 0) {
        return null;
      }

      // Update conversation context
      const context = this.conversations.get(roomId);
      if (!context) return null;

      context.messages.push({
        role: 'user',
        content: transcription,
        timestamp: admin.firestore.Timestamp.now(),
        speaker: userId
      });
      context.lastActivity = admin.firestore.Timestamp.now();
      context.silenceCount = 0;

      // Save message to Firestore
      await this.saveMessage(roomId, {
        senderType: 'human',
        senderId: userId,
        text: transcription,
        timestamp: admin.firestore.Timestamp.now()
      });

      // Generate AI response if needed
      const shouldRespond = await this.shouldAIRespond(context);
      if (shouldRespond) {
        const response = await this.generateAIResponse(context);
        return await this.sendAIMessage(roomId, response);
      }

      return null;
    } catch (error) {
      console.error('Error processing user audio:', error);
      return null;
    }
  }

  private async transcribeAudio(audioData: string): Promise<string | null> {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      // Create a temporary file for Whisper API
      const response = await openai.audio.transcriptions.create({
        file: audioBuffer as any,
        model: 'whisper-1',
        language: 'en' // Can be dynamic based on user preferences
      });

      return response.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  }

  private async shouldAIRespond(context: ConversationContext): Promise<boolean> {
    // AI responds if:
    // 1. There's been silence for too long
    // 2. Someone asks a direct question
    // 3. The conversation needs facilitation
    
    const lastMessage = context.messages[context.messages.length - 1];
    const timeSinceLastMessage = Date.now() - context.lastActivity.toMillis();
    
    // Respond if silence > 5 seconds
    if (timeSinceLastMessage > 5000) {
      context.silenceCount++;
      return true;
    }

    // Respond to questions
    if (lastMessage.content.includes('?')) {
      return true;
    }

    // Respond every few messages to keep conversation flowing
    const userMessages = context.messages.filter(m => m.role === 'user').length;
    return userMessages % 4 === 0;
  }

  private async generateAIResponse(context: ConversationContext): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: context.messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        max_tokens: 150,
        temperature: 0.8
      });

      return response.choices[0]?.message?.content || "I'm here to help keep the conversation going!";
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "Let's keep chatting! What would you like to talk about?";
    }
  }

  private async sendAIMessage(roomId: string, message: string) {
    // Convert text to speech
    const audioData = await this.textToSpeech(message);
    
    // Update conversation context
    const context = this.conversations.get(roomId);
    if (context) {
      context.messages.push({
        role: 'assistant',
        content: message,
        timestamp: admin.firestore.Timestamp.now()
      });
    }

    // Save message to Firestore
    await this.saveMessage(roomId, {
      senderType: 'ai_moderator',
      senderId: 'ai_moderator',
      text: message,
      audioUrl: audioData ? `data:audio/mp3;base64,${audioData}` : undefined,
      timestamp: admin.firestore.Timestamp.now()
    });

    return {
      type: 'ai_message',
      text: message,
      audio: audioData
    };
  }

  private async textToSpeech(text: string): Promise<string | null> {
    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        response_format: 'mp3'
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer.toString('base64');
    } catch (error) {
      console.error('Error converting text to speech:', error);
      return null;
    }
  }

  private generateSystemPrompt(profiles: any[]): string {
    return `You are a friendly AI moderator facilitating a voice conversation between two people. Your role is to:

1. Keep the conversation flowing naturally
2. Ask engaging questions when there's silence
3. Help participants find common ground
4. Be encouraging and positive
5. Intervene if the conversation gets stuck

Participants:
${profiles.map((p, i) => `Person ${i + 1}: ${p?.name || 'Anonymous'}, interests: ${p?.interests?.join(', ') || 'None specified'}`).join('\n')}

Keep your responses brief (1-2 sentences) and conversational. Speak as if you're a helpful friend joining the chat.`;
  }

  private async generateGreeting(profiles: any[]): Promise<string> {
    const names = profiles.map(p => p?.name || 'there').join(' and ');
    return `Hi ${names}! I'm your AI moderator for today's chat. I'm here to help keep the conversation flowing. How are you both doing today?`;
  }

  private async saveMessage(roomId: string, message: any) {
    await this.db.collection('rooms').doc(roomId)
      .collection('messages').add(message);
  }

  async handleSilence(roomId: string) {
    const context = this.conversations.get(roomId);
    if (!context) return;

    context.silenceCount++;
    
    if (context.silenceCount >= 2) {
      const response = await this.generateSilenceBreaker(context);
      await this.sendAIMessage(roomId, response);
    }
  }

  private async generateSilenceBreaker(context: ConversationContext): Promise<string> {
    const silenceBreakerPrompts = [
      "What's something interesting that happened to you this week?",
      "If you could travel anywhere right now, where would you go?",
      "What's your favorite way to spend a weekend?",
      "Tell me about a hobby you're passionate about!",
      "What's the best advice you've ever received?"
    ];

    return silenceBreakerPrompts[Math.floor(Math.random() * silenceBreakerPrompts.length)];
  }
}

export const aiService = new AIService();