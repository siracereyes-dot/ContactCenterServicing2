
export class RingtoneService {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private timer: any = null;

  private notes = [
    { freq: 1318.51, duration: 0.15 }, // E6
    { freq: 1174.66, duration: 0.15 }, // D6
    { freq: 739.99, duration: 0.3 },   // F#5
    { freq: 830.61, duration: 0.3 },   // G#5
    { freq: 1108.73, duration: 0.15 }, // C#6
    { freq: 987.77, duration: 0.15 },  // B5
    { freq: 587.33, duration: 0.3 },   // D5
    { freq: 659.25, duration: 0.3 },   // E5
    { freq: 987.77, duration: 0.15 },  // B5
    { freq: 880, duration: 0.15 },     // A5
    { freq: 554.37, duration: 0.3 },   // C#5
    { freq: 659.25, duration: 0.3 },   // E5
    { freq: 880, duration: 0.6 },      // A5
  ];

  public start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.playSequence();
  }

  private playSequence() {
    if (!this.isPlaying || !this.audioContext) return;

    let startTime = this.audioContext.currentTime;

    this.notes.forEach((note) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.type = 'square'; // Classic 8-bit / Nokia feel
      osc.frequency.setValueAtTime(note.freq, startTime);
      
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration - 0.05);

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.start(startTime);
      osc.stop(startTime + note.duration);

      startTime += note.duration;
    });

    // Loop after a 2 second delay
    this.timer = setTimeout(() => {
      if (this.isPlaying) {
        this.playSequence();
      }
    }, (startTime - this.audioContext.currentTime) * 1000 + 1000);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const ringtoneService = new RingtoneService();
