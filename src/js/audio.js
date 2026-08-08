import { CONFIG } from "./config.js";

/**
 * Forest bed: wind/rain, river, birds, wolf howl, owl, footsteps.
 * Procedural Web Audio — no sample files.
 */
export class AudioBed {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.ambBus = null;
    this.riverGain = null;
    this.started = false;
    this._nodes = [];
    this._callTimer = 4;
    this._melodyTimer = 14;
    this._motif = [196, 233, 262, 294, 330, 294, 262, 233];
    this._motifStep = 0;
    this._dayMix = 0.5;
    this._listenerX = 0;
    this._listenerZ = 10;
    this._stepCooldown = 0;
    this._lastStepSide = 0;
  }

  async unlock() {
    if (this.started) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();

    this.master = this.ctx.createGain();
    this.master.gain.value = CONFIG.audio.master ?? 0.4;
    this.master.connect(this.ctx.destination);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = CONFIG.audio.music ? 0.22 : 0;
    this.musicBus.connect(this.master);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.55;
    this.sfxBus.connect(this.master);

    this.ambBus = this.ctx.createGain();
    this.ambBus.gain.value = 0.28;
    this.ambBus.connect(this.master);

    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.started = true;

    if (CONFIG.audio.rain || CONFIG.audio.wind) this._softAmbience();
    if (CONFIG.audio.river) this._river();
    if (CONFIG.audio.music) this._startScore();

    // Immediate life in the forest so the bed never feels empty
    this._scheduleFirstCalls();
  }

  _scheduleFirstCalls() {
    if (!CONFIG.audio.animals) return;
    setTimeout(() => this.birdCall(), 900);
    setTimeout(() => this.birdCall(), 2400);
    setTimeout(() => {
      if (this._dayMix < 0.45) this.wolfHowl();
      else this.birdCall();
    }, 5000);
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = v;
  }

  setListener(x, z) {
    this._listenerX = x;
    this._listenerZ = z;
  }

  setDayMix(dayPhase) {
    this._dayMix = dayPhase;
    if (!this.musicBus || !this.ambBus || !this.ctx) return;
    const night = 1 - dayPhase;
    this.musicBus.gain.setTargetAtTime(0.16 + night * 0.1, this.ctx.currentTime, 1.2);
    this.ambBus.gain.setTargetAtTime(0.22 + night * 0.08, this.ctx.currentTime, 1.2);
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
    lp1.frequency.value = 520;
    lp1.Q.value = 0.5;

    const lp2 = this.ctx.createBiquadFilter();
    lp2.type = "lowpass";
    lp2.frequency.value = 360;
    lp2.Q.value = 0.7;

    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 70;

    const g = this.ctx.createGain();
    g.gain.value = 0.055;

    src.connect(lp1);
    lp1.connect(lp2);
    lp2.connect(hp);
    hp.connect(g);
    g.connect(this.ambBus);
    src.start();
    this._nodes.push(src);
  }

  /** Flowing water: layered filtered noise + soft tone, volume follows river distance. */
  _river() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.035 * white) / 1.035;
      data[i] = last * 2.8 + white * 0.08;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.7;

    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;

    this.riverGain = this.ctx.createGain();
    this.riverGain.gain.value = 0.04;

    src.connect(bp);
    bp.connect(lp);
    lp.connect(this.riverGain);
    this.riverGain.connect(this.ambBus);
    src.start();
    this._nodes.push(src);

    // Soft undertone of current
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 62;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.14;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const og = this.ctx.createGain();
    og.gain.value = 0.01;
    osc.connect(og);
    og.connect(this.riverGain);
    osc.start();
    lfo.start();
    this._nodes.push(osc, lfo);
  }

  _updateRiverProximity() {
    if (!this.riverGain || !this.ctx) return;
    const r = CONFIG.world.river;
    const dx = this._listenerX - r.x;
    const zMid = (r.z0 + r.z1) / 2;
    const half = (r.z1 - r.z0) / 2;
    const dz = Math.max(0, Math.abs(this._listenerZ - zMid) - half);
    const dist = Math.hypot(dx, dz);
    const near = Math.max(0, 1 - dist / 22);
    const target = 0.018 + near * 0.11;
    this.riverGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.35);
  }

  _startScore() {
    this._drone(98, 0.014, "sine");
    this._drone(147, 0.008, "sine");
    this._drone(196, 0.005, "sine", 0.04);
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
    if (Math.random() < 0.45) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.016, t0 + 0.12);
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

  /** Leaf/dirt footstep — short filtered noise thump. */
  footstep(sprint = false) {
    if (!this.started) return;
    const t0 = this.ctx.currentTime;
    const dur = sprint ? 0.09 : 0.12;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 180 + Math.random() * 120;
    filter.Q.value = 0.9;
    const g = this.ctx.createGain();
    g.gain.value = sprint ? 0.085 : 0.06;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /** Sync steps to walk — call every frame while moving on ground. */
  updateFootsteps(dt, moving, sprint, onGround) {
    if (!this.started) return;
    this._stepCooldown -= dt;
    if (!moving || !onGround) {
      this._stepCooldown = Math.min(this._stepCooldown, 0.08);
      return;
    }
    const interval = sprint ? 0.28 : 0.42;
    if (this._stepCooldown <= 0) {
      this.footstep(sprint);
      this._stepCooldown = interval * (0.92 + Math.random() * 0.16);
      this._lastStepSide ^= 1;
    }
  }

  birdCall() {
    if (!this.started || !CONFIG.audio.animals) return;
    const t0 = this.ctx.currentTime;
    const kind = Math.random();
    if (kind < 0.55) {
      // Short chirp pair
      const base = 1400 + Math.random() * 900;
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        const start = t0 + i * 0.11;
        osc.frequency.setValueAtTime(base * (1 + i * 0.08), start);
        osc.frequency.exponentialRampToValueAtTime(base * 1.35, start + 0.07);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.045, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
        const hp = this.ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 800;
        osc.connect(hp);
        hp.connect(g);
        g.connect(this.sfxBus);
        osc.start(start);
        osc.stop(start + 0.14);
      }
    } else if (kind < 0.85) {
      // Longer warble
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      const base = 900 + Math.random() * 500;
      osc.frequency.setValueAtTime(base, t0);
      osc.frequency.linearRampToValueAtTime(base * 1.4, t0 + 0.18);
      osc.frequency.linearRampToValueAtTime(base * 0.95, t0 + 0.35);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.035, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(t0);
      osc.stop(t0 + 0.42);
    } else {
      // Distant woodpecker taps
      for (let i = 0; i < 4; i++) {
        this._tap(t0 + i * 0.07, 0.03);
      }
    }
  }

  _tap(t0, gain) {
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 2;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    src.start(t0);
    src.stop(t0 + 0.05);
  }

  /** Distant wolf howl — night of the mata. */
  wolfHowl() {
    if (!this.started || !CONFIG.audio.animals) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    const base = 180 + Math.random() * 40;
    osc.frequency.setValueAtTime(base, t0);
    osc.frequency.linearRampToValueAtTime(base * 1.55, t0 + 1.4);
    osc.frequency.linearRampToValueAtTime(base * 1.1, t0 + 2.8);
    osc.frequency.exponentialRampToValueAtTime(base * 0.85, t0 + 3.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 420;
    filter.Q.value = 1.2;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.055, t0 + 0.5);
    g.gain.setValueAtTime(0.05, t0 + 2.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.8);

    // Soft vibrato
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 4.5;
    const lg = this.ctx.createGain();
    lg.gain.value = 8;
    lfo.connect(lg);
    lg.connect(osc.frequency);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + 4);
    lfo.stop(t0 + 4);
  }

  owlHoot() {
    if (!this.started || !CONFIG.audio.animals) return;
    const t0 = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      const start = t0 + i * 0.45;
      osc.frequency.setValueAtTime(380, start);
      osc.frequency.exponentialRampToValueAtTime(280, start + 0.28);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.04, start + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 700;
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.sfxBus);
      osc.start(start);
      osc.stop(start + 0.4);
    }
  }

  /** Legacy alias used by older call sites. */
  animalChirp() {
    this.birdCall();
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

  _pickForestCall() {
    const night = this._dayMix < 0.42;
    const roll = Math.random();
    if (night) {
      if (roll < 0.35) this.wolfHowl();
      else if (roll < 0.7) this.owlHoot();
      else this.birdCall();
    } else {
      if (roll < 0.78) this.birdCall();
      else if (roll < 0.9) this.owlHoot();
      else this.wolfHowl();
    }
  }

  update(dt) {
    if (!this.started) return;
    this._updateRiverProximity();

    if (CONFIG.audio.animals) {
      this._callTimer -= dt;
      if (this._callTimer <= 0) {
        this._pickForestCall();
        const night = this._dayMix < 0.42;
        this._callTimer = night
          ? 8 + Math.random() * 14
          : 5 + Math.random() * 10;
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
