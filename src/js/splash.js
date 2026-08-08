import { CONFIG } from "./config.js";
import { listSkins } from "./skins.js";

/**
 * Boot: splash → character → difficulty → play (solo).
 * Resolves with { skinId, difficulty }.
 */
export function runBootFlow({ onUnlockAudio } = {}) {
  return new Promise((resolve) => {
    const splash = document.getElementById("splash");
    const skinScreen = document.getElementById("skin-screen");
    const diffScreen = document.getElementById("diff-screen");
    const skinGrid = document.getElementById("skin-grid");
    const diffGrid = document.getElementById("diff-grid");

    let skinId = "albert";
    let difficulty = "normal";

    const show = (el) => {
      for (const node of [splash, skinScreen, diffScreen]) {
        if (!node) continue;
        node.hidden = node !== el;
      }
    };

    // Splash
    const pitch = document.getElementById("splash-pitch");
    if (pitch) pitch.textContent = CONFIG.pitch;
    const title = document.getElementById("splash-title");
    if (title) title.textContent = CONFIG.name;

    const enterSplash = async () => {
      await onUnlockAudio?.();
      // Character picker
      skinGrid.innerHTML = "";
      const skins = listSkins();
      const shuffled = [...skins].sort(() => Math.random() - 0.5);
      for (const s of shuffled) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "pick-card";
        const label = String(s.name || "").toUpperCase();
        card.innerHTML = `
          <img src="${s.face}" alt="${label}" width="96" height="96" />
          <strong>${label}</strong>
        `;
        card.addEventListener("click", () => {
          skinId = s.id;
          // Difficulty
          diffGrid.innerHTML = "";
          for (const d of Object.values(CONFIG.difficulties)) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "pick-card pick-card--diff";
            btn.innerHTML = `<strong>${d.label}</strong><span>${d.id}</span>`;
            btn.addEventListener("click", () => {
              difficulty = d.id;
              show(null);
              splash.hidden = true;
              skinScreen.hidden = true;
              diffScreen.hidden = true;
              resolve({ skinId, difficulty });
            });
            diffGrid.appendChild(btn);
          }
          show(diffScreen);
        });
        skinGrid.appendChild(card);
      }
      show(skinScreen);
    };

    document.getElementById("btn-splash")?.addEventListener("click", enterSplash, { once: true });
    show(splash);
  });
}
