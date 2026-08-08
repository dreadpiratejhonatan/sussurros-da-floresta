# Sussurros da Floresta

Jogo 3D no navegador (Three.js): explore a mata, ouça os sussurros das pedras e descubra o coração da floresta.

| Onde | URL |
| --- | --- |
| **Produção (HostGator)** | https://jhonatanribeiro.com/sussurros-da-floresta/ |
| **GitHub Pages** | https://dreadpiratejhonatan.github.io/sussurros-da-floresta/ |
| **Repo** | https://github.com/dreadpiratejhonatan/sussurros-da-floresta |

## Controles

| Tecla / gesto | Ação |
| --- | --- |
| WASD / stick | Mover |
| Mouse / arrastar | Olhar |
| Shift | Correr |
| Espaço | Pular |
| E / botão E | Ouvir sussurro |
| Esc | Pausar |

## Rodar localmente

```bash
npm install
npm run start:win
```

Abra http://127.0.0.1:5175/

## Branches e deploy

| Branch | O que faz |
| --- | --- |
| `develop` | push → CI + **FTP HostGator** + Pages |
| `main` | estável + Pages |
| `cursor/*` | Cloud Agent (celular) → auto-merge na `develop` → deploy |

**Celular (Cursor Cloud Agent):** mesmo fluxo do Neve Selvagem / Amarelinho — prompt no app → PR `cursor/*` → auto-merge → HostGator. Guia: [`docs/MOBILE-AUTO-PROD.md`](docs/MOBILE-AUTO-PROD.md) · [`AGENTS.md`](AGENTS.md)

Detalhes e secrets: [`docs/DEPLOY.md`](docs/DEPLOY.md)

```bash
npm run build   # dist/ + release/hostgator-sussurros-da-floresta/
```

Secrets FTP (mesmos nomes do `snow` / `amarelinho`): `HOSTGATOR_FTP_HOST`, `HOSTGATOR_FTP_USER`, `HOSTGATOR_FTP_PASSWORD`, `HOSTGATOR_FTP_DIR`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/set-ftp-secrets.ps1
```
