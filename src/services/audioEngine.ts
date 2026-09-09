// Web Audio API and Synthetic Voice System for Aethelgard: Echoes of the First Sun

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private isMuted: boolean = false;
  private voiceVolume: number = 0.8;
  private sfxVolume: number = 0.7;
  private isCombatMusic: boolean = false;

  constructor() {
    // Lazy initialized on first user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setMasterMute(muted: boolean) {
    this.isMuted = muted;
  }

  public startBackgroundAmbient() {
    this.startDynamicMusic(false);
  }

  public getMuted() {
    return this.isMuted;
  }

  // --- SOUND EFFECTS ---

  public playSwing(type: 'light' | 'heavy' = 'light') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const now = this.ctx.currentTime;
    const dur = type === 'heavy' ? 0.25 : 0.15;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(type === 'heavy' ? 180 : 280, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'heavy' ? 600 : 900, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2 * this.sfxVolume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
  }

  public playHit(isCrit: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = isCrit ? 0.35 : 0.18;

    // Punch oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isCrit ? 160 : 120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + dur);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);

    // Noise burst for impact
    this.playNoise(0.08, 1200, 0.25 * this.sfxVolume);
  }

  public playPerfectParry() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // High crystalline chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now); // E6

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);

    // Deep resonance thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.3);

    subGain.gain.setValueAtTime(0.45 * this.sfxVolume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.3);
  }

  public playBlock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playDodge() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.playNoise(0.2, 500, 0.15 * this.sfxVolume);
  }

  public playCastSpell() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(940, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3 * this.sfxVolume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playGather() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.08); // C#5
    osc.frequency.setValueAtTime(659.25, now + 0.16); // E5

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playLevelUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const chords = [392, 493.88, 587.33, 783.99]; // G major arpeggio
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      }, idx * 100);
    });
  }

  private playNoise(duration: number, cutoff: number, volume: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // --- AMBIENT DYNAMIC SOUNDTRACK (GENERATIVE) ---

  public startDynamicMusic(isCombat: boolean = false) {
    this.isCombatMusic = isCombat;
    if (this.musicInterval) clearInterval(this.musicInterval);
    if (this.isMuted) return;

    this.musicInterval = setInterval(() => {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Ambient atmospheric progression
      const explorationNotes = [110, 130.81, 146.83, 164.81, 196]; // A minor pentatonic
      const combatNotes = [73.42, 82.41, 87.31, 98, 110]; // Low heavy tension

      const pool = this.isCombatMusic ? combatNotes : explorationNotes;
      const note = pool[Math.floor(Math.random() * pool.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = this.isCombatMusic ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(note, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.isCombatMusic ? 400 : 250, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06 * this.sfxVolume, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 4.5);
    }, 4200);
  }

  public setCombatMusic(inCombat: boolean) {
    if (this.isCombatMusic !== inCombat) {
      this.isCombatMusic = inCombat;
      this.startDynamicMusic(inCombat);
    }
  }

  // --- EXTRA ATMOSPHERIC & CINEMATIC SOUNDS ---

  public playEclipseRoar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 1.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35 * this.sfxVolume, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.0);
  }

  public playRelicSurge() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C shimmering
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start();
        o.stop(this.ctx.currentTime + 0.8);
      }, idx * 120);
    });
  }

  // --- SYNTHETIC VOICE ENGINE ---

  public speakLine(
    text: string,
    character: 'player' | 'kaelen' | 'maeve' | 'malakor' | 'narrator' | 'torvald' | 'varric',
    voiceProfile?: string,
    playerPitch: number = 1.0
  ) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = this.voiceVolume;

    switch (character) {
      case 'kaelen': // Deep, rugged knight
        utterance.pitch = 0.85;
        utterance.rate = 0.95;
        break;
      case 'maeve': // Warm, mystical scholar
        utterance.pitch = 1.15;
        utterance.rate = 0.9;
        break;
      case 'torvald': // Boisterous, hearty dwarven-style blacksmith
        utterance.pitch = 0.75;
        utterance.rate = 1.02;
        break;
      case 'varric': // Wry, quick-witted scout
        utterance.pitch = 0.92;
        utterance.rate = 1.08;
        break;
      case 'malakor': // Menacing, resonant villain
        utterance.pitch = 0.62;
        utterance.rate = 0.84;
        break;
      case 'narrator':
        utterance.pitch = 0.95;
        utterance.rate = 0.90;
        break;
      case 'player':
      default:
        if (voiceProfile === 'rough') {
          utterance.pitch = 0.78;
          utterance.rate = 0.92;
        } else if (voiceProfile === 'warm') {
          utterance.pitch = 1.18;
          utterance.rate = 0.98;
        } else if (voiceProfile === 'confident') {
          utterance.pitch = 1.06;
          utterance.rate = 1.04;
        } else if (voiceProfile === 'mysterious') {
          utterance.pitch = 0.88;
          utterance.rate = 0.86;
        } else if (voiceProfile === 'stoic') {
          utterance.pitch = 0.84;
          utterance.rate = 0.94;
        } else {
          utterance.pitch = playerPitch;
          utterance.rate = 0.96;
        }
        break;
    }

    // Attempt to pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const audioEngine = new AudioEngine();
