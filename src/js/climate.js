import * as THREE from "three";
import { CONFIG } from "./config.js";

const SEASON_ORDER = ["primavera", "verao", "outono", "inverno"];

const SEASONS = {
  primavera: {
    id: "primavera",
    label: "Primavera",
    skyDay: 0xa8cbb8,
    skyNight: 0x1c3228,
    fog: 0x6a8f7a,
    ground: 0x3a6a48,
    leaf: 0x4a9a58,
    sunMult: 1.05,
    weatherWeights: { clear: 0.2, fog: 0.2, rain: 0.4, wind: 0.2, sandstorm: 0 },
  },
  verao: {
    id: "verao",
    label: "Verão",
    skyDay: 0xb8d4a8,
    skyNight: 0x1a2e20,
    fog: 0x8aaa78,
    ground: 0x4a6a38,
    leaf: 0x5aaa48,
    sunMult: 1.25,
    weatherWeights: { clear: 0.35, fog: 0.05, rain: 0.2, wind: 0.15, sandstorm: 0.25 },
  },
  outono: {
    id: "outono",
    label: "Outono",
    skyDay: 0xc4a878,
    skyNight: 0x2a2218,
    fog: 0x8a7058,
    ground: 0x5a4a28,
    leaf: 0xb86a2a,
    sunMult: 0.95,
    weatherWeights: { clear: 0.15, fog: 0.3, rain: 0.15, wind: 0.35, sandstorm: 0.05 },
  },
  inverno: {
    id: "inverno",
    label: "Inverno",
    skyDay: 0x7a9a98,
    skyNight: 0x121c22,
    fog: 0x6a7a80,
    ground: 0x2a3a38,
    leaf: 0x3a5a4a,
    sunMult: 0.75,
    weatherWeights: { clear: 0.1, fog: 0.4, rain: 0.3, wind: 0.2, sandstorm: 0 },
  },
};

const WEATHER = {
  clear: { id: "clear", label: "Céu aberto", rain: 0, wind: 0.15, fog: 0.35, sand: 0 },
  fog: { id: "fog", label: "Névoa", rain: 0, wind: 0.1, fog: 1, sand: 0 },
  rain: { id: "rain", label: "Chuva", rain: 1, wind: 0.35, fog: 0.55, sand: 0 },
  wind: { id: "wind", label: "Vento", rain: 0.05, wind: 1, fog: 0.4, sand: 0.1 },
  sandstorm: { id: "sandstorm", label: "Tempestade de areia", rain: 0, wind: 0.85, fog: 0.7, sand: 1 },
};

function pickWeighted(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0) || 1;
  let r = Math.random() * total;
  for (const [id, w] of entries) {
    r -= w;
    if (r <= 0) return id;
  }
  return entries[0]?.[0] || "clear";
}

/**
 * Seasons + weather clock with rain / wind / sand particles.
 * Day/night still driven by run time; climate tints the world and audio.
 */
