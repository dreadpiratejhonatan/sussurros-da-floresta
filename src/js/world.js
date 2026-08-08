import * as THREE from "three";
import { CONFIG } from "./config.js";
import { seededRand } from "./rng.js";

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.puzzleMeshes = new Map();
    this.loreMeshes = new Map();
    this.fireflies = [];
    this.footprints = [];
    this.fogMult = 1;
    this.dayMult = 1;
    this._sun = null;
    this._hemi = null;
    this._build();
  }

  setAtmosphere({ fogMult = 1, dayMult = 1 } = {}) {
    this.fogMult = fogMult;
    this.dayMult = dayMult;
    if (this.scene.fog) this.scene.fog.density = 0.016 * fogMult;
    if (this._sun) this._sun.intensity = 1.15 * dayMult;
    if (this._hemi) this._hemi.intensity = 1.05 * dayMult;
    if (this._fill) this._fill.intensity = 0.55 * dayMult;
  }

  _build() {
    const w = CONFIG.world;
    const { colors } = CONFIG;
    this.scene.background = new THREE.Color(w.skyDay);
    this.scene.fog = new THREE.FogExp2(w.fog, 0.016);

    this._hemi = new THREE.HemisphereLight(0xd8efe4, 0x3a5a44, 1.05);
    this.scene.add(this._hemi);
    this._sun = new THREE.DirectionalLight(0xfff6e8, 1.15);
    this._sun.position.set(14, 30, 10);
    this._sun.castShadow = true;
    this._sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(this._sun);
    // Soft fill so Albert and props stay readable in fog
    this._fill = new THREE.DirectionalLight(0xc8e6d8, 0.55);
    this._fill.position.set(-10, 18, -8);
    this.scene.add(this._fill);

    this._groundMat = new THREE.MeshStandardMaterial({ color: w.ground, roughness: 0.96 });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(w.size, 72), this._groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this._leafMats = [];

    this._addRiver();
    this._scatterProps();
    for (const p of CONFIG.puzzles) this._addPuzzle(p);
    for (const l of CONFIG.lore) this._addLore(l);
    this._addFireflies();
    this._addFootprintTrails();
  }

  _addRiver() {
    const r = CONFIG.world.river;
    const len = r.z1 - r.z0;
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(r.width, len),
      new THREE.MeshStandardMaterial({
        color: CONFIG.colors.river,
        roughness: 0.25,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(r.x, 0.04, (r.z0 + r.z1) / 2);
    this.scene.add(water);
  }

  _scatterProps() {
    const rand = seededRand(CONFIG.world.seed);
    const size = CONFIG.world.size;
    const { trees, rocks, grass } = CONFIG.world.props;

    for (let i = 0; i < trees; i++) {
      const ang = rand() * Math.PI * 2;
      const dist = 5 + rand() * (size - 8);
      const x = Math.cos(ang) * dist;
      const z = Math.sin(ang) * dist;
      if (this._nearPath(x, z, 2.4)) continue;
      if (this._nearRiver(x, z, 2.2)) continue;
      this._addTree(x, z, 0.65 + rand() * 1.1, rand);
    }

    for (let i = 0; i < rocks; i++) {
      const ang = rand() * Math.PI * 2;
      const dist = 4 + rand() * (size - 10);
      const x = Math.cos(ang) * dist;
      const z = Math.sin(ang) * dist;
      if (this._nearPath(x, z, 1.8)) continue;
      this._addRock(x, z, 0.35 + rand() * 0.6);
    }

    const grassGeo = new THREE.ConeGeometry(0.08, 0.45, 3);
    const grassMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.leaf, roughness: 1 });
    this._leafMats.push(grassMat);
    for (let i = 0; i < grass; i++) {
      const ang = rand() * Math.PI * 2;
      const dist = 3 + rand() * (size - 6);
      const blade = new THREE.Mesh(grassGeo, grassMat);
      blade.position.set(Math.cos(ang) * dist, 0.2, Math.sin(ang) * dist);
      blade.rotation.y = rand() * Math.PI;
      this.scene.add(blade);
    }
  }

  _nearPath(x, z, r) {
    return Math.abs(x) < r && z > -2 && z < 14;
  }

  _nearRiver(x, z, r) {
    const river = CONFIG.world.river;
    return Math.abs(x - river.x) < river.width * 0.5 + r && z >= river.z0 - r && z <= river.z1 + r;
  }

  _addTree(x, z, scale, rand) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const trunkH = 2.5 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * scale, 0.26 * scale, trunkH, 7),
      new THREE.MeshStandardMaterial({ color: CONFIG.colors.bark, roughness: 0.92 })
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.leaf, roughness: 0.88 });
    this._leafMats.push(leafMat);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.35 * scale, 3.1 * scale, 7), leafMat);
    canopy.position.y = trunkH + 1.05 * scale;
    canopy.castShadow = true;
    group.add(canopy);
    if (rand() > 0.4) {
      const mid = new THREE.Mesh(new THREE.ConeGeometry(1.05 * scale, 2.3 * scale, 7), leafMat);
      mid.position.y = trunkH + 0.15 * scale;
      group.add(mid);
    }
    this.scene.add(group);
    this.colliders.push({ x, z, r: 0.42 * scale });
  }

  _addRock(x, z, scale) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(scale, 0),
      new THREE.MeshStandardMaterial({ color: 0x4a554c, roughness: 0.9 })
    );
    rock.position.set(x, scale * 0.45, z);
    rock.rotation.set(0.2, 0.4, 0.1);
    rock.castShadow = true;
    this.scene.add(rock);
    this.colliders.push({ x, z, r: scale * 0.7 });
  }

  _addPuzzle(p) {
    const group = new THREE.Group();
    group.position.set(p.x, 0, p.z);

    let mesh;
    if (p.id.includes("hub")) {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.55, 2.2, 8),
        new THREE.MeshStandardMaterial({
          color: 0x5a6a5e,
          emissive: CONFIG.colors.glow,
          emissiveIntensity: 0.2,
          roughness: 0.65,
        })
      );
      mesh.position.y = 1.1;
    } else if (p.id.includes("river")) {
      mesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.7, 0),
        new THREE.MeshStandardMaterial({
          color: 0x4a6a72,
          emissive: CONFIG.colors.tech,
          emissiveIntensity: 0.25,
          roughness: 0.55,
        })
      );
      mesh.position.y = 0.55;
    } else if (p.id.includes("roots")) {
      mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.18, 8, 16),
        new THREE.MeshStandardMaterial({
          color: 0x3a5a28,
          emissive: CONFIG.colors.glow,
          emissiveIntensity: 0.3,
          roughness: 0.7,
        })
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = 0.35;
    } else if (p.id.includes("mirror")) {
      mesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 24),
        new THREE.MeshStandardMaterial({
          color: 0x88aaaa,
          emissive: CONFIG.colors.tech,
          emissiveIntensity: 0.35,
          metalness: 0.8,
          roughness: 0.15,
          side: THREE.DoubleSide,
        })
      );
      mesh.position.y = 1.1;
    } else {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.6, 0.25),
        new THREE.MeshStandardMaterial({
          color: 0x3a2a18,
          emissive: CONFIG.colors.glow,
          emissiveIntensity: 0.15,
          roughness: 0.8,
        })
      );
      mesh.position.y = 0.85;
    }
    mesh.castShadow = true;
    group.add(mesh);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.15, 28),
      new THREE.MeshBasicMaterial({
        color: CONFIG.colors.glow,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    group.add(ring);

    this.scene.add(group);
    this.puzzleMeshes.set(p.id, { group, mesh, ring, solved: false });
    this.colliders.push({ x: p.x, z: p.z, r: 0.7 });
  }

  _addLore(l) {
    const group = new THREE.Group();
    group.position.set(l.x, 0, l.z);
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.9, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x4a3a28,
        emissive: 0x3a6048,
        emissiveIntensity: 0.2,
        roughness: 0.85,
      })
    );
    slab.position.y = 0.5;
    slab.castShadow = true;
    group.add(slab);
    const rune = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.2, 5),
      new THREE.MeshBasicMaterial({
        color: CONFIG.colors.tech,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      })
    );
    rune.position.set(0, 0.55, 0.07);
    group.add(rune);
    this.scene.add(group);
    this.loreMeshes.set(l.id, { group, slab, rune, read: false });
    this.colliders.push({ x: l.x, z: l.z, r: 0.45 });
  }

  _addFireflies() {
    const n = CONFIG.world.props.fireflies || 40;
    const rand = seededRand(CONFIG.world.seed + 99);
    const geo = new THREE.SphereGeometry(0.04, 6, 6);
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? CONFIG.colors.tech : CONFIG.colors.glow,
        transparent: true,
        opacity: 0.85,
      });
      const m = new THREE.Mesh(geo, mat);
      const ang = rand() * Math.PI * 2;
      const dist = 4 + rand() * (CONFIG.world.size - 10);
      m.position.set(Math.cos(ang) * dist, 0.6 + rand() * 2.2, Math.sin(ang) * dist);
      this.scene.add(m);
      this.fireflies.push({
        mesh: m,
        phase: rand() * Math.PI * 2,
        speed: 0.6 + rand() * 1.2,
        radius: 0.4 + rand() * 0.8,
        base: m.position.clone(),
      });
    }
  }

  _addFootprintTrails() {
    // Soft glowing prints from spawn toward each mystery (subtle breadcrumbs)
    const start = { x: 0, z: 10 };
    const geo = new THREE.CircleGeometry(0.12, 8);
    for (const p of CONFIG.puzzles) {
      const steps = 6;
      for (let i = 1; i <= steps; i++) {
        const t = i / (steps + 2);
        const x = start.x + (p.x - start.x) * t + Math.sin(i * 1.7) * 0.35;
        const z = start.z + (p.z - start.z) * t + Math.cos(i * 1.3) * 0.35;
        const m = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({
            color: CONFIG.colors.spirit,
            transparent: true,
            opacity: 0.22,
          })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, 0.03, z);
        this.scene.add(m);
        this.footprints.push(m);
      }
    }
  }

  markPuzzleSolved(id) {
    const entry = this.puzzleMeshes.get(id);
    if (!entry) return;
    entry.solved = true;
    entry.mesh.material.emissiveIntensity = 0.55;
    entry.ring.material.opacity = 0.75;
    entry.ring.material.color.set(CONFIG.colors.tech);
  }

  markLoreRead(id) {
    const entry = this.loreMeshes.get(id);
    if (!entry) return;
    entry.read = true;
    entry.rune.material.color.set(CONFIG.colors.glow);
    entry.slab.material.emissiveIntensity = 0.45;
  }

  nearestLore(x, z, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const l of CONFIG.lore) {
      const d = Math.hypot(x - l.x, z - l.z);
      if (d < bestD) {
        bestD = d;
        best = l;
      }
    }
    return best;
  }

  floorHeight() {
    return 0;
  }

  blocked(x, z, radius) {
    for (const c of this.colliders) {
      const dx = x - c.x;
      const dz = z - c.z;
      if (dx * dx + dz * dz < (c.r + radius) * (c.r + radius)) return true;
    }
    if (Math.hypot(x, z) > CONFIG.world.size - 1.5) return true;
    return false;
  }

  nearestPuzzle(x, z, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const p of CONFIG.puzzles) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  update(t, dayPhase, climate = null) {
    const c = climate || {
      skyDay: CONFIG.world.skyDay,
      skyNight: CONFIG.world.skyNight,
      fogColor: CONFIG.world.fog,
      ground: CONFIG.world.ground,
      leaf: CONFIG.colors.leaf,
      sunMult: 1,
      fogDensity: 0.014 * this.fogMult + (1 - dayPhase) * 0.006,
      rain: 0,
      sand: 0,
    };

    const sky = new THREE.Color(c.skyNight).lerp(new THREE.Color(c.skyDay), dayPhase * this.dayMult);
    // Sand / heavy fog washes the sky
    if (c.sand > 0.2) sky.lerp(new THREE.Color(0xc4a06a), c.sand * 0.55);
    if (c.fog > 0.7) sky.lerp(new THREE.Color(c.fogColor), 0.25);

    this.scene.background.copy(sky);
    if (this.scene.fog) {
      this.scene.fog.color.copy(sky).lerp(new THREE.Color(c.fogColor), 0.35);
      this.scene.fog.density = c.fogDensity * this.fogMult;
    }

    const dim = 1 - c.sand * 0.35 - (c.rain > 0.5 ? 0.12 : 0);
    if (this._sun) this._sun.intensity = (0.75 + dayPhase * 0.55) * this.dayMult * c.sunMult * dim;
    if (this._hemi) this._hemi.intensity = (0.8 + dayPhase * 0.4) * this.dayMult * dim;
    if (this._fill) this._fill.intensity = (0.4 + dayPhase * 0.25) * this.dayMult * dim;

    if (this._groundMat) this._groundMat.color.setHex(c.ground);
    for (const m of this._leafMats) m.color.setHex(c.leaf);

    for (const [, entry] of this.puzzleMeshes) {
      entry.mesh.rotation.y = t * 0.25;
      entry.ring.scale.setScalar(1 + Math.sin(t * 2) * 0.04);
    }
    for (const [, entry] of this.loreMeshes) {
      entry.rune.rotation.z = t * 0.4;
    }
    for (const f of this.fireflies) {
      f.mesh.position.x = f.base.x + Math.cos(t * f.speed + f.phase) * f.radius;
      f.mesh.position.z = f.base.z + Math.sin(t * f.speed * 0.8 + f.phase) * f.radius;
      f.mesh.position.y = f.base.y + Math.sin(t * f.speed * 1.4 + f.phase) * 0.35;
      // Fireflies hide in rain / sandstorm; glow more at night when clear
      const hide = Math.max(c.rain, c.sand);
      f.mesh.material.opacity =
        Math.max(0, 0.35 + (1 - dayPhase) * 0.5 + Math.sin(t * 3 + f.phase) * 0.15) * (1 - hide);
    }
    for (const fp of this.footprints) {
      fp.material.opacity = 0.12 + (1 - dayPhase) * 0.18;
    }
  }
}
