/** All tunable content lives here — prefer knobs over new frameworks. */
export const CONFIG = {
  name: "Sussurros da Floresta",
  slug: "spirit",
  prodPath: "/spirit/",
  pitch: "Fronteira · primeiros povos · novas terras",
  tone: "epic-frontier",
  language: "pt-BR",
  playerCount: "solo",
  winCondition: "Explorar a mata, ouvir as crônicas e revelar os mistérios",
  build:
    typeof window !== "undefined" && window.SDF_BUILD
      ? window.SDF_BUILD
      : "dev",

  eyeHeight: 1.62,
  moveSpeed: 3.35,
  sprintMult: 1.55,
  mouseSens: 0.0024,
  interactDist: 2.85,
  gravity: 16,
  jumpSpeed: 5.1,
  playerRadius: 0.32,
  thirdPersonDist: 4.1,

  difficulties: {
    easy: { id: "easy", label: "Trilha leve", moveMult: 1.12, fogMult: 0.75, dayMult: 1.2 },
    normal: { id: "normal", label: "Mata fechada", moveMult: 1, fogMult: 0.9, dayMult: 1.05 },
    hard: { id: "hard", label: "Névoa densa", moveMult: 0.92, fogMult: 1.1, dayMult: 0.95 },
  },

  skins: {
    albert: {
      id: "albert",
      name: "Albert",
      face: "faces/albert.png",
      suit: "#2f6db4",
      shirt: "#1a2740",
      skin: "#c49a76",
      accent: "#e85a2a",
      personality: "Explorador da fronteira; segue caçadores, crônicas e o sussurro das novas terras.",
      blurb: "Único jogável: óculos de grau, jaqueta azul, zíper laranja e mochila — o forasteiro que ouve a mata.",
    },
  },
  skinOrder: ["albert"],

  /**
   * NPCs históricos / míticos (não jogáveis).
   * Tom: exploração / caça / chegada às novas terras (mood fronteira).
   * Fatos: Cananéia & litoral sul (pt.wikipedia.org/wiki/Cananeia).
   */
  npcs: [
    {
      id: "karai-carijo",
      name: "Karaí Carijó",
      kind: "horseman",
      title: "Caçador da Maratayama",
      skin: 0x8a5a38,
      shirt: 0x3a5a28,
      pants: 0x2a2418,
      hair: 0x140c08,
      accent: 0xe07030,
      fact:
        "Antes de Cananéia, este litoral era Maratayama — «mar» e «terra» em tupi-guarani. Os Carijó/Guarani caçavam e guiavam na costa e no Peabiru muito antes das caravelas.",
      line: "Corro atrás da presa como o vento na crista. A trilha é nossa — o mapa veio depois.",
    },
    {
      id: "yacua-cacador",
      name: "Yacuã",
      kind: "elder",
      title: "Caçador do estuário",
      skin: 0x7a4a2a,
      shirt: 0x4a3420,
      pants: 0x2a2018,
      hair: 0x120c08,
      accent: 0xc45a28,
      fact:
        "No estuário de Cananéia–Iguape, a caça, a pesca e os caminhos ligavam ilhas, mangue e sertão. Os primeiros povos liam rastros onde o europeu só via selva.",
      line: "Ouviste o cervo? Na fronteira, quem não escuta o animal não chega vivo ao rio.",
    },
    {
      id: "bacharel",
      name: "Cosme Fernandes",
      kind: "explorer",
      title: "Bacharel de Cananéia",
      skin: 0xc4a080,
      shirt: 0x3a3a58,
      pants: 0x2a2a30,
      hair: 0x3a2818,
      accent: 0xc8a060,
      hat: "cap",
      fact:
        "Por volta de 1502, o degredado Cosme Fernandes — o Bacharel de Cananéia — ficou nestas terras. Tornou-se figura poderosa no povoado, décadas antes da vila oficial de São Vicente (1532).",
      line: "Eu não servi à Coroa. A Coroa chegou tarde demais à minha ilha.",
    },
    {
      id: "vespucci",
      name: "Américo Vespúcio",
      kind: "explorer",
      title: "Navegador da costa",
      skin: 0xd0b090,
      shirt: 0x2a4a6a,
      pants: 0x1a2430,
      hair: 0x4a3020,
      accent: 0xd4b070,
      hat: "cap",
      fact:
        "Em janeiro de 1502, a expedição com Gaspar de Lemos e Américo Vespúcio passou por aqui e chamou o lugar de Barra do Rio Cananor. Mapas antigos já apontavam Cananéia entre 1498 e 1502.",
      line: "Medimos a costa… mas a mata já tinha medido a gente.",
    },
    {
      id: "martim-afonso",
      name: "Martim Afonso",
      kind: "explorer",
      title: "Capitão da armada",
      skin: 0xc8a888,
      shirt: 0x5a2030,
      pants: 0x2a2028,
      hair: 0x2a1c14,
      accent: 0xc0a050,
      hat: "cap",
      fact:
        "Em 12 de agosto de 1531, Martim Afonso de Sousa aportou na região (Ilha do Bom Abrigo / Marataiama). São Vicente seria fundada em 22/01/1532 — Cananéia disputa o posto de primeiro povoado do Brasil.",
      line: "Fundamos vilas no papel. A floresta fundou a memória primeiro.",
    },
    {
      id: "anha-maratayama",
      name: "Anhangaí",
      kind: "elder",
      title: "Anciã da costa",
      skin: 0x7a4a2e,
      shirt: 0x6b3a1e,
      pants: 0x3a2818,
      hair: 0x1a1008,
      accent: 0xe8dcc0,
      fact:
        "Povos Tupi e Guarani ocupavam o litoral paulista séculos antes da colonização. Cananéia liga-se também ao estuário, à Ilha do Cardoso e às redes que ligavam o mar ao interior pelo Peabiru.",
      line: "Os primeiros povos não sumiram, Albert. Mudaram de voz — e ainda falam.",
    },
    {
      id: "peabiru",
      name: "Espírito do Peabiru",
      kind: "spirit",
      title: "Caminho antigo",
      skin: 0xa8d0c0,
      shirt: 0x6a9080,
      pants: 0x405848,
      hair: 0xd4ffe8,
      accent: 0xa8e6c0,
      fact:
        "O Peabiru era uma rede de caminhos indígenas que ligava o litoral ao interior — inclusive às terras dos Carijó/Guarani. Por ele passaram trocas, fugas e as primeiras entradas rumo ao sertão.",
      line: "Segue a trilha que não está no mapa. Ela é mais velha que a tinta.",
    },
  ],

  world: {
    size: 56,
    seed: 20260808,
    ground: 0x2d523a,
    fog: 0x24382c,
    skyDay: 0x9cbcab,
    skyNight: 0x1a2e24,
    hub: { x: 0, z: -4, label: "Clareira dos Antigos", kind: "totem" },
    props: { trees: 110, rocks: 28, grass: 220, fireflies: 48 },
    dayLengthSec: 180,
    seasons: true,
    seasonLengthSec: 70,
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
    master: 0.42,
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

export function npcCount() {
  return CONFIG.npcs.length;
}
