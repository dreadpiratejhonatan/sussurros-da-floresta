// Gera dist/ (bundle único) + release/hostgator-sussurros-da-floresta/
// Nunca sobrescreve data/*.json vivos no pacote HostGator.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

process.chdir(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const DIST = "dist";
const HOST = path.join("release", "hostgator-sussurros-da-floresta");
const CACHE = "b002";

/** Arquivos de dados vivos no servidor — nunca clobber no pacote HostGator. */
const PRESERVE_DATA = new Set([
  "leaderboard.json",
  "tickets.json",
  "tickets-rate.json",
  "tickets-admin.key",
]);

function copyDataDir(destRoot, { omitLiveData = false } = {}) {
  const srcDir = "data";
  const destDir = path.join(destRoot, "data");
  fs.mkdirSync(destDir, { recursive: true });
  if (fs.existsSync(srcDir)) {
    for (const name of fs.readdirSync(srcDir)) {
      const from = path.join(srcDir, name);
      const to = path.join(destDir, name);
      if (!fs.statSync(from).isFile()) continue;
      if (PRESERVE_DATA.has(name)) {
        if (omitLiveData) continue;
        if (fs.existsSync(to)) {
          console.log(`PRESERVE data: ${to}`);
          continue;
        }
      }
      fs.copyFileSync(from, to);
    }
  }
  fs.writeFileSync(
    path.join(destDir, "leaderboard.example.json"),
    JSON.stringify({ entries: [] }, null, 2) + "\n"
  );
  fs.writeFileSync(
    path.join(destDir, "tickets.example.json"),
    JSON.stringify({ tickets: [] }, null, 2) + "\n"
  );
  if (omitLiveData) {
    console.log("HostGator package: data/ sem leaderboard/tickets vivos (servidor intacto)");
  }
}

const API_BASE = (process.env.GAME_API_BASE || process.env.SDF_API_BASE || "").trim().replace(/\/+$/, "");
function injectApiBase(htmlFile) {
  if (!API_BASE || !fs.existsSync(htmlFile)) return;
  const src = fs.readFileSync(htmlFile, "utf8");
  fs.writeFileSync(
    htmlFile,
    src.replace(
      "<head>",
      `<head>\n  <script>window.SDF_API_BASE=${JSON.stringify(API_BASE)};</script>`
    )
  );
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "styles"), { recursive: true });
fs.copyFileSync("src/styles/styles.css", path.join(DIST, "styles", "styles.css"));

execSync(
  "npx esbuild src/js/main.js --bundle --format=esm --outfile=dist/game.js --minify --legal-comments=none",
  { stdio: "inherit" }
);

let html = fs.readFileSync("index.html", "utf8");
html = html
  .replace(
    /<link rel="stylesheet" href="src\/styles\/styles\.css(?:\?v=[^"]*)?" \/>/,
    `<link rel="stylesheet" href="styles/styles.css?v=${CACHE}" />`
  )
  .replace(/window\.SDF_BUILD\s*=\s*"[^"]*"/, `window.SDF_BUILD = "${CACHE}"`)
  .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/m, "")
  .replace(
    /<script type="module" src="src\/js\/main\.js\?v=[^"]*"><\/script>/,
    `<script type="module" src="game.js?v=${CACHE}"></script>`
  );
fs.writeFileSync(path.join(DIST, "index.html"), html);
injectApiBase(path.join(DIST, "index.html"));

if (fs.existsSync("manifest.webmanifest")) {
  fs.copyFileSync("manifest.webmanifest", path.join(DIST, "manifest.webmanifest"));
}
if (fs.existsSync("sw.js")) {
  let sw = fs.readFileSync("sw.js", "utf8");
  sw = sw.replace(/sussurros-v[\w.-]+/, `sussurros-${CACHE}`);
  fs.writeFileSync(path.join(DIST, "sw.js"), sw);
}
if (fs.existsSync("assets")) fs.cpSync("assets", path.join(DIST, "assets"), { recursive: true });
if (fs.existsSync("faces")) fs.cpSync("faces", path.join(DIST, "faces"), { recursive: true });
if (fs.existsSync("music")) fs.cpSync("music", path.join(DIST, "music"), { recursive: true });
if (fs.existsSync("api")) fs.cpSync("api", path.join(DIST, "api"), { recursive: true });
copyDataDir(DIST);

