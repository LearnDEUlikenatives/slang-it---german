// Web Audio API Synthesizer + Web Speech API (TTS & Speech Recognition)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('touchstart', unlock, { passive: true, once: true });
      window.addEventListener('click', unlock, { passive: true, once: true });
      window.addEventListener('keydown', unlock, { passive: true, once: true });
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public unlockAudio() {
    if (this.isUnlocked) return;
    try {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.isUnlocked = true;
    } catch {}
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Play a happy cartoon "Pop" sound
  public playPop() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // AudioContext fallback
    }
  }

  // Play a triumphant correct chime
  public playCorrect() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = this.ctx!.currentTime + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {
      // AudioContext fallback
    }
  }

  // Play a cartoon buzzer / strike sound
  public playWrong() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch {
      // AudioContext fallback
    }
  }

  // Play Level Up Fanfare
  public playLevelUp() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = this.ctx!.currentTime + idx * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // AudioContext fallback
    }
  }

  // Party Buzzer Sound
  public playBuzzer() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.setValueAtTime(320, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // AudioContext fallback
    }
  }

  // Clock tick for countdown
  public playTick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // AudioContext fallback
    }
  }
}

export const sounds = new SoundEngine();

// Text to Speech
let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const current = window.speechSynthesis.getVoices();
    if (current.length > 0) {
      cachedVoices = current;
      resolve(current);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
    // Fallback if onvoiceschanged doesn't trigger
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 200);
  });
}

// Pre-trigger voice load in browser
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

export function speakGerman(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined') {
    onEnd?.();
    return;
  }

  // Check if browser/Android WebView supports speechSynthesis
  if (!('speechSynthesis' in window) || !window.speechSynthesis) {
    console.warn('Speech synthesis not available in this environment');
    onEnd?.();
    return;
  }

  try {
    // If speech synthesis is paused or stuck, resume it
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    // Cancel any ongoing/stuck utterances
    window.speechSynthesis.cancel();
  } catch {}

  // Clean text and prepare utterance
  const cleanedText = text.replace(/_+/g, ' ').replace(/[«»"]/g, '').trim();
  if (!cleanedText) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.lang = 'de-DE';
  utterance.rate = 0.90; // Natural tempo
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  let hasEnded = false;
  const finish = () => {
    if (!hasEnded) {
      hasEnded = true;
      onEnd?.();
    }
  };

  utterance.onend = finish;
  utterance.onerror = (e) => {
    console.warn('Speech synthesis error or cancelled:', e);
    finish();
  };

  // Safety timeout in case browser never fires onend
  setTimeout(finish, 8000);

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  // Find a German voice
  const germanVoice = voices.find(
    (v) =>
      v.lang.toLowerCase() === 'de-de' ||
      v.lang.toLowerCase().startsWith('de') ||
      v.name.toLowerCase().includes('german') ||
      v.name.toLowerCase().includes('deutsch')
  );

  if (germanVoice) {
    utterance.voice = germanVoice;
  }

  try {
    window.speechSynthesis.speak(utterance);
    // Workaround for Android / Chromium WebView where speak() doesn't start until resumed
    setTimeout(() => {
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 50);
  } catch (err) {
    console.error('Failed to trigger speak:', err);
    finish();
  }
}

// Voice Recognition Helper (Web Speech Recognition API)
export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onError: (err: any) => void,
  onEnd: () => void
) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech recognition not supported in this browser');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      onResult(finalTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      onError(event.error);
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  } catch (e) {
    onError(e);
    return null;
  }
}
