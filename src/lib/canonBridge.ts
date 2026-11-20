import { Anime, AnimeEpisode } from "./animes";

export interface CanonBridgeMapping {
  /** Whether anime episodes adapt a manga source directly */
  hasMangaAdaptation: boolean;
  /** True for original animations whose primary story was not adapted from a manga */
  isOriginalAnimation?: boolean;
  /** Approximate manga chapters covered per anime episode (if no explicit map) */
  chaptersPerEpisode: number;
  /** Starting chapter offset */
  startChapter?: number;
  /** Known filler episode numbers (1-indexed global or season-1 relative) */
  fillerEpisodes?: number[];
  /** Explicit per-episode [startCap, endCap] overrides for Season 1 or key episodes */
  episodeMap?: Record<number, [number, number]>;
}

export interface CanonBridgeResolution {
  supported: boolean;
  isOriginalAnimation: boolean;
  isFiller: boolean;
  equivSpan: string;
  targetChapter: number;
  targetEpisode: number;
  targetSeason: number;
  bannerText: string;
  ctaLabel: string;
}

export interface AmbientTheme {
  accentHex: string;
  ambientRgb: string;
  logline: string;
}

export interface PhilosophicalWorkMeta {
  quote: string;
  authorNote: string;
  themeLabel: string;
}

const CANON_BRIDGE_REGISTRY: Record<string, CanonBridgeMapping> = {
  "solo-leveling": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 3.4,
    episodeMap: {
      1: [1, 4],
      2: [5, 10],
      3: [11, 13],
      4: [14, 17],
      5: [18, 20],
      6: [21, 24],
      7: [25, 27],
      8: [28, 30],
      9: [31, 34],
      10: [35, 38],
      11: [39, 42],
      12: [43, 45],
    },
  },
  "frieren-beyond-journeys-end": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.15,
    episodeMap: {
      1: [1, 2],
      2: [3, 4],
      3: [5, 6],
      4: [7, 8],
      5: [9, 10],
      6: [11, 12],
      7: [13, 14],
      8: [15, 16],
      9: [17, 19],
      10: [20, 21],
      11: [22, 23],
      12: [24, 25],
    },
  },
  "orb-movements-of-the-earth": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.48,
    episodeMap: {
      1: [1, 2],
      2: [3, 5],
      3: [6, 8],
      4: [9, 10],
      5: [11, 13],
      6: [14, 16],
    },
  },
  dandadan: {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.8,
    episodeMap: {
      1: [1, 1],
      2: [2, 3],
      3: [4, 5],
      4: [6, 8],
      5: [9, 11],
      6: [12, 14],
    },
  },
  "attack-on-titan": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 1.6,
    episodeMap: {
      1: [1, 2],
      2: [2, 3],
      3: [4, 5],
      4: [15, 17],
      5: [3, 4],
    },
  },
  "vinland-saga": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.2,
    episodeMap: {
      1: [1, 2],
      2: [3, 5],
      3: [6, 8],
      4: [9, 11],
    },
  },
  "demon-slayer-infinity-castle": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.3,
    episodeMap: {
      1: [1, 1],
      2: [2, 3],
      3: [4, 5],
      4: [6, 8],
    },
  },
  "jujutsu-kaisen-culling-game": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.6,
    episodeMap: {
      1: [1, 1],
      2: [2, 3],
      3: [4, 5],
      4: [6, 8],
    },
  },
  "bleach-tybw": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 4.2,
    startChapter: 480,
    fillerEpisodes: [14, 15, 16, 17, 18],
  },
  monster: {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.2,
  },
  "apothecary-diaries": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 1.7,
    episodeMap: {
      1: [1, 1],
      2: [2, 3],
      3: [4, 5],
      4: [6, 7],
    },
  },
  "re-zero": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 1.8,
  },
  "kaiju-no-8": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 3.1,
  },
  "chainsaw-man": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 3.2,
    episodeMap: {
      1: [1, 1],
      2: [2, 4],
      3: [5, 7],
      4: [8, 10],
    },
  },
  "oshi-no-ko": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 3.6,
    episodeMap: {
      1: [1, 10],
      2: [11, 13],
      3: [14, 16],
    },
  },
  "blue-lock": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 3.9,
  },
  "cyberpunk-edgerunners": {
    hasMangaAdaptation: false,
    isOriginalAnimation: true,
    chaptersPerEpisode: 0,
  },
  "dungeon-meshi": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.1,
  },
  "spy-x-family": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 1.6,
  },
  "tower-of-god": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 5.5,
  },
  "black-clover": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.2,
    fillerEpisodes: [13, 14, 15, 19, 20],
  },
  "jojos-bizarre-adventure": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 4.0,
  },
  "steel-ball-run": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 3.2,
    episodeMap: {
      1: [1, 6],
      2: [7, 10],
      3: [11, 14],
      4: [15, 18],
    },
  },
  "dragon-ball": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.4,
    fillerEpisodes: [9, 10, 11, 12, 16],
  },
  naruto: {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.2,
    fillerEpisodes: [14, 15, 16],
  },
  boruto: {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 1.8,
    fillerEpisodes: [10, 11, 12, 13, 14, 15],
  },
  "one-piece": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 1.25,
    fillerEpisodes: [14, 15],
    episodeMap: {
      1: [1, 1],
      2: [2, 3],
      3: [4, 5],
      4: [6, 8],
      5: [9, 11],
      6: [12, 14],
      7: [15, 17],
      8: [18, 21],
      9: [22, 24],
      10: [25, 27],
      11: [28, 30],
      12: [31, 33],
      13: [34, 36],
    },
  },
  "hunter-x-hunter": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.4,
    fillerEpisodes: [13, 26],
  },
  "my-hero-academia": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.3,
    fillerEpisodes: [13],
  },
  "death-note": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.9,
    episodeMap: {
      1: [1, 1],
      2: [2, 3],
      3: [4, 5],
      4: [6, 8],
    },
  },
  "fullmetal-alchemist-brotherhood": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 1.7,
  },
  "sakamoto-days": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.8,
  },
  "dr-stone": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.6,
  },
  "mob-psycho-100": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.7,
  },
  "shangri-la-frontier": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.4,
  },
  mashle: {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 3.1,
  },
  "wind-breaker": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.6,
  },
  jigokuraku: {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 3.4,
  },
  "classroom-of-the-elite": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.3,
  },
  "slam-dunk": {
    hasMangaAdaptation: true,
    chaptersPerEpisode: 2.7,
    episodeMap: {
      1: [1, 2],
      2: [3, 5],
      3: [6, 8],
      4: [9, 11],
      5: [12, 14],
    },
  },
};

