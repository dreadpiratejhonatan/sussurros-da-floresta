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
assert(distHtml.includes("?v=b016"), "dist HTML missing cache bust b016");
assert(hostHtml.includes("?v=b016"), "host HTML missing cache bust b016");
assert(distHtml.includes("hud__top"), "compact HUD top stack");
assert(distHtml.includes("hud__meters"), "HUD meters row");
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
assert(cfg.includes("#2f6db4"), "Albert blue jacket color");
assert(cfg.includes("#e85a2a"), "Albert orange zipper accent");
assert(cfg.includes("#c49a76"), "Albert photo skin tone");
assert(cfg.includes("puzzles"), "puzzles in CONFIG");
assert(cfg.includes("Os primeiros povos"), "pitch primeiros povos");
assert(cfg.includes('name: "ALBERT"'), "ALBERT uppercase name");
assert(cfg.includes("npcs"), "NPCs in CONFIG");
assert(cfg.includes("karai-carijo"), "Carijó horseman NPC");
assert(fs.existsSync("src/js/npcs.js"), "npcs module");
assert(!distHtml.includes("Cananéia"), "splash must not mention Cananéia");
assert(!distHtml.includes("Único jogável"), "no playable-only blurb on splash");

const audioFrontier = fs.readFileSync("src/js/audio.js", "utf8");
assert(audioFrontier.includes("_trailDrum"), "frontier drum pulse");
assert(audioFrontier.includes("_playPhrase"), "soaring phrase");
assert(audioFrontier.includes("not The Gael"), "original motif note");
assert(cfg.includes("cervo-luz"), "spirit animals in CONFIG");
assert(cfg.includes("lore"), "lore in CONFIG");
assert(fs.existsSync("src/js/animals.js"), "animals module");
assert(fs.existsSync("src/js/audio.js"), "audio module");
assert(fs.existsSync("src/js/climate.js"), "climate module");
assert(cfg.includes("seasonLengthSec"), "season length in CONFIG");
assert(cfg.includes("seasons: true"), "seasons enabled");

const climateSrc = fs.readFileSync("src/js/climate.js", "utf8");
assert(climateSrc.includes("sandstorm"), "sandstorm weather");
assert(climateSrc.includes("primavera"), "spring season");
assert(climateSrc.includes("rain"), "rain particles");

const audioSrcFull = fs.readFileSync("src/js/audio.js", "utf8");
assert(audioSrcFull.includes("setClimate"), "audio setClimate");
assert(audioSrcFull.includes("_weatherBeds"), "weather audio beds");
assert(audioSrcFull.includes("rainGain"), "rain audio gain");

const audioSrc = fs.readFileSync("src/js/audio.js", "utf8");
assert(audioSrc.includes("footstep"), "footsteps in audio");
assert(audioSrc.includes("wolfHowl"), "wolf howl in audio");
assert(audioSrc.includes("birdCall"), "bird calls in audio");
assert(audioSrc.includes("_river"), "river bed in audio");

const playerSrc = fs.readFileSync("src/js/player.js", "utf8");
assert(playerSrc.includes("_bodyYaw"), "body facing separate from camera yaw");
assert(playerSrc.includes("shortestAngleDelta"), "smooth body turn");
assert(playerSrc.includes("setAvatarLook"), "head/neck look sync");
assert(playerSrc.includes("camY"), "camera stays above ground");

const skinsSrc = fs.readFileSync("src/js/skins.js", "utf8");
assert(skinsSrc.includes("headRoot"), "head root joint");
assert(skinsSrc.includes("setAvatarLook"), "setAvatarLook export");
assert(skinsSrc.includes("opacity: 0.1"), "clear glasses lenses");

const worldSrc = fs.readFileSync("src/js/world.js", "utf8");
assert(worldSrc.includes("_fill"), "fill light for readability");
assert(worldSrc.includes("0.016"), "lighter fog density");

console.log("SMOKE OK");
