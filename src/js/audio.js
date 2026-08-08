import { CONFIG } from "./config.js";

/**
 * Soft forest bed + sparse score.
 * Avoids harsh white-noise hiss — brown noise + heavy lowpass only.
 */
export class AudioBed {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.ambBus = null;
    this.started = false;
    this._nodes = [];
    this._animalTimer = 18;
    this._melodyTimer = 16;
    this._motif = [196, 233, 262, 294, 330, 294, 262, 233];
    this._motifStep = 0;
    this._dayMix = 0.5;
  }

  async unlock() {
    if (this.started) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();

    this.master = this.ctx.createGain();
    this.master.gain.value = CONFIG.audio.master ?? 0.35;
    this.master.connect(this.ctx.destination);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = CONFIG.audio.music ? 0.28 : 0;
    this.musicBus.connect(this.master);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.45;
    this.sfxBus.connect(this.master);

    this.ambBus = this.ctx.createGain();
    this.ambBus.gain.value = 0.22;
    this.ambBus.connect(this.master);

    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.started = true;

    // Soft ambience only — no raw white noise hiss
    if (CONFIG.audio.rain || CONFIG.audio.wind) this._softAmbience();
    if (CONFIG.audio.river) this._river();
    if (CONFIG.audio.music) this._startScore();
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = v;
  }

  setDayMix(dayPhase) {
    this._dayMix = dayPhase;
    if (!this.musicBus || !this.ambBus || !this.ctx) return;
    const night = 1 - dayPhase;
    this.musicBus.gain.setTargetAtTime(0.22 + night * 0.12, this.ctx.currentTime, 1.2);
    this.ambBus.gain.setTargetAtTime(0.16 + night * 0.1, this.ctx.currentTime, 1.2);
  }

  /** Brown-ish noise through stacked lowpass — rain/wind without hiss. */
  _softAmbience() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const lp1 = this.ctx.createBiquadFilter();
    lp1.type = "lowpass";
    lp1.frequency.value = 480;
    lp1.Q.value = 0.5;

    const lp2 = this.ctx.createBiquadFilter();
    lp2.type = "lowpass";
    lp2.frequency.value = 320;
    lp2.Q.value = 0.7;

    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 80;

    const g = this.ctx.createGain();
    g.gain.value = 0.045;

    src.connect(lp1);
    lp1.connect(lp2);
    lp2.connect(hp);
    hp.connect(g);
    g.connect(this.ambBus);
    src.start();
    this._nodes.push(src);
  }

  _river() {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 55;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    const g = this.ctx.createGain();
    g.gain.value = 0.012;
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.ambBus);
    osc.start();
    lfo.start();
    this._nodes.push(osc, lfo);
  }

  _startScore() {
    this._drone(98, 0.018, "sine");
    this._drone(147, 0.01, "sine");
    this._drone(196, 0.007, "sine", 0.04);
  }

  _drone(freq, gain, type = "sine", vibrato = 0) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    if (vibrato > 0) {
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = vibrato;
      const lg = this.ctx.createGain();
      lg.gain.value = 1.5;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start();
      this._nodes.push(lfo);
    }
    const g = this.ctx.createGain();
    g.gain.value = gain;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
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
    if (Math.random() < 0.55) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.018, t0 + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.musicBus);
    osc.start(t0);
    osc.stop(t0 + 2.4);
  }

  animalChirp() {
    if (!this.started || !CONFIG.audio.animals) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    const base = 480 + Math.random() * 280;
    osc.frequency.setValueAtTime(base, t0);
    osc.frequency.exponentialRampToValueAtTime(base * 1.15, t0 + 0.12);
    osc.frequency.exponentialRampToValueAtTime(base * 0.85, t0 + 0.35);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.02, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + 0.45);
  }

  spiritTone() {
    if (!this.started) return;
    const t0 = this.ctx.currentTime;
    const freqs = [220, 277, 330];
    for (let i = 0; i < freqs.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freqs[i];
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.022, t0 + i * 0.06 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.06 + 1.1);
      osc.connect(g);
      g.connect(this.musicBus);
      osc.start(t0 + i * 0.06);
      osc.stop(t0 + i * 0.06 + 1.2);
    }
  }

  puzzleChime() {
    if (!this.started) return;
    const t0 = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.0];
    for (let i = 0; i < chord.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = chord[i];
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0 + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.03, t0 + i * 0.08 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.08 + 0.85);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t0 + i * 0.08);
      osc.stop(t0 + i * 0.08 + 0.95);
    }
  }

  loreChime() {
    if (!this.started) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(196, t0);
    osc.frequency.exponentialRampToValueAtTime(294, t0 + 0.45);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.025, t0 + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.75);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + 0.8);
  }

  update(dt) {
    if (!this.started) return;
    if (CONFIG.audio.animals) {
      this._animalTimer -= dt;
      if (this._animalTimer <= 0) {
        this.animalChirp();
        this._animalTimer = 14 + Math.random() * 22;
      }
    }
    if (CONFIG.audio.music) {
      this._melodyTimer -= dt;
      if (this._melodyTimer <= 0) {
        this._melodyNote();
        this._melodyTimer = 10 + Math.random() * 18;
      }
    }
  }
}