export const AMBIENT_THEME_MAP: Record<string, AmbientTheme> = {
  "solo-leveling": {
    accentHex: "#60a5fa",
    ambientRgb: "96, 165, 250",
    logline: "Do caçador mais fraco da humanidade ao monarca das sombras sem limites de evolução.",
  },
  "frieren-beyond-journeys-end": {
    accentHex: "#a7f3d0",
    ambientRgb: "110, 231, 183",
    logline: "Após o triunfo sobre o Rei Demônio, uma elfa milenar aprende o valor fugaz dos laços humanos.",
  },
  "orb-movements-of-the-earth": {
    accentHex: "#fbbf24",
    ambientRgb: "245, 158, 11",
    logline: "Astrônomos clandestinos arriscam a fogueira da Inquisição para provar que a Terra gira em torno do Sol.",
  },
  "one-piece": {
    accentHex: "#38bdf8",
    ambientRgb: "56, 189, 248",
    logline: "De East Blue ao Século Perdido em Egghead: a maior odisseia marítima sobre liberdade nos oceanos.",
  },
  "steel-ball-run": {
    accentHex: "#f59e0b",
    ambientRgb: "245, 158, 11",
    logline: "6.000 km a cavalo pela América de 1890: a física da Rotação encontra o destino dos Joestar.",
  },
  "attack-on-titan": {
    accentHex: "#ef4444",
    ambientRgb: "220, 38, 38",
    logline: "Por trás das muralhas gigantes, a luta pela sobrevivência revela um tratado brutal sobre guerra e liberdade.",
  },
  "vinland-saga": {
    accentHex: "#34d399",
    ambientRgb: "52, 211, 153",
    logline: "Da vingança nórdica ao silêncio da redenção: o que significa realmente não ter inimigos.",
  },
  monster: {
    accentHex: "#94a3b8",
    ambientRgb: "148, 163, 184",
    logline: "Um cirurgião salva a vida de um garoto — nove anos depois descobre ter ressuscitado um monstro calculista.",
  },
  "apothecary-diaries": {
    accentHex: "#fb7185",
    ambientRgb: "244, 63, 94",
    logline: "Venenos, conspirações palacianas e medicina empírica na corte imperial sob os olhos de Maomao.",
  },
  "cyberpunk-edgerunners": {
    accentHex: "#facc15",
    ambientRgb: "234, 179, 8",
    logline: "Em Night City, um garoto de rua instala tecnologia militar proibida para sobreviver no limite da cyberpsicose.",
  },
  dandadan: {
    accentHex: "#f97316",
    ambientRgb: "249, 115, 22",
    logline: "Fantasmas, OVNIs e velocidade absurda colidem na mais elétrica aventura sobrenatural da nova geração.",
  },
  "slam-dunk": {
    accentHex: "#ef4444",
    ambientRgb: "239, 68, 68",
    logline: "Do delinquente ruivo ao reboteiro lendário de Shohoku: paixão, superação e basquete inesquecível.",
  },
};

