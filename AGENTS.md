# Sussurros da Floresta — agent guide

3D forest mystery (Three.js). Pitch: **Os primeiros povos**. Solo. Sem inimigos no v0.

Production: https://jhonatanribeiro.com/sussurros-da-floresta/

## Cloud / phone (same as snow)

1. Branch `cursor/*` + PR → **`develop`**
2. Auto-merge after CI → HostGator + Pages
3. Bump `CACHE` / `SDF_BUILD` / `?v=` (`b002`, …) on visible ships
4. `npm run test:smoke` before finishing

## Stack pointers

- Content knobs: `src/js/config.js`
- Boot: `splash.js` → Albert → difficulty → `main.js`
- World/puzzles: `world.js` · avatar: `skins.js` · save: `save.js`
- Build: `scripts/build.mjs` → `dist/` + `release/hostgator-sussurros-da-floresta/`
- Local: `npm run start:win` → http://127.0.0.1:5175/

## Conventions

- Portuguese UI. Prefer CONFIG + art over new frameworks.
- Never commit FTP passwords, `.env`, or the private game recipe doc.
- Never ship live `data/leaderboard.json` / `tickets.json` in the HostGator package.
