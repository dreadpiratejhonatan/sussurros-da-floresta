import * as THREE from "three";
import { CONFIG } from "./config.js";
import { animateAvatar, buildAvatar, setAvatarLook } from "./skins.js";

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
    this.pitch = -0.08;
    this.pos = new THREE.Vector3(0, CONFIG.eyeHeight, 10);
    this.velY = 0;
    this.onGround = true;
    this.mode = "third";
    this.moveMult = 1;
    this.avatar = buildAvatar(skinId);
    this.avatar.visible = true;
    // Face +Z in mesh space; yaw+π so third-person camera sees Albert's back
    this._bodyYaw = this.yaw + Math.PI;
    this.avatar.rotation.y = this._bodyYaw;
    world.scene.add(this.avatar);
    this._syncCrosshair();
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
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
    this._syncCrosshair();
  }

  _syncCrosshair() {
    const el = document.getElementById("crosshair");
    if (el) el.hidden = this.mode !== "first";
  }

  _setFirstPersonBodyVisible(showFull) {
    this.avatar.traverse((obj) => {
      if (!obj.isMesh && !obj.isLight) return;
      obj.visible = showFull;
    });
    if (!showFull) {
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
    this.pitch = -0.08;
    this.pos.set(0, CONFIG.eyeHeight, 10);
    this.velY = 0;
    this.mode = "third";
    this._bodyYaw = this.yaw + Math.PI;
    this.avatar.rotation.y = this._bodyYaw;
    this.avatar.visible = true;
    this._setFirstPersonBodyVisible(true);
    this._syncCrosshair();
    this._applyCamera();
  }

  update(dt, input) {
    const look = input.consumeLook();
    this.yaw -= look.dx * CONFIG.mouseSens;
    this.pitch -= look.dy * CONFIG.mouseSens;
    // Look up/down — enough down angle to see the forest floor; camera stays above ground
    this.pitch = Math.max(-1.2, Math.min(0.65, this.pitch));

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

    // Body faces walk direction; when idle, ease toward look facing
    let targetBody = this.yaw + Math.PI;
    if (this._moving) {
      targetBody = Math.atan2(this._wish.x, this._wish.z);
    }
    const turnSpeed = this._moving ? 12 : 7;
    this._bodyYaw += shortestAngleDelta(this._bodyYaw, targetBody) * Math.min(1, dt * turnSpeed);
    this.avatar.position.set(this.pos.x, this.pos.y - CONFIG.eyeHeight, this.pos.z);
    this.avatar.rotation.y = this._bodyYaw;

    // Head/neck matches camera look (bone +X/+Y are opposite to camera pitch/yaw signs)
    const lookFacing = this.yaw + Math.PI;
    const headYaw = shortestAngleDelta(this._bodyYaw, lookFacing);
    setAvatarLook(this.avatar, -headYaw, -this.pitch, dt);

    animateAvatar(this.avatar, dt, this._moving, this._sprint);
    this._applyCamera();
  }

  _applyCamera() {
    if (this.mode === "first") {
      this.camera.position.copy(this.pos);
      this.camera.rotation.order = "YXZ";
      this.camera.rotation.y = this.yaw;
      // pitch>0 = look up (same as third-person aim); Three.js +X rotation looks down
      this.camera.rotation.x = -this.pitch;
      return;
    }

    // Stable third-person follow: camera stays above ground.
    // Looking up/down is the head + aim point — not burying the camera.
    const dist = CONFIG.thirdPersonDist;
    const feetY = this.pos.y - CONFIG.eyeHeight;
    const camY = feetY + 1.9;
    this.camera.position.set(
      this.pos.x + Math.sin(this.yaw) * dist,
      camY,
      this.pos.z + Math.cos(this.yaw) * dist
    );

    const aim = 9;
    const eyeY = feetY + 1.55;
    this._lookTarget.set(
      this.pos.x - Math.sin(this.yaw) * aim,
      eyeY + Math.sin(this.pitch) * aim,
      this.pos.z - Math.cos(this.yaw) * aim
    );
    // Allow aiming at the ground in front; never bury the look point deep underground
    this._lookTarget.y = Math.max(feetY - 2.2, this._lookTarget.y);
    this.camera.lookAt(this._lookTarget);
  }
}