export const PHILOSOPHICAL_QUOTES: Record<string, PhilosophicalWorkMeta> = {
  "frieren-beyond-journeys-end": {
    quote: "“Dez anos de jornada parecem um piscar de olhos — ainda assim, mudam mil anos de solidão.”",
    authorNote: "Kanehito Yamada · Madhouse",
    themeLabel: "Tempo, Memória e Finitude",
  },
  "orb-movements-of-the-earth": {
    quote: "“A heresia de hoje pode ser a verdade que move as estrelas amanhã.”",
    authorNote: "Uoto · Big Comic Spirits",
    themeLabel: "Verdade Científica e Coragem",
  },
  "vinland-saga": {
    quote: "“Você não tem inimigos. Ninguém neste mundo merece ser ferido.”",
    authorNote: "Makoto Yukimura · Thors",
    themeLabel: "Ética, Trauma e Redenção",
  },
  monster: {
    quote: "“Todas as vidas têm o mesmo peso — mas nem toda escolha preserva quem somos.”",
    authorNote: "Naoki Urasawa · Kenzo Tenma",
    themeLabel: "Psicologia Moral e Culpa",
  },
  "attack-on-titan": {
    quote: "“Se você não lutar, não pode vencer — mas até onde vai o preço da liberdade?”",
    authorNote: "Hajime Isayama · Paradis",
    themeLabel: "Ciclos Históricos e Liberdade",
  },
  "apothecary-diaries": {
    quote: "“Todo veneno guarda um antídoto quando observado sem superstição.”",
    authorNote: "Natsu Hyuuga · Maomao",
    themeLabel: "Empirismo na Corte Imperial",
  },
  "death-note": {
    quote: "“A linha entre justiça absoluta e tirania é mais fina que uma página em branco.”",
    authorNote: "Tsugumi Ohba & Takeshi Obata",
    themeLabel: "Poder Absoluto e Dialética",
  },
  "fullmetal-alchemist-brotherhood": {
    quote: "“Nada nasce do nada: para ganhar algo, outro valor equivalente precisa ser entregue.”",
    authorNote: "Hiromu Arakawa · Troca Equivalente",
    themeLabel: "Sacrifício e Humanismo",
  },
  "slam-dunk": {
    quote: "“Quando você desiste, o jogo acaba naquele exato instante.”",
    authorNote: "Takehiko Inoue · Técnico Anzai",
    themeLabel: "Superação, Disciplina e Espírito de Equipe",
  },
};

