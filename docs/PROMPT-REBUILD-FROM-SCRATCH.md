# Prompt for another agent: rebuild a SPIRIT-class forest game from scratch

Use this document as the **full brief** for a second agent (e.g. 2NO). Goal: produce a game in the same class as **Sussurros da Floresta / SPIRIT**, then compare both builds side by side.

This is **not** a changelog. It is:
1. What to build (product + systems)
2. How to build it (order + architecture)
3. What worked well (steal these)
4. What failed in production on phone (do not repeat)
5. A scorecard so you can judge Cursor vs 2NO honestly

Reference production (when live): https://jhonatanribeiro.com/spirit/  
Reference repo patterns: vanilla ES modules + Three.js, content in `CONFIG`, Portuguese UI, mobile-first browser game.

---

## 0. Mission (give this to the agent first)

Build a **solo 3D forest mystery** playable in mobile Chrome/Safari:

- Pitch: **Os primeiros povos** (first peoples / frontier memory). Tone: quiet, exploratory, historical whispers — not combat.
- One playable character (**Albert**). No enemies in v0.
- Win by discovering all forest mysteries (interactable puzzle spots).
- Optional depth: lore tablets, spirit animals, historical NPC “chronicles”.
- Seasons + weather that **look and sound** different (day/night, rain, wind, fog, sandstorm).
- Full Portuguese (pt-BR) UI.
- Must feel good on a phone: touch stick + look pad + E / jump / camera toggle.

**Success = a stranger can open it on a phone, walk, look around, talk to something, feel weather, and understand the fantasy without a tutorial wall.**

---

## 1. Non-goals (do not waste time here)

- Do not build a multiplayer game.
- Do not add combat, guns, health bars, or enemy AI in v0.
- Do not use React/Vue/Unity — keep **vanilla JS + Three.js**.
- Do not put plot spoilers (place names like Cananéia, “only playable character” essays) on the **splash**. Keep splash lean.
- Do not ship live server JSON (`leaderboard.json`, `tickets.json`) inside the deploy package.
- Do not commit secrets, FTP passwords, or private recipe docs.
- Do not chase photorealism. Stylized low-poly is correct.
- Do not license or copy another game’s OST (e.g. Last of the Mohicans). Original procedural audio only if you want that mood.

---

## 2. Product definition (what the player experiences)

### Boot flow
1. Splash: brand title + short pitch + **Tocar para começar** (unlocks audio).
2. Character: show **ALBERT** only (name as hero; no long blurb).
3. Difficulty: 2–3 options that change fog / move / day speed (labels in Portuguese).
4. Enter world in third person with touch controls on mobile.

### Core loop
- Walk the forest (WASD or stick).
- Look with mouse / right-side touch drag.
- Press **E** near: mystery totem → lore tablet → historical NPC → spirit animal.
- HUD shows progress (mysteries / lore / spirits / chronicles) + climate chip.
- Ambient whispers occasionally (never stacking on top of an active conversation).
- Solve all mysteries → win screen.

### Fantasy content (v0 set)
- **Mysteries:** ~5 interactable sites (clareira, rio, glyph, roots, mirror…).
- **Lore:** ~3 readable tablets.
- **Spirit animals:** deer / owl / fox / fish (or equivalent) with short lines + optional clue toward an unsolved mystery.
- **Historical NPCs:** explorers / indigenous / mythic guides. Talking gives: spoken line, then a longer historical fact. Only Albert is playable; NPCs are not skins.

### Climate
- Four seasons cycle while playing.
- Weather: clear, fog, rain, wind, sandstorm (weights per season).
- Day and night must both happen (not “always day”).
- Start season/weather **random each run**.

---

## 3. Tech stack & repo shape

```
index.html                 # DOM shells: splash, skin, diff, hud, pause, win, touch
src/styles/styles.css      # atmosphere UI (not a dashboard)
src/js/
  config.js                # ALL content knobs + copy
  main.js                  # Game orchestrator
  splash.js                # boot flow
  player.js                # move + camera
  skins.js                 # Albert mesh + head look
  world.js                 # ground, trees, grass, puzzles, lore
  climate.js               # seasons, weather, particles, canopy drip
  audio.js                 # WebAudio beds + SFX (procedural OK)
  npcs.js                  # historical NPCs
  animals.js               # spirit fauna
  hud.js                   # meters, toast, balloon, story panel
  save.js                  # localStorage
  input.js / touch.js / rng.js
faces/albert.png           # face texture (generate via script OK)
scripts/build.mjs          # dist + host package
tests/smoke-test.mjs       # assert critical strings / modules / cache bump
```

