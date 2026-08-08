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
 * Albert — guia da mata / primeiros povos.
 * Pele cobre, manto verde-musgo, pintura de argila, trança, amuleto — sem glow tech.
 */
export function buildAvatar(skinId, { castShadow = true } = {}) {
  const skin = getSkin(skinId);
  const root = new THREE.Group();
  root.name = `avatar-${skin.id}`;

  const skinTone = new THREE.Color(skin.skin);
  const cloth = new THREE.Color(skin.suit);
  const wrap = new THREE.Color(skin.shirt);
  const spirit = new THREE.Color(skin.accent);

  const skinMat = mat(skinTone, { roughness: 0.82 });
  const clothMat = mat(cloth, { roughness: 0.92 });
  const wrapMat = mat(wrap, { roughness: 0.88 });
  const leatherMat = mat(0x2e1c10, { roughness: 0.9 });
  const hairMat = mat(0x0e0906, { roughness: 0.95 });
  const woodMat = mat(0x5a3a1e, { roughness: 0.8 });
  const clayMat = mat(0xe8dcc0, { roughness: 0.75 });
  const spiritMat = mat(spirit, {
    roughness: 0.55,
    emissive: spirit,
    emissiveIntensity: 0.12,
  });
  const ochreMat = mat(0xb03a1e, { roughness: 0.7 });
  const featherMat = mat(0xa84e22, { roughness: 0.7 });

  // hips + wrapped skirt / tunic hem
  const hips = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.14, 4, 10), clothMat), castShadow);
  hips.position.y = 0.9;
  root.add(hips);

  const tunic = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 6, 12), clothMat), castShadow);
  tunic.position.y = 1.28;
  root.add(tunic);

  // woven sash (burnt orange — reads clearly vs moss tunic)
  const sash = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.045, 6, 18), wrapMat), castShadow);
  sash.rotation.x = Math.PI / 2;
  sash.position.y = 1.05;
  root.add(sash);

  // chest wrap / vest of fiber
  const vest = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.28), wrapMat), castShadow);
  vest.position.y = 1.34;
  root.add(vest);

  // painted ochre band across chest
  const paint = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), ochreMat), castShadow);
  paint.position.y = 1.4;
  root.add(paint);

  // clay shoulder marks (visible in 3rd person)
  for (const side of [-1, 1]) {
    const mark = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.04), clayMat), castShadow);
    mark.position.set(side * 0.2, 1.48, 0.12);
    root.add(mark);
  }

  // legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.11, 0.9, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.11, 0.9, 0);

  for (const leg of [leftLeg, rightLeg]) {
    const thigh = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.26, 4, 8), skinMat), castShadow);
    thigh.position.y = -0.2;
    leg.add(thigh);
    const shin = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.24, 4, 8), skinMat), castShadow);
    shin.position.y = -0.5;
    leg.add(shin);
    // soft leather wrap at calf
    const wrapBand = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 5, 12), leatherMat), castShadow);
    wrapBand.rotation.x = Math.PI / 2;
    wrapBand.position.y = -0.42;
    leg.add(wrapBand);
    // foot
    const foot = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.18), leatherMat), castShadow);
    foot.position.set(0, -0.7, 0.02);
    leg.add(foot);
    root.add(leg);
  }

  // arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 1.48, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 1.48, 0);

  for (const [arm, side] of [
    [leftArm, -1],
    [rightArm, 1],
  ]) {
    const shoulder = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), skinMat), castShadow);
    arm.add(shoulder);
    const upper = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.2, 4, 8), skinMat), castShadow);
    upper.position.y = -0.15;
    arm.add(upper);
    const fore = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.18, 4, 8), skinMat), castShadow);
    fore.position.y = -0.4;
    arm.add(fore);
    const hand = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skinMat), castShadow);
    hand.position.y = -0.55;
    arm.add(hand);
    // wrist bead
    const bead = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 5, 10), spiritMat), castShadow);
    bead.rotation.x = Math.PI / 2;
    bead.position.y = -0.48;
    arm.add(bead);
    root.add(arm);
  }

  // small hip pouch (side, not a glowing backpack)
  const satchel = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.08), leatherMat), castShadow);
  satchel.position.set(0.2, 1.05, 0.02);
  satchel.rotation.z = -0.2;
  root.add(satchel);
  const strap = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 0.015), leatherMat), castShadow);
  strap.position.set(0.1, 1.28, 0.02);
  strap.rotation.z = 0.45;
  root.add(strap);

  // neck + head
  const neck = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.1, 10), skinMat), castShadow);
  neck.position.y = 1.56;
  root.add(neck);

  const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 16), skinMat), castShadow);
  head.position.y = 1.76;
  head.scale.set(0.95, 1.05, 0.92);
  root.add(head);

  const faceTex = loadFaceTexture(skin.face);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 0.27),
    new THREE.MeshStandardMaterial({
      map: faceTex,
      transparent: true,
      roughness: 0.9,
      depthWrite: false,
    })
  );
  face.position.set(0, 1.76, 0.15);
  root.add(face);

  // dark hair + long braid
  const hair = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), hairMat), castShadow);
  hair.position.set(0, 1.84, -0.02);
  hair.scale.set(1.08, 0.72, 1.12);
  root.add(hair);
  const braid = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.42, 4, 8), hairMat), castShadow);
  braid.position.set(-0.1, 1.48, -0.14);
  braid.rotation.z = 0.28;
  braid.rotation.x = 0.45;
  root.add(braid);
  const braidTip = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), wrapMat), castShadow);
  braidTip.position.set(-0.14, 1.22, -0.22);
  root.add(braidTip);

  // woven headband + one soft feather (not a spike crown)
  const band = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 5, 18), wrapMat), castShadow);
  band.rotation.x = Math.PI / 2;
  band.position.set(0, 1.9, 0);
  root.add(band);
  const bandBead = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), clayMat), castShadow);
  bandBead.position.set(0, 1.9, 0.15);
  root.add(bandBead);
  const plume = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.16, 5), featherMat), castShadow);
  plume.position.set(0.08, 1.98, -0.06);
  plume.rotation.z = 0.55;
  plume.rotation.x = 0.35;
  root.add(plume);

  // ears
  for (const side of [-1, 1]) {
    const ear = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), skinMat), castShadow);
    ear.position.set(side * 0.16, 1.76, 0);
    root.add(ear);
  }

  // wooden amulet — soft, no neon point light
  const cord = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 4, 14), woodMat), castShadow);
  cord.position.set(0, 1.52, 0.12);
  cord.rotation.x = 0.5;
  root.add(cord);
  const amulet = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), spiritMat), castShadow);
  amulet.position.set(0, 1.42, 0.16);
  root.add(amulet);

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
  joints.leftArm.rotation.z = 0.1;
  joints.rightArm.rotation.z = -0.1;
}