export function getAnimeAmbientTheme(anime: Anime): AmbientTheme {
  const known = AMBIENT_THEME_MAP[anime.id];
  if (known) return known;
  const firstSentence =
    (anime.synopsis || "").split(/(?<=[.!?])\s+/)[0] || anime.synopsis || "";
  return {
    accentHex: "#38bdf8",
    ambientRgb: "56, 189, 248",
    logline: firstSentence.length > 135 ? `${firstSentence.slice(0, 132)}...` : firstSentence,
  };
}

export function getPhilosophicalMeta(anime: Anime): PhilosophicalWorkMeta {
  const known = PHILOSOPHICAL_QUOTES[anime.id];
  if (known) return known;
  return {
    quote: `“${(anime.synopsis || "").split(".")[0] || anime.title}.”`,
    authorNote: `${anime.manga?.author || anime.studio} · ${anime.year}`,
    themeLabel: anime.genres.slice(0, 2).join(" · "),
  };
}

export function isEpisodeCanon(animeId: string, seasonNumber: number, epNumber: number): boolean {
  const mapping = CANON_BRIDGE_REGISTRY[animeId];
  if (!mapping || !mapping.fillerEpisodes?.length) return true;
  if (seasonNumber === 1) {
    return !mapping.fillerEpisodes.includes(epNumber);
  }
  return true;
}

export function isOriginalAnimationWork(anime: Anime): boolean {
  const mapping = CANON_BRIDGE_REGISTRY[anime.id];
  if (mapping?.isOriginalAnimation) return true;
  return !anime.manga || (anime.manga.chaptersCount || 0) === 0;
}

export function resolveCanonBridge(
  anime: Anime,
  mode: "anime" | "manga",
  number: number,
  seasonNumber = 1
): CanonBridgeResolution {
  const mapping = CANON_BRIDGE_REGISTRY[anime.id];
  const isOriginal = isOriginalAnimationWork(anime);

  if (isOriginal || !anime.manga || anime.manga.chaptersCount === 0) {
    return {
      supported: false,
      isOriginalAnimation: true,
      isFiller: false,
      equivSpan: "Obra Original",
      targetChapter: 1,
      targetEpisode: number,
      targetSeason: seasonNumber,
      bannerText: "Obra Original para Animação — roteiro concebido diretamente para a tela.",
      ctaLabel: "Obra Original",
    };
  }

  const maxChap = Math.max(1, anime.manga.chaptersCount || 100);
  const maxEp = Math.max(1, anime.episodesCount || 12);
  const rate = mapping?.chaptersPerEpisode || Math.max(1, maxChap / maxEp);
  const startOffset = mapping?.startChapter ? mapping.startChapter - 1 : 0;

  if (mode === "anime") {
    const isFiller = !isEpisodeCanon(anime.id, seasonNumber, number);
    if (isFiller) {
      return {
        supported: true,
        isOriginalAnimation: false,
        isFiller: true,
        equivSpan: "Filler / Original do Anime",
        targetChapter: Math.min(maxChap, Math.max(1, Math.round(number * rate + startOffset))),
        targetEpisode: number,
        targetSeason: seasonNumber,
        bannerText: `Ep. ${number} é conteúdo original/filler exclusivo da adaptação em anime.`,
        ctaLabel: "Ir ao arco canônico",
      };
    }

    // Check explicit Season 1 map
    if (seasonNumber === 1 && mapping?.episodeMap?.[number]) {
      const [cStart, cEnd] = mapping.episodeMap[number];
      const span = cStart === cEnd ? `Cap. ${cStart}` : `Caps. ${cStart}–${cEnd}`;
      return {
        supported: true,
        isOriginalAnimation: false,
        isFiller: false,
        equivSpan: span,
        targetChapter: Math.min(maxChap, cEnd),
        targetEpisode: number,
        targetSeason: seasonNumber,
        bannerText: `Ep. ${number} adapta ${span} do Mangá`,
        ctaLabel: `Continuar no Cap. ${Math.min(maxChap, cEnd)}`,
      };
    }

    // Calculate continuous episode offset across prior seasons
    let globalEp = number;
    if (seasonNumber > 1 && anime.seasons?.length) {
      for (const s of anime.seasons) {
        if (s.seasonNumber < seasonNumber) {
          globalEp += s.episodes?.length || s.episodesCount || 0;
        }
      }
    }

    const cStart = Math.min(
      maxChap,
      Math.max(1, Math.floor((globalEp - 1) * rate) + 1 + startOffset)
    );
    const cEnd = Math.min(maxChap, Math.max(cStart, Math.round(globalEp * rate) + startOffset));
    const span = cStart === cEnd ? `Cap. ${cStart}` : `Caps. ${cStart}–${cEnd}`;

    return {
      supported: true,
      isOriginalAnimation: false,
      isFiller: false,
      equivSpan: span,
      targetChapter: cEnd,
      targetEpisode: number,
      targetSeason: seasonNumber,
      bannerText: `T${seasonNumber}:Ep. ${number} adapta ${span} do Mangá`,
      ctaLabel: `Continuar no Cap. ${cEnd}`,
    };
  }

  // mode === "manga" -> map chapter number back to season + episode
  const adjustedChapter = Math.max(1, number - startOffset);
  const approxGlobalEp = Math.min(maxEp, Math.max(1, Math.ceil(adjustedChapter / rate)));

  let targetSeason = 1;
  let targetEp = approxGlobalEp;

  if (anime.seasons?.length) {
    let remaining = approxGlobalEp;
    for (const s of anime.seasons) {
      const len = s.episodes?.length || s.episodesCount || 0;
      if (len > 0 && remaining <= len) {
        targetSeason = s.seasonNumber;
        targetEp = remaining;
        break;
      }
      remaining = Math.max(1, remaining - len);
      targetSeason = s.seasonNumber;
      targetEp = Math.min(len || remaining, remaining);
    }
  }

  return {
    supported: true,
    isOriginalAnimation: false,
    isFiller: false,
    equivSpan: `T${targetSeason}:Ep. ${targetEp}`,
    targetChapter: number,
    targetEpisode: targetEp,
    targetSeason,
    bannerText: `Cap. ${number} corresponde a T${targetSeason}:Ep. ${targetEp} do Anime`,
    ctaLabel: `Assistir T${targetSeason}:Ep. ${targetEp}`,
  };
}