const htaccess = [
  "AddType text/javascript .js .mjs",
  "<IfModule mod_headers.c>",
  '  <FilesMatch "\\.(html)$">',
  '    Header set Cache-Control "no-cache, no-store, must-revalidate"',
  "  </FilesMatch>",
  '  <FilesMatch "\\.(js|mjs|css)$">',
  '    Header set Cache-Control "public, max-age=3600"',
  "  </FilesMatch>",
  "</IfModule>",
  "",
].join("\n");
fs.writeFileSync(path.join(DIST, ".htaccess"), htaccess);
fs.writeFileSync(path.join(DIST, ".nojekyll"), "");
fs.writeFileSync(
  path.join(DIST, "GITHUB-PAGES.txt"),
  [
    "Sussurros da Floresta — build estático (GitHub Pages)",
    "",
    "O jogo roda 100% no browser.",
    "Ranking/API PHP: HostGator (CORS) quando configurado.",
    "",
  ].join("\n")
);

fs.rmSync(HOST, { recursive: true, force: true });
fs.mkdirSync(path.join(HOST, "src", "js"), { recursive: true });
fs.mkdirSync(path.join(HOST, "src", "styles"), { recursive: true });
fs.copyFileSync(path.join(DIST, "game.js"), path.join(HOST, "src", "js", "bundle.js"));
fs.copyFileSync("src/styles/styles.css", path.join(HOST, "src", "styles", "styles.css"));
if (fs.existsSync("assets")) fs.cpSync("assets", path.join(HOST, "assets"), { recursive: true });
if (fs.existsSync("faces")) fs.cpSync("faces", path.join(HOST, "faces"), { recursive: true });
if (fs.existsSync("music")) fs.cpSync("music", path.join(HOST, "music"), { recursive: true });
if (fs.existsSync("api")) fs.cpSync("api", path.join(HOST, "api"), { recursive: true });
copyDataDir(HOST, { omitLiveData: true });
fs.mkdirSync(path.join(HOST, "data", "rooms"), { recursive: true });
if (fs.existsSync("data/rooms/.htaccess")) {
  fs.copyFileSync("data/rooms/.htaccess", path.join(HOST, "data", "rooms", ".htaccess"));
}
if (fs.existsSync("data/.htaccess")) {
  fs.copyFileSync("data/.htaccess", path.join(HOST, "data", ".htaccess"));
}

let hostHtml = fs.readFileSync("index.html", "utf8");
hostHtml = hostHtml
  .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/m, "")
  .replace(
    /<script type="module" src="src\/js\/main\.js\?v=[^"]*"><\/script>/,
    `<script type="module" src="src/js/bundle.js?v=${CACHE}"></script>`
  )
  .replace(
    /href="src\/styles\/styles\.css\?v=[^"]+"/,
    `href="src/styles/styles.css?v=${CACHE}"`
  )
  .replace(/window\.SDF_BUILD\s*=\s*"[^"]*"/, `window.SDF_BUILD = "${CACHE}"`);
fs.writeFileSync(path.join(HOST, "index.html"), hostHtml);
fs.writeFileSync(path.join(HOST, ".htaccess"), htaccess);
fs.writeFileSync(
  path.join(HOST, "LEIA-ME.txt"),
  [
    "Sussurros da Floresta — upload HostGator (PRESERVA O RANKING)",
    "",
    "*** NAO APAGUE a pasta data/ no servidor ***",
    "*** NAO sobrescreva data/leaderboard.json nem data/tickets.json ***",
    "",
    "1. No cPanel, abra public_html/sussurros-da-floresta",
    "2. BACKUP: baixe data/leaderboard.json se existir",
    "3. Apague SOMENTE: index.html, src/, api/, music/, faces/, assets/",
    "   (deixe data/ intacta)",
    "4. Upload deste pacote",
    "5. Permissão data/ e data/rooms/ = 755 ou 775",
    "6. Site + Ctrl+F5 (cache ?v=" + CACHE + ")",
    "",
  ].join("\n")
);

const sizeMb = (fs.statSync(path.join(DIST, "game.js")).size / (1024 * 1024)).toFixed(2);
console.log(`BUILD OK — game.js ${sizeMb} MB · cache ${CACHE}`);
console.log(`HostGator: ${HOST}/`);
