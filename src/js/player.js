import * as THREE from "three";
import { CONFIG } from "./config.js";

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.yaw = 0;
    this.pitch = -0.12;
    this.pos = new THREE.Vector3(0, CONFIG.eyeHeight, 8);
    this.velY = 0;
    this.onGround = true;
    this._fwd = new THREE.Vector3();
    this._right = new THREE.Vector3();
  }

  reset() {
    this.yaw = 0;
    this.pitch = -0.12;
    this.pos.set(0, CONFIG.eyeHeight, 8);
    this.velY = 0;
    this._applyCamera();
  }

  update(dt, input) {
    const look = input.consumeLook();
    this.yaw -= look.dx * CONFIG.mouseSens;
    this.pitch -= look.dy * CONFIG.mouseSens;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));

    this._fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const mv = input.moveVector();
    let speed = CONFIG.moveSpeed * (mv.sprint ? CONFIG.sprintMult : 1);
    const wish = new THREE.Vector3()
      .addScaledVector(this._right, mv.x)
      .addScaledVector(this._fwd, -mv.z);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed * dt);

    let nx = this.pos.x + wish.x;
    let nz = this.pos.z + wish.z;
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

    if (this.onGround && (input.keys.has("Space"))) {
      this.velY = CONFIG.jumpSpeed;
      this.onGround = false;
    }

    this._applyCamera();
  }

  _applyCamera() {
    this.camera.position.copy(this.pos);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
