/**
 * Web Speech API Controller (Text-to-Speech)
 * Provides play, pause, resume, cancel, and playback rate adjustment.
 */

export interface SpeechOptions {
  rate?: number; // 0.8 to 1.5
  pitch?: number; // 0.5 to 1.5
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  onBoundary?: (charIndex: number) => void;
}

class SpeechController {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }

  public speak(text: string, options: SpeechOptions = {}) {
    if (!this.isSupported) {
      if (options.onError) {
        options.onError(new Error("Web Speech API is not supported in this browser."));
      }
      return;
    }

    this.stop(); // Stop any currently playing audio

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.rate = options.rate ?? 1.0;
    this.utterance.pitch = options.pitch ?? 1.0;
    this.utterance.lang = options.lang ?? "en-NZ"; // Default to English (New Zealand) or en-US

    if (options.onStart) this.utterance.onstart = () => options.onStart?.();
    if (options.onEnd) this.utterance.onend = () => options.onEnd?.();
    if (options.onError) this.utterance.onerror = (e) => options.onError?.(e);

    window.speechSynthesis.speak(this.utterance);
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
      window.speechSynthesis.cancel();
      this.utterance = null;
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
