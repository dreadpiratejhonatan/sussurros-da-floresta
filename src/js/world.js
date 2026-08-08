import * as THREE from "three";
import { CONFIG } from "./config.js";

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.whispers = [];
    this._build();
  }

  _build() {
    const { colors } = CONFIG;
    this.scene.background = new THREE.Color(colors.nightSky);
    this.scene.fog = new THREE.FogExp2(colors.nightSky, 0.045);

    const hemi = new THREE.HemisphereLight(0xb8d4c4, 0x1a2a1c, 0.55);
    this.scene.add(hemi);
    const moon = new THREE.DirectionalLight(0xcfe8d8, 0.55);
    moon.position.set(12, 28, 8);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    this.scene.add(moon);
    const fill = new THREE.PointLight(0x6aa888, 0.35, 40);
    fill.position.set(0, 4, 0);
    this.scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(48, 64),
      new THREE.MeshStandardMaterial({ color: colors.mossDeep, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 28),
      new THREE.MeshStandardMaterial({ color: colors.path, roughness: 1 })
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, 2);
    path.receiveShadow = true;
    this.scene.add(path);

    const rand = mulberry32(42);
    for (let i = 0; i < 70; i++) {
      const ang = rand() * Math.PI * 2;
      const dist = 6 + rand() * 38;
      const x = Math.cos(ang) * dist;
      const z = Math.sin(ang) * dist;
      if (Math.abs(x) < 2.2 && z > -2 && z < 18) continue;
      this._addTree(x, z, 0.7 + rand() * 0.9, rand);
    }

    this._addWhisperStone(0, -6, "A névoa guarda um nome antigo…");
    this._addWhisperStone(-7, 4, "Passos leves. A floresta escuta.");
    this._addWhisperStone(8, 10, "Siga o brilho entre as folhas.");
    this._addClearing();
  }

  _addTree(x, z, scale, rand) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const trunkH = 2.4 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, trunkH, 8),
      new THREE.MeshStandardMaterial({ color: CONFIG.colors.bark, roughness: 0.9 })
    );
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({
      color: CONFIG.colors.leaf,
      roughness: 0.85,
    });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.4 * scale, 3.2 * scale, 8), leafMat);
    canopy.position.y = trunkH + 1.1 * scale;
    canopy.castShadow = true;
    group.add(canopy);
    if (rand() > 0.45) {
      const mid = new THREE.Mesh(new THREE.ConeGeometry(1.1 * scale, 2.4 * scale, 8), leafMat);
      mid.position.y = trunkH + 0.2 * scale;
      mid.castShadow = true;
      group.add(mid);
    }
    this.scene.add(group);
    this.colliders.push({ x, z, r: 0.45 * scale });
  }

  _addWhisperStone(x, z, text) {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({
        color: 0x5a6a5e,
        emissive: CONFIG.colors.glow,
        emissiveIntensity: 0.18,
        roughness: 0.7,
      })
    );
    stone.position.set(x, 0.45, z);
    stone.castShadow = true;
    this.scene.add(stone);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.95, 24),
      new THREE.MeshBasicMaterial({
        color: CONFIG.colors.glow,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.05, z);
    this.scene.add(ring);

    this.whispers.push({ x, z, text, mesh: stone });
    this.colliders.push({ x, z, r: 0.55 });
  }

  _addClearing() {
    const glow = new THREE.PointLight(CONFIG.colors.glow, 1.1, 12);
    glow.position.set(0, 2.2, -6);
    this.scene.add(glow);
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
    if (Math.hypot(x, z) > 46) return true;
    return false;
  }

  nearestWhisper(x, z, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const w of this.whispers) {
      const d = Math.hypot(x - w.x, z - w.z);
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    return best;
  }

  update(t) {
    for (const w of this.whispers) {
      w.mesh.position.y = 0.45 + Math.sin(t * 1.6 + w.x) * 0.06;
      w.mesh.rotation.y = t * 0.35;
    }
  }
}
