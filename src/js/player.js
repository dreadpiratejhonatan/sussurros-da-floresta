import * as THREE from "three";
import { CONFIG } from "./config.js";
import { animateAvatar, buildAvatar } from "./skins.js";

function shortestAngleDelta(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Player {
  constructor(camera, world, skinId = "albert") {
    this.camera = camera;
    this.world = world;
    this.yaw = Math.PI;
    this.pitch = -0.12;
    this.pos = new THREE.Vector3(0, CONFIG.eyeHeight, 10);
    this.velY = 0;
    this.onGround = true;
    this.mode = "third"; // visible 3D by default
    this.moveMult = 1;
    this.avatar = buildAvatar(skinId);
    this.avatar.visible = true;
    // Face +Z in mesh space; yaw+π so third-person camera sees Albert's back
    this._bodyYaw = this.yaw + Math.PI;
    this.avatar.rotation.y = this._bodyYaw;
    world.scene.add(this.avatar);
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._camOffset = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
    this._wish = new THREE.Vector3();
    this._moving = false;
    this._sprint = false;
  }

  setSkin(skinId) {
    this.world.scene.remove(this.avatar);
    this.avatar = buildAvatar(skinId);
    this.avatar.visible = true;
    this.avatar.rotation.y = this._bodyYaw;
    if (this.mode === "first") this._setFirstPersonBodyVisible(false);
    this.world.scene.add(this.avatar);
  }

  setMoveMult(m) {
    this.moveMult = m;
  }

  toggleCamera() {
    this.mode = this.mode === "first" ? "third" : "first";
    this.avatar.visible = true;
    this._setFirstPersonBodyVisible(this.mode === "third");
  }

  /** Hide head/face in 1st person so it doesn't clip the camera; keep body optional off. */
  _setFirstPersonBodyVisible(showFull) {
    this.avatar.traverse((obj) => {
      if (!obj.isMesh && !obj.isLight) return;
      // In first person, hide whole avatar (camera in head). Third: show all.
      obj.visible = showFull;
    });
    if (!showFull) {
      // keep avatar group "there" for anim state, but invisible
      this.avatar.visible = false;
    } else {
      this.avatar.visible = true;
      this.avatar.traverse((obj) => {
        obj.visible = true;
      });
    }
  }

  reset() {
    this.yaw = Math.PI;
    this.pitch = -0.12;
    this.pos.set(0, CONFIG.eyeHeight, 10);
    this.velY = 0;
    this.mode = "third";
    this._bodyYaw = this.yaw + Math.PI;
    this.avatar.rotation.y = this._bodyYaw;
    this.avatar.visible = true;
    this._setFirstPersonBodyVisible(true);
    this._applyCamera();
  }

  update(dt, input) {
    const look = input.consumeLook();
    this.yaw -= look.dx * CONFIG.mouseSens;
    this.pitch -= look.dy * CONFIG.mouseSens;
    this.pitch = Math.max(-1.15, Math.min(0.55, this.pitch));

    this._fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const mv = input.moveVector();
    this._sprint = !!mv.sprint;
    let speed = CONFIG.moveSpeed * this.moveMult * (mv.sprint ? CONFIG.sprintMult : 1);
    this._wish
      .set(0, 0, 0)
      .addScaledVector(this._right, mv.x)
      .addScaledVector(this._fwd, -mv.z);
    this._moving = this._wish.lengthSq() > 0;
    if (this._moving) this._wish.normalize().multiplyScalar(speed * dt);

    let nx = this.pos.x + this._wish.x;
    let nz = this.pos.z + this._wish.z;
    if (!this.world.blocked(nx, this.pos.z, CONFIG.playerRadius)) this.pos.x = nx;
    if (!this.world.blocked(this.pos.x, nz, CONFIG.playerRadius)) this.pos.z = nz;

    const ground = this.world.floorHeight(this.pos.x, this.pos.z) + CONFIG.eyeHeight;
    this.velY -= CONFIG.gravity * dt;
    this.pos.y += this.velY * dt;
    if (this.pos.y <= ground) {
      this.pos.y = ground;
      this.velY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    if (this.onGround && mv.jump) {
      this.velY = CONFIG.jumpSpeed;
      this.onGround = false;
    }

    // Face walk direction (not the camera) so Albert stops moonwalking
    let targetBody = this.yaw + Math.PI;
    if (this._moving) {
      targetBody = Math.atan2(this._wish.x, this._wish.z);
    }
    const turnSpeed = this._moving ? 12 : 7;
    this._bodyYaw += shortestAngleDelta(this._bodyYaw, targetBody) * Math.min(1, dt * turnSpeed);
    this.avatar.position.set(this.pos.x, this.pos.y - CONFIG.eyeHeight, this.pos.z);
    this.avatar.rotation.y = this._bodyYaw;
    animateAvatar(this.avatar, dt, this._moving, this._sprint);
    this._applyCamera();
  }

  _applyCamera() {
    if (this.mode === "first") {
      this.camera.position.copy(this.pos);
      this.camera.rotation.order = "YXZ";
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
      return;
    }

    const dist = CONFIG.thirdPersonDist;
    const height = 1.35 - this.pitch * 0.85;
    this._camOffset.set(
      Math.sin(this.yaw) * dist,
      height,
      Math.cos(this.yaw) * dist
    );
    this.camera.position.set(
      this.pos.x + this._camOffset.x,
      this.pos.y - CONFIG.eyeHeight + 1.55 + this._camOffset.y * 0.35,
      this.pos.z + this._camOffset.z
    );
    // Pull camera up a bit and look at chest/head so Albert reads clearly in frame
    this._lookTarget.set(this.pos.x, this.pos.y - 0.15, this.pos.z);
    this.camera.lookAt(this._lookTarget);
  }
}
