import * as THREE from "three";
import { CONFIG, loreCount, npcCount, puzzleCount } from "./config.js";
import { Input } from "./input.js";
import { HUD } from "./hud.js";
import { World } from "./world.js";
import { Player } from "./player.js";
import { TouchControls, isTouchDevice } from "./touch.js";
import { Save } from "./save.js";
import { AudioBed } from "./audio.js";
import { runBootFlow } from "./splash.js";
import { getSkin } from "./skins.js";
import { SpiritAnimals } from "./animals.js";
import { Climate } from "./climate.js";
import { HistoricalNpcs } from "./npcs.js";

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.pauseEl = document.getElementById("pause");
    this.winEl = document.getElementById("win-screen");

    const mobile = isTouchDevice();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !mobile,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = !mobile;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = mobile ? 1.1 : 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      mobile ? 78 : 70,
      window.innerWidth / window.innerHeight,
      0.05,
      140
    );

    this.input = new Input(this.canvas);
    this.hud = new HUD();
    this.save = new Save();
    this.audio = new AudioBed();
    this.world = new World(this.scene);
    this.animals = new SpiritAnimals(this.scene);
    this.npcs = new HistoricalNpcs(this.scene);
    this.player = new Player(this.camera, this.world, "albert");
    this.climate = new Climate(this.scene, this.camera);
    this.touch = mobile ? new TouchControls(this.input) : null;

    this.state = "boot";
    this._last = performance.now();
    this._runTime = 0;
    this._whisperTimer = 20 + Math.random() * 40;
    this.difficulty = CONFIG.difficulties.normal;

    document.getElementById("btn-pause")?.addEventListener("click", () => this.pause());
    document.getElementById("btn-resume")?.addEventListener("click", () => this.resume());
    document.getElementById("btn-menu")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.restart();
    });
    document.getElementById("btn-win-again")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.restart();
    });

    window.addEventListener("resize", () => this._onResize());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    this._boot();
    this._loop();
  }

  async _boot() {
    const choice = await runBootFlow({
      onUnlockAudio: () => this.audio.unlock(),
    });
    this.save.data.skinId = choice.skinId;
    this.save.data.difficulty = choice.difficulty;
    this.save.data.runs += 1;
    this.save.resetRunProgress();
    this.save.persist();

    this.difficulty = CONFIG.difficulties[choice.difficulty] || CONFIG.difficulties.normal;
    this.player.setSkin(choice.skinId);
    this.player.setMoveMult(this.difficulty.moveMult);
    this.world.setAtmosphere({
      fogMult: this.difficulty.fogMult,
      dayMult: this.difficulty.dayMult,
    });

    this.start();
  }

  start() {
    this.player.reset();
    this.climate.reset();
    this.npcs.reset(this.save.data.npcs);
    this._runTime = 0;
    this.input.enabled = true;
    this.hud.show();
    this.hud.setObjective(CONFIG.winCondition);
    this._refreshBars();
    this.hud.showToast(`${getSkin(this.save.data.skinId).name} · ${this.difficulty.label}`, 2200);
    this.state = "playing";
    this.canvas.requestPointerLock?.();
  }

  _refreshBars() {
    const n = this.save.solvedCount(CONFIG.puzzles.map((p) => p.saveId));
    this.hud.setProgress(n, puzzleCount());
    this.hud.setLore(
      this.save.loreCount(CONFIG.lore.map((l) => l.saveId)),
      loreCount(),
      this.save.animalCount(CONFIG.animals.map((a) => a.id)),
      CONFIG.animals.length
    );
    this.hud.setChronicles(
      this.save.npcCount(CONFIG.npcs.map((n) => n.id)),
      npcCount()
    );
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.input.enabled = false;
    this.pauseEl.hidden = false;
    document.exitPointerLock?.();
  }

  resume() {
    if (this.state !== "paused") return;
    this.pauseEl.hidden = true;
    this.input.enabled = true;
    this.state = "playing";
    this.canvas.requestPointerLock?.();
  }

  restart() {
    const url = new URL(window.location.href);
    url.searchParams.set("r", String(Date.now()));
    window.location.href = url.pathname + url.search + url.hash;
  }

  _win() {
    this.state = "won";
    this.input.enabled = false;
    document.exitPointerLock?.();
    this.hud.hide();
    if (this.touch?.root) this.touch.root.hidden = true;
    this.pauseEl.hidden = true;
    this.winEl.hidden = false;
    this.winEl.style.zIndex = "200";
    const elapsed = Math.round(this._runTime);
    const loreN = this.save.loreCount(CONFIG.lore.map((l) => l.saveId));
    const aniN = this.save.animalCount(CONFIG.animals.map((a) => a.id));
    const npcN = this.save.npcCount(CONFIG.npcs.map((n) => n.id));
    const body = document.getElementById("win-body");
    if (body) {
      body.textContent =
        `Albert revelou ${puzzleCount()} mistérios em ${elapsed}s. ` +
        `Crônicas ${npcN}/${npcCount()} · Lore ${loreN}/${loreCount()} · Espíritos ${aniN}/${CONFIG.animals.length}. ` +
        `Cananéia e os primeiros povos permanecem na memória da mata.`;
    }
    if (this.save.data.bestTimeSec == null || elapsed < this.save.data.bestTimeSec) {
      this.save.data.bestTimeSec = elapsed;
      this.save.persist();
    }
    this.audio.spiritTone();
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _nextWhisperGap() {
    const { minGapSec, maxGapSec, longBias } = CONFIG.whispers;
    const t = Math.random();
    const skewed = longBias > 0 ? Math.pow(t, 1 - longBias * 0.5) : t;
    return minGapSec + skewed * (maxGapSec - minGapSec);
  }

  _handleInteract() {
    const x = this.player.pos.x;
    const z = this.player.pos.z;
    const puzzle = this.world.nearestPuzzle(x, z, CONFIG.interactDist);
    if (puzzle) {
      const done = this.save.isSolved(puzzle.saveId);
      this.hud.setPrompt(done ? `${puzzle.title} · já revelado` : `E — ${puzzle.hint}`);
      if (!done && this.input.consumeInteract()) {
        this.save.markSolved(puzzle.saveId);
        this.world.markPuzzleSolved(puzzle.id);
        this.audio.puzzleChime();
        this.hud.showToast(puzzle.whisper, 3800);
        this._refreshBars();
        const n = this.save.solvedCount(CONFIG.puzzles.map((p) => p.saveId));
        if (n >= puzzleCount()) {
          this.hud.setObjective("Todos os mistérios da floresta foram descobertos.");
          setTimeout(() => this._win(), 1000);
        } else {
          this.hud.setObjective(`Ainda faltam ${puzzleCount() - n} mistério(s).`);
        }
      }
      return;
    }

    const lore = this.world.nearestLore(x, z, CONFIG.interactDist);
    if (lore) {
      const done = this.save.isLore(lore.saveId);
      this.hud.setPrompt(done ? `${lore.title} · lido` : `E — ler ${lore.title}`);
      if (!done && this.input.consumeInteract()) {
        this.save.markLore(lore.saveId);
        this.world.markLoreRead(lore.id);
        this.audio.loreChime();
        this.hud.showToast(lore.text, 4800);
        this._refreshBars();
      }
      return;
    }

    const npc = this.npcs.nearest(x, z, CONFIG.interactDist + 0.8);
    if (npc) {
      const first = !this.save.heardNpc(npc.cfg.id);
      this.hud.setPrompt(
        first
          ? `E — falar com ${npc.cfg.name}`
          : `${npc.cfg.name} · crônica ouvida`
      );
      if (this.input.consumeInteract()) {
        if (first) {
          this.save.markNpc(npc.cfg.id);
          npc.heard = true;
          this._refreshBars();
        }
        this.audio.loreChime();
        // One story panel at a time — longer read time, no toast/balloon stack
        this.hud.showChronicle({
          name: npc.cfg.name,
          line: npc.cfg.line,
          fact: `${npc.cfg.title}: ${npc.cfg.fact}`,
          lineMs: 11000,
          factMs: 18000,
        });
      }
      return;
    }

    const animal = this.animals.nearest(x, z, CONFIG.interactDist + 0.6);
    if (animal) {
      const first = !this.save.sawAnimal(animal.cfg.id);
      this.hud.setPrompt(
        first ? `E — observar ${animal.cfg.label}` : `${animal.cfg.label} · presente`
      );
      if (first && this.input.consumeInteract()) {
        this.save.markAnimal(animal.cfg.id);
        animal.seen = true;
        this.audio.spiritTone();
        this.hud.showBalloon(animal.cfg.label, animal.cfg.line, 5000);
        // clue toward an unsolved mystery
        const unsolved = CONFIG.puzzles.find((p) => !this.save.isSolved(p.saveId));
        if (unsolved?.clue) {
          setTimeout(() => this.hud.showToast(unsolved.clue, 3200), 900);
        }
        this._refreshBars();
      }
      return;
    }

    this.hud.setPrompt("");
    this.input.consumeInteract();
  }

  _update(dt) {
    if (this.input.consumePause()) {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    }

    if (this.state !== "playing") {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    this._runTime += dt;
    if (this.input.consumeCameraToggle()) this.player.toggleCamera();

    this.player.update(dt, this.input);
    this.audio.setListener(this.player.pos.x, this.player.pos.z);
    this.audio.updateFootsteps(
      dt,
      this.player._moving,
      this.player._sprint,
      this.player.onGround
    );
    this.audio.update(dt);
    this.animals.update(this._runTime, dt);
    this.npcs.update(this._runTime, dt);

    // Full day/night cycle (0 = night, 1 = day) + seasons / weather
    const dayPhase =
      0.5 +
      0.5 *
        Math.sin(
          (this._runTime / (CONFIG.world.dayLengthSec / this.difficulty.dayMult)) *
            Math.PI *
            2
        );
    this.climate.update(dt, this._runTime, dayPhase, this.player.pos);
    const climate = this.climate.state();
    this.world.update(this._runTime, dayPhase, climate);
    this.audio.setDayMix(dayPhase);
    this.audio.setClimate({
      rain: climate.rain,
      wind: climate.wind,
      sand: climate.sand,
      dayPhase,
      seasonId: climate.seasonId,
    });
    this.hud.setClimate(climate.hudLine);
    const climateToast = this.climate.consumeToast();
    if (climateToast && !this.hud.isStoryBusy()) {
      this.hud.showToast(climateToast.text, climateToast.ms);
    }

    this._handleInteract();

    this._whisperTimer -= dt;
    if (this._whisperTimer <= 0 && !this.hud.balloonVisible() && !this.hud.isStoryBusy()) {
      const skin = getSkin(this.save.data.skinId);
      const lines = [
        "A mata guarda nomes anteriores ao mapa.",
        "Cada gota de chuva lembra um nome antigo.",
        "Os primeiros povos não sumiram — mudaram de voz.",
        "Esses animais… não são só animais.",
        "Há uma melodia debaixo do vento.",
        "O rio fala mais alto quando a noite chega.",
        climate.isDay
          ? `A luz do ${climate.seasonLabel.toLowerCase()} muda o cheiro da trilha.`
          : `Na noite de ${climate.seasonLabel.toLowerCase()}, a mata fala baixo.`,
        climate.weatherId === "rain"
          ? "A chuva lava nomes antigos nas folhas."
          : climate.weatherId === "sandstorm"
            ? "A areia risca o ar — um aviso seco da estação."
            : "O clima da floresta nunca fica quieto por muito tempo.",
      ];
      this.hud.showBalloon(skin.name, lines[Math.floor(Math.random() * lines.length)]);
      this._whisperTimer = this._nextWhisperGap();
    } else if (this._whisperTimer <= 0) {
      this._whisperTimer = 8;
    }

    this.renderer.render(this.scene, this.camera);
  }

  _loop = () => {
    requestAnimationFrame(this._loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._update(dt);
  };
}

console.info("[Sussurros da Floresta] build", CONFIG.build);
new Game();
