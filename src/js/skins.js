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

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

function shadowed(mesh, on) {
  mesh.castShadow = on;
  mesh.receiveShadow = on;
  return mesh;
}

/**
 * Albert — protagonista de Sussurros da Floresta.
 * Referência: óculos pretos, barba, jaqueta azul com zíper laranja, mochila.
 */
export function buildAvatar(skinId, { castShadow = true } = {}) {
  const skin = getSkin(skinId);
  const root = new THREE.Group();
  root.name = `avatar-${skin.id}`;

  const skinTone = new THREE.Color(skin.skin);
  const jacket = new THREE.Color(skin.suit);
  const shirt = new THREE.Color(skin.shirt);
  const zip = new THREE.Color(skin.accent);

  const skinMat = mat(skinTone, { roughness: 0.7 });
  const jacketMat = mat(jacket, { roughness: 0.55, metalness: 0.08 });
  const navyMat = mat(shirt, { roughness: 0.75 });
  const zipMat = mat(zip, { roughness: 0.4, metalness: 0.35 });
  const jeanMat = mat(0x2a3340, { roughness: 0.88 });
  const bootMat = mat(0x1a1816, { roughness: 0.9 });
  const hairMat = mat(0x2a1c14, { roughness: 0.88 });
  const packMat = mat(0x4a4638, { roughness: 0.82 });
  const glassMat = mat(0x141418, { roughness: 0.35, metalness: 0.4 });
  const lensMat = mat(0x6a8498, { roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.35 });

  // hips / jeans waist
  const hips = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.12, 4, 10), jeanMat), castShadow);
  hips.position.y = 0.92;
  root.add(hips);

  // navy tee under jacket
  const tee = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.28, 4, 10), navyMat), castShadow);
  tee.position.y = 1.28;
  root.add(tee);

  // blue windbreaker body
  const coat = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.32), jacketMat), castShadow);
  coat.position.y = 1.32;
  root.add(coat);

  // navy hood collar
  const collar = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.28), navyMat), castShadow);
  collar.position.y = 1.56;
  root.add(collar);
  const hood = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), navyMat), castShadow);
  hood.position.set(0, 1.62, -0.08);
  hood.rotation.x = 0.4;
  root.add(hood);

  // orange-red zipper down the chest (signature from photo)
  const zipper = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.48, 0.34), zipMat), castShadow);
  zipper.position.set(-0.08, 1.32, 0.01);
  root.add(zipper);
  const zipPull = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.05), zipMat), castShadow);
  zipPull.position.set(-0.08, 1.48, 0.18);
  root.add(zipPull);

  // jacket hem / hand pockets hint
  const hem = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.34), jacketMat), castShadow);
  hem.position.y = 1.04;
  root.add(hem);

  // legs — jeans
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.11, 0.9, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.11, 0.9, 0);

  for (const leg of [leftLeg, rightLeg]) {
    const thigh = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.28, 4, 8), jeanMat), castShadow);
    thigh.position.y = -0.2;
    leg.add(thigh);
    const shin = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.26, 4, 8), jeanMat), castShadow);
    shin.position.y = -0.52;
    leg.add(shin);
    const boot = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.2), bootMat), castShadow);
    boot.position.set(0, -0.72, 0.02);
    leg.add(boot);
    root.add(leg);
  }

  // arms — jacket sleeves
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.3, 1.48, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.3, 1.48, 0);

  for (const arm of [leftArm, rightArm]) {
    const shoulder = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), jacketMat), castShadow);
    arm.add(shoulder);
    const upper = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.2, 4, 8), jacketMat), castShadow);
    upper.position.y = -0.15;
    arm.add(upper);
    const fore = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.18, 4, 8), jacketMat), castShadow);
    fore.position.y = -0.4;
    arm.add(fore);
    const cuff = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 5, 10), navyMat), castShadow);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.5;
    arm.add(cuff);
    const hand = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), skinMat), castShadow);
    hand.position.y = -0.56;
    arm.add(hand);
    root.add(arm);
  }

  // hiking backpack (olive, readable from behind — no neon)
  const pack = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.18), packMat), castShadow);
  pack.position.set(0, 1.35, -0.22);
  root.add(pack);
  const packLid = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.2), packMat), castShadow);
  packLid.position.set(0, 1.58, -0.22);
  root.add(packLid);
  for (const side of [-1, 1]) {
    const strap = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.03), packMat), castShadow);
    strap.position.set(side * 0.14, 1.38, 0.02);
    strap.rotation.x = -0.15;
    root.add(strap);
  }

  // neck + head
  const neck = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.1, 10), skinMat), castShadow);
  neck.position.y = 1.58;
  root.add(neck);

  const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 16), skinMat), castShadow);
  head.position.y = 1.78;
  head.scale.set(0.95, 1.02, 0.92);
  root.add(head);

  const faceTex = loadFaceTexture(skin.face);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.28),
    new THREE.MeshStandardMaterial({
      map: faceTex,
      transparent: true,
      roughness: 0.85,
      depthWrite: false,
    })
  );
  face.position.set(0, 1.78, 0.155);
  root.add(face);

  // short dark hair (no braid)
  const hair = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 12), hairMat), castShadow);
  hair.position.set(0, 1.88, -0.01);
  hair.scale.set(1.05, 0.68, 1.1);
  root.add(hair);
  const fringe = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.1), hairMat), castShadow);
  fringe.position.set(0, 1.92, 0.1);
  root.add(fringe);

  // 3D glasses frame (matches photo)
  const bridge = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.02), glassMat), castShadow);
  bridge.position.set(0, 1.8, 0.175);
  root.add(bridge);
  for (const side of [-1, 1]) {
    const rim = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.025), glassMat), castShadow);
    rim.position.set(side * 0.08, 1.8, 0.175);
    root.add(rim);
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.055), lensMat);
    lens.position.set(side * 0.08, 1.8, 0.19);
    root.add(lens);
    const temple = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.015), glassMat), castShadow);
    temple.position.set(side * 0.16, 1.8, 0.1);
    temple.rotation.y = side * 0.5;
    root.add(temple);
  }

  // ears
  for (const side of [-1, 1]) {
    const ear = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), skinMat), castShadow);
    ear.position.set(side * 0.165, 1.78, 0);
    root.add(ear);
  }

  // Warm fill so protagonist stays clear in the forest
  const key = new THREE.PointLight(0xfff0dd, 0.7, 5.5, 2);
  key.position.set(0.35, 1.75, 0.95);
  root.add(key);
  const rimLight = new THREE.PointLight(0xc8dce8, 0.3, 4.2, 2);
  rimLight.position.set(-0.35, 1.55, -0.75);
  root.add(rimLight);

  root.userData.skinId = skin.id;
  root.userData.joints = { leftLeg, rightLeg, leftArm, rightArm };
  root.userData.walkPhase = 0;
  return root;
}

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
  joints.leftArm.rotation.z = 0.08;
  joints.rightArm.rotation.z = -0.08;
}
