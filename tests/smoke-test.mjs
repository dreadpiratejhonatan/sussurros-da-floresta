import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

console.log("smoke: build…");
execSync("npm run build", { stdio: "inherit" });

const distHtml = fs.readFileSync("dist/index.html", "utf8");
const hostHtml = fs.readFileSync("release/hostgator-spirit/index.html", "utf8");
const gameJs = "dist/game.js";
const bundleJs = "release/hostgator-spirit/src/js/bundle.js";

assert(fs.existsSync(gameJs), "dist/game.js missing");
assert(fs.existsSync(bundleJs), "host bundle missing");
assert(distHtml.includes("?v=b005"), "dist HTML missing cache bust b005");
assert(hostHtml.includes("?v=b005"), "host HTML missing cache bust b005");
assert(distHtml.includes("SDF_BUILD"), "SDF_BUILD missing in dist");
assert(fs.existsSync("faces/albert.png"), "faces/albert.png missing");
assert(fs.existsSync("release/hostgator-spirit/faces/albert.png"), "host face missing");
assert(
  !fs.existsSync("release/hostgator-spirit/data/leaderboard.json") ||
    fs.readFileSync("release/hostgator-spirit/data/leaderboard.example.json", "utf8"),
  "host data examples"
);
assert(
  !fs.existsSync("release/hostgator-spirit/data/leaderboard.json"),
  "HostGator package must NOT ship live leaderboard.json"
);
assert(fs.existsSync("release/hostgator-spirit/data/leaderboard.example.json"), "example ranking");
assert(fs.existsSync("release/hostgator-spirit/.htaccess"), ".htaccess missing");
assert(fs.existsSync("release/hostgator-spirit/api/leaderboard.php"), "api missing");

const cfg = fs.readFileSync("src/js/config.js", "utf8");
assert(cfg.includes("albert"), "Albert skin in CONFIG");
assert(cfg.includes("puzzles"), "puzzles in CONFIG");
assert(cfg.includes("Os primeiros povos"), "pitch in CONFIG");
assert(cfg.includes("cervo-luz"), "spirit animals in CONFIG");
assert(cfg.includes("lore"), "lore in CONFIG");
assert(fs.existsSync("src/js/animals.js"), "animals module");
assert(fs.existsSync("src/js/audio.js"), "audio module");

console.log("SMOKE OK");
