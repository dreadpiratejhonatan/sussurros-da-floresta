# Sussurros da Floresta — agent guide (desktop + Cursor mobile)

3D browser forest game (Three.js). Production: https://jhonatanribeiro.com/sussurros-da-floresta/

## Cloud / phone workflow (same as snow / amarelinho)

When working as a **Cloud Agent** (Cursor mobile or cloud):

1. Work on a `cursor/*` branch and open a PR toward **`develop`**.
2. Do **not** ask the user to merge manually — GitHub Action **Auto-merge Cursor PRs** squash-merges `cursor/*` into `develop` after CI and dispatches HostGator + Pages deploys.
3. After finishing a feature the user wanted live, ensure the PR is opened (not only a local commit). Prefer a ready-for-review PR.
4. Bump cache/`SDF_BUILD` in `scripts/build.mjs` + `index.html` (+ `sw.js` cache name) when shipping visible changes (`v2`, `v3`, …).
5. Run `npm run build` before finishing so CI and FTP artifacts stay in sync.

## Deploy facts

| Trigger | Result |
| --- | --- |
| Push / merge to `develop` | CI + FTP HostGator + Pages |
| PR from `cursor/*` | Auto-merge → then dispatch deploys |
| Manual | Actions → **Deploy HostGator** |

Docs: [`docs/MOBILE-AUTO-PROD.md`](docs/MOBILE-AUTO-PROD.md), [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Stack pointers

- Entry: `src/js/main.js`, shell: `index.html`
- World/player: `src/js/world.js`, `player.js`, `input.js`, `touch.js`
- Build: `npm run build` → `dist/` + `release/hostgator-sussurros-da-floresta/`
- Local: `npm run start:win` → http://127.0.0.1:5175/

## Conventions

- Portuguese UI copy by default.
- Prefer small, shippable changes; keep touch controls working.
- Never commit FTP passwords or `.env` secrets.
