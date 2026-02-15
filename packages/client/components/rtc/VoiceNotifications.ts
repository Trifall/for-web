/**
 * Voice notification sound manager
 * Uses Web Audio API to generate tones for voice channel events
 */

interface ToneConfig {
  frequency: number;
  duration: number;
  attack: number;
  release: number;
  type: OscillatorType;
}

const JOIN_TONE: ToneConfig = {
  frequency: 600,
  duration: 0.15,
  attack: 0.01,
  release: 0.05,
  type: "sine",
};

const LEAVE_TONE: ToneConfig = {
  frequency: 400,
  duration: 0.15,
  attack: 0.01,
  release: 0.05,
  type: "sine",
};

const SELF_JOIN_TONE: ToneConfig = {
  frequency: 800,
  duration: 0.2,
  attack: 0.01,
  release: 0.08,
  type: "sine",
};

class VoiceNotificationManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private volume = 0.5;
  private hasUserInteracted = false;

  constructor() {
    this.handleUserInteraction = this.handleUserInteraction.bind(this);

    if (typeof window !== "undefined") {
      const events = ["click", "keydown", "touchstart"];
      events.forEach((event) => {
        document.addEventListener(event, this.handleUserInteraction, { once: true });
      });
    }
  }

  private handleUserInteraction() {
    this.hasUserInteracted = true;
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;

      this.audioContext = new AudioContextClass();
    }

    return this.audioContext;
  }

  private async ensureContext(): Promise<AudioContext | null> {
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    if (ctx.state === "suspended" && this.hasUserInteracted) {
      await ctx.resume();
    }

    return ctx;
  }

  private playTone(config: ToneConfig): void {
    console.log("[VoiceNotifications] playTone() called, enabled:", this.enabled);
    if (!this.enabled) {
      console.log("[VoiceNotifications] Not playing - disabled");
      return;
    }

    this.ensureContext().then((ctx) => {
      console.log("[VoiceNotifications] AudioContext state:", ctx?.state);
      if (!ctx || ctx.state === "suspended") {
        console.log("[VoiceNotifications] Not playing - context not available or suspended");
        return;
      }

      const now = ctx.currentTime;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = config.frequency;
      oscillator.type = config.type;

      const peakGain = this.volume * 0.1;

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(peakGain, now + config.attack);
      gainNode.gain.setValueAtTime(peakGain, now + config.duration - config.release);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration);

      oscillator.start(now);
      oscillator.stop(now + config.duration);

      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    });
  }

  playJoin(): void {
    console.log("[VoiceNotifications] playJoin() called, enabled:", this.enabled);
    this.playTone(JOIN_TONE);
  }

  playLeave(): void {
    console.log("[VoiceNotifications] playLeave() called, enabled:", this.enabled);
    this.playTone(LEAVE_TONE);
  }

  playSelfJoin(): void {
    console.log("[VoiceNotifications] playSelfJoin() called, enabled:", this.enabled);
    this.playTone(SELF_JOIN_TONE);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  destroy(): void {
    if (this.audioContext?.state !== "closed") {
      this.audioContext?.close();
    }
    this.audioContext = null;
  }
}

export const voiceNotifications = new VoiceNotificationManager();
