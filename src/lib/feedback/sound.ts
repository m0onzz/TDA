import type { FeedbackSound } from "@/lib/feedback/types";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

const SOUND_SEQUENCES: Record<
  FeedbackSound,
  Array<{ frequency: number; duration: number; volume: number; type?: OscillatorType; delay?: number }>
> = {
  tap: [{ frequency: 880, duration: 0.04, volume: 0.04, type: "triangle" }],
  navigate: [
    { frequency: 420, duration: 0.06, volume: 0.03, type: "sine" },
    { frequency: 560, duration: 0.08, volume: 0.025, type: "sine", delay: 0.04 },
  ],
  toggle: [{ frequency: 640, duration: 0.05, volume: 0.035, type: "triangle" }],
  success: [
    { frequency: 523, duration: 0.08, volume: 0.04, type: "sine" },
    { frequency: 659, duration: 0.1, volume: 0.04, type: "sine", delay: 0.07 },
    { frequency: 784, duration: 0.14, volume: 0.035, type: "sine", delay: 0.14 },
  ],
  error: [
    { frequency: 220, duration: 0.12, volume: 0.05, type: "square" },
    { frequency: 180, duration: 0.16, volume: 0.04, type: "square", delay: 0.1 },
  ],
};

export function playFeedbackSound(sound: FeedbackSound): void {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  const sequence = SOUND_SEQUENCES[sound];
  const startTime = ctx.currentTime;

  for (const note of sequence) {
    const noteStart = startTime + (note.delay ?? 0);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = note.type ?? "sine";
    oscillator.frequency.setValueAtTime(note.frequency, noteStart);
    gain.gain.setValueAtTime(note.volume, noteStart);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      noteStart + note.duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(noteStart);
    oscillator.stop(noteStart + note.duration);
  }
}

export function primeAudioContext(): void {
  void getAudioContext()?.resume();
}
