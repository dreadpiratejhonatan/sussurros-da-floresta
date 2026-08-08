import * as THREE from "three";
import { CONFIG } from "./config.js";

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.8,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

function addHumanoid(root, {
  skin = 0xc49a76,
  shirt = 0x3a5a40,
  pants = 0x2a2a28,
  hair = 0x1a120c,
  accent = 0xc45a28,
  hat = null,
} = {}) {
  const skinMat = mat(skin, { roughness: 0.7 });
  const shirtMat = mat(shirt);
  const pantsMat = mat(pants);
  const hairMat = mat(hair, { roughness: 0.9 });
  const accentMat = mat(accent);

  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.1, 4, 8), pantsMat);
  hips.position.y = 0.85;
  root.add(hips);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.35, 4, 10), shirtMat);
  torso.position.y = 1.2;
  root.add(torso);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.45, 4, 6), pantsMat);
    leg.position.set(side * 0.09, 0.45, 0);
    root.add(leg);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.35, 4, 6), skinMat);
    arm.position.set(side * 0.26, 1.25, 0);
    root.add(arm);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8), skinMat);
  neck.position.y = 1.45;
  root.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
  head.position.y = 1.62;
  root.add(head);
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 8), hairMat);
  hairMesh.position.set(0, 1.7, -0.02);
  hairMesh.scale.set(1.05, 0.65, 1.05);
  root.add(hairMesh);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 4, 12), accentMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = 1.72;
  root.add(band);
  if (hat === "cap") {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 12), mat(0x1a2740));
    brim.position.y = 1.74;
    root.add(brim);
  } else if (hat === "feather") {
    const feather = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.28, 5), accentMat);
    feather.position.set(0.08, 1.9, -0.02);
    feather.rotation.z = 0.4;
    root.add(feather);
  }
  return root;
}

function buildHorseRider(cfg) {
  const g = new THREE.Group();
  const horseMat = mat(0x4a3220, { roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 4, 10), horseMat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.85;
  g.add(body);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.28, 4, 6), horseMat);
  neck.position.set(0.35, 1.1, 0);
  neck.rotation.z = -0.7;
  g.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.12), horseMat);
  head.position.set(0.52, 1.28, 0);
  g.add(head);
  for (const [x, z] of [
    [-0.2, -0.12],
    [-0.2, 0.12],
    [0.22, -0.12],
    [0.22, 0.12],
  ]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.4, 4, 5), horseMat);
    leg.position.set(x, 0.35, z);
    g.add(leg);
  }
  const rider = new THREE.Group();
  rider.position.set(0, 0.55, 0);
  addHumanoid(rider, {
    skin: cfg.skin,
    shirt: cfg.shirt,
    pants: cfg.pants,
    hair: cfg.hair,
    accent: cfg.accent,
    hat: "feather",
  });
  g.add(rider);
  const glow = new THREE.PointLight(cfg.accent, 0.35, 4);
  glow.position.set(0, 1.4, 0);
  g.add(glow);
  return g;
}

function buildExplorer(cfg) {
  const g = new THREE.Group();
  addHumanoid(g, {
    skin: cfg.skin,
    shirt: cfg.shirt,
    pants: cfg.pants,
    hair: cfg.hair,
    accent: cfg.accent,
    hat: cfg.hat || "cap",
  });
  // satchel / scroll
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.08), mat(0x5a3a20));
  bag.position.set(0.2, 1.1, 0.05);
  g.add(bag);
  const glow = new THREE.PointLight(cfg.accent, 0.3, 3.5);
  glow.position.set(0, 1.5, 0.2);
  g.add(glow);
  return g;
}

function buildElder(cfg) {
  const g = new THREE.Group();
  addHumanoid(g, {
    skin: cfg.skin,
    shirt: cfg.shirt,
    pants: cfg.pants,
    hair: cfg.hair,
    accent: cfg.accent,
    hat: "feather",
  });
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.5, 6), mat(0x5a3a1e));
  staff.position.set(0.28, 0.85, 0);
  g.add(staff);
  const glow = new THREE.PointLight(cfg.accent, 0.4, 4);
  glow.position.set(0, 1.5, 0);
  g.add(glow);
  return g;
}

