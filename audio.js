/**
 * JUMANJI: The Last Decision - Thriller & Suspense Audio Engine
 * Features ominous low-end drones, Phrygian staccato thriller ostinato,
 * syncopated war-tom heartbeats, and balanced gameplay SFX.
 */

const AUDIO_PREFS_KEY = 'jumanji_audio_prefs_v1';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;
    this.volumes = {
      master: 0.85,
      music: 0.72,
      ambient: 0.48,
      sfx: 0.65
    };
    this.loadPrefs();

    this.loopId = null;
    this.step = 0;
    this.intensity = 1; // 1: Suspense, 2: Hunt/Danger, 3: Boss Climax
    this.realmId = 1;

    this.masterGain = null;
    this.musicGain = null;
    this.ambientGain = null;
    this.sfxGain = null;
    this.reverbSend = null;
    this.ambienceNodes = [];
  }

  loadPrefs() {
    try {
      const raw = localStorage.getItem(AUDIO_PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.muted === 'boolean') this.muted = p.muted;
        if (p.volumes) this.volumes = { ...this.volumes, ...p.volumes };
      }
    } catch (e) { /* ignore */ }
  }

  savePrefs() {
    try {
      localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify({
        muted: this.muted,
        volumes: this.volumes
      }));
    } catch (e) { /* ignore */ }
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volumes.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.volumes.music, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.volumes.ambient, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Dark Thriller Echo Bus
      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.setValueAtTime(0.36, this.ctx.currentTime);
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.setValueAtTime(0.41, this.ctx.currentTime);
      const fb = this.ctx.createGain();
      fb.gain.setValueAtTime(0.38, this.ctx.currentTime);
      const damp = this.ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.setValueAtTime(1100, this.ctx.currentTime);

      this.reverbSend.connect(delay);
      delay.connect(damp);
      damp.connect(fb);
      fb.connect(delay);
      damp.connect(this.masterGain);

      this.initialized = true;
      this.startAmbience();
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(channel, val) {
    const v = Math.max(0, Math.min(1, Number(val)));
    this.volumes[channel] = v;
    if (this.initialized && this.ctx) {
      const t = this.ctx.currentTime;
      if (channel === 'master') this.masterGain.gain.setTargetAtTime(this.muted ? 0 : v, t, 0.04);
      if (channel === 'music') this.musicGain.gain.setTargetAtTime(v, t, 0.04);
      if (channel === 'ambient') this.ambientGain.gain.setTargetAtTime(v, t, 0.04);
      if (channel === 'sfx') this.sfxGain.gain.setTargetAtTime(v, t, 0.04);
    }
    this.savePrefs();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volumes.master, this.ctx.currentTime, 0.05);
    }
    this.savePrefs();
    return this.muted;
  }

  setRealm(realmId) {
    this.realmId = realmId;
  }

  // --- BROODING THRILLER TENSION DRONE ---
  startAmbience() {
    if (!this.initialized || this.ambienceNodes.length > 0) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const droneGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(36.71, this.ctx.currentTime); // D1
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(55.0, this.ctx.currentTime);  // A1

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(65, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    lfo.start();
    this.ambienceNodes.push(osc1, osc2, lfo);
  }

  // --- THRILLER / SUSPENSE SCORE (112 BPM) ---
  startJumanjiDrums(intensity = 1) {
    this.intensity = intensity;
    if (this.loopId) return;

    const bpm = 112;
    const stepMs = ((60 / bpm) / 4) * 1000;

    // Tense D-Phrygian / Minor Ostinato
    const ostinato = [
      146.83, 155.56, 174.61, 146.83, // D3, Eb3, F3, D3
      220.00, 233.08, 220.00, 174.61, // A3, Bb3, A3, F3
      146.83, 155.56, 207.65, 196.00, // D3, Eb3, Ab3(tritone), G3
      174.61, 155.56, 146.83, 130.81  // F3, Eb3, D3, C3
    ];
    const bassRoots = [36.71, 38.89, 36.71, 51.91]; // D1, Eb1, D1, Ab1

    const tick = () => {
      if (!this.initialized || this.muted) {
        this.loopId = setTimeout(tick, stepMs);
        return;
      }

      const t = this.ctx.currentTime;
      const s = this.step % 16;
      const bar = Math.floor(this.step / 16) % 4;

      // 1. Ominous Heartbeat / War-Tom Pulse
      if (s === 0 || s === 3 || s === 8 || s === 11) {
        this.playThrillerTom(s === 0 ? 52 : 64, 0.38, s === 0 ? 0.36 : 0.22, t);
      }

      // 2. Staccato Thriller String / Synth Ostinato (every 8th note)
      if (s % 2 === 0) {
        const note = ostinato[(s + bar * 4) % ostinato.length];
        this.playThrillerPluck(note, 0.16, t);
      }

      // 3. Dark Sub-Bass Pulse
      if (s === 0 || s === 6 || s === 10 || s === 14) {
        this.playThrillerBass(bassRoots[bar], 0.25, t);
      }

      // 4. Suspense Metallic Tick & High-Intensity Pursuit Snare
      if (s % 2 === 1) {
        this.playSuspenseTick(this.intensity >= 2 ? 0.055 : 0.025, t);
      }
      if (this.intensity >= 2 && (s === 4 || s === 12 || s === 15)) {
        this.playThrillerTom(88, 0.22, 0.2, t);
      }

      this.step++;
      this.loopId = setTimeout(tick, stepMs);
    };

    tick();
  }

  setIntensity(level) {
    this.intensity = level;
  }

  stopDrums() {
    if (this.loopId) {
      clearTimeout(this.loopId);
      this.loopId = null;
    }
  }

  playThrillerTom(pitch, decay, vol, time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 2.0, time);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.65, time + decay);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    osc.connect(gain);
    gain.connect(this.musicGain);
    gain.connect(this.reverbSend);
    osc.start(time);
    osc.stop(time + decay + 0.05);
  }

  playThrillerPluck(freq, dur, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1450, time);
    filter.frequency.exponentialRampToValueAtTime(280, time + dur);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.085, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0005, time + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    gain.connect(this.reverbSend);
    osc.start(time);
    osc.stop(time + dur + 0.04);
  }

  playThrillerBass(freq, dur, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(210, time);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  playSuspenseTick(vol, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(4200 + Math.random() * 900, time);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3800, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  // --- BALANCED GAMEPLAY SFX ---
  playSfx(name, opts = {}) {
    if (!this.initialized || this.muted || this.volumes.sfx <= 0.01) return;
    this.resume();
    const t = this.ctx.currentTime;

    switch (name) {
      case 'coin': {
        const mult = Math.min(5, opts.combo || 1);
        const f = 760 * (1 + (mult - 1) * 0.05);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.25, t + 0.06);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }

      case 'throw':
      case 'dodge': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(name === 'dodge' ? 240 : 320, t);
        osc.frequency.exponentialRampToValueAtTime(95, t + 0.12);
        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.14);
        break;
      }

      case 'hit':
      case 'trap': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(145, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }

      case 'pickup':
      case 'powerup':
      case 'checkpoint':
      case 'puzzleSolve':
      case 'levelComplete': {
        const notes = name === 'levelComplete' ? [392, 493.88, 587.33, 783.99] : [523.25, 659.25, 783.99];
        notes.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t + i * 0.06);
          gain.gain.setValueAtTime(0.11, t + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.4);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t + i * 0.06);
          osc.stop(t + i * 0.06 + 0.45);
        });
        break;
      }

      case 'bossRoar': {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(92, t);
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.6);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, t);
        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.7);
        break;
      }

      case 'endingFanfare': {
        [261.63, 329.63, 392, 523.25, 659.25].forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.12);
          gain.gain.setValueAtTime(0.18, t + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 2.0);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t + i * 0.12);
          osc.stop(t + i * 0.12 + 2.1);
        });
        break;
      }

      case 'click': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(640, t);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.04);
        break;
      }
    }
  }
}

export const soundEngine = new SoundEngine();
