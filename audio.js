/**
 * Jumanji - Deep House Ambience Music Engine
 * Keeps only the smooth 122 BPM Deep House Mix ambience as the primary sound.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.muted = false;
    this.volume = 0.8;
    this.loopId = null;
    this.step = 0;
    this.intensity = 1;
    this.masterGain = null;
    this.musicGain = null;
    this.reverbSend = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Warm Stereo Delay Bus for Deep House Chords
      this.reverbSend = this.ctx.createGain();
      this.reverbSend.gain.setValueAtTime(0.32, this.ctx.currentTime);
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.setValueAtTime(0.368, this.ctx.currentTime);
      const fb = this.ctx.createGain();
      fb.gain.setValueAtTime(0.35, this.ctx.currentTime);
      const damp = this.ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.setValueAtTime(1350, this.ctx.currentTime);

      this.reverbSend.connect(delay);
      delay.connect(damp);
      damp.connect(fb);
      fb.connect(delay);
      damp.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  startJumanjiDrums(intensity = 1) {
    this.intensity = intensity;
    if (this.loopId) return;

    const bpm = 122;
    const stepMs = ((60 / bpm) / 4) * 1000;

    // Deep House Chord Progression (Fm9 -> Dbmaj7 -> Bbm7 -> C7sus4)
    const chords = [
      [174.61, 207.65, 261.63, 311.13],
      [138.59, 174.61, 207.65, 261.63],
      [116.54, 138.59, 174.61, 207.65],
      [130.81, 174.61, 196.00, 233.08]
    ];
    const bassRoots = [43.65, 34.65, 58.27, 65.41];

    const tick = () => {
      if (!this.initialized || this.muted) {
        this.loopId = setTimeout(tick, stepMs);
        return;
      }

      const t = this.ctx.currentTime;
      const s = this.step % 16;
      const bar = Math.floor(this.step / 16) % 4;

      // 4-on-the-floor Deep House Kick
      if (s % 4 === 0) {
        this.playHouseKick(t);
      }

      // Crisp Off-beat Open Hi-Hat
      if (s % 4 === 2) {
        this.playHouseHat(0.075, 0.075, t);
      } else if (s % 2 === 1 && this.intensity >= 2) {
        this.playHouseHat(0.025, 0.025, t);
      }

      // Soft Clap on 2 & 4
      if (s === 4 || s === 12) {
        this.playHouseClap(t);
      }

      // Groovy Deep Sub-Bass
      if (s === 0 || s === 3 || s === 6 || s === 8 || s === 10 || s === 14) {
        const root = bassRoots[bar];
        this.playDeepBass(s === 14 ? root * 1.5 : root, 0.22, t);
      }

      // Lush Deep House Pad Chords
      if (s === 0 || (this.intensity >= 2 && s === 10)) {
        this.playDeepChord(chords[bar], s === 0 ? 1.65 : 0.45, t);
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

  playHouseKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(132, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.055);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.28);
    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.32);
  }

  playDeepBass(freq, dur, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, time);
    filter.frequency.exponentialRampToValueAtTime(105, time + dur);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.24, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  playDeepChord(notes, dur, time) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, time);
    filter.frequency.linearRampToValueAtTime(900, time + dur * 0.3);
    filter.frequency.exponentialRampToValueAtTime(320, time + dur);

    const chordGain = this.ctx.createGain();
    chordGain.gain.setValueAtTime(0.001, time);
    chordGain.gain.linearRampToValueAtTime(0.08, time + 0.08);
    chordGain.gain.exponentialRampToValueAtTime(0.0005, time + dur);

    filter.connect(chordGain);
    chordGain.connect(this.musicGain);
    chordGain.connect(this.reverbSend);

    notes.forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    });
  }

  playHouseHat(vol, dur, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(6200 + Math.random() * 1400, time);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5200, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  playHouseClap(time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900 + Math.random() * 400, time);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    gain.gain.setValueAtTime(0.085, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.reverbSend);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  // Ambience-only mode: keep SFX silent so Deep House mix stays clean
  playSfx() {}
}

export const soundEngine = new SoundEngine();