**Rules:**
- Three.js via import map (or bundled for prod).
- Prefer CONFIG + architecture over new frameworks.
- One `Game` class owns the loop; systems are plain classes.
- Portuguese strings live in CONFIG / DOM, not sprinkled English.

---

## 4. Build order (step by step — do this sequence)

Give the other agent this order. Skipping steps is how phone UX breaks.

### Phase A — Playable empty forest
1. Renderer + scene + fog + ground + simple sky.
2. First/third person controller with collision against trees/rocks.
3. Touch controls (stick, look pad, jump, interact, camera toggle).
4. Boot splash that unlocks audio on first tap.
5. Prove on a real phone: move + look feels OK.

### Phase B — Avatar
1. Build Albert as a readable humanoid (jacket, backpack, glasses).
2. Face texture: short hair (not a beanie/cap), **clear lenses**, clean face (no giant mustache block).
3. Body faces walk direction; head follows look.
4. **Critical:** head yaw/pitch signs must match camera (test on phone in third person).

### Phase C — Camera (third person done right)
1. Default third person behind Albert.
2. Orbit around a chest/head pivot (spherical), not a fixed-height camera that only moves the aim point.
3. Look down → camera rises overhead so feet are visible.
4. Never put the camera under the terrain; clamp height, keep orbiting.
5. First person pitch must use the **same “up” meaning** as third person.

### Phase D — Mysteries & save
1. Place 5 interactables; E to reveal; progress chip updates.
2. localStorage save for run progress.
3. Win when all mysteries solved.

### Phase E — Lore animals NPCs
1. Lore tablets.
2. Spirit animals with roam + interact.
3. Historical NPCs with random spawn; interaction opens a **single sequential story panel** (line → fact), long enough to read on mobile (~10s / ~16–18s), suppressing toast/balloon/prompt while open.

### Phase F — Climate that is honest
1. Full day/night sine (`0…1`), not biased to daylight.
2. Seasons + weather with HUD chip: `Estação · Dia/Noite · Clima`.
3. Particles strong enough to **see** rain/wind (audio must not lie).
4. Randomize starting season + weather every run (never force “always rain”).
5. Trees: canopy group separate from trunk; grass blades tracked.
6. Wind → lean + leaf flutter + grass bend.
7. Rain → canopy shake + rain hits canopy volumes + drips off leaf edges.

### Phase G — Audio & polish
1. Unlock on splash; soft beds; rain/wind gains; footsteps; a few animal calls.
2. Original ambient/score only (no licensed OST).
3. Compact mobile HUD: flex column, no overlapping absolute stacks; hide long objective on small screens.
4. Smoke tests + cache bump for deploys.

---

## 5. Architecture contracts (implement these APIs)

### `CONFIG` (single source of truth)
Must include: pitch, difficulties, Albert skin, world size/seed/props, `dayLengthSec`, `seasonLengthSec`, puzzles, lore, animals, npcs, colors, audio flags.

### `Game` loop
Each frame while playing:
1. Player update (look, move, jump, camera)
2. Animals / NPCs update
3. Compute `dayPhase`
4. `climate.update` → `world.update(climate)` → `audio.setClimate`
5. Interact prompt + E handling
6. Whisper timer (skip if story panel busy)

### `Player` camera (third person)
- Pivot ~chest height.
- `horiz = cos(pitch) * dist`, `camY = pivotY - sin(pitch) * dist`.
- Clamp `camY` above feet; when clamped, pull in / go more overhead.
- Aim blends toward feet when looking down.
- Head look: negate bone signs if Three.js bone axes oppose camera signs — **verify visually**.

### `Climate`
- `bindFoliage(world)` + `world.getCanopies()`.
- Rain step: world-space hit against canopy cylinders → spawn leaf drip particles → continue runoff from canopy edge.
- `state()` returns intensities + `hudLine` for HUD/audio/world.

### `HUD`
- One story panel for chronicles (`showChronicle`).
- While story busy: hide prompt, block toast/balloon, don’t stack climate toasts on top.
- Meters as chips in a flex column (never 5 absolute boxes fighting for the same pixels).

### `World` foliage
- Tree = trunk + `canopyRoot` children.
- Always subtle breeze; wind amplifies; rain adds high-frequency canopy shake.
- Grass array with per-blade phase; bend with wind.

---

## 6. What worked well (STEAL THESE)

These are the good parts of the Cursor/SPIRIT build. Another agent should **copy the idea**, not necessarily the exact code.

