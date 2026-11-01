/**
 * AudioManager — Procedural Web Audio API sound effects and ambient space music synthesizer.
 *
 * Zero external audio assets required. All sounds (lasers, shotgun bursts, homing missiles,
 * laser beams, EMP lightning zaps, explosions, shield hits, power-up chimes, and deep space ambient music)
 * are synthesized in real-time with sub-millisecond latency.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private isMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.45;

  // Ambient space synthesizer state
  private isAmbientPlaying: boolean = false;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private ambientLfoGain: GainNode | null = null;
  private ambientTimer: number | null = null;

  // Cached noise buffer for explosions and shotgun blasts
  private noiseBuffer: AudioBuffer | null = null;

  private constructor() {
    this.setupUnlockListeners();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initializes the AudioContext lazily on user gesture.
   */
  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Create brown/pink noise buffer for explosions
      this.createNoiseBuffer();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Registers automatic unlock listener for browser autoplay policy.
   */
  private setupUnlockListeners(): void {
    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  /**
   * Generates a 2-second stereo pink/brown noise buffer for natural explosion rumbles.
   */
  private createNoiseBuffer(): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration filter
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    this.noiseBuffer = buffer;
  }

  // ---------------------------------------------------------------------------
  // 🌌 Ambient Space Music (Normal time space awaz)
  // ---------------------------------------------------------------------------

  /**
   * Starts procedural deep-space cosmic drone with slow resonant filter breathing
   * and periodic ethereal celestial chimes.
   */
  public startAmbientSpaceMusic(): void {
    if (this.isAmbientPlaying) return;
    const ctx = this.initContext();
    if (!this.musicGain) return;

    this.isAmbientPlaying = true;

    try {
      const now = ctx.currentTime;

      // 1. Dual detuned sub-bass oscillators (55Hz A1 & 55.4Hz binaural beating)
      this.ambientOsc1 = ctx.createOscillator();
      this.ambientOsc2 = ctx.createOscillator();
      this.ambientOsc1.type = 'sawtooth';
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc1.frequency.setValueAtTime(55, now);
      this.ambientOsc2.frequency.setValueAtTime(55.4, now);

      // 2. Resonant Lowpass Filter with slow LFO modulation
      this.ambientFilter = ctx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setValueAtTime(220, now);
      this.ambientFilter.Q.setValueAtTime(3.5, now);

      // 3. LFO to sweep filter cutoff frequency smoothly (0.05 Hz = 20 sec cycle)
      this.ambientLfo = ctx.createOscillator();
      this.ambientLfo.frequency.setValueAtTime(0.05, now);

      this.ambientLfoGain = ctx.createGain();
      this.ambientLfoGain.gain.setValueAtTime(90, now); // Sweeps between 130Hz and 310Hz

      this.ambientLfo.connect(this.ambientLfoGain);
      this.ambientLfoGain.connect(this.ambientFilter.frequency);

      // Drone Gain
      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.001, now);
      droneGain.gain.exponentialRampToValueAtTime(0.35, now + 3); // Smooth 3-second fade in

      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(droneGain);
      droneGain.connect(this.musicGain);

      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);
      this.ambientLfo.start(now);

      // 4. Periodic Celestial Stellar Bells (Ethereal pentatonic chimes in deep space)
      this.scheduleCelestialChimes();
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  /**
   * Randomly triggers soft celestial bell tones echoing through the deep-space void.
   */
  private scheduleCelestialChimes(): void {
    if (!this.isAmbientPlaying) return;

    const playChime = () => {
      if (!this.isAmbientPlaying || !this.ctx || !this.musicGain) return;

      const pentatonic = [220, 277.18, 329.63, 440, 554.37, 659.25]; // A major pentatonic (peaceful space vibe)
      const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Soft chime attack and long decaying space shimmer
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 4);

      // Schedule next celestial chime every 4 to 8 seconds
      const nextDelay = 4000 + Math.random() * 4000;
      this.ambientTimer = window.setTimeout(playChime, nextDelay);
    };

    const initialDelay = 3000 + Math.random() * 2000;
    this.ambientTimer = window.setTimeout(playChime, initialDelay);
  }

  public stopAmbientSpaceMusic(): void {
    this.isAmbientPlaying = false;
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    try {
      this.ambientOsc1?.stop();
      this.ambientOsc2?.stop();
      this.ambientLfo?.stop();
    } catch {
      // Ignore if already stopped
    }
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientLfo = null;
    this.ambientFilter = null;
    this.ambientLfoGain = null;
  }

  // ---------------------------------------------------------------------------
  // 🔫 Weapon Firing Sounds (Goli ki awazein)
  // ---------------------------------------------------------------------------

  /**
   * Default Blaster: Snappy sci-fi laser chirp (880Hz -> 180Hz in 0.08s).
   */
  public playBlasterFire(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(860, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.085);
  }

  /**
   * Plasma Shotgun: Dual-layer punch with sub-kick + multi-burst scatter pop.
   */
  public playShotgunFire(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    // Sub-kick layer
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);

    // Noise blast layer (Shotgun burst)
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(1.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.16);
    }
  }

  /**
   * Homing Missiles: Rocket ignition whoosh + burning thruster roar.
   */
  public playMissileFire(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pitch sweeps up as the rocket ignites and accelerates
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  /**
   * Laser Beam: High-intensity plasma ray hum & sizzle (continuous piercing beam).
   */
  public playLaserBeamFire(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(1100, now);
    osc2.frequency.setValueAtTime(733, now); // Perfect fifth interval for cutting laser buzz

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.12);
    osc2.stop(now + 0.12);
  }

  /**
   * Lightning Arc / EMP: High-voltage electric discharge snap and buzzing zap.
   */
  public playLightningFire(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    // Fast chaotic FM zap
    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gain = ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(540, now);
    carrier.frequency.exponentialRampToValueAtTime(120, now + 0.14);

    modulator.type = 'square';
    modulator.frequency.setValueAtTime(95, now);
    modGain.gain.setValueAtTime(320, now);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    carrier.connect(gain);
    gain.connect(this.sfxGain);

    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + 0.15);
    modulator.stop(now + 0.15);
  }

  // ---------------------------------------------------------------------------
  // 💥 Explosions, Impacts & Shield SFX
  // ---------------------------------------------------------------------------

  /**
   * Deep bass explosion rumble with sub-harmonic thud and decaying low noise.
   */
  public playExplosion(intensity: 'small' | 'medium' | 'large' = 'medium'): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const duration = intensity === 'large' ? 0.8 : intensity === 'medium' ? 0.5 : 0.3;
    const volume = intensity === 'large' ? 0.65 : intensity === 'medium' ? 0.45 : 0.25;

    // 1. Deep Sub-bass Thud
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + duration * 0.7);

    subGain.gain.setValueAtTime(volume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + duration * 0.75);

    // 2. Low-pass Filtered Brown Noise Rumble
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + duration);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(volume * 0.9, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + duration + 0.05);
    }
  }

  /**
   * Crisp impact tick when a projectile strikes an enemy.
   */
  public playEnemyHit(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.025);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Resonant crystalline deflection chime when energy shield absorbs damage.
   */
  public playShieldHit(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(950, now);
    osc2.frequency.setValueAtTime(1425, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.24);
    osc2.stop(now + 0.24);
  }

  /**
   * Heavy thud and alert buzz when the player ship takes hull damage.
   */
  public playPlayerHit(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * Ascending 4-tone harmonic chime (C5-E5-G5-C6) on power-up pickup.
   */
  public playPowerUp(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + i * 0.045;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
    });
  }

  /**
   * Mechanical servo click and energy power-up hum on weapon switch.
   */
  public playWeaponSwitch(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.09);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Ominous low sci-fi warhorn/siren for Boss encounters.
   */
  public playBossAlert(): void {
    const ctx = this.initContext();
    if (!this.sfxGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(82, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.linearRampToValueAtTime(700, now + 0.4);
    filter.frequency.exponentialRampToValueAtTime(150, now + 1.2);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  // ---------------------------------------------------------------------------
  // 🎚️ Volume & Mute Controls
  // ---------------------------------------------------------------------------

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Phaser.Math.Clamp(vol, 0, 1);
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Phaser.Math.Clamp(vol, 0, 1);
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }
}

export const audioManager = AudioManager.getInstance();

