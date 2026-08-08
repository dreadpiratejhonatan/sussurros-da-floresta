# Deploy — Sussurros da Floresta

Site: **https://jhonatanribeiro.com/sussurros-da-floresta/**

## Automático (GitHub Actions → FTP)

Workflow: `.github/workflows/deploy-hostgator.yml` — push em `develop` ou manual.

### Secrets (só nomes)

| Secret | Conteúdo |
| --- | --- |
| `HOSTGATOR_FTP_HOST` | host FTP |
| `HOSTGATOR_FTP_USER` | usuário FTP jail em `public_html/sussurros-da-floresta/` |
| `HOSTGATOR_FTP_PASSWORD` | senha |
| `HOSTGATOR_FTP_DIR` | `/` ou `./` |
| `GAME_API_BASE` | (opcional) URL absoluta da API HostGator p/ Pages |

```powershell
powershell -ExecutionPolicy Bypass -File scripts/set-ftp-secrets.ps1
```

### Pacote

`npm run build` → `release/hostgator-sussurros-da-floresta/`

- Bundle único `src/js/bundle.js`
- `.htaccess` com cache HTML no-cache
- **Não** inclui `data/leaderboard.json` nem `tickets.json` vivos
- FTP exclude reforça `data/**/*.json` sensíveis

Se Action verde e site velho: apague `.ftp-deploy-sync-state.json` no servidor e rode **Deploy HostGator** de novo.

## GitHub Pages

`.github/workflows/deploy-pages.yml` — estático a partir de `dist/`.

## Checklist

- [ ] HTML/prod mostra `?v=b001` (ou bump atual)
- [ ] Console: `[Sussurros da Floresta] build b001`
- [ ] Ranking/`data/` intactos no servidor
