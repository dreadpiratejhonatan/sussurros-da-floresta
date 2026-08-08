$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Url = "http://127.0.0.1:5175"
$Port = 5175

Set-Location $Root

Write-Host "Sussurros da Floresta - localhost" -ForegroundColor Yellow

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js nao encontrado." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "faces\albert.png")) {
  node scripts/gen-face-albert.mjs
}

if (-not (Test-Path "node_modules\three\build\three.module.js")) {
  npm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1

if ($existing) {
  Write-Host "Servidor ja ativo na porta $Port." -ForegroundColor Green
} else {
  Start-Process -FilePath "node" `
    -ArgumentList "node_modules\serve\build\main.js", "-l", "tcp://127.0.0.1:$Port" `
    -WorkingDirectory $Root -WindowStyle Minimized
  Start-Sleep -Seconds 2
}

Write-Host "  Jogo:  $Url" -ForegroundColor Green
Start-Process $Url
