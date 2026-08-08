export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.lookDX = 0;
    this.lookDY = 0;
    this.locked = false;
    this.interactPressed = false;
    this.pausePressed = false;
    this.cameraTogglePressed = false;
    this.stickX = 0;
    this.stickY = 0;
    this.demo = false;
    /** When false, ignore gameplay input and do not steal pointer lock. */
    this.enabled = true;

    window.addEventListener("keydown", (e) => {
      if (!this.enabled) return;
      if (e.code === "Tab") e.preventDefault();
      this.keys.add(e.code);
      if (e.code === "KeyE") this.interactPressed = true;
      if (e.code === "Escape") this.pausePressed = true;
      if (e.code === "KeyV" || e.code === "KeyC") this.cameraTogglePressed = true;
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));

    canvas.addEventListener("click", () => {
      if (!this.enabled || this.locked || this.demo) return;
      canvas.requestPointerLock?.();
    });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === canvas;
    });
    document.addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      this.lookDX += e.movementX;
      this.lookDY += e.movementY;
    });
  }

  consumeLook() {
    const dx = this.lookDX;
    const dy = this.lookDY;
    this.lookDX = 0;
    this.lookDY = 0;
    return { dx, dy };
  }

  consumeInteract() {
    const v = this.interactPressed;
    this.interactPressed = false;
    return v;
  }

  consumePause() {
    const v = this.pausePressed;
    this.pausePressed = false;
    return v;
  }

  consumeCameraToggle() {
    const v = this.cameraTogglePressed;
    this.cameraTogglePressed = false;
    return v;
  }

  moveVector() {
    let x = this.stickX;
    let z = this.stickY;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z += 1;
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }
    return {
      x,
      z,
      sprint: this.keys.has("ShiftLeft") || this.keys.has("ShiftRight"),
      jump: this.keys.has("Space"),
    };
  }
}
