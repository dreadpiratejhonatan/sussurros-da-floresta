import * as THREE from "three";
import { CONFIG } from "./config.js";

function spiritMat(color, emissive) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.82,
    roughness: 0.35,
    metalness: 0.2,
  });
}

function buildDeer(cfg) {
  const g = new THREE.Group();
  const mat = spiritMat(cfg.color, cfg.emissive);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.45, 4, 8), mat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.75;
  g.add(body);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 6), mat);
  neck.position.set(0.28, 0.95, 0);
  neck.rotation.z = -0.6;
  g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mat);
  head.position.set(0.42, 1.12, 0);
  g.add(head);
  for (const side of [-1, 1]) {
    const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.35, 5), mat);
    antler.position.set(0.4, 1.35, side * 0.06);
    antler.rotation.z = side * 0.25;
    g.add(antler);
  }
  const glow = new THREE.PointLight(cfg.emissive, 0.55, 5);
  glow.position.set(0, 0.9, 0);
  g.add(glow);
  return g;
}

function buildOwl(cfg) {
  const g = new THREE.Group();
  const mat = spiritMat(cfg.color, cfg.emissive);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), mat);
  body.position.y = 1.4;
  body.scale.set(0.85, 1.15, 0.85);
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat);
  head.position.y = 1.72;
  g.add(head);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.CircleGeometry(0.04, 10),
      new THREE.MeshBasicMaterial({ color: cfg.emissive })
    );
    eye.position.set(side * 0.05, 1.74, 0.12);
    g.add(eye);
  }
  const glow = new THREE.PointLight(cfg.emissive, 0.4, 4);
  glow.position.set(0, 1.5, 0);
  g.add(glow);
  return g;
}

function buildFox(cfg) {
  const g = new THREE.Group();
  const mat = spiritMat(cfg.color, cfg.emissive);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.35, 4, 8), mat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.45;
  g.add(body);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 8), mat);
  head.rotation.z = -Math.PI / 2;
  head.position.set(0.28, 0.55, 0);
  g.add(head);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.35, 4, 6), mat);
  tail.position.set(-0.28, 0.55, 0);
  tail.rotation.z = 0.8;
  g.add(tail);
  const glow = new THREE.PointLight(cfg.emissive, 0.45, 4);
  glow.position.set(0, 0.5, 0);
  g.add(glow);
  return g;
}

function buildFish(cfg) {
  const g = new THREE.Group();
  const mat = spiritMat(cfg.color, cfg.emissive);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat);
  body.scale.set(1.6, 0.7, 0.55);
  body.position.y = 0.35;
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 6), mat);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.28, 0.35, 0);
  g.add(tail);
  const glow = new THREE.PointLight(cfg.emissive, 0.5, 3.5);
  glow.position.set(0, 0.35, 0);
  g.add(glow);
  return g;
}

const BUILDERS = {
  deer: buildDeer,
  owl: buildOwl,
  fox: buildFox,
  fish: buildFish,
};

export class SpiritAnimals {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    for (const cfg of CONFIG.animals) {
      const builder = BUILDERS[cfg.kind] || buildDeer;
      const mesh = builder(cfg);
      mesh.position.set(cfg.home.x, 0, cfg.home.z);
      scene.add(mesh);
      this.list.push({
        cfg,
        mesh,
        angle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        seen: false,
      });
    }
  }

  nearest(x, z, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const a of this.list) {
      const d = Math.hypot(x - a.mesh.position.x, z - a.mesh.position.z);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    return best;
  }

  update(t, dt) {
    for (const a of this.list) {
      a.angle += dt * (a.cfg.speed * 0.22);
      const hx = a.cfg.home.x;
      const hz = a.cfg.home.z;
      const r = a.cfg.roam;
      const ox = Math.cos(a.angle) * r * (0.55 + 0.45 * Math.sin(t * 0.2 + a.phase));
      const oz = Math.sin(a.angle * 0.85) * r * (0.55 + 0.45 * Math.cos(t * 0.17 + a.phase));
      const tx = hx + ox;
      const tz = hz + oz;
      const bob = a.cfg.kind === "fish" ? 0.25 + Math.sin(t * 2 + a.phase) * 0.12 : 0;
      const fly = a.cfg.kind === "owl" ? 1.1 + Math.sin(t * 1.2 + a.phase) * 0.15 : 0;
      a.mesh.position.x += (tx - a.mesh.position.x) * Math.min(1, dt * 1.5);
      a.mesh.position.z += (tz - a.mesh.position.z) * Math.min(1, dt * 1.5);
      a.mesh.position.y = bob + fly;
      const dx = tx - a.mesh.position.x;
      const dz = tz - a.mesh.position.z;
      if (Math.hypot(dx, dz) > 0.05) {
        a.mesh.rotation.y = Math.atan2(dx, dz);
      }
      // soft pulse
      a.mesh.traverse((obj) => {
        if (obj.isMesh && obj.material?.emissiveIntensity != null) {
          obj.material.emissiveIntensity = 0.4 + Math.sin(t * 2 + a.phase) * 0.2;
        }
      });
    }
  }
}
