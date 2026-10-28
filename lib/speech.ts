/**
 * Web Speech API Controller (Text-to-Speech)
 * Optimized for mobile Safari (iOS) and Chrome/WebView (Android).
 * Provides continuous playback, onboundary tracking, speed adjustment, and resume fallback.
 */

export interface SpeechOptions {
  rate?: number; // 0.8 to 2.0
  pitch?: number; // 0.5 to 1.5
  lang?: string;
  voice?: SpeechSynthesisVoice | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  onBoundary?: (charIndex: number) => void;
}

class SpeechController {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean;
  private voices: SpeechSynthesisVoice[] = [];
  private resumeTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
    if (this.isSupported) {
      this.loadVoices();
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        this.loadVoices();
      });
    }
  }

  private loadVoices() {
    try {
      this.voices = window.speechSynthesis.getVoices() || [];
    } catch {
      this.voices = [];
    }
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public getPreferredVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null;
    return (
      this.voices.find((v) => /natural|enhanced|google|samantha|daniel|karen/i.test(v.name) && v.lang.startsWith("en")) ||
      this.voices.find((v) => v.lang === "en-US" || v.lang === "en-NZ" || v.lang === "en-GB") ||
      this.voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  }

  public speak(text: string, options: SpeechOptions = {}) {
    if (!this.isSupported) {
      options.onError?.(new Error("Web Speech API is not supported in this browser."));
      return;
    }

    this.stop(); // Clear any ongoing audio

    const cleanText = text.trim();
    if (!cleanText) return;

    this.utterance = new SpeechSynthesisUtterance(cleanText);
    this.utterance.rate = options.rate ?? 1.0;
    this.utterance.pitch = options.pitch ?? 1.0;
    this.utterance.lang = options.lang ?? "en-US";

    const voice = options.voice || this.getPreferredVoice();
    if (voice) {
      this.utterance.voice = voice;
    }

    if (options.onStart) this.utterance.onstart = () => options.onStart?.();
    if (options.onEnd) this.utterance.onend = () => options.onEnd?.();
    if (options.onError) {
      this.utterance.onerror = (e) => {
        const err = (e as any).error;
        if (err === "canceled" || err === "interrupted") return;
        options.onError?.(e);
      };
    }
    if (options.onBoundary) {
      this.utterance.onboundary = (e: SpeechSynthesisEvent) => {
        options.onBoundary?.(e.charIndex || 0);
      };
    }

    // 50ms tick allows the cancel() cleanup on mobile engines to complete
    setTimeout(() => {
      try {
        if (this.utterance) {
          window.speechSynthesis.speak(this.utterance);
        }
      } catch (err) {
        options.onError?.(err);
      }
    }, 50);
  }

  public pause() {
    if (this.isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if (this.isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    if (this.isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      this.utterance = null;
    }
    if (this.resumeTimer) {
      clearTimeout(this.resumeTimer);
      this.resumeTimer = null;
    }
  }

  public isSpeaking(): boolean {
    return this.isSupported && window.speechSynthesis.speaking;
  }

  public isPaused(): boolean {
    return this.isSupported && window.speechSynthesis.paused;
  }
}

export const speechController = new SpeechController();