function buildSpiritPath(cfg) {
  const g = new THREE.Group();
  const mist = mat(cfg.shirt, {
    roughness: 0.4,
    emissive: cfg.accent,
    emissiveIntensity: 0.45,
  });
  mist.transparent = true;
  mist.opacity = 0.75;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.7, 6, 10), mist);
  body.position.y = 1.1;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mist);
  head.position.y = 1.7;
  g.add(head);
  const glow = new THREE.PointLight(cfg.accent, 0.55, 5);
  glow.position.set(0, 1.4, 0);
  g.add(glow);
  return g;
}

const BUILDERS = {
  horseman: buildHorseRider,
  explorer: buildExplorer,
  elder: buildElder,
  spirit: buildSpiritPath,
};

/**
 * Historical / mythological NPCs of the Cananéia & South America exploration theme.
 * Only Albert is playable — these appear randomly and tell chronicles on interact.
 */
export class HistoricalNpcs {
  constructor(scene) {
    this.scene = scene;
    this.pool = CONFIG.npcs.map((cfg) => {
      const builder = BUILDERS[cfg.kind] || buildExplorer;
      const mesh = builder(cfg);
      mesh.visible = false;
      scene.add(mesh);
      return {
        cfg,
        mesh,
        active: false,
        heard: false,
        phase: Math.random() * Math.PI * 2,
        life: 0,
      };
    });
    this._spawnTimer = 6;
    this._activeMax = 2;
  }

  reset(heardMap = {}) {
    for (const n of this.pool) {
      n.active = false;
      n.heard = !!heardMap[n.cfg.id];
      n.mesh.visible = false;
      n.life = 0;
    }
    this._spawnTimer = 4;
    // Immediate first encounter so plot starts quickly
    this._spawnOne();
  }

  nearest(x, z, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const n of this.pool) {
      if (!n.active) continue;
      const d = Math.hypot(x - n.mesh.position.x, z - n.mesh.position.z);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  heardCount() {
    return this.pool.filter((n) => n.heard).length;
  }

  total() {
    return this.pool.length;
  }

  _randPos() {
    const ang = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 22;
    return { x: Math.cos(ang) * dist, z: Math.sin(ang) * dist };
  }

  _spawnOne() {
    const inactive = this.pool.filter((n) => !n.active);
    if (!inactive.length) return null;
    const n = inactive[Math.floor(Math.random() * inactive.length)];
    const p = this._randPos();
    n.mesh.position.set(p.x, 0, p.z);
    n.mesh.visible = true;
    n.active = true;
    n.life = 55 + Math.random() * 40;
    n.phase = Math.random() * Math.PI * 2;
    return n;
  }

  update(t, dt) {
    const activeCount = this.pool.filter((n) => n.active).length;
    this._spawnTimer -= dt;
    if (this._spawnTimer <= 0) {
      this._spawnTimer = 12 + Math.random() * 18;
      if (activeCount < this._activeMax) {
        this._spawnOne();
      } else if (Math.random() < 0.45) {
        // Swap: despawn one, spawn another
        const act = this.pool.filter((n) => n.active);
        const victim = act[Math.floor(Math.random() * act.length)];
        if (victim) {
          victim.active = false;
          victim.mesh.visible = false;
        }
        this._spawnOne();
      }
    }

    for (const n of this.pool) {
      if (!n.active) continue;
      n.life -= dt;
      if (n.life <= 0) {
        n.active = false;
        n.mesh.visible = false;
        continue;
      }
      // Gentle idle motion
      n.mesh.position.y = Math.sin(t * 1.3 + n.phase) * 0.03;
      n.mesh.rotation.y += dt * 0.25;
      n.mesh.traverse((obj) => {
        if (obj.isLight) obj.intensity = 0.25 + Math.sin(t * 2 + n.phase) * 0.12;
      });
    }
  }
}
