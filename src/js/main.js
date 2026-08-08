import * as THREE from "three";
import { CONFIG } from "./config.js";
import { Input } from "./input.js";
import { HUD } from "./hud.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { TouchControls, isTouchDevice } from "./touch.js";

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.menu = document.getElementById("menu");
    this.pauseEl = document.getElementById("pause");
    this.btnPlay = document.getElementById("btn-play");

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouchDevice() ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = !isTouchDevice();
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = isTouchDevice() ? 1.15 : 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      isTouchDevice() ? 78 : 70,
      window.innerWidth / window.innerHeight,
      0.05,
      120
    );

    this.input = new Input(this.canvas);
    this.hud = new HUD();
    this.world = new World(this.scene);
    this.player = new Player(this.camera, this.world);
    this.touch = isTouchDevice() ? new TouchControls(this.input) : null;

    this.state = "menu";
    this._last = performance.now();
    this._heard = new Set();

    this.btnPlay.addEventListener("click", () => this.start());
    document.getElementById("btn-pause")?.addEventListener("click", () => this.pause());
    document.getElementById("btn-resume")?.addEventListener("click", () => this.resume());
    document.getElementById("btn-menu")?.addEventListener("click", () => this.returnToMenu());

    window.addEventListener("resize", () => this._onResize());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    this._loop();
  }

  start() {
    this.menu.hidden = true;
    this.menu.setAttribute("aria-hidden", "true");
    this.pauseEl.hidden = true;
    this.hud.show();
    this.player.reset();
    this._heard.clear();
    this.hud.setObjective("Ouça os sussurros das pedras brilhantes.");
    this.state = "playing";
    this.canvas.requestPointerLock?.();
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.pauseEl.hidden = false;
    document.exitPointerLock?.();
  }

  resume() {
    if (this.state !== "paused") return;
    this.pauseEl.hidden = true;
    this.state = "playing";
    this.canvas.requestPointerLock?.();
  }

  returnToMenu() {
    this.state = "menu";
    this.pauseEl.hidden = true;
    this.hud.hide();
    this.menu.hidden = false;
    this.menu.setAttribute("aria-hidden", "false");
    document.exitPointerLock?.();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _update(dt, now) {
    if (this.input.consumePause()) {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    }

    if (this.state !== "playing") return;

    this.player.update(dt, this.input);
    this.world.update(now * 0.001);

    const w = this.world.nearestWhisper(this.player.pos.x, this.player.pos.z, CONFIG.interactDist);
    if (w) {
      this.hud.setPrompt("E — ouvir sussurro");
      if (this.input.consumeInteract()) {
        this.hud.showToast(w.text, 3200);
        this._heard.add(w.text);
        if (this._heard.size >= this.world.whispers.length) {
          this.hud.setObjective("Você ouviu todos os sussurros. A floresta respira com você.");
        } else {
          this.hud.setObjective(`Sussurros ouvidos: ${this._heard.size}/${this.world.whispers.length}`);
        }
      }
    } else {
      this.hud.setPrompt("");
      this.input.consumeInteract();
    }
  }

  _loop = () => {
    requestAnimationFrame(this._loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._update(dt, now);
    this.renderer.render(this.scene, this.camera);
  };
}

new Game();