| Area | Keep / reuse |
|---|---|
| Content-driven design | Almost everything tunable from `config.js` |
| Boot order | Splash → character → difficulty → world; audio unlock on first tap |
| Solo mystery fantasy | No enemies; win = discover mysteries |
| Albert-only playable | NPCs are story props, not skins |
| Portuguese UI | Consistent pt-BR, short HUD labels |
| Flex HUD | Top-left column of chips; hide long objective on phone |
| Story panel | Sequential line → fact; long read time; blocks overlapping UI |
| Climate ↔ audio ↔ world | One `state()` object drives look, sound, HUD |
| Procedural audio | Beds + SFX without huge asset pipeline |
| Seeded world scatter | Stable forest layout from seed |
| Touch layout | Stick left; look pad right; E / jump / V |
| Orbit camera | Look-down goes overhead to see feet |
| Head sync after sign fix | Head follows camera once axes are correct |
| Foliage systems | Canopy separate from trunk; grass bend; rain drip off leaves |
| Random climate start | Each run feels different |
| Deploy discipline | Cache bump (`b0xx`), smoke tests, don’t overwrite live `data/*.json` |
| Small modules | One concern per file; `Game` only orchestrates |

---

## 7. What failed / was bad (DO NOT REPEAT)

These bugs shipped to a phone and had to be fixed. Treat them as **hard acceptance tests**.

### HUD / dialogue
- **Don’t** stack balloon + toast + interact prompt for NPC talk. Unreadable on mobile.
- **Don’t** keep dialogue on screen for ~4s. People need ~10–18s for chronicle text.
- **Don’t** use absolute-positioned status boxes that overlap each other. Use one flex stack.
- **Don’t** put the long objective text on the phone’s first viewport.

### Day / night / weather honesty
- **Don’t** bias dayPhase like `0.55 + 0.45 * sin(...)` — that never reaches night.
- **Don’t** force starting weather to rain “so particles are visible” forever. Randomize; make particles visible for every weather you advertise.
- **Don’t** play rain/wind audio without matching visuals.
- **Don’t** make season changes so slow the player never sees them (tens of seconds, not many minutes, for a short session demo).

### Camera / avatar
- **Don’t** keep third-person camera at fixed height and only move the look target — looking down feels “stuck”.
- **Don’t** clamp look target to `feetY + 0.2` if you claim the player can look at the ground.
- **Don’t** apply head pitch/yaw with the wrong sign. Phone test: look up → head up; look left → head left. If inverted, negate.
- **Don’t** let first-person `rotation.x = pitch` disagree with third-person “pitch up” meaning.
- **Don’t** bury the camera under the mesh/terrain.

### Albert face / mesh
- **Don’t** ship a flat dark hair plate that reads as a **cap**.
- **Don’t** ship thick dark “lenses” (white/opaque slabs or heavy tint). Lenses must read **clear**; eyes visible.
- **Don’t** leave a huge blocky mustache/beard blob on the face texture.
- **Don’t** put a bulky hood collar that reads as headwear from behind.

### Foliage
- **Don’t** rotate the whole tree only a tiny amount and call it wind.
- **Don’t** let rain fall through canopies with zero interaction if you promise leaf response.
- **Don’t** forget grass when you animate trees.

### Process / ship
- **Don’t** forget cache/`?v=`/service-worker bump — phones keep old builds.
- **Don’t** spoil the mystery on the splash screen.
- **Don’t** put live leaderboard/tickets JSON in the HostGator zip.
- **Don’t** claim “done” without a phone hard-refresh check.

---

## 8. Hard acceptance tests (phone)

The agent is not done until these pass on a real mobile browser:

1. **Look sync:** Drag look up → Albert’s head tips up. Drag left → head turns left.
2. **Look down:** Can see Albert’s feet / ground at his shoes; camera stays above terrain.
3. **NPC talk:** One panel; can finish reading the fact; no overlapping prompt/toast.
4. **Night happens:** Within one short session, HUD shows Noite and lighting darkens.
5. **Weather honesty:** If chip says Chuva, rain is visible; if Vento, trees/grass move and wind is visible/audible together.
6. **Random start:** Restart 3 times — climate chip is not identical every time.
7. **HUD:** Title + chips readable; no overlapping status pills.
8. **Albert face:** No cap, clear glasses, no grotesque mustache.
9. **Touch:** Can play without keyboard; E works; pause works.
10. **Win path:** Can solve a mystery and see progress increment.

---

## 9. Comparison scorecard (Cursor vs 2NO)

