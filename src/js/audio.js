import { CONFIG } from "./config.js";

/**
 * Forest bed + mystical soundtrack (procedural Web Audio).
 * Layers: rain/wind/river · drone · fifth pad · sparse melody · animal calls.
 */
export class AudioBed {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.started = false;
    this._nodes = [];
    this._animalTimer = 0;
    this._melodyTimer = 12;
    this._motif = [196, 247, 294, 330, 392, 330, 294, 247];
    this._motifStep = 0;
    this._dayMix = 0.5;
  }

  async unlock() {
    if (this.started) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = CONFIG.audio.master;
    this.master.connect(this.ctx.destination);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = CONFIG.audio.music ? 0.55 : 0;
    this.musicBus.connect(this.master);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);

    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.started = true;

    if (CONFIG.audio.rain) this._noisePad(0.04, 900, 0.35);
    if (CONFIG.audio.wind) this._noisePad(0.028, 260, 0.14, true);
    if (CONFIG.audio.river) this._river();
    if (CONFIG.audio.music) this._startScore();
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = v;
  }

  setDayMix(dayPhase) {
    this._dayMix = dayPhase;
    if (!this.musicBus) return;
    // Night = thicker pad; day = lighter
    const night = 1 - dayPhase;
    this.musicBus.gain.setTargetAtTime(0.42 + night * 0.28, this.ctx.currentTime, 0.8);
  }

  _noisePad(gain, freq, q, highpass = false) {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = highpass ? "highpass" : "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    src.start();
    this._nodes.push(src);
  }

  _river() {
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 48;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const g = this.ctx.createGain();
    g.gain.value = 0.026;
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    osc.start();
    lfo.start();
    this._nodes.push(osc, lfo);
  }

  _startScore() {
    // Deep drone (root)
    this._drone(98, 0.035, "sine");
    this._drone(147, 0.018, "triangle");
    // Floating fifth
    this._drone(196, 0.012, "sine", 0.07);
    // Slow shimmer LFO on a soft pad
    const pad = this.ctx.createOscillator();
    pad.type = "sine";
    pad.frequency.value = 392;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = 12;
    lfo.connect(lfoG);
    lfoG.connect(pad.frequency);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const g = this.ctx.createGain();
    g.gain.value = 0.012;
    pad.connect(filter);
    filter.connect(g);
    g.connect(this.musicBus);
    pad.start();
    lfo.start();
    this._nodes.push(pad, lfo);
  }

  _drone(freq, gain, type = "sine", vibrato = 0) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    if (vibrato > 0) {
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = vibrato;
      const lg = this.ctx.createGain();
      lg.gain.value = 3;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start();
      this._nodes.push(lfo);
    }
    const g = this.ctx.createGain();
    g.gain.value = gain;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.musicBus);
    osc.start();
    this._nodes.push(osc);
  }

  _melodyNote() {
    if (!this.started || !CONFIG.audio.music) return;
    const freq = this._motif[this._motifStep % this._motif.length];
    this._motifStep++;
    // Bias longer rests — mystery, not arcade
    if (Math.random() < 0.35) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.musicBus);
    osc.start(t0);
    osc.stop(t0 + 2);
  }

  animalChirp() {
    if (!this.started || !CONFIG.audio.animals) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    const base = 520 + Math.random() * 700;
    osc.frequency.setValueAtTime(base, t0);
    osc.frequency.exponentialRampToValueAtTime(base * 1.35, t0 + 0.1);
    osc.frequency.exponentialRampToValueAtTime(base * 0.65, t0 + 0.35);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.045, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + 0.45);
  }

  spiritTone() {
    if (!this.started) return;
    const t0 = this.ctx.currentTime;
    const freqs = [262, 330, 392];
    for (let i = 0; i < freqs.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freqs[i];
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + i * 0.05 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.05 + 1.2);
      osc.connect(g);
      g.connect(this.musicBus);
      osc.start(t0 + i * 0.05);
      osc.stop(t0 + i * 0.05 + 1.3);
    }
  }

  puzzleChime() {
    if (!this.started) return;
    const t0 = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.0, 523.25];
    for (let i = 0; i < chord.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = chord[i];
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.065, t0 + i * 0.07 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.07 + 0.9);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t0 + i * 0.07);
      osc.stop(t0 + i * 0.07 + 1);
    }
  }

  loreChime() {
    if (!this.started) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(440, t0 + 0.4);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + 0.75);
  }

  update(dt) {
    if (!this.started) return;
    if (CONFIG.audio.animals) {
      this._animalTimer -= dt;
      if (this._animalTimer <= 0) {
        this.animalChirp();
        this._animalTimer = 10 + Math.random() * 20;
      }
    }
    if (CONFIG.audio.music) {
      this._melodyTimer -= dt;
      if (this._melodyTimer <= 0) {
        this._melodyNote();
        this._melodyTimer = 6 + Math.random() * 14;
      }
    }
  }
}
