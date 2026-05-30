import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

interface LiveClientCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onError: (error: Error) => void;
  onAudioData: (isPlaying: boolean) => void;
  onTranscript: (speaker: 'user' | 'model', text: string, isFinal: boolean) => void;
  onUserVolume?: (volume: number) => void;
}

interface ConnectConfig {
  voiceName?: string;
  systemInstruction?: string;
}

export class GeminiLiveClient {
  private ai: GoogleGenAI;
  private session: any = null;
  private resolvedLiveSession: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private isConnected = false;
  private isMuted = false;
  private callbacks: LiveClientCallbacks;
  
  // Transcript accumulation
  private currentModelText = "";
  private currentUserText = "";

  constructor(callbacks: LiveClientCallbacks) {
    let apiKey = process.env.GEMINI_API_KEY;
    // Handle cases where Vite might have stringified "undefined"
    if (!apiKey || apiKey === "undefined" || apiKey === "null") {
      apiKey = "";
      console.error("GEMINI_API_KEY is missing or invalid in environment variables.");
    } else {
      console.log("GeminiLiveClient: API Key found (starts with " + apiKey.substring(0, 4) + ")");
    }
    this.ai = new GoogleGenAI({ 
      apiKey, 
      apiVersion: 'v1beta',
      httpOptions: {
        apiVersion: 'v1beta',
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    this.callbacks = callbacks;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.callbacks.onUserVolume) {
      this.callbacks.onUserVolume(0);
    }
  }

  public async sendInitialPrompt(message: string) {
    if (!this.session) {
      console.warn("No active session to send initial prompt");
      return;
    }
    try {
      const session = await this.session;
      console.log("Sending initial prompt:", message);
      session.sendRealtimeInput({ text: message });
    } catch (err) {
      console.error("Failed to send initial prompt", err);
    }
  }

  public async connect(configOpts?: ConnectConfig) {
    if (this.isConnected) return;

    try {
      console.log("Connecting to Gemini Live API...");
      // Initialize Audio Contexts natively inside the user gesture handler
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume contexts immediately synchronously so the browser grants permissions
      try {
        await Promise.all([
          this.inputAudioContext.resume(),
          this.outputAudioContext.resume()
        ]);
        console.log("Acoustic Audio Contexts active and running.");
      } catch (resumeErr) {
        console.warn("Could not resume audio contexts synchronously:", resumeErr);
      }
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Mic stream acquired");

      const config = {
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: configOpts?.systemInstruction || SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: configOpts?.voiceName || 'Puck' } }, 
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      };

      const sessionPromise = this.ai.live.connect({
        ...config,
        callbacks: {
          onopen: async () => {
            console.log("Gemini Live connection opened");
            this.isConnected = true;
            this.currentModelText = "";
            this.currentUserText = "";
            
            // Backup resume
            if (this.inputAudioContext?.state === 'suspended') await this.inputAudioContext.resume();
            if (this.outputAudioContext?.state === 'suspended') await this.outputAudioContext.resume();
            
            this.callbacks.onOpen();
            this.startAudioInput(sessionPromise);
          },
          onmessage: (msg: LiveServerMessage) => {
            // console.log("Live Message received", msg);
            this.handleMessage(msg);
          },
          onclose: () => {
            console.log("Gemini Live connection closed");
            this.isConnected = false;
            this.cleanup();
            this.callbacks.onClose();
          },
          onerror: (err: any) => {
            console.error("Gemini Live API websocket error:", err);
            const errorMsg = err.message || (typeof err === 'string' ? err : JSON.stringify(err)) || "Network error or connection lost";
            this.callbacks.onError(new Error(errorMsg));
            this.disconnect();
          }
        }
      });
      
      this.session = sessionPromise;
      
      sessionPromise.then((resolvedSession) => {
        console.log("Live session pre-resolved cleanly.");
        this.resolvedLiveSession = resolvedSession;
      }).catch(err => {
        if (this.isConnected) {
          console.error("Failed to pre-resolve Gemini Live session:", err);
        }
      });

    } catch (error) {
      console.error("Connection setup failed", error);
      this.callbacks.onError(error as Error);
    }
  }

  public disconnect() {
    if (this.session) {
      this.isConnected = false;
      // Mark session as potentially closed on client side
    }
    this.cleanup();
    this.callbacks.onClose();
  }