After both agents ship a build, score each 1–5 and write evidence (screenshot / clip).

| Category | What “5” looks like | Cursor notes (baseline) | 2NO notes | Winner |
|---|---|---|---|---|
| Boot clarity | Splash brand-first, no spoilers, one CTA | Lean splash after cleanup | | |
| Mobile HUD | No overlaps; gameplay readable | Fixed with flex + story panel | | |
| Dialogue UX | Readable chronicle timing, no stacks | Fixed after overlap bug | | |
| Avatar identity | Albert readable; face not broken | Face iterated (cap/glasses/mustache) | | |
| Head/camera sync | Head matches look; feet viewable | Inverted head + orbit fixes | | |
| Day/night | Real night, readable day | Day bias bug then fixed | | |
| Weather honesty | Audio = visuals; random start | Forced rain + quiet particles then fixed | | |
| Foliage life | Wind + rain-leaf interaction | Added late (canopy drip/grass) | | |
| Content fantasy | Mysteries + lore + NPCs coherent | Strong CONFIG content | | |
| Audio mood | Soft forest + weather, not hiss/noise | Softened; original score | | |
| Code structure | CONFIG-driven modules, testable | Clear module split | | |
| Ship discipline | Cache bump, smoke, no secrets | Pipeline solid | | |
| What not to copy | List concrete bad ideas from each | See §7 | | |

### How to use the scorecard
- **Take from the winner of each row** into a merged “best of both” build.
- **Ban** anything in §7 even if an agent reintroduces it.
- Prefer the build that wins **mobile HUD + camera + weather honesty** over the one with prettier desktop-only art.

---

## 10. Suggested prompt paste block (for 2NO)

Copy everything below the line into the other agent:

---

You are building a mobile-first browser game from scratch: a solo Three.js forest mystery called something in the spirit of “Sussurros da Floresta / SPIRIT”.

**Fantasy:** Os primeiros povos. Quiet exploration. No enemies. One playable character (Albert). Win by discovering all mysteries. Portuguese UI.

**Stack:** Vanilla ES modules, Three.js, one `CONFIG` object for content, procedural WebAudio OK, no React/Unity.

**Must implement (in order):**
1. Boot: splash → Albert select → difficulty → world (audio unlock on first tap).
2. Third-person controller + touch controls; orbit camera that can look at the character’s feet without going underground.
3. Albert avatar with clear glasses, short hair (not a cap), clean face; head look matches camera (verify signs on mobile).
4. 5 mysteries + save + win screen.
5. Lore + spirit animals + historical NPCs.
6. NPC talk = one sequential story panel (line then fact), long read time, no overlapping toast/balloon/prompt.
7. Seasons + weather + full day/night; random starting climate each run; particles must match audio.
8. Trees/grass react to wind; rain hits canopies and drips off leaves.
9. Compact non-overlapping mobile HUD.
10. Smoke tests + cache-busting build mindset.

**Explicitly avoid:** stacked dialogue UI; dayPhase biased to always-day; forced always-rain start; rain audio without rain visuals; inverted head look; fixed-height third-person camera that can’t see feet; splash spoilers; shipping live server JSON/secrets.

**Deliver:** runnable local build + short README of controls + a self-score using the acceptance tests (look sync, look down to feet, NPC readability, night occurs, weather honesty, random climate, HUD clarity, face quality).

---

## 11. Reference implementation map (if you can read the Cursor repo)

Use as reference, not dogma:

| Concern | File |
|---|---|
| Content | `src/js/config.js` |
| Loop | `src/js/main.js` |
| Boot | `src/js/splash.js` |
| Camera/move | `src/js/player.js` |
| Avatar | `src/js/skins.js`, `faces/albert.png`, `scripts/gen-face-albert.mjs` |
| Forest | `src/js/world.js` |
| Weather | `src/js/climate.js` |
| UI | `src/js/hud.js`, `src/styles/styles.css`, `index.html` |
| Audio | `src/js/audio.js` |
| NPCs / animals | `src/js/npcs.js`, `src/js/animals.js` |
| Agent rules | `AGENTS.md` |

Production path convention if deploying like SPIRIT: `/spirit/` on the host, bump `CACHE` / `SDF_BUILD` / `?v=` together.

---

## 12. Final instruction to the comparing human

When both agents finish:
1. Play both on the **same phone**.
2. Fill the scorecard in §9 with evidence.
3. Merge winners per row into a “best of” backlog.
4. Anything that violates §7 is an automatic reject, even if the rest looks prettier.
