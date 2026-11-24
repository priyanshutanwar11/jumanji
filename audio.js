/**
 * Jumanji: The Last Decision - Web Audio Sound Engine
 * Procedural tribal percussion, ambient jungle soundscapes, and cinematic SFX.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;
    this.volume = 0.8;
    this.drumLoopId = null;
    this.drumStep = 0;
    this.drumIntensity = 1; // 1: Exploration, 2: Alert/Pursuit, 3: Climax/Altar
    this.ambienceNodes = [];
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbience();
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  // --- AMBIENT SOUNDSCAPE (Wind, distant jungle calls, crickets) ---
  startAmbience() {
    if (!this.initialized || this.ambienceNodes.length > 0) return;

    // Pink / Brown noise for jungle wind and foliage rustle
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    const ambGain = this.ctx.createGain();
    ambGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(ambGain);
    ambGain.connect(this.musicGain);

    whiteNoise.start();
    this.ambienceNodes.push(whiteNoise, filter, ambGain);

    // Random jungle bird / cricket chirps interval
    this.cricketInterval = setInterval(() => {
      if (Math.random() < 0.4 && !this.muted && this.ctx && this.ctx.state === 'running') {
        this.playBirdChirp();
      }
    }, 3500);
  }

  playBirdChirp() {
    if (!this.initialized || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    const baseFreq = 2200 + Math.random() * 1200;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, t + 0.16);

    gain.gain.setValueAtTime(0.015, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // --- PROCEDURAL JUMANJI TRIBAL DRUMS ---
  startJumanjiDrums(intensity = 1) {
    this.drumIntensity = intensity;
    if (this.drumLoopId) return;

    const bpm = 118;
    const stepTime = (60 / bpm) / 4; // 16th notes

    const tick = () => {
      if (!this.initialized || this.muted) {
        this.drumLoopId = setTimeout(tick, stepTime * 1000);
        return;
      }

      const t = this.ctx.currentTime;
      const s = this.drumStep % 16;

      // Jumanji classic polyrhythm pattern
      // Deep war tom on beats 0, 4, 8, 11, 14
      if (s === 0 || s === 8) {
        this.playTom(68, 0.45, 0.28, t);
      } else if (s === 4 || s === 11 || s === 14) {
        this.playTom(82, 0.35, 0.22, t);
      }

      // Mid tribal bongo / djembe
      if (s === 2 || s === 6 || s === 10 || s === 12) {
        this.playDjembe(160 + (s % 3) * 25, 0.22, 0.14, t);
      }

      // Shaker / seed rattle on 16th notes
      if (s % 2 === 0 || this.drumIntensity >= 2) {
        this.playShaker(0.06 * (s % 4 === 2 ? 1.4 : 0.8), t);
      }

      // High tension drums when intensity >= 2 (Enemy near or chasing)
      if (this.drumIntensity >= 2) {
        if (s === 3 || s === 7 || s === 15) {
          this.playTom(110, 0.4, 0.18, t);
        }
      }

      // Epic climax war horns / sub pulses at intensity 3
      if (this.drumIntensity >= 3 && s === 0) {
        this.playAltarDrone(t);
      }

      this.drumStep++;
      this.drumLoopId = setTimeout(tick, stepTime * 1000);
    };

    tick();
  }

  setIntensity(level) {
    this.drumIntensity = level;
  }

  stopDrums() {
    if (this.drumLoopId) {
      clearTimeout(this.drumLoopId);
      this.drumLoopId = null;
    }
  }

  playTom(pitch, decay, vol, time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch * 1.8, time);
    osc.frequency.exponentialRampToValueAtTime(pitch, time + 0.06);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, time + decay);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + decay + 0.05);
  }

  playDjembe(pitch, decay, vol, time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(pitch, time + decay);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + decay + 0.05);
  }

  playShaker(vol, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2400 + Math.random() * 800, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, time);

    gain.gain.setValueAtTime(vol * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  playAltarDrone(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, time); // A1 note
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 1.9);
  }

  // --- GAMEPLAY SOUND EFFECTS ---
  playSfx(name, opts = {}) {
    if (!this.initialized || this.muted) return;
    this.resume();
    const t = this.ctx.currentTime;

    switch (name) {
      case 'step': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const freq = 90 + Math.random() * 30;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.07);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }

      case 'jump': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.15);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);
        break;
      }

      case 'pickup': {
        // Mystical resonant chime chord
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.04);
          gain.gain.setValueAtTime(0.18, t + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.04 + 0.6);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t + i * 0.04);
          osc.stop(t + i * 0.04 + 0.65);
        });
        break;
      }

      case 'smash': {
        // Dr. Bravestone's Smoldering Smash
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.45);
        break;
      }

      case 'decrypt': {
        // Prof. Oberon's Glyph Decryption (magical arpeggio)
        [440, 554, 659, 880, 1108].forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.06);
          gain.gain.setValueAtTime(0.16, t + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.4);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t + i * 0.06);
          osc.stop(t + i * 0.06 + 0.45);
        });
        break;
      }

      case 'flare': {
        // Seaplane's Signal Flare whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.25);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.42);
        break;
      }

      case 'whisper': {
        // Mouse Finbar's Beast Whisper flute
        [392, 440, 523, 587].forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t + i * 0.1);
          gain.gain.setValueAtTime(0.2, t + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + 0.5);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t + i * 0.1);
          osc.stop(t + i * 0.1 + 0.55);
        });
        break;
      }

      case 'kick': {
        // Ruby Roundhouse Dance Fight combo whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.22);
        break;
      }

      case 'lockpick': {
        // Ming Fleetfoot stealth lock click
        for (let i = 0; i < 3; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1400 + i * 300, t + i * 0.08);
          gain.gain.setValueAtTime(0.15, t + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.05);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t + i * 0.08);
          osc.stop(t + i * 0.08 + 0.06);
        }
        break;
      }

      case 'guardianRoar': {
        // Cursed Jaguar Guardian Roar
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.linearRampToValueAtTime(80, t + 0.4);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.7);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);

        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.8);
        break;
      }

      case 'hit': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      }

      case 'puzzleSolve': {
        // Major triumphant chord
        [261.63, 329.63, 392.00, 523.25, 659.25].forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t + i * 0.08);
          gain.gain.setValueAtTime(0.28, t + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 1.2);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t + i * 0.08);
          osc.stop(t + i * 0.08 + 1.3);
        });
        break;
      }

      case 'dialogue': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540 + Math.random() * 80, t);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }

      case 'click': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.04);
        break;
      }

      case 'endingFanfare': {
        const chord = opts.type === 'conquer' ? [220, 261.63, 329.63, 440] : [261.63, 329.63, 392, 523.25, 659.25, 783.99];
        chord.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.12);
          gain.gain.setValueAtTime(0.3, t + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 2.5);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t + i * 0.12);
          osc.stop(t + i * 0.12 + 2.6);
        });
        break;
      }
    }
  }
}

export const soundEngine = new SoundEngine();
