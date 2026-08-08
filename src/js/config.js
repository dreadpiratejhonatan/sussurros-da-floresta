/** All tunable content lives here — prefer knobs over new frameworks. */
export const CONFIG = {
  name: "Sussurros da Floresta",
  slug: "spirit",
  prodPath: "/spirit/",
  pitch: "Os primeiros povos",
  tone: "mystery",
  language: "pt-BR",
  playerCount: "solo",
  winCondition: "Descobrir todos os mistérios da floresta",
  build:
    typeof window !== "undefined" && window.SDF_BUILD
      ? window.SDF_BUILD
      : "dev",

  eyeHeight: 1.62,
  moveSpeed: 3.35,
  sprintMult: 1.55,
  mouseSens: 0.0021,
  interactDist: 2.85,
  gravity: 16,
  jumpSpeed: 5.1,
  playerRadius: 0.32,
  thirdPersonDist: 4.1,

  difficulties: {
    easy: { id: "easy", label: "Trilha leve", moveMult: 1.12, fogMult: 0.85, dayMult: 1.15 },
    normal: { id: "normal", label: "Mata fechada", moveMult: 1, fogMult: 1, dayMult: 1 },
    hard: { id: "hard", label: "Névoa densa", moveMult: 0.92, fogMult: 1.25, dayMult: 0.85 },
  },

  skins: {
    albert: {
      id: "albert",
      name: "Albert",
      face: "faces/albert.png",
      suit: "#4a3420",
      shirt: "#6b4a2e",
      skin: "#7a4a2e",
      accent: "#c8e6a8",
      personality: "Guia calmo da mata; ouve os primeiros povos na névoa.",
      blurb: "Moreno, traços indígenas, traje de fibras e couro, trança e amuleto da floresta.",
    },
  },
  skinOrder: ["albert"],

  world: {
    size: 56,
    seed: 20260808,
    ground: 0x1a3324,
    fog: 0x0c1812,
    skyDay: 0x6a8f7a,
    skyNight: 0x06100c,
    hub: { x: 0, z: -4, label: "Clareira dos Antigos", kind: "totem" },
    props: { trees: 110, rocks: 28, grass: 220, fireflies: 48 },
    dayLengthSec: 420,
    seasons: false,
    zones: ["clareira", "mata", "rio", "raiz"],
    river: { x: -14, z0: -8, z1: 22, width: 3.2 },
  },

  /** Main mysteries — required for win */
  puzzles: [
    {
      id: "puzzle-hub",
      saveId: "puzzle_clareira",
      x: 0,
      z: -4,
      title: "Clareira dos Antigos",
      whisper: "Aqui a mata ainda lembra os primeiros povos.",
      hint: "Toque o totem da clareira (E).",
      clue: "O cervo-luz bebe a memória da clareira.",
    },
    {
      id: "puzzle-river",
      saveId: "puzzle_rio",
      x: -14,
      z: 10,
      title: "Pedra do Rio",
      whisper: "A água carrega nomes que o vento não ousa dizer.",
      hint: "Siga o barulho do rio até a pedra brilhante.",
      clue: "Onde a corrente curva, a pedra canta.",
    },
    {
      id: "puzzle-glyph",
      saveId: "puzzle_marca",
      x: 16,
      z: -18,
      title: "Marca dos Antigos",
      whisper: "Três sinais. Um caminho. Nenhuma pressa.",
      hint: "Entre mais fundo na mata, a leste da clareira.",
      clue: "A marca espera sob a coroa das árvores.",
    },
    {
      id: "puzzle-roots",
      saveId: "puzzle_raizes",
      x: 8,
      z: 18,
      title: "Raízes que Escutam",
      whisper: "Debaixo da terra, as raízes trocam histórias como cabos de luz.",
      hint: "Norte da trilha, entre raízes brilhantes.",
      clue: "Siga as pegadas de musgo vivo.",
    },
    {
      id: "puzzle-mirror",
      saveId: "puzzle_espelho",
      x: -18,
      z: -14,
      title: "Espelho de Névoa",
      whisper: "Albert vê o próprio rosto… e outro, mais antigo, piscando atrás.",
      hint: "Sudoeste, onde a névoa engrossa.",
      clue: "A coruja-sílex guarda o espelho.",
    },
  ],

  /** Optional lore tablets — deepen mystery, not required to win */
  lore: [
    {
      id: "lore-1",
      saveId: "lore_mapa",
      x: 4,
      z: 6,
      title: "Casca-Mapa",
      text: "Antes dos caminhos, a floresta era o mapa. Os primeiros povos liam as veias das folhas.",
    },
    {
      id: "lore-2",
      saveId: "lore_frequencia",
      x: -8,
      z: -10,
      title: "Frequência Antiga",
      text: "Eles não sumiram: sintonizaram outra frequência. Seu relógio atrasa porque está perto demais da verdade.",
    },
    {
      id: "lore-3",
      saveId: "lore_nome",
      x: 12,
      z: 2,
      title: "Nome Sem Boca",
      text: "Há um nome que só a chuva pronuncia. Albert sente, mas ainda não consegue gravar.",
    },
  ],

  animals: [
    {
      id: "cervo-luz",
      label: "Cervo-luz",
      kind: "deer",
      color: 0xc8f0d8,
      emissive: 0x6ec8ff,
      home: { x: 2, z: -8 },
      roam: 10,
      speed: 1.1,
      line: "O cervo-luz inclina a cabeça: a clareira ainda respira.",
    },
    {
      id: "coruja-silex",
      label: "Coruja-sílex",
      kind: "owl",
      color: 0xb8a090,
      emissive: 0xa8e6c0,
      home: { x: -16, z: -12 },
      roam: 7,
      speed: 0.7,
      line: "A coruja pisca uma vez. No espelho de névoa, alguém responde.",
    },
    {
      id: "raposa-eco",
      label: "Raposa-eco",
      kind: "fox",
      color: 0xc47a4a,
      emissive: 0xffb070,
      home: { x: 10, z: 14 },
      roam: 12,
      speed: 1.4,
      line: "A raposa deixa um rastro de faíscas. Siga as raízes que escutam.",
    },
    {
      id: "peixe-lua",
      label: "Peixe-lua",
      kind: "fish",
      color: 0x7ec8e0,
      emissive: 0x6ec8ff,
      home: { x: -14, z: 8 },
      roam: 4,
      speed: 0.9,
      line: "O peixe-lua sobe e some. A pedra do rio aquece no peito do Albert.",
    },
  ],

  enemies: [],

  audio: {
    master: 0.32,
    rain: true,
    wind: true,
    river: true,
    animals: true,
    music: true,
  },

  whispers: {
    minGapSec: 50,
    maxGapSec: 150,
    longBias: 0.72,
  },

  colors: {
    moss: 0x2d5a3d,
    mossDeep: 0x1a3a28,
    bark: 0x4a3220,
    leaf: 0x3d7a4a,
    mist: 0x8aa898,
    glow: 0xa8e6c0,
    tech: 0x6ec8ff,
    river: 0x2a5a6a,
    spirit: 0xd4ffe8,
  },
};

export function puzzleCount() {
  return CONFIG.puzzles.length;
}

export function loreCount() {
  return CONFIG.lore.length;
}
