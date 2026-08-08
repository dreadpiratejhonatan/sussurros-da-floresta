export function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export class TouchControls {
  constructor(input) {
    this.input = input;
    this.root = document.getElementById("touch-controls");
    this.stick = document.getElementById("touch-stick");
    this.knob = document.getElementById("touch-knob");
    this.lookPad = document.getElementById("touch-look");
    this.btnInteract = document.getElementById("touch-interact");
    this.btnJump = document.getElementById("touch-jump");
    this.btnCam = document.getElementById("touch-cam");
    if (this.root) this.root.hidden = false;

    this._bindStick();
    this._bindLook();
    this.btnInteract?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.input.interactPressed = true;
    });
    this.btnJump?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.input.keys.add("Space");
      setTimeout(() => this.input.keys.delete("Space"), 180);
    });
    this.btnCam?.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.input.cameraTogglePressed = true;
    });
  }

  _bindStick() {
    if (!this.stick) return;
    let active = null;
    const max = 42;
    const onMove = (e) => {
      if (active == null) return;
      const t = [...e.changedTouches].find((c) => c.identifier === active);
      if (!t) return;
      const rect = this.stick.getBoundingClientRect();
      let dx = t.clientX - (rect.left + rect.width / 2);
      let dy = t.clientY - (rect.top + rect.height / 2);
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      if (this.knob) this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.stickX = dx / max;
      this.input.stickY = dy / max;
    };
    const end = (e) => {
      if (active == null) return;
      if (![...e.changedTouches].some((c) => c.identifier === active)) return;
      active = null;
      if (this.knob) this.knob.style.transform = "translate(0,0)";
      this.input.stickX = 0;
      this.input.stickY = 0;
    };
    this.stick.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        active = e.changedTouches[0].identifier;
        onMove(e);
      },
      { passive: false }
    );
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
  }

  _bindLook() {
    if (!this.lookPad) return;
    let active = null;
    let lastX = 0;
    let lastY = 0;
    this.lookPad.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        active = t.identifier;
        lastX = t.clientX;
        lastY = t.clientY;
      },
      { passive: false }
    );
    window.addEventListener(
      "touchmove",
      (e) => {
        if (active == null) return;
        const t = [...e.changedTouches].find((c) => c.identifier === active);
        if (!t) return;
        this.input.lookDX += (t.clientX - lastX) * 1.4;
        this.input.lookDY += (t.clientY - lastY) * 1.4;
        lastX = t.clientX;
        lastY = t.clientY;
      },
      { passive: false }
    );
    const end = (e) => {
      if (active == null) return;
      if ([...e.changedTouches].some((c) => c.identifier === active)) active = null;
    };
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
  }
}
