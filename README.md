# Sussurros da Floresta

**Os primeiros povos.** Aventura solo de mistério na mata fechada (Three.js).

| Onde | URL |
| --- | --- |
| **Produção (HostGator)** | https://jhonatanribeiro.com/spirit/ |
| **GitHub Pages** | https://dreadpiratejhonatan.github.io/sussurros-da-floresta/ |
| **Repo** | https://github.com/dreadpiratejhonatan/sussurros-da-floresta |

## Rodar local

```bash
npm install
npm run start:win
# ou: npm start  → http://127.0.0.1:5175/
```

Fluxo: splash (libera trilha) → Albert → dificuldade → explorar **5 mistérios**, ler lore, observar espíritos (E).

| Tecla | Ação |
| --- | --- |
| WASD / stick | Mover |
| Mouse / arrastar | Olhar |
| E | Interagir / puzzle |
| V / C | 1ª ↔ 3ª pessoa |
| Esc | Pausar |

## Personagem

**Albert** — protagonista (foto): óculos pretos, barba, jaqueta azul com zíper laranja, camiseta navy e mochila.

### Adicionar personagem (quando quiser mais skins)

1. PNG 256×256 em `faces/ID.png` (NEAREST)
2. Entrada em `CONFIG.skins` + `CONFIG.skinOrder` (`src/js/config.js`)
3. Atualizar texto de ajuda se precisar
4. Bump `?v=` / `CACHE` em `scripts/build.mjs` + `index.html`
5. `npm run test:smoke`

## Build / smoke

```bash
npm run build
npm run test:smoke
```

- `dist/` — Pages / preview
- `release/hostgator-spirit/` — FTP → `public_html/spirit/` (**não** leva `leaderboard.json` / tickets vivos)

## Deploy

Ver [`docs/DEPLOY.md`](docs/DEPLOY.md). Secrets FTP (nomes): `HOSTGATOR_FTP_HOST`, `HOSTGATOR_FTP_USER`, `HOSTGATOR_FTP_PASSWORD`, `HOSTGATOR_FTP_DIR`. Opcional: `GAME_API_BASE`.

```powershell
npm run secrets:ftp
```

Se o Action ficar verde e o site antigo: apague no servidor `.ftp-deploy-sync-state.json` e redeploy.

## Branches

| Branch | Papel |
| --- | --- |
| `develop` | CI + HostGator + Pages |
| `main` | estável + Pages |
| `cursor/*` | auto-merge → develop → deploy |

Celular: [`docs/MOBILE-AUTO-PROD.md`](docs/MOBILE-AUTO-PROD.md) · [`AGENTS.md`](AGENTS.md)

## v0

- Solo, mystery, sem inimigos
- 1 hub + 3 puzzles (win)
- Áudio procedural: chuva, vento, rio, animais
