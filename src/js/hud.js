/**
 * In-game HUD: meters, prompts, toasts, whisper balloons, and story chronicles.
 * Story panel is sequential and suppresses overlapping toast/balloon/prompt.
 */
export class HUD {
  constructor() {
    this.root = document.getElementById("hud");
    this.prompt = document.getElementById("prompt");
    this.toast = document.getElementById("toast");
    this.objective = document.getElementById("objective");
    this.progress = document.getElementById("hud-progress");
    this.loreBar = document.getElementById("hud-lore");
    this.chronicleBar = document.getElementById("hud-chronicles");
    this.climateBar = document.getElementById("hud-climate");
    this.balloon = document.getElementById("whisper-balloon");
    this.story = document.getElementById("story-panel");
    this.storyName = this.story?.querySelector(".story__name") || null;
    this.storyText = this.story?.querySelector(".story__text") || null;
    this._toastTimer = 0;
    this._balloonTimer = 0;
    this._storyTimer = 0;
    this._storyBusy = false;
  }

  show() {
    if (this.root) this.root.hidden = false;
  }

  hide() {
    if (this.root) this.root.hidden = true;
    this.hideBalloon();
    this.hideStory();
  }

  isStoryBusy() {
    return this._storyBusy;
  }

  setPrompt(text) {
    if (!this.prompt) return;
    if (this._storyBusy) {
      this.prompt.hidden = true;
      return;
    }
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
    this.progress.textContent = `${done}/${total} mistérios`;
    this.progress.hidden = false;
  }

  setLore(done, total, animalsDone, animalsTotal) {
    if (!this.loreBar) return;
    this.loreBar.textContent = `${done}/${total} lore · ${animalsDone}/${animalsTotal} espíritos`;
    this.loreBar.hidden = false;
  }

  setChronicles(done, total) {
    if (!this.chronicleBar) return;
    this.chronicleBar.textContent = `${done}/${total} crônicas`;
    this.chronicleBar.hidden = false;
  }

  setClimate(line) {
    if (!this.climateBar) return;
    this.climateBar.textContent = line || "";
    this.climateBar.hidden = !line;
  }

  showToast(text, ms = 2600) {
    if (this._storyBusy) return;
    if (!this.toast) return;
    this.toast.hidden = false;
    this.toast.textContent = text;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toast.hidden = true;
    }, ms);
  }

  showBalloon(name, text, ms = 4200) {
    if (this._storyBusy) return;
    if (!this.balloon) return;
    this.balloon.hidden = false;
    const nameEl = this.balloon.querySelector(".balloon__name");
    const textEl = this.balloon.querySelector(".balloon__text");
    if (nameEl) nameEl.textContent = name;
    if (textEl) textEl.textContent = text;
    clearTimeout(this._balloonTimer);
    this._balloonTimer = setTimeout(() => this.hideBalloon(), ms);
  }

  hideBalloon() {
    if (this.balloon) this.balloon.hidden = true;
  }

  balloonVisible() {
    return !!(this.balloon && !this.balloon.hidden) || this._storyBusy;
  }

  hideStory() {
    clearTimeout(this._storyTimer);
    this._storyTimer = 0;
    this._storyBusy = false;
    if (this.story) this.story.hidden = true;
  }

  _showStoryPanel(name, text, ms, onDone) {
    clearTimeout(this._storyTimer);
    this._storyBusy = true;
    if (this.prompt) this.prompt.hidden = true;
    if (this.toast) this.toast.hidden = true;
    this.hideBalloon();
    if (this.storyName) this.storyName.textContent = name || "";
    if (this.storyText) this.storyText.textContent = text || "";
    if (this.story) this.story.hidden = false;
    this._storyTimer = setTimeout(() => {
      this._storyTimer = 0;
      if (typeof onDone === "function") onDone();
      else this.hideStory();
    }, Math.max(2500, ms | 0));
  }

  /**
   * Sequential chronicle: spoken line, then historical fact — readable timing, no overlap.
   */
  showChronicle({ name = "", line = "", fact = "", lineMs = 10000, factMs = 16000 } = {}) {
    clearTimeout(this._toastTimer);
    clearTimeout(this._balloonTimer);
    clearTimeout(this._storyTimer);
    this.hideBalloon();
    if (this.toast) this.toast.hidden = true;

    const title = String(name || "Crônica");
    const speak = String(line || "").trim();
    const lore = String(fact || "").trim();
    if (!speak && !lore) return;

    if (speak && lore) {
      this._showStoryPanel(title, speak, lineMs, () => {
        this._showStoryPanel(title, lore, factMs, () => this.hideStory());
      });
      return;
    }
    this._showStoryPanel(title, speak || lore, speak ? lineMs : factMs, () => this.hideStory());
  }
}
