import * as THREE from "three";
import { CONFIG } from "./config.js";

const faceCache = new Map();

export function listSkins() {
  return CONFIG.skinOrder.map((id) => CONFIG.skins[id]).filter(Boolean);
}

export function getSkin(id) {
  return CONFIG.skins[id] || CONFIG.skins[CONFIG.skinOrder[0]];
}

function loadFaceTexture(url) {
  if (faceCache.has(url)) return faceCache.get(url);
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  faceCache.set(url, tex);
  return tex;
}

function mat(color, { roughness = 0.7, metalness = 0.1, emissive = 0x000000, emissiveIntensity = 0 } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
  });
}

function addShadow(mesh, on) {
  mesh.castShadow = on;
  mesh.receiveShadow = on;
  return mesh;
}

/**
 * Albert — humanoid 3D: pele morena, traços indígenas, traje tech + gadgets.
 * Exposed joints for walk cycle: leftLeg, rightLeg, leftArm, rightArm.
 */
export function buildAvatar(skinId, { castShadow = true } = {}) {
  const skin = getSkin(skinId);
  const root = new THREE.Group();
  root.name = `avatar-${skin.id}`;

  const skinTone = new THREE.Color(skin.skin);
  const suit = new THREE.Color(skin.suit);
  const shirt = new THREE.Color(skin.shirt);
  const accent = new THREE.Color(skin.accent);

  const skinMat = mat(skinTone, { roughness: 0.78 });
  const suitMat = mat(suit, { roughness: 0.45, metalness: 0.42 });
  const shirtMat = mat(shirt, { roughness: 0.62, metalness: 0.15 });
  const accentMat = mat(accent, {
    roughness: 0.28,
    metalness: 0.7,
    emissive: accent,
    emissiveIntensity: 0.55,
  });
  const darkMat = mat(0x14181c, { roughness: 0.4, metalness: 0.65 });
  const hairMat = mat(0x1a100c, { roughness: 0.92 });
  const bootMat = mat(0x22282e, { roughness: 0.55, metalness: 0.35 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.55,
    metalness: 0.9,
    roughness: 0.15,
  });

  // --- hips / torso ---
  const hips = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.16, 4, 10), suitMat), castShadow);
  hips.position.y = 0.92;
  root.add(hips);

  const torso = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 6, 12), suitMat), castShadow);
  torso.position.y = 1.28;
  root.add(torso);

  const vest = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.34), shirtMat), castShadow);
  vest.position.y = 1.32;
  root.add(vest);

  // tech chest panel
  const panel = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.06), darkMat), castShadow);
  panel.position.set(0, 1.34, 0.17);
  root.add(panel);
  const panelGlow = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.04), accentMat), castShadow);
  panelGlow.position.set(0, 1.34, 0.2);
  root.add(panelGlow);

  // belt
  const belt = addShadow(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 20), darkMat), castShadow);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 1.02;
  root.add(belt);
  const buckle = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.06), accentMat), castShadow);
  buckle.position.set(0, 1.02, 0.22);
  root.add(buckle);

  // --- legs (pivots at hip) ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12, 0.92, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12, 0.92, 0);

  for (const [leg, side] of [
    [leftLeg, -1],
    [rightLeg, 1],
  ]) {
    const thigh = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.28, 4, 8), suitMat), castShadow);
    thigh.position.y = -0.22;
    leg.add(thigh);
    const shin = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.26, 4, 8), suitMat), castShadow);
    shin.position.y = -0.52;
    leg.add(shin);
    const boot = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.22), bootMat), castShadow);
    boot.position.set(0, -0.72, 0.03);
    leg.add(boot);
    const soleGlow = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.18), accentMat), castShadow);
    soleGlow.position.set(0, -0.78, 0.03);
    leg.add(soleGlow);
    // knee pad
    const knee = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), darkMat), castShadow);
    knee.position.set(side * 0.02, -0.38, 0.06);
    leg.add(knee);
    root.add(leg);
  }

  // --- arms ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.3, 1.48, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.3, 1.48, 0);

  for (const [arm, side] of [
    [leftArm, -1],
    [rightArm, 1],
  ]) {
    const upper = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.22, 4, 8), suitMat), castShadow);
    upper.position.y = -0.16;
    arm.add(upper);
    const fore = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.2, 4, 8), skinMat), castShadow);
    fore.position.y = -0.42;
    arm.add(fore);
    const hand = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinMat), castShadow);
    hand.position.y = -0.58;
    arm.add(hand);
    const shoulder = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), suitMat), castShadow);
    shoulder.position.set(side * 0.02, 0.02, 0);
    arm.add(shoulder);
    root.add(arm);
  }

  // watch on left wrist
  const watch = addShadow(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 6, 14), accentMat), castShadow);
  watch.rotation.x = Math.PI / 2;
  watch.position.set(0, -0.5, 0);
  leftArm.add(watch);
  const watchFace = addShadow(new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), darkMat), castShadow);
  watchFace.position.set(0, -0.5, 0.04);
  leftArm.add(watchFace);

  // shoulder scanner gadget (right)
  const scanner = new THREE.Group();
  scanner.position.set(0.08, 0.06, -0.02);
  const scanBody = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.2), darkMat), castShadow);
  scanner.add(scanBody);
  const scanLens = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12), accentMat), castShadow);
  scanLens.rotation.x = Math.PI / 2;
  scanLens.position.set(0, 0.02, 0.12);
  scanner.add(scanLens);
  const antenna = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6), accentMat), castShadow);
  antenna.position.set(0.04, 0.12, -0.04);
  scanner.add(antenna);
  rightArm.add(scanner);

  // backpack / field kit
  const pack = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.18), darkMat), castShadow);
  pack.position.set(0, 1.3, -0.22);
  root.add(pack);
  const packLight = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), accentMat), castShadow);
  packLight.position.set(0, 1.42, -0.32);
  root.add(packLight);

  // --- head ---
  const neck = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 10), skinMat), castShadow);
  neck.position.y = 1.58;
  root.add(neck);

  const head = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 16), skinMat), castShadow);
  head.position.y = 1.78;
  head.scale.set(0.95, 1.05, 0.92);
  root.add(head);

  // face plane (front only)
  const faceTex = loadFaceTexture(skin.face);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.28),
    new THREE.MeshStandardMaterial({
      map: faceTex,
      transparent: true,
      roughness: 0.85,
      metalness: 0,
      depthWrite: false,
    })
  );
  face.position.set(0, 1.78, 0.155);
  root.add(face);

  // hair volume + braid hint
  const hair = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 12), hairMat), castShadow);
  hair.position.set(0, 1.84, -0.02);
  hair.scale.set(1.05, 0.75, 1.1);
  root.add(hair);
  const braid = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.35, 4, 8), hairMat), castShadow);
  braid.position.set(-0.12, 1.55, -0.12);
  braid.rotation.z = 0.35;
  braid.rotation.x = 0.4;
  root.add(braid);

  // tech headband
  const band = addShadow(new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 6, 20), darkMat), castShadow);
  band.rotation.x = Math.PI / 2;
  band.position.set(0, 1.9, 0);
  root.add(band);
  const bandGem = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), accentMat), castShadow);
  bandGem.position.set(0, 1.9, 0.16);
  root.add(bandGem);

  // glasses
  const bridge = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.02), darkMat), castShadow);
  bridge.position.set(0, 1.8, 0.175);
  root.add(bridge);
  for (const side of [-1, 1]) {
    const frame = addShadow(new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 16), darkMat), castShadow);
    frame.position.set(side * 0.08, 1.8, 0.17);
    root.add(frame);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.048, 16), lensMat);
    lens.position.set(side * 0.08, 1.8, 0.175);
    root.add(lens);
    const armG = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.015), darkMat), castShadow);
    armG.position.set(side * 0.15, 1.8, 0.1);
    armG.rotation.y = side * 0.5;
    root.add(armG);
  }

  // ear gadgets
  for (const side of [-1, 1]) {
    const ear = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat), castShadow);
    ear.position.set(side * 0.17, 1.78, 0);
    root.add(ear);
    if (side === 1) {
      const earpiece = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.05), accentMat), castShadow);
      earpiece.position.set(0.19, 1.76, 0.02);
      root.add(earpiece);
    }
  }

  // soft accent point light attached to chest (reads in 3rd person)
  const glow = new THREE.PointLight(accent, 0.35, 2.5);
  glow.position.set(0, 1.35, 0.25);
  root.add(glow);

  root.userData.skinId = skin.id;
  root.userData.joints = { leftLeg, rightLeg, leftArm, rightArm };
  root.userData.walkPhase = 0;
  return root;
}

/** Simple walk / idle pose on avatar joints. */
export function animateAvatar(avatar, dt, moving, sprint = false) {
  const joints = avatar?.userData?.joints;
  if (!joints) return;
  const speed = sprint ? 10 : 7;
  if (moving) {
    avatar.userData.walkPhase = (avatar.userData.walkPhase || 0) + dt * speed;
  } else {
    avatar.userData.walkPhase = (avatar.userData.walkPhase || 0) * 0.85;
  }
  const p = avatar.userData.walkPhase || 0;
  const amp = moving ? 0.55 : 0.04;
  joints.leftLeg.rotation.x = Math.sin(p) * amp;
  joints.rightLeg.rotation.x = Math.sin(p + Math.PI) * amp;
  joints.leftArm.rotation.x = Math.sin(p + Math.PI) * amp * 0.7;
  joints.rightArm.rotation.x = Math.sin(p) * amp * 0.7;
  joints.leftArm.rotation.z = 0.12;
  joints.rightArm.rotation.z = -0.12;
}