export class Climate {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.seasonIndex = 0;
    this.season = SEASONS.primavera;
    this.weather = WEATHER.clear;
    this.seasonT = 0;
    this.weatherT = 0;
    this.seasonLen = CONFIG.world.seasonLengthSec ?? 36;
    this.weatherLen = 12 + Math.random() * 10;
    this.dayPhase = 0.7;
    this.isDay = true;
    this._rain = 0;
    this._wind = 0.15;
    this._fog = 0.35;
    this._sand = 0;
    this._prevSeason = null;
    this._prevWeather = null;
    this._toast = null;
    this._buildParticles();
    // Start with readable weather so rain/wind are not "sound only"
    this.weather = WEATHER.rain;
    this._rain = 0.85;
    this._wind = 0.4;
    this._fog = 0.55;
  }

  _buildParticles() {
    this.rain = this._makePoints(1400, 0xc8e4ff, 0.16, 0.85);
    this.sand = this._makePoints(900, 0xd2b48c, 0.12, 0.8);
    this.wind = this._makePoints(480, 0xeef6f0, 0.11, 0.55);
    this.scene.add(this.rain.points);
    this.scene.add(this.sand.points);
    this.scene.add(this.wind.points);
  }

  _makePoints(count, color, size, opacity) {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 28;
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = -4 - Math.random() * 8;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    return { points, positions, velocities, count, baseOpacity: opacity };
  }

  reset() {
    this.seasonIndex = 0;
    this.season = SEASONS.primavera;
    this.weather = WEATHER.rain;
    this.seasonT = 0;
    this.weatherT = 0;
    this.weatherLen = 12 + Math.random() * 10;
    this._rain = 0.85;
    this._wind = 0.4;
    this._fog = 0.55;
    this._sand = 0;
    this._prevSeason = null;
    this._prevWeather = null;
    this._toast = null;
  }

  update(dt, runTime, dayPhase, followPos) {
    this.dayPhase = dayPhase;
    this.isDay = dayPhase > 0.45;
    this.seasonT += dt;
    this.weatherT += dt;

    if (this.seasonT >= this.seasonLen) {
      this.seasonT = 0;
      this.seasonIndex = (this.seasonIndex + 1) % SEASON_ORDER.length;
      this.season = SEASONS[SEASON_ORDER[this.seasonIndex]];
      this._rollWeather(true);
    } else if (this.weatherT >= this.weatherLen) {
      this._rollWeather(false);
    }

    // Smooth intensities toward weather targets (night thickens fog a bit)
    const night = 1 - dayPhase;
    const targetRain = this.weather.rain;
    const targetWind = this.weather.wind + (this.season.id === "outono" ? 0.1 : 0);
    const targetFog = Math.min(1.15, this.weather.fog + night * 0.15);
    const targetSand = this.weather.sand;
    const k = 1 - Math.exp(-dt * 1.8);
    this._rain += (targetRain - this._rain) * k;
    this._wind += (targetWind - this._wind) * k;
    this._fog += (targetFog - this._fog) * k;
    this._sand += (targetSand - this._sand) * k;

    this._updateParticles(dt, followPos);

    // Season / weather change toasts
    if (this._prevSeason !== this.season.id) {
      this._prevSeason = this.season.id;
      this._toast = { text: `${this.season.label} chega à mata`, ms: 2800 };
    } else if (this._prevWeather !== this.weather.id) {
      this._prevWeather = this.weather.id;
      if (this.weather.id !== "clear") {
        this._toast = { text: this.weather.label, ms: 2200 };
      }
    }
  }

  _rollWeather(force) {
    this.weatherT = 0;
    this.weatherLen = 10 + Math.random() * 14;
    let id = pickWeighted(this.season.weatherWeights);
    // Avoid instant repeat unless forced season change
    if (!force && id === this.weather.id && Math.random() < 0.55) {
      id = pickWeighted(this.season.weatherWeights);
    }
    this.weather = WEATHER[id] || WEATHER.clear;
  }

  _updateParticles(dt, followPos) {
    const ox = followPos?.x ?? 0;
    const oy = (followPos?.y ?? 1.5) + 2;
    const oz = followPos?.z ?? 0;

    this._stepSystem(this.rain, dt, ox, oy, oz, this._rain, {
      vx: this._wind * 4,
      vy: -18 - this._rain * 12,
      vz: this._wind * 2,
      resetY: 14,
      span: 32,
    });
    this._stepSystem(this.sand, dt, ox, oy, oz, this._sand, {
      vx: 10 + this._wind * 12,
      vy: -1.2,
      vz: Math.sin(performance.now() * 0.001) * 3,
      resetY: 9,
      horizontal: true,
      span: 30,
    });
    // Wind streaks — visible when windy even without rain
    const windVis = Math.max(this._wind - 0.2, 0) * 1.35;
    this._stepSystem(this.wind, dt, ox, oy, oz, windVis, {
      vx: 14 + this._wind * 12,
      vy: 0.35,
      vz: 3 + this._wind * 2,
      resetY: 7,
      horizontal: true,
      span: 34,
    });
  }

  _stepSystem(sys, dt, ox, oy, oz, intensity, opts) {
    const { positions, velocities, count, points, baseOpacity } = sys;
    if (!points.material.userData.baseSize) {
      points.material.userData.baseSize = points.material.size;
    }
    points.material.opacity = baseOpacity * Math.min(1, intensity * 1.35);
    points.material.size =
      points.material.userData.baseSize * (1 + Math.min(0.45, intensity * 0.3));
    points.visible = intensity > 0.05;
    if (!points.visible) return;
    points.position.set(ox, 0, oz);
    const span = opts.span || 28;
    const half = span * 0.5;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      positions[ix] += (velocities[ix] + opts.vx) * dt;
      positions[ix + 1] += (velocities[ix + 1] + opts.vy) * dt;
      positions[ix + 2] += (velocities[ix + 2] + opts.vz) * dt;

      const out =
        positions[ix + 1] < 0 ||
        Math.abs(positions[ix]) > half ||
        Math.abs(positions[ix + 2]) > half;
      if (out) {
        positions[ix] = (Math.random() - 0.5) * span;
        positions[ix + 1] = opts.horizontal
          ? Math.random() * opts.resetY
          : opts.resetY * (0.35 + Math.random());
        positions[ix + 2] = (Math.random() - 0.5) * span;
      }
    }
    points.geometry.attributes.position.needsUpdate = true;
  }

  consumeToast() {
    const t = this._toast;
    this._toast = null;
    return t;
  }

  /** Snapshot for world lighting / audio / HUD */
  state() {
    const s = this.season;
    const night = 1 - this.dayPhase;
    return {
      seasonId: s.id,
      seasonLabel: s.label,
      weatherId: this.weather.id,
      weatherLabel: this.weather.label,
      dayPhase: this.dayPhase,
      isDay: this.isDay,
      dayLabel: this.isDay ? "Dia" : "Noite",
      rain: this._rain,
      wind: this._wind,
      fog: this._fog,
      sand: this._sand,
      skyDay: s.skyDay,
      skyNight: s.skyNight,
      fogColor: s.fog,
      ground: s.ground,
      leaf: s.leaf,
      sunMult: s.sunMult * (this.weather.id === "sandstorm" ? 0.55 : this.weather.id === "fog" ? 0.7 : 1),
      fogDensity:
        0.012 +
        this._fog * 0.028 +
        night * 0.006 +
        this._sand * 0.02,
      hudLine: `${s.label} · ${this.isDay ? "Dia" : "Noite"} · ${this.weather.label}`,
    };
  }
}

export { SEASONS, WEATHER, SEASON_ORDER };
