export class HUD {
  constructor() {
    this.root = document.getElementById("hud");
    this.prompt = document.getElementById("prompt");
    this.toast = document.getElementById("toast");
    this.objective = document.getElementById("objective");
    this.progress = document.getElementById("hud-progress");
    this.loreBar = document.getElementById("hud-lore");
    this.balloon = document.getElementById("whisper-balloon");
    this._toastTimer = 0;
    this._balloonTimer = 0;
  }

  show() {
    if (this.root) this.root.hidden = false;
  }

  hide() {
    if (this.root) this.root.hidden = true;
    this.hideBalloon();
  }

  setPrompt(text) {
    if (!this.prompt) return;
    if (!text) {
      this.prompt.hidden = true;
      this.prompt.textContent = "";
      return;
    }
    this.prompt.hidden = false;
    this.prompt.textContent = text;
  }

  setObjective(text) {
    if (!this.objective) return;
    this.objective.textContent = text || "";
    this.objective.hidden = !text;
  }

  setProgress(done, total) {
    if (!this.progress) return;
    this.progress.textContent = `Mistérios ${done}/${total}`;
    this.progress.hidden = false;
  }

  setLore(done, total, animalsDone, animalsTotal) {
    if (!this.loreBar) return;
    this.loreBar.textContent = `Lore ${done}/${total} · Espíritos ${animalsDone}/${animalsTotal}`;
    this.loreBar.hidden = false;
  }

  showToast(text, ms = 2600) {
    if (!this.toast) return;
    this.toast.hidden = false;
    this.toast.textContent = text;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toast.hidden = true;
    }, ms);
  }

  showBalloon(name, text, ms = 4200) {
    if (!this.balloon) return;
    this.balloon.hidden = false;
    this.balloon.querySelector(".balloon__name").textContent = name;
    this.balloon.querySelector(".balloon__text").textContent = text;
    clearTimeout(this._balloonTimer);
    this._balloonTimer = setTimeout(() => this.hideBalloon(), ms);
  }

  hideBalloon() {
    if (this.balloon) this.balloon.hidden = true;
  }

  balloonVisible() {
    return this.balloon && !this.balloon.hidden;
  }
}
