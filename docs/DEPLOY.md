# Deploy — Sussurros da Floresta

Site: **https://jhonatanribeiro.com/sussurros-da-floresta/**

## Deploy automático (GitHub Actions → FTP)

Workflow: [`.github/workflows/deploy-hostgator.yml`](../.github/workflows/deploy-hostgator.yml)

Dispara em **push na `develop`** ou manualmente em Actions → **Deploy HostGator**.

### Secrets do repositório

`Settings → Secrets and variables → Actions` — **só os nomes**; valores ficam só no GitHub:

| Secret | Conteúdo |
| --- | --- |
| `HOSTGATOR_FTP_HOST` | host FTP |
| `HOSTGATOR_FTP_USER` | usuário FTP dedicado do Sussurros |
| `HOSTGATOR_FTP_PASSWORD` | senha FTP |
| `HOSTGATOR_FTP_DIR` | pasta remota (raiz da conta FTP jail, em geral `/` ou `./`) |

Mesmo esquema do Neve Selvagem (`snow`) e Amarelinho: conta FTP própria jailada em `public_html/sussurros-da-floresta/`.

Script auxiliar (pede os valores e grava no repo):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/set-ftp-secrets.ps1
```

### Branches

| Branch | Papel |
| --- | --- |
| `develop` | desenvolvimento + deploy HostGator (e Pages) |
| `main` | estável + GitHub Pages |

## GitHub Pages

Workflow: [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)

URL típica: https://dreadpiratejhonatan.github.io/sussurros-da-floresta/

Em **Settings → Pages → Source: GitHub Actions**.

## Build local / pacote manual

```bash
npm run build
```

- `dist/` — preview (`npm run preview`)
- `release/hostgator-sussurros-da-floresta/` — conteúdo para `public_html/sussurros-da-floresta/`

## FTP sync state

Se apagar arquivos no File Manager e o deploy Action ficar verde sem subir nada, apague no servidor:

`.ftp-deploy-sync-state.json`

e rode de novo **Deploy HostGator**.

## Checklist pós-deploy

- [ ] https://jhonatanribeiro.com/sussurros-da-floresta/ abre
- [ ] Console: `[Sussurros da Floresta] build vXX` (cache atual)
- [ ] Hard refresh `Ctrl+Shift+R`
