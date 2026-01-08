/**
 * AudioManager - Handles game audio including procedural ambient sounds
 * Creates jungle ambience using Web Audio API
 */

class AudioManagerClass {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private nodes: AudioNode[] = [];

  // Ambient sound sources
  private rainNoise: AudioBufferSourceNode | null = null;
  private birdOscillators: OscillatorNode[] = [];
  private cricketOscillator: OscillatorNode | null = null;

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3; // Default volume
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * Start ambient jungle music
   */
  async startAmbient(): Promise<void> {
    if (!this.audioContext || this.isPlaying) {
      await this.init();
    }
    if (!this.audioContext || !this.masterGain) return;

    this.isPlaying = true;

    // Layer 1: Filtered noise for rain/forest ambience
    this.createRainAmbience();

    // Layer 2: Random bird chirps
    this.createBirdSounds();

    // Layer 3: Cricket/insect sounds
    this.createCricketSounds();
  }

  /**
   * Create rain/wind ambience using filtered noise
   */
  private createRainAmbience(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * 2;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate brown noise (more natural sounding)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Amplify
    }

    // Create source
    this.rainNoise = this.audioContext.createBufferSource();
    this.rainNoise.buffer = noiseBuffer;
    this.rainNoise.loop = true;

    // Low-pass filter for gentle rain sound
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 400;
    lowpass.Q.value = 1;

    // Gain for rain volume
    const rainGain = this.audioContext.createGain();
    rainGain.gain.value = 0.15;

    this.rainNoise.connect(lowpass);
    lowpass.connect(rainGain);
    rainGain.connect(this.masterGain);

    this.rainNoise.start();
    this.nodes.push(lowpass, rainGain);
  }

  /**
   * Create random bird chirp sounds
   */
  private createBirdSounds(): void {
    if (!this.audioContext || !this.masterGain) return;

    const scheduleChirp = () => {
      if (!this.isPlaying || !this.audioContext || !this.masterGain) return;

      // Random delay between chirps (2-8 seconds)
      const delay = 2000 + Math.random() * 6000;

      setTimeout(() => {
        if (!this.isPlaying || !this.audioContext || !this.masterGain) return;

        // Create chirp oscillator
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // Random bird frequency (800-2500 Hz)
        const baseFreq = 800 + Math.random() * 1700;
        osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);

        // Chirp up or down
        const targetFreq = baseFreq + (Math.random() - 0.5) * 600;
        osc.frequency.exponentialRampToValueAtTime(
          targetFreq,
          this.audioContext.currentTime + 0.1
        );

        // Quick envelope
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);

        this.birdOscillators.push(osc);

        // Schedule next chirp
        scheduleChirp();
      }, delay);
    };

    // Start multiple bird "voices"
    scheduleChirp();
    setTimeout(() => scheduleChirp(), 1000);
    setTimeout(() => scheduleChirp(), 2500);
  }

  /**
   * Create cricket/insect ambient drone
   */
  private createCricketSounds(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create oscillator for cricket sound
    this.cricketOscillator = this.audioContext.createOscillator();
    this.cricketOscillator.type = 'sine';
    this.cricketOscillator.frequency.value = 4000;

    // Tremolo effect for cricket-like pulsing
    const tremolo = this.audioContext.createGain();
    const lfo = this.audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 15; // Pulse rate

    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 0.5;

    lfo.connect(lfoGain);
    lfoGain.connect(tremolo.gain);

    // Cricket volume
    const cricketGain = this.audioContext.createGain();
    cricketGain.gain.value = 0.02;

    this.cricketOscillator.connect(tremolo);
    tremolo.connect(cricketGain);
    cricketGain.connect(this.masterGain);

    this.cricketOscillator.start();
    lfo.start();

    this.nodes.push(tremolo, lfoGain, cricketGain);
  }

  /**
   * Stop all ambient sounds
   */
  stopAmbient(): void {
    this.isPlaying = false;

    if (this.rainNoise) {
      this.rainNoise.stop();
      this.rainNoise = null;
    }

    if (this.cricketOscillator) {
      this.cricketOscillator.stop();
      this.cricketOscillator = null;
    }

    this.birdOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // May already be stopped
      }
    });
    this.birdOscillators = [];

    this.nodes.forEach(node => {
      try {
        node.disconnect();
      } catch {
        // May already be disconnected
      }
    });
    this.nodes = [];
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current playing state
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Toggle ambient on/off
   */
  async toggleAmbient(): Promise<void> {
    if (this.isPlaying) {
      this.stopAmbient();
    } else {
      await this.startAmbient();
    }
  }
}

// Singleton instance
export const audioManager = new AudioManagerClass();
