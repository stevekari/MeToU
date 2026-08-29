// Helper to safely trigger vibration only when user has interacted with the document
function safeVibrate(pattern) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // In modern browsers, vibrate requires a prior user gesture/activation
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
        return;
      }
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error if blocked or unsupported
    }
  }
}

// Web Audio API sound synthesizer for calling sounds
class CallSoundManager {
  constructor() {
    this.audioContext = null;
    this.incomingInterval = null;
    this.outgoingInterval = null;
    this.isPlaying = false;
    this.currentSound = null;
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  // Play a pair of tones with smooth attack/decay envelope
  playTone(frequencies, duration = 0.4, startTime = 0, volume = 0.15) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const baseTime = ctx.currentTime + startTime;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, baseTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, baseTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, baseTime + duration - 0.02);
    gainNode.connect(ctx.destination);

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, baseTime);
      osc.connect(gainNode);
      osc.start(baseTime);
      osc.stop(baseTime + duration);
    });
  }

  // Incoming call ringtone (loud pleasant repeating digital phone melody)
  startIncomingRingtone() {
    this.stop();
    this.isPlaying = true;
    this.currentSound = 'incoming';

    // Start mobile vibration if supported and user has interacted
    safeVibrate([400, 200, 400, 1000]);

    const ringCycle = () => {
      if (!this.isPlaying || this.currentSound !== 'incoming') return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      // Ring melody: 4 burst tones
      this.playTone([523, 659], 0.22, 0, 0.22);
      this.playTone([659, 784], 0.22, 0.28, 0.22);
      this.playTone([523, 659], 0.22, 0.56, 0.22);
      this.playTone([659, 880], 0.35, 0.84, 0.24);

      safeVibrate([400, 200, 400, 1000]);
    };

    ringCycle();
    this.incomingInterval = window.setInterval(ringCycle, 2400);
  }

  // Outgoing call dialing / ringback tone (Standard 440Hz + 480Hz dial tone pulse)
  startOutgoingRingback() {
    this.stop();
    this.isPlaying = true;
    this.currentSound = 'outgoing';

    const ringbackCycle = () => {
      if (!this.isPlaying || this.currentSound !== 'outgoing') return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      // 1.2s dial pulse followed by silence
      this.playTone([440, 480], 1.2, 0, 0.15);
    };

    ringbackCycle();
    this.outgoingInterval = window.setInterval(ringbackCycle, 3000);
  }

  // Call connected subtle chime
  playConnectedSound() {
    this.stop();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.playTone([587], 0.1, 0, 0.14);
    this.playTone([880], 0.2, 0.12, 0.16);
  }

  // Call ended subtle tone
  playEndedSound() {
    this.stop();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.playTone([480, 400], 0.25, 0, 0.14);
    this.playTone([350, 300], 0.35, 0.28, 0.14);
  }

  // Stop all repeating sounds and vibration
  stop() {
    this.isPlaying = false;
    this.currentSound = null;
    if (this.incomingInterval) {
      clearInterval(this.incomingInterval);
      this.incomingInterval = null;
    }
    if (this.outgoingInterval) {
      clearInterval(this.outgoingInterval);
      this.outgoingInterval = null;
    }
    safeVibrate(0);
  }
}

export const callSounds = new CallSoundManager();