  private downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) {
      return buffer;
    }
    if (fromRate < toRate) {
      // Upsampling - not expected for mic but return as is
      return buffer;
    }
    const sampleRateRatio = fromRate / toRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  private startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;

    // Ensure context is active (prevent browser auto-suspend)
    if (this.inputAudioContext.state === 'suspended') {
      this.inputAudioContext.resume();
    }

    this.source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    // Capture actual sample rate to use in MIME type
    const currentSampleRate = this.inputAudioContext.sampleRate;
    console.log(`Mic input sample rate set up. Browser Native Rate: ${currentSampleRate} Hz. Downsampling to 16000 Hz.`);

    let chunkCount = 0;
    this.processor.onaudioprocess = (e) => {
      if (this.isMuted) {
        if (this.callbacks.onUserVolume) {
          this.callbacks.onUserVolume(0);
        }
        return;
      }
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate RMS to see if there's actual sound
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      if (chunkCount++ % 100 === 0) {
        console.log("Audio Input RMS:", rms.toFixed(5));
      }

      // Notify UI of user's active volume
      if (this.callbacks.onUserVolume) {
        this.callbacks.onUserVolume(rms);
      }

      // Downsample to exactly 16000 Hz PCM for Gemini Live API
      const resampledData = this.downsample(inputData, currentSampleRate, 16000);
      const pcmBlob = this.createBlob(resampledData, 16000);

      if (this.resolvedLiveSession) {
        try {
          this.resolvedLiveSession.sendRealtimeInput({ audio: pcmBlob });
        } catch (sendErr) {
          if (this.isConnected) {
            console.warn("Failed sending audio chunk directly:", sendErr);
          }
        }
      } else {
        sessionPromise.then((session) => {
          this.resolvedLiveSession = session;
          session.sendRealtimeInput({ audio: pcmBlob });
        }).catch(err => {
          if (this.isConnected) {
            console.warn("Failed to send audio chunk via fallback promise:", err);
          }
        });
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (audioData) {
      this.callbacks.onAudioData(true);
      if (!this.outputAudioContext) return;

      // Ensure output context is running
      if (this.outputAudioContext.state === 'suspended') {
         await this.outputAudioContext.resume();
      }

      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      
      const audioBuffer = await this.decodeAudioData(
        this.decode(audioData),
        this.outputAudioContext,
        24000,
        1
      );

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      
      source.addEventListener('ended', () => {
        this.sources.delete(source);
        if (this.sources.size === 0) {
             this.callbacks.onAudioData(false);
        }
      });

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }

    // Handle Interruptions
    const interrupted = message.serverContent?.interrupted;
    if (interrupted) {
      this.sources.forEach(s => s.stop());
      this.sources.clear();
      this.nextStartTime = 0;
      this.callbacks.onAudioData(false);
      
      // If we have accumulated text, mark it as final (interrupted)
      if (this.currentModelText) {
        this.callbacks.onTranscript('model', this.currentModelText, true);
      }
      this.currentModelText = "";
    }

    // Handle Transcription
    const modelTranscriptChunk = message.serverContent?.outputTranscription?.text;
    const userTranscriptChunk = message.serverContent?.inputTranscription?.text;
    const turnComplete = message.serverContent?.turnComplete;

    // Trigger callback if there is new text OR if the turn is complete (even if no new text)
    if (modelTranscriptChunk || (turnComplete && this.currentModelText)) {
      if (modelTranscriptChunk) {
        this.currentModelText += modelTranscriptChunk;
      }
      this.callbacks.onTranscript('model', this.currentModelText, !!turnComplete);
    }
    
    if (turnComplete) {
        // Reset model text buffer after turn is complete
        this.currentModelText = "";
        this.currentUserText = "";
    }

    if (userTranscriptChunk) {
      this.currentUserText += userTranscriptChunk;
      this.callbacks.onTranscript('user', this.currentUserText, false);
    }
  }

  private createBlob(data: Float32Array, sampleRate: number): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      let sample = data[i];
      
      // Dither noise to prevent silence timeouts
      if (sample === 0) {
         sample = (Math.random() * 0.0002) - 0.0001; 
      }
      
      // Clamp to [-1, 1]
      sample = Math.max(-1, Math.min(1, sample));
      
      // Convert to 16-bit PCM
      int16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: `audio/pcm;rate=${sampleRate}`,
    };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    // Correctly handle buffer offset/length for Int16Array
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  private cleanup() {
    this.resolvedLiveSession = null;
    this.session = null;
    if (this.callbacks.onUserVolume) {
      this.callbacks.onUserVolume(0);
    }
    if (this.processor && this.source) {
      this.source.disconnect();
      this.processor.disconnect();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    
    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      this.inputAudioContext.close();
    }
    if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
      this.outputAudioContext.close();
    }
  }
}