/**
 * Cleans boilerplate repetitive catalog synopses (e.g., "Episódio X completo da Temporada 1: ...")
 * so episode cards read with editorial clarity instead of duplicated database strings.
 */
export function getCleanEpisodeSynopsis(anime: Anime, ep: AnimeEpisode): string {
  const raw = (ep.synopsis || "").trim();
  const isBoilerplate =
    /^Episódio\s+\d+\s+completo\s+da\s+Temporada/i.test(raw) ||
    raw.toLowerCase() === ep.title.toLowerCase() ||
    raw.length < 18;

  if (!isBoilerplate) return raw;

  const bridge = resolveCanonBridge(anime, "anime", ep.number, ep.seasonNumber);
  const seasonObj = anime.seasons?.find((s) => s.seasonNumber === ep.seasonNumber);
  const arcName = seasonObj?.title
    ? seasonObj.title.replace(/^Temporada\s*\d+\s*[:—-]\s*/i, "").trim()
    : anime.season;

  if (bridge.isFiller) {
    return `História complementar da adaptação televisiva durante ${arcName}, expandindo os momentos entre os arcos principais.`;
  }
  if (bridge.supported) {
    return `Desdobramento de ${arcName} em ${anime.title}, adaptando ${bridge.equivSpan} da obra original de ${anime.manga?.author || anime.studio}.`;
  }
  return `Capítulo ${ep.number} de ${arcName} em ${anime.title}, com direção de ${anime.studio}.`;
}

export function getCleanEpisodeTitle(ep: AnimeEpisode): string {
  const raw = (ep.title || "").trim();
  // Trim overly redundant "Episódio X — Saga ... — Episódio X" suffixes if long
  if (/^Episódio\s+\d+\s+—\s+.+/i.test(raw) && raw.length > 68) {
    return raw.replace(/^Episódio\s+\d+\s+—\s+/i, "");
  }
  return raw;
}
