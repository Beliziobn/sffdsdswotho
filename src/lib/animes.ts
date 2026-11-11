import { ANIME_MANGA_CONFIGS } from "./mangadex";
import verifiedCatalogRaw from "@/data/verifiedAnimesCatalog.json";

export interface AnimeSource {
  id: string;
  quality: "1080p" | "720p" | "480p";
  streamUrl: string;
  format: "hls" | "mp4" | "embed";
  provider: string;
  isDefault?: boolean;
}

export interface AnimeEpisode {
  id: string;
  animeId: string;
  seasonId: string;
  seasonNumber: number;
  number: number;
  title: string;
  duration: string;
  thumbnail: string;
  synopsis: string;
  isFree: boolean;
  contentHash: string;
  streamUrl: string;
  hlsStreamUrl?: string;
  subHlsStreamUrl?: string;
  anivideoEmbedUrl?: string;
  youtubeVideoId?: string;
  sources?: AnimeSource[];
  airDate?: string;
  /** Campo mantido para retrocompatibilidade */
  videoUrl?: string;
}

export interface AnimeSeason {
  id: string;
  animeId: string;
  seasonNumber: number;
  title: string;
  year: number;
  synopsis: string;
  episodesCount: number;
  poster: string;
  banner?: string;
  trailerYoutubeId: string;
  episodes: AnimeEpisode[];
}

export interface MangaChapter {
  id: string;
  number: number;
  title: string;
  pagesCount: number;
  pages: string[];
  description: string;
  releaseDate: string;
  isFree: boolean;
  mangadexChapterId?: string;
  chapterUrl?: string;
  translatedLanguage?: string;
}

export interface MangaInfo {
  title: string;
  chaptersCount: number;
  author: string;
  artist: string;
  cover: string;
  status: "Em publicação" | "Completo";
  mangadexId?: string;
  serialization?: string;
  publisher?: string;
  chapters: MangaChapter[];
}

export interface Anime {
  id: string;
  title: string;
  japaneseTitle: string;
  slug: string;
  synopsis: string;
  cover: string;
  banner: string;
  rating: number;
  ratingCount: number;
  episodesCount: number;
  genres: string[];
  status: "Em lançamento" | "Completo";
  season: string;
  studio: string;
  year: number;
  audio: string;
  trailerYoutubeId: string;
  broadcastDay?: "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo";
  featured?: boolean;
  trending?: boolean;
  isDeepPhilosophical?: boolean;
  isRecentTop?: boolean;
  rank?: number;
  malId?: number;
  tmdbId?: number;
  anilistId?: number;
  imdbId?: string;
  /** Hierarquia Completa Estrita: Temporadas com seus respectivos episódios */
  seasons: AnimeSeason[];
  /** Array unificado para retrocompatibilidade com componentes existentes */
  episodes: AnimeEpisode[];
  manga: MangaInfo;
}

export const ANIME_GENRES = [
  "Tudo",
  "Ação",
  "Seinen",
  "Filosófico",
  "Psicológico",
  "Mistério",
  "Fantasia",
  "Ficção Científica",
  "Cyberpunk",
  "Histórico",
  "Sobrenatural",
  "Drama",
  "Shonen",
  "Isekai",
  "Esporte",
  "Comédia",
];

const verifiedCatalog = verifiedCatalogRaw as Record<
  string,
  {
    trailerYoutubeId: string;
    episodesCount: number;
    seasons: AnimeSeason[];
  }
>;

function getVerifiedSeasons(animeId: string): AnimeSeason[] {
  return verifiedCatalog[animeId]?.seasons || [];
}

function getVerifiedEpisodesCount(animeId: string, fallback: number): number {
  return verifiedCatalog[animeId]?.episodesCount || fallback;
}

function getVerifiedTrailer(animeId: string, fallback: string): string {
  return verifiedCatalog[animeId]?.trailerYoutubeId || fallback;
}

function buildMangaInfo(
  animeId: string,
  fallback: {
    title: string;
    chaptersCount: number;
    author: string;
    artist: string;
    cover: string;
    status: "Em publicação" | "Completo";
    mangadexId?: string;
    serialization: string;
    publisher: string;
  }
): MangaInfo {
  const cfg = ANIME_MANGA_CONFIGS[animeId];
  if (cfg) {
    return {
      title: cfg.canonicalTitle,
      chaptersCount: cfg.totalChaptersEstimate,
      author: cfg.author,
      artist: cfg.artist,
      cover: cfg.officialCover,
      status: cfg.status === "Completo" ? "Completo" : "Em publicação",
      mangadexId: cfg.mangadexId,
      serialization: cfg.serialization,
      publisher: cfg.publisher,
      chapters: cfg.initialChapters.map((ch) => ({
        ...ch,
        pages: ch.pages || [],
      })),
    };
  }

  return {
    ...fallback,
    chapters: [
      {
        id: `${animeId}-cap-1`,
        number: 1,
        title: `Capítulo 1: O Início de ${fallback.title}`,
        pagesCount: 42,
        pages: [],
        description: `Capítulo de abertura oficial da obra original de ${fallback.author}.`,
        releaseDate: "2024",
        isFree: true,
      },
      {
        id: `${animeId}-cap-2`,
        number: 2,
        title: `Capítulo 2: Despertar e Destino`,
        pagesCount: 28,
        pages: [],
        description: `Segundo capítulo canônico publicado na ${fallback.serialization}.`,
        releaseDate: "2024",
        isFree: true,
      },
    ],
  };
}

// ============================================================================
// BASE DE DADOS OFICIAL - 39 FRANQUIAS, 112 TEMPORADAS COMPLETAS, 1.675 EPISÓDIOS
// ============================================================================

export const ANIMES_DATA: Anime[] = [
  // 1. SOLO LEVELING (2 Temporadas - 25 Episódios)
  {
    id: "solo-leveling",
    title: "Solo Leveling: Arise from the Shadow",
    japaneseTitle: "俺だけレベルアップな件 (나 혼자만 레벨업)",
    slug: "solo-leveling",
    synopsis:
      "Em um mundo onde caçadores humanos despertam habilidades mágicas para combater monstros mortais, Sung Jinwoo é conhecido como o caçador mais fraco da humanidade. À beira da morte em uma masmorra dupla implacável, ele aceita uma misteriosa missão que o transforma no único capaz de subir de nível sem limites.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176496-9BDMjAZGEbq4.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/176496-5oY4k2NRqlYs.jpg",
    rating: 9.4,
    ratingCount: 68200,
    episodesCount: getVerifiedEpisodesCount("solo-leveling", 25),
    genres: ["Ação", "Fantasia", "Sobrenatural", "Shonen"],
    status: "Em lançamento",
    season: "Temporada de Inverno / Outono",
    studio: "A-1 Pictures",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("solo-leveling", "HkIKAnwLZCw"),
    broadcastDay: "Sábado",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 1,
    malId: 52299,
    anilistId: 151807,
    imdbId: "tt21209876",
    seasons: getVerifiedSeasons("solo-leveling"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("solo-leveling", {
      title: "Solo Leveling",
      chaptersCount: 179,
      author: "Chugong",
      artist: "DUBU (REDICE Studio)",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png",
      status: "Completo",
      serialization: "KakaoPage",
      publisher: "D&C Media",
    }),
  },

  // 2. FRIEREN (3 Temporadas - 38 Episódios)
  {
    id: "frieren-beyond-journeys-end",
    title: "Frieren e a Jornada Para o Além",
    japaneseTitle: "葬送のフリーレン",
    slug: "frieren-beyond-journeys-end",
    synopsis:
      "A maga elfa Frieren e seus valorosos companheiros derrotaram o Rei Demônio e trouxeram paz ao mundo. Mas após o fim da grande aventura, Frieren, cuja vida se estende por milênios, precisa encarar a passagem do tempo, a finitude humana e o legado emocional de seus amigos.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg",
    rating: 9.6,
    ratingCount: 84500,
    episodesCount: getVerifiedEpisodesCount("frieren-beyond-journeys-end", 38),
    genres: ["Fantasia", "Filosófico", "Drama", "Ação"],
    status: "Em lançamento",
    season: "Temporada de Inverno",
    studio: "Madhouse",
    year: 2026,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("frieren-beyond-journeys-end", "tR8YH0G67Rk"),
    broadcastDay: "Sexta",
    featured: true,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 2,
    malId: 52991,
    anilistId: 154587,
    imdbId: "tt22248376",
    seasons: getVerifiedSeasons("frieren-beyond-journeys-end"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("frieren-beyond-journeys-end", {
      title: "Sousou no Frieren",
      chaptersCount: 140,
      author: "Kanehito Yamada",
      artist: "Tsukasa Abe",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
      status: "Em publicação",
      serialization: "Weekly Shōnen Sunday",
      publisher: "Shogakukan",
    }),
  },

  // 3. ORB: ON THE MOVEMENTS OF THE EARTH (1 Temporada Completa - 25 Episódios)
  {
    id: "orb-movements-of-the-earth",
    title: "Orb: Sobre os Movimentos da Terra (Chi.)",
    japaneseTitle: "チ。―地球の運動について―",
    slug: "orb-movements-of-the-earth",
    synopsis:
      "Na Europa do século XV, onde questionar o geocentrismo significa a fogueira da Inquisição, o prodígio Rafal e gerações de astrônomos clandestinos arriscam suas almas para provar matematicamente uma verdade proibida: a Terra se move em torno do Sol.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151514-Y0d82Ah2ZOHX.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151514-mwWSGTynCLkl.jpg",
    rating: 9.4,
    ratingCount: 41200,
    episodesCount: getVerifiedEpisodesCount("orb-movements-of-the-earth", 25),
    genres: ["Seinen", "Filosófico", "Histórico", "Drama", "Mistério"],
    status: "Completo",
    season: "Temporada de Outono / Inverno",
    studio: "Madhouse",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("orb-movements-of-the-earth", "EBosY5GPpfw"),
    broadcastDay: "Sábado",
    featured: true,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 3,
    malId: 52215,
    anilistId: 151514,
    imdbId: "tt28641195",
    seasons: getVerifiedSeasons("orb-movements-of-the-earth"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("orb-movements-of-the-earth", {
      title: "Chi.: Chikyuu no Undou ni Tsuite",
      chaptersCount: 62,
      author: "Uoto",
      artist: "Uoto",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151514-Y0d82Ah2ZOHX.jpg",
      status: "Completo",
      mangadexId: "12345678-0000-0000-0000-000000000001",
      serialization: "Big Comic Spirits",
      publisher: "Shogakukan",
    }),
  },

  // 4. DANDADAN (2 Temporadas - 24 Episódios)
  {
    id: "dandadan",
    title: "DAN DA DAN",
    japaneseTitle: "ダンダダン",
    slug: "dandadan",
    synopsis:
      "Momo Ayase acredita em espíritos, mas nega alienígenas; seu colega Okarun é fanático por OVNIs, mas nega fantasmas. Em uma aposta para provar quem está certo, os dois são lançados em batalhas sobrenaturais alucinantes contra a Vovó Turbo, alienígenas Serpo e o Olho Maligno.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-60q1B6GK2Ghb.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/171018-SpwPNAduszXl.jpg",
    rating: 9.2,
    ratingCount: 59400,
    episodesCount: getVerifiedEpisodesCount("dandadan", 24),
    genres: ["Ação", "Sobrenatural", "Ficção Científica", "Comédia", "Shonen"],
    status: "Em lançamento",
    season: "Temporada de Verão",
    studio: "Science SARU",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("dandadan", "rJo1MnsuxyY"),
    broadcastDay: "Quinta",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 4,
    malId: 57334,
    anilistId: 171018,
    imdbId: "tt30217403",
    seasons: getVerifiedSeasons("dandadan"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("dandadan", {
      title: "Dandadan",
      chaptersCount: 185,
      author: "Yukinobu Tatsu",
      artist: "Yukinobu Tatsu",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-60q1B6GK2Ghb.jpg",
      status: "Em publicação",
      serialization: "Shōnen Jump+",
      publisher: "Shueisha",
    }),
  },

  // 5. ATTACK ON TITAN (5 Temporadas Completas - 87 Episódios)
  {
    id: "attack-on-titan",
    title: "Attack on Titan (Shingeki no Kyojin)",
    japaneseTitle: "進撃の巨人",
    slug: "attack-on-titan",
    synopsis:
      "Confinada atrás de três muralhas colossais para sobreviver a devoradores humanos gigantes, a humanidade vê sua paz ruir quando o Titã Colossal abre caminho para o caos. A jornada de Eren Yeager evolui de uma luta por sobrevivência para um tratado filosófico visceral sobre liberdade, ciclo de ódio e guerra.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx110277-sKUNXAsWMNFw.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/110277-iuGn6F5bK1U1.jpg",
    rating: 9.6,
    ratingCount: 142000,
    episodesCount: getVerifiedEpisodesCount("attack-on-titan", 87),
    genres: ["Ação", "Drama", "Filosófico", "Mistério", "Psicológico", "Seinen"],
    status: "Completo",
    season: "Série Completa (5 Temporadas)",
    studio: "WIT Studio & MAPPA",
    year: 2023,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("attack-on-titan", "LHtdKWJdif4"),
    broadcastDay: "Domingo",
    featured: true,
    trending: true,
    isDeepPhilosophical: true,
    rank: 5,
    malId: 16498,
    anilistId: 16498,
    imdbId: "tt2560140",
    seasons: getVerifiedSeasons("attack-on-titan"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("attack-on-titan", {
      title: "Shingeki no Kyojin (Attack on Titan)",
      chaptersCount: 139,
      author: "Hajime Isayama",
      artist: "Hajime Isayama",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg",
      status: "Completo",
      serialization: "Bessatsu Shōnen Magazine",
      publisher: "Kodansha",
    }),
  },

  // 6. VINLAND SAGA (2 Temporadas Completas - 48 Episódios)
  {
    id: "vinland-saga",
    title: "Vinland Saga",
    japaneseTitle: "ヴィンランド・サガ",
    slug: "vinland-saga",
    synopsis:
      "Na Europa do século XI devastada pelas invasões vikings, o jovem Thorfinn cresce no campo de batalha buscando um duelo honrado contra Askeladd, o assassino de seu pai. Uma epopeia histórica e filosófica profunda sobre redenção, trauma e o que significa ser um verdadeiro guerreiro.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx136430-gsBsJjA7hGh9.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/136430-ktoFZnyubhHg.jpg",
    rating: 9.5,
    ratingCount: 74800,
    episodesCount: getVerifiedEpisodesCount("vinland-saga", 48),
    genres: ["Seinen", "Histórico", "Filosófico", "Drama", "Ação"],
    status: "Completo",
    season: "Temporada de Inverno",
    studio: "WIT Studio & MAPPA",
    year: 2023,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("vinland-saga", "5xqEp7R9SYM"),
    broadcastDay: "Segunda",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    rank: 6,
    malId: 37521,
    anilistId: 101348,
    imdbId: "tt10233448",
    seasons: getVerifiedSeasons("vinland-saga"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("vinland-saga", {
      title: "Vinland Saga",
      chaptersCount: 216,
      author: "Makoto Yukimura",
      artist: "Makoto Yukimura",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-2fhDFPCuMNiz.jpg",
      status: "Em publicação",
      serialization: "Monthly Afternoon",
      publisher: "Kodansha",
    }),
  },

  // 7. DEMON SLAYER (5 Temporadas Completas - 63 Episódios)
  {
    id: "demon-slayer-infinity-castle",
    title: "Demon Slayer: Kimetsu no Yaiba",
    japaneseTitle: "鬼滅の刃 無限城編",
    slug: "demon-slayer-infinity-castle",
    synopsis:
      "Tanjiro Kamado luta incansavelmente para curar sua irmã Nezuko transformada em demônio e vingar sua família massacrada. Percorrendo todas as 5 temporadas — da Seleção Final ao Trem Infinito, Distrito do Entretenimento, Vila dos Ferreiros e Treinamento dos Hashiras rumo ao Castelo Infinito.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
    rating: 9.5,
    ratingCount: 91200,
    episodesCount: getVerifiedEpisodesCount("demon-slayer-infinity-castle", 63),
    genres: ["Ação", "Sobrenatural", "Fantasia", "Shonen"],
    status: "Em lançamento",
    season: "5 Temporadas Completas",
    studio: "ufotable",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("demon-slayer-infinity-castle", "6vMuWuWlW4I"),
    broadcastDay: "Domingo",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 7,
    malId: 38000,
    anilistId: 101922,
    imdbId: "tt9335498",
    seasons: getVerifiedSeasons("demon-slayer-infinity-castle"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("demon-slayer-infinity-castle", {
      title: "Kimetsu no Yaiba",
      chaptersCount: 205,
      author: "Koyoharu Gotouge",
      artist: "Koyoharu Gotouge",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
      status: "Completo",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 8. JUJUTSU KAISEN (3 Temporadas - 59 Episódios)
  {
    id: "jujutsu-kaisen-culling-game",
    title: "Jujutsu Kaisen: Shibuya & Jogo do Abate",
    japaneseTitle: "呪術廻戦 死滅回游",
    slug: "jujutsu-kaisen-culling-game",
    synopsis:
      "Desde o despertar de Ryomen Sukuna em Yuji Itadori até o trágico passado de Satoru Gojo, o devastador Incidente de Shibuya e o ritual mortal do Jogo do Abate arquitetado por Kenjaku.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/145064-esDtAY2He7sk.jpg",
    rating: 9.3,
    ratingCount: 83400,
    episodesCount: getVerifiedEpisodesCount("jujutsu-kaisen-culling-game", 59),
    genres: ["Ação", "Sobrenatural", "Fantasia", "Shonen"],
    status: "Em lançamento",
    season: "Temporada de Outono",
    studio: "MAPPA",
    year: 2026,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("jujutsu-kaisen-culling-game", "RIyb52EMx8c"),
    broadcastDay: "Quinta",
    featured: false,
    trending: true,
    isRecentTop: true,
    rank: 8,
    malId: 40748,
    anilistId: 113415,
    imdbId: "tt12343534",
    seasons: getVerifiedSeasons("jujutsu-kaisen-culling-game"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("jujutsu-kaisen-culling-game", {
      title: "Jujutsu Kaisen",
      chaptersCount: 271,
      author: "Gege Akutami",
      artist: "Gege Akutami",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
      status: "Completo",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 9. BLEACH: THOUSAND-YEAR BLOOD WAR (4 Temporadas - 50 Episódios)
  {
    id: "bleach-tybw",
    title: "Bleach: Thousand-Year Blood War",
    japaneseTitle: "BLEACH 千年血戦篇",
    slug: "bleach-tybw",
    synopsis:
      "Após mil anos nas sombras, o Imperador Quincy Yhwach e a Sternritter marcham sobre a Soul Society para aniquilar os Shinigamis. Ichigo Kurosaki descobre a verdade sobre sua linhagem e desperta sua verdadeira Zanpakuto na guerra pelos três mundos.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx169755-Rqb7MjnzdTc6.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/169755-hCWjp9ajjMYV.jpg",
    rating: 9.3,
    ratingCount: 54900,
    episodesCount: getVerifiedEpisodesCount("bleach-tybw", 50),
    genres: ["Ação", "Sobrenatural", "Fantasia", "Shonen"],
    status: "Em lançamento",
    season: "4 Partes (Guerra Sangrenta)",
    studio: "Pierrot Films",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("bleach-tybw", "fzR82oXbjnY"),
    broadcastDay: "Sábado",
    featured: false,
    trending: true,
    isRecentTop: true,
    rank: 9,
    malId: 41467,
    anilistId: 116674,
    imdbId: "tt14986406",
    seasons: getVerifiedSeasons("bleach-tybw"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("bleach-tybw", {
      title: "Bleach: Sennen Kessen-hen",
      chaptersCount: 686,
      author: "Tite Kubo",
      artist: "Tite Kubo",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx116674-p3zK4PUX2Aag.jpg",
      status: "Completo",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 10. MONSTER (2 Temporadas - 49 Episódios)
  {
    id: "monster",
    title: "Monster (Naoki Urasawa's Monster)",
    japaneseTitle: "モンスター",
    slug: "monster",
    synopsis:
      "Em 1986, na Alemanha Ocidental, o brilhante neurocirurgião Dr. Kenzo Tenma desobedece ordens políticas do hospital para salvar a vida de um menino baleado na cabeça, Johan Liebert. Nove anos depois, Tenma descobre que o garoto que salvou tornou-se o mais frio e carismático psicopata da Europa.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19-gtMC64182sm4.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/19-kJhwsB0Z97tL.jpg",
    rating: 9.5,
    ratingCount: 62300,
    episodesCount: getVerifiedEpisodesCount("monster", 49),
    genres: ["Seinen", "Psicológico", "Filosófico", "Mistério", "Drama"],
    status: "Completo",
    season: "Obra-Prima Clássica Seinen",
    studio: "Madhouse",
    year: 2005,
    audio: "Legendado PT-BR & Áudio Original",
    trailerYoutubeId: getVerifiedTrailer("monster", "9aS-EgdAq6U"),
    broadcastDay: "Quarta",
    featured: false,
    trending: false,
    isDeepPhilosophical: true,
    rank: 10,
    malId: 19,
    anilistId: 19,
    imdbId: "tt0434706",
    seasons: getVerifiedSeasons("monster"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("monster", {
      title: "Monster",
      chaptersCount: 162,
      author: "Naoki Urasawa",
      artist: "Naoki Urasawa",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19-gtMC64182sm4.jpg",
      status: "Completo",
      serialization: "Big Comic Original",
      publisher: "Shogakukan",
    }),
  },

  // 11. THE APOTHECARY DIARIES (2 Temporadas - 48 Episódios)
  {
    id: "apothecary-diaries",
    title: "Diários de uma Apotecária (Kusuriya no Hitorigoto)",
    japaneseTitle: "薬屋のひとりごと",
    slug: "apothecary-diaries",
    synopsis:
      "Sequestrada e vendida como serva na Corte Interna Imperial, a jovem boticária Maomao usa seu intelecto afiado e conhecimento enciclopédico de venenos e medicina para solucionar assassinatos, maldições e conspirações políticas ao lado do enigmático Jinshi.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176301-TIGmldLffQGX.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/176301-GkuTF1YTT6b2.jpg",
    rating: 9.3,
    ratingCount: 51800,
    episodesCount: getVerifiedEpisodesCount("apothecary-diaries", 48),
    genres: ["Mistério", "Histórico", "Drama", "Psicológico"],
    status: "Em lançamento",
    season: "Temporada de Inverno / Primavera",
    studio: "TOHO animation STUDIO & OLM",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("apothecary-diaries", "oyHqh8ue4zw"),
    broadcastDay: "Sexta",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 11,
    malId: 54492,
    anilistId: 161645,
    imdbId: "tt26743760",
    seasons: getVerifiedSeasons("apothecary-diaries"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("apothecary-diaries", {
      title: "Kusuriya no Hitorigoto",
      chaptersCount: 82,
      author: "Natsu Hyuuga",
      artist: "Nekokurage",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx161645-QLbzHXiYRgV2.jpg",
      status: "Em publicação",
      serialization: "Monthly Big Gangan",
      publisher: "Square Enix",
    }),
  },

  // 12. RE:ZERO (4 Temporadas - 66 Episódios)
  {
    id: "re-zero",
    title: "Re:ZERO — Começando uma Vida em Outro Mundo",
    japaneseTitle: "Re:ゼロから始める異世界生活",
    slug: "re-zero",
    synopsis:
      "Subitamente transportado para um reino de fantasia implacável, Subaru Natsuki descobre a maldição do 'Retorno Através da Morte'. Carregando sozinho as memórias de linhas temporais sangrentas, ele luta para salvar Emilia, Rem e seus aliados da loucura dos Arcebispos do Pecado.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163134-yieRFbvUOH9a.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/163134-CqaXjXVivwJ5.jpg",
    rating: 9.1,
    ratingCount: 64200,
    episodesCount: getVerifiedEpisodesCount("re-zero", 66),
    genres: ["Psicológico", "Fantasia", "Isekai", "Drama", "Mistério"],
    status: "Em lançamento",
    season: "Temporada 3 (Arco de Priestella)",
    studio: "White Fox",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("re-zero", "vFfXjuVA1Jk"),
    broadcastDay: "Quarta",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 12,
    malId: 31240,
    anilistId: 21355,
    imdbId: "tt5607616",
    seasons: getVerifiedSeasons("re-zero"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("re-zero", {
      title: "Re:Zero kara Hajimeru Isekai Seikatsu",
      chaptersCount: 115,
      author: "Tappei Nagatsuki",
      artist: "Shinichirou Otsuka",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21355-wRVUrGxpvIQQ.jpg",
      status: "Em publicação",
      serialization: "MF Bunko J / Monthly Comic Alive",
      publisher: "Kadokawa",
    }),
  },

  // 13. KAIJU NO. 8 (2 Temporadas - 23 Episódios)
  {
    id: "kaiju-no-8",
    title: "Kaiju No. 8",
    japaneseTitle: "怪獣8号",
    slug: "kaiju-no-8",
    synopsis:
      "No Japão, monstros colossais conhecidos como Kaiju atacam constantemente a população civil. Kafka Hibino, que sonhava em se alistar na Força de Defesa ao lado de Mina Ashiro, adquire o poder devastador do Kaiju No. 8.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx178754-Dgrub8xgC03M.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/178754-pzQw3EJ0DYO9.jpg",
    rating: 9.0,
    ratingCount: 44900,
    episodesCount: getVerifiedEpisodesCount("kaiju-no-8", 23),
    genres: ["Ação", "Ficção Científica", "Comédia", "Shonen"],
    status: "Em lançamento",
    season: "Temporada de Verão",
    studio: "Production I.G",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("kaiju-no-8", "7n_mFVPeApw"),
    broadcastDay: "Sábado",
    featured: false,
    trending: true,
    isRecentTop: true,
    rank: 13,
    malId: 52588,
    anilistId: 153288,
    imdbId: "tt21975436",
    seasons: getVerifiedSeasons("kaiju-no-8"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("kaiju-no-8", {
      title: "Kaiju No. 8",
      chaptersCount: 118,
      author: "Naoya Matsumoto",
      artist: "Naoya Matsumoto",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153288-25FBfFJzEQ5O.jpg",
      status: "Em publicação",
      serialization: "Shōnen Jump+",
      publisher: "Shueisha",
    }),
  },

  // 14. CHAINSAW MAN (2 Temporadas - 18 Episódios)
  {
    id: "chainsaw-man",
    title: "Chainsaw Man & Arco da Reze",
    japaneseTitle: "チェンソーマン 劇場版 レゼ篇",
    slug: "chainsaw-man",
    synopsis:
      "Denji é um jovem empobrecido que caça demônios ao lado de seu cão-motosserra Pochita. Após ser traído e renascer como o Homem-Motosserra na Segurança Pública de Makima, ele conhece Reze, uma misteriosa garota de cafeteria que guarda um segredo explosivo.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/127230-o8IRwCGVr9KW.jpg",
    rating: 9.2,
    ratingCount: 68300,
    episodesCount: getVerifiedEpisodesCount("chainsaw-man", 18),
    genres: ["Ação", "Sobrenatural", "Psicológico", "Drama", "Shonen"],
    status: "Em lançamento",
    season: "Série + Arco Cinematográfico",
    studio: "MAPPA",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("chainsaw-man", "v4yLeNt-kCU"),
    broadcastDay: "Terça",
    featured: false,
    trending: true,
    isRecentTop: true,
    rank: 14,
    malId: 44511,
    anilistId: 127230,
    imdbId: "tt13616990",
    seasons: getVerifiedSeasons("chainsaw-man"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("chainsaw-man", {
      title: "Chainsaw Man",
      chaptersCount: 188,
      author: "Tatsuki Fujimoto",
      artist: "Tatsuki Fujimoto",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png",
      status: "Em publicação",
      serialization: "Weekly Shōnen Jump / Shōnen Jump+",
      publisher: "Shueisha",
    }),
  },

  // 15. OSHI NO KO (3 Temporadas - 35 Episódios)
  {
    id: "oshi-no-ko",
    title: "[OSHI NO KO]: Minha Estrela Favorita",
    japaneseTitle: "【推しの子】",
    slug: "oshi-no-ko",
    synopsis:
      "Um médico obstetra e uma paciente renascem como os filhos gêmeos da superestrela idol Ai Hoshino. Após uma tragédia chocante, Aqua e Ruby mergulham nas verdades cruéis, mentiras fabricadas e manipulações psicológicas do mundo do espetáculo japonês.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166531-dAL5MsqDHUkj.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/166531-vUu7iDwUkC67.jpg",
    rating: 9.1,
    ratingCount: 49200,
    episodesCount: getVerifiedEpisodesCount("oshi-no-ko", 35),
    genres: ["Drama", "Psicológico", "Mistério", "Sobrenatural", "Seinen"],
    status: "Em lançamento",
    season: "Temporada de Verão",
    studio: "Doga Kobo",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("oshi-no-ko", "gKWEUJ4r5do"),
    broadcastDay: "Quarta",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 15,
    malId: 52034,
    anilistId: 150672,
    imdbId: "tt21030032",
    seasons: getVerifiedSeasons("oshi-no-ko"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("oshi-no-ko", {
      title: "[Oshi no Ko]",
      chaptersCount: 166,
      author: "Aka Akasaka",
      artist: "Mengo Yokoyari",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx150672-WqmmwZ4nMzAy.png",
      status: "Completo",
      serialization: "Weekly Young Jump",
      publisher: "Shueisha",
    }),
  },

  // 16. BLUE LOCK (2 Temporadas - 38 Episódios)
  {
    id: "blue-lock",
    title: "BLUE LOCK: Vs. U-20 Japan",
    japaneseTitle: "ブルーロック",
    slug: "blue-lock",
    synopsis:
      "Após a eliminação do Japão na Copa do Mundo, a União Japonesa de Futebol contrata o enigmático Jinpachi Ego para criar o projeto Blue Lock: uma prisão competitiva onde 300 atacantes disputam a sobrevivência profissional através do egoísmo absoluto.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163146-BVZPgyzkqi82.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/163146-HIz04v1Or7He.jpg",
    rating: 8.9,
    ratingCount: 52600,
    episodesCount: getVerifiedEpisodesCount("blue-lock", 38),
    genres: ["Esporte", "Psicológico", "Ação", "Shonen"],
    status: "Completo",
    season: "Temporada de Outono",
    studio: "8bit",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("blue-lock", "5YBL7fx94RU"),
    broadcastDay: "Sábado",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 16,
    malId: 49596,
    anilistId: 137822,
    imdbId: "tt15222080",
    seasons: getVerifiedSeasons("blue-lock"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("blue-lock", {
      title: "Blue Lock",
      chaptersCount: 285,
      author: "Muneyuki Kaneshiro",
      artist: "Yusuke Nomura",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx137822-U8naszP96vzC.png",
      status: "Em publicação",
      serialization: "Weekly Shōnen Magazine",
      publisher: "Kodansha",
    }),
  },

  // 17. CYBERPUNK: EDGERUNNERS (2 Temporadas - 20 Episódios)
  {
    id: "cyberpunk-edgerunners",
    title: "Cyberpunk: Edgerunners",
    japaneseTitle: "サイバーパンク エッジランナーズ",
    slug: "cyberpunk-edgerunners",
    synopsis:
      "Em uma Night City distópica consumida pela corrupção corporativa e obsessão tecnológica, o jovem de rua David Martinez instala o implante militar experimental Sandevistan e mergulha no submundo dos mercenários Edgerunners ao lado da netrunner Lucy.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-ayZPoxiWt4Li.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/120377-c15oLS8CA31s.jpg",
    rating: 9.3,
    ratingCount: 69100,
    episodesCount: getVerifiedEpisodesCount("cyberpunk-edgerunners", 20),
    genres: ["Cyberpunk", "Ficção Científica", "Ação", "Psicológico", "Drama"],
    status: "Completo",
    season: "Série Original Studio Trigger",
    studio: "Trigger",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("cyberpunk-edgerunners", "ax5YUmkWf_Y"),
    broadcastDay: "Sexta",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    rank: 17,
    malId: 42310,
    anilistId: 120377,
    imdbId: "tt12590266",
    seasons: getVerifiedSeasons("cyberpunk-edgerunners"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("cyberpunk-edgerunners", {
      title: "Cyberpunk: Edgerunners Madness",
      chaptersCount: 24,
      author: "Bartosz Sztybor",
      artist: "Asano",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-ayZPoxiWt4Li.jpg",
      status: "Em publicação",
      serialization: "Comic Alive+",
      publisher: "CD Projekt Red / Kadokawa",
    }),
  },

  // 18. DELICIOUS IN DUNGEON / DUNGEON MESHI (1 Temporada - 24 Episódios)
  {
    id: "dungeon-meshi",
    title: "Dungeon Meshi (Delicious in Dungeon)",
    japaneseTitle: "ダンジョン飯",
    slug: "dungeon-meshi",
    synopsis:
      "Após sua irmã Falin ser engolida por um Dragão Vermelho nas profundezas de uma masmorra amaldiçoada, o aventureiro Laios, a maga Marcille, Chilchuck e o anão cozinheiro Senshi desvendam a biologia e a ecologia subterrânea cozinhando as próprias criaturas do labirinto.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153518-IVXPDY5ph3kO.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/153518-7uRvV7SLqmHV.jpg",
    rating: 9.1,
    ratingCount: 39800,
    episodesCount: getVerifiedEpisodesCount("dungeon-meshi", 24),
    genres: ["Fantasia", "Seinen", "Comédia", "Ação"],
    status: "Completo",
    season: "Temporada de Inverno / Primavera",
    studio: "Trigger",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("dungeon-meshi", "RtpYObV4c1Y"),
    broadcastDay: "Quinta",
    featured: false,
    trending: false,
    isRecentTop: true,
    rank: 18,
    malId: 52701,
    anilistId: 153518,
    imdbId: "tt21621494",
    seasons: getVerifiedSeasons("dungeon-meshi"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("dungeon-meshi", {
      title: "Dungeon Meshi",
      chaptersCount: 97,
      author: "Ryoko Kui",
      artist: "Ryoko Kui",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153518-IVXPDY5ph3kO.jpg",
      status: "Completo",
      serialization: "Harta",
      publisher: "Enterbrain / Kadokawa",
    }),
  },

  // 19. SPY X FAMILY (3 Temporadas - 37 Episódios)
  {
    id: "spy-x-family",
    title: "SPY x FAMILY",
    japaneseTitle: "スパイファミリー",
    slug: "spy-x-family",
    synopsis:
      "Para manter a frágil paz entre as nações de Westalis e Ostania, o agente secreto Twilight precisa construir uma família de fachada. O que ele não sabe é que sua esposa Yor é a letal assassina Thorn Princess e sua filha Anya é uma telepata capaz de ler mentes.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/140960-Z7xSvkRxHKfj.jpg",
    rating: 9.0,
    ratingCount: 58400,
    episodesCount: getVerifiedEpisodesCount("spy-x-family", 37),
    genres: ["Comédia", "Ação", "Shonen"],
    status: "Completo",
    season: "Temporada de Outono",
    studio: "WIT Studio & CloverWorks",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("spy-x-family", "_VRxEEBa1XU"),
    broadcastDay: "Sábado",
    featured: false,
    trending: false,
    rank: 19,
    malId: 50265,
    anilistId: 140960,
    imdbId: "tt13706018",
    seasons: getVerifiedSeasons("spy-x-family"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("spy-x-family", {
      title: "SPY x FAMILY",
      chaptersCount: 112,
      author: "Tatsuya Endo",
      artist: "Tatsuya Endo",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg",
      status: "Em publicação",
      serialization: "Shōnen Jump+",
      publisher: "Shueisha",
    }),
  },

  // 20. TOWER OF GOD (3 Temporadas - 39 Episódios)
  {
    id: "tower-of-god",
    title: "Tower of God: O Retorno do Príncipe & Batalha da Oficina",
    japaneseTitle: "神之塔 -Tower of God- (신의 탑)",
    slug: "tower-of-god",
    synopsis:
      "O que você deseja? Fortuna? Glória? Autoridade? Vingança? Ou algo que transcenda tudo isso? Qualquer desejo pode ser realizado no topo da Torre. Vinte-e-Quinto Bam renasce como o implacável candidato a Assassino da FUG, Jyu Viole Grace.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx153406-dU2RLKgMUF2U.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/153406-wP0TEqBVxY0V.jpg",
    rating: 8.8,
    ratingCount: 36200,
    episodesCount: getVerifiedEpisodesCount("tower-of-god", 39),
    genres: ["Ação", "Fantasia", "Mistério", "Sobrenatural"],
    status: "Completo",
    season: "3 Temporadas (Andar de Testes, Príncipe & Oficina)",
    studio: "The Answer Studio & Telecom Animation",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("tower-of-god", "RNyClma6awo"),
    broadcastDay: "Domingo",
    featured: false,
    trending: false,
    rank: 20,
    malId: 40221,
    anilistId: 115230,
    imdbId: "tt12076042",
    seasons: getVerifiedSeasons("tower-of-god"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("tower-of-god", {
      title: "Tower of God (Sin-ui Tap)",
      chaptersCount: 645,
      author: "SIU",
      artist: "SIU",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx115230-QHOdSN7yt8ab.jpg",
      status: "Em publicação",
      serialization: "Naver Webtoon",
      publisher: "Naver",
    }),
  },

  // 21. BLACK CLOVER (4 Temporadas - 64 Episódios)
  {
    id: "black-clover",
    title: "Black Clover: A Saga Completa dos Cavaleiros Mágicos",
    japaneseTitle: "ブラッククローバー",
    slug: "black-clover",
    synopsis:
      "Em um mundo onde a magia é tudo, Asta e Yuno são abandonados na mesma igreja no mesmo dia. Enquanto Yuno possui poderes mágicos excepcionais e o Grimório de Trevo de Quatro Folhas, Asta nasce sem nenhuma gota de mana — até despertar o Grimório de Cinco Folhas da Anti-Magia.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-fyh8o7gNbha0.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/97940-1URQdQ4U1a0b.jpg",
    rating: 9.2,
    ratingCount: 84200,
    episodesCount: getVerifiedEpisodesCount("black-clover", 64),
    genres: ["Ação", "Fantasia", "Shonen", "Sobrenatural"],
    status: "Em lançamento",
    season: "4 Temporadas Completas",
    studio: "Pierrot",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("black-clover", "vUjAxk1qYzQ"),
    broadcastDay: "Terça",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 21,
    malId: 34572,
    anilistId: 97940,
    imdbId: "tt7441658",
    seasons: getVerifiedSeasons("black-clover"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("black-clover", {
      title: "Black Clover",
      chaptersCount: 378,
      author: "Yūki Tabata",
      artist: "Yūki Tabata",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-fyh8o7gNbha0.png",
      status: "Em publicação",
      serialization: "Jump GIGA / Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 22. JOJO'S BIZARRE ADVENTURE (5 Temporadas - 80 Episódios)
  {
    id: "jojos-bizarre-adventure",
    title: "JoJo's Bizarre Adventure: Phantom Blood a Stone Ocean",
    japaneseTitle: "ジョジョの奇妙な冒険",
    slug: "jojos-bizarre-adventure",
    synopsis:
      "A épica saga multigeracional da família Joestar contra forças sobrenaturais, vampiros milenares e usuários de Stands — desde a rivalidade mortal entre Jonathan Joestar e Dio Brando até Jotaro Kujo, Josuke, Giorno Giovanna e Jolyne Cujoh.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx102883-S9KzdMJhDswJ.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/102883-8ffuBLnY5vNR.jpg",
    rating: 9.5,
    ratingCount: 96500,
    episodesCount: getVerifiedEpisodesCount("jojos-bizarre-adventure", 80),
    genres: ["Ação", "Sobrenatural", "Mistério", "Shonen", "Seinen"],
    status: "Completo",
    season: "Partes 1 a 6 Completas",
    studio: "David Production",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("jojos-bizarre-adventure", "EeCX8Y0a278"),
    broadcastDay: "Sexta",
    featured: true,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 22,
    malId: 37991,
    anilistId: 102883,
    imdbId: "tt2359704",
    seasons: getVerifiedSeasons("jojos-bizarre-adventure"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("jojos-bizarre-adventure", {
      title: "JoJo's Bizarre Adventure",
      chaptersCount: 950,
      author: "Hirohiko Araki",
      artist: "Hirohiko Araki",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx102883-S9KzdMJhDswJ.png",
      status: "Em publicação",
      serialization: "Weekly Shōnen Jump / Ultra Jump",
      publisher: "Shueisha",
    }),
  },

  // 23. JOJO'S BIZARRE ADVENTURE PART 7: STEEL BALL RUN (1st Stage 48min + 2nd Stage 8 Episódios)
  {
    id: "steel-ball-run",
    title: "STEEL BALL RUN JoJo's Bizarre Adventure (1st & 2nd Stage)",
    japaneseTitle: "ジョジョの奇妙な冒険 スティール・ボール・ラン 1st & 2nd STAGE",
    slug: "steel-ball-run",
    synopsis:
      "Em 1890, nos Estados Unidos, o ex-jóquei paraplégico Johnny Joestar e o misterioso mestre da Rotação Gyro Zeppeli cruzam o continente americano na lendária corrida a cavalo Steel Ball Run de 6.000 km — começando pelo especial de 48 minutos da 1st Stage em San Diego Beach até os 8 episódios da 2nd Stage através do Deserto do Arizona.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx210482-P1VNKbqdJ6Zj.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/210482-pYAD0IbzNbgS.jpg",
    rating: 9.8,
    ratingCount: 112400,
    episodesCount: getVerifiedEpisodesCount("steel-ball-run", 9),
    genres: ["Ação", "Seinen", "Sobrenatural", "Drama", "Mistério"],
    status: "Em lançamento",
    season: "1ª Parte (Especial 48 min) & 2ª Parte (8 Episódios)",
    studio: "David Production",
    year: 2026,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("steel-ball-run", "jXtG_lcR9P4"),
    broadcastDay: "Sexta",
    featured: true,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 23,
    malId: 61469,
    anilistId: 210482,
    imdbId: "tt32100856",
    seasons: getVerifiedSeasons("steel-ball-run"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("steel-ball-run", {
      title: "JoJo's Bizarre Adventure Part 7: Steel Ball Run",
      chaptersCount: 95,
      author: "Hirohiko Araki",
      artist: "Hirohiko Araki",
      cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31706-lRncu9VbcBB7.png",
      status: "Completo",
      serialization: "Ultra Jump",
      publisher: "Shueisha",
    }),
  },

  // 24. DRAGON BALL: DAIMA, SUPER & Z (4 Temporadas - 64 Episódios)
  {
    id: "dragon-ball",
    title: "Dragon Ball: Clássico, Z, Super & Daima",
    japaneseTitle: "ドラゴンボール ダイマ / 超 / Z",
    slug: "dragon-ball",
    synopsis:
      "A jornada lendária de Son Goku desde sua infância em busca das Esferas do Dragão, passando pelas batalhas épicas de Dragon Ball Z contra Freeza, Cell e Majin Boo, o Torneio do Poder com o Instinto Superior em Dragon Ball Super, até a nova aventura no Reino dos Demônios em Dragon Ball Daima.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx170083-GTwRrhTApcLR.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/170083-SYCCWWlq3hqF.jpg",
    rating: 9.6,
    ratingCount: 158000,
    episodesCount: getVerifiedEpisodesCount("dragon-ball", 64),
    genres: ["Ação", "Fantasia", "Shonen", "Ficção Científica"],
    status: "Em lançamento",
    season: "Franquia Completa (Clássico, Z, Super & Daima)",
    studio: "Toei Animation",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("dragon-ball", "ezbYAglQoxI"),
    broadcastDay: "Sexta",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 24,
    malId: 56894,
    anilistId: 170083,
    imdbId: "tt29485149",
    seasons: getVerifiedSeasons("dragon-ball"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("dragon-ball", {
      title: "Dragon Ball & Dragon Ball Super",
      chaptersCount: 623,
      author: "Akira Toriyama",
      artist: "Akira Toriyama & Toyotarou",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx170083-GTwRrhTApcLR.png",
      status: "Em publicação",
      serialization: "Weekly Shōnen Jump / V Jump",
      publisher: "Shueisha",
    }),
  },

  // 25. NARUTO & NARUTO SHIPPUDEN (4 Temporadas - 64 Episódios)
  {
    id: "naruto",
    title: "Naruto Clássico & Naruto Shippuden",
    japaneseTitle: "ナルト 疾風伝",
    slug: "naruto",
    synopsis:
      "Rejeitado pela Vila Oculta da Folha por carregar a Raposa de Nove Caudas (Kurama) selada em seu corpo, o jovem órfão Naruto Uzumaki treina incansavelmente para conquistar o respeito de todos como Hokage, enquanto tenta resgatar seu melhor amigo Sasuke Uchiha da escuridão e enfrentar a Akatsuki.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1735-kGfVm0YqCPcu.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1735.jpg",
    rating: 9.5,
    ratingCount: 164000,
    episodesCount: getVerifiedEpisodesCount("naruto", 64),
    genres: ["Ação", "Fantasia", "Drama", "Shonen"],
    status: "Completo",
    season: "Saga Clássica & Shippuden Completa",
    studio: "Pierrot",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("naruto", "1dy2zPPrKD0"),
    broadcastDay: "Quinta",
    featured: true,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 25,
    malId: 1735,
    anilistId: 1735,
    imdbId: "tt0988824",
    seasons: getVerifiedSeasons("naruto"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("naruto", {
      title: "Naruto",
      chaptersCount: 700,
      author: "Masashi Kishimoto",
      artist: "Masashi Kishimoto",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1735-kGfVm0YqCPcu.png",
      status: "Completo",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 26. BORUTO: NARUTO NEXT GENERATIONS & TWO BLUE VORTEX (3 Temporadas - 48 Episódios)
  {
    id: "boruto",
    title: "Boruto: Naruto Next Generations & Two Blue Vortex",
    japaneseTitle: "BORUTO-ボルト- NARUTO NEXT GENERATIONS",
    slug: "boruto",
    synopsis:
      "Filho do Sétimo Hokage Naruto Uzumaki e discípulo de Sasuke Uchiha, Boruto Uzumaki busca trilhar seu próprio caminho ninja em uma nova era tecnológica, mas acaba marcado pelo Karma do clã celestial Otsutsuki e confrontado pela organização Kara e Kawaki.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97938-BnF6M5yTaNB1.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/97938-cT6wkSRifTEC.jpg",
    rating: 8.8,
    ratingCount: 61400,
    episodesCount: getVerifiedEpisodesCount("boruto", 48),
    genres: ["Ação", "Fantasia", "Shonen", "Sobrenatural"],
    status: "Em lançamento",
    season: "Next Generations & Arco Kawaki/Code",
    studio: "Pierrot",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("boruto", "PULgjzsOybA"),
    broadcastDay: "Domingo",
    featured: false,
    trending: true,
    isRecentTop: true,
    rank: 26,
    malId: 34566,
    anilistId: 97938,
    imdbId: "tt6342474",
    seasons: getVerifiedSeasons("boruto"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("boruto", {
      title: "Boruto: Two Blue Vortex & Next Generations",
      chaptersCount: 98,
      author: "Masashi Kishimoto & Ukyō Kodachi",
      artist: "Mikio Ikemoto",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97938-BnF6M5yTaNB1.jpg",
      status: "Em publicação",
      serialization: "V Jump",
      publisher: "Shueisha",
    }),
  },

  // 27. ONE PIECE (5 Temporadas - 80 Episódios)
  {
    id: "one-piece",
    title: "One Piece: De East Blue a Wano & Egghead",
    japaneseTitle: "ONE PIECE (ワンピース)",
    slug: "one-piece",
    synopsis:
      "Monkey D. Luffy e sua tripulação dos Piratas do Chapéu de Palha navegam pelos mares da Grand Line e do Novo Mundo em busca do lendário tesouro deixado por Gol D. Roger, enfrentando os Quatro Imperadores (Yonkou), a Marinha e os segredos do Século Perdido na Ilha do Futuro Egghead.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg",
    rating: 9.8,
    ratingCount: 215000,
    episodesCount: getVerifiedEpisodesCount("one-piece", 80),
    genres: ["Ação", "Fantasia", "Comédia", "Drama", "Shonen"],
    status: "Em lançamento",
    season: "Arco de Egghead & Sagas Clássicas",
    studio: "Toei Animation",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("one-piece", "MCb13lbVGE0"),
    broadcastDay: "Domingo",
    featured: true,
    trending: true,
    isDeepPhilosophical: true,
    isRecentTop: true,
    rank: 27,
    malId: 21,
    anilistId: 21,
    imdbId: "tt0388629",
    seasons: getVerifiedSeasons("one-piece"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("one-piece", {
      title: "One Piece",
      chaptersCount: 1140,
      author: "Eiichiro Oda",
      artist: "Eiichiro Oda",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg",
      status: "Em publicação",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 28. HUNTER X HUNTER (4 Temporadas - 64 Episódios)
  {
    id: "hunter-x-hunter",
    title: "Hunter x Hunter (2011): Sagas Completas",
    japaneseTitle: "HUNTER×HUNTER (ハンター×ハンター)",
    slug: "hunter-x-hunter",
    synopsis:
      "Gon Freecss descobre que seu pai, Ging, que ele acreditava estar morto, é na verdade um dos Hunters mais lendários do mundo. Ao lado de Killua Zoldyck, Kurapika e Leorio, Gon domina a energia vital do Nen e enfrenta a Trupe Fantasma e as mortíferas Formigas Quimera.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-y5gsT1hoHuHw.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-8WkkTZ6duKpq.jpg",
    rating: 9.7,
    ratingCount: 142000,
    episodesCount: getVerifiedEpisodesCount("hunter-x-hunter", 64),
    genres: ["Ação", "Fantasia", "Psicológico", "Shonen"],
    status: "Completo",
    season: "Sagas do Exame Hunter a Formigas Quimera",
    studio: "Madhouse",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("hunter-x-hunter", "d6kBeJjTGnY"),
    broadcastDay: "Domingo",
    featured: true,
    trending: true,
    isDeepPhilosophical: true,
    rank: 28,
    malId: 11061,
    anilistId: 11061,
    imdbId: "tt2098220",
    seasons: getVerifiedSeasons("hunter-x-hunter"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("hunter-x-hunter", {
      title: "Hunter x Hunter",
      chaptersCount: 410,
      author: "Yoshihiro Togashi",
      artist: "Yoshihiro Togashi",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-y5gsT1hoHuHw.png",
      status: "Em publicação",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 29. MY HERO ACADEMIA / BOKU NO HERO ACADEMIA (4 Temporadas - 62 Episódios)
  {
    id: "my-hero-academia",
    title: "My Hero Academia (Boku no Hero Academia)",
    japaneseTitle: "僕のヒーローアカデミア",
    slug: "my-hero-academia",
    synopsis:
      "Em um mundo onde 80% da população possui superpoderes chamados Individualidades (Quirks), Izuku Midoriya nasce sem nenhum poder, mas herda o lendário One For All do Símbolo da Paz, All Might, ingressando na U.A. High School para enfrentar Tomura Shigaraki e All For One.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163139-JchZhUFlNTWU.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/163139-UWM3qDG5cRa6.jpg",
    rating: 9.1,
    ratingCount: 98300,
    episodesCount: getVerifiedEpisodesCount("my-hero-academia", 62),
    genres: ["Ação", "Shonen", "Fantasia", "Drama"],
    status: "Em lançamento",
    season: "Temporada 7 & Guerra Final",
    studio: "Bones",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("my-hero-academia", "T5HMoxJRhRY"),
    broadcastDay: "Sábado",
    featured: false,
    trending: true,
    isRecentTop: true,
    rank: 29,
    malId: 54789,
    anilistId: 163139,
    imdbId: "tt5626028",
    seasons: getVerifiedSeasons("my-hero-academia"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("my-hero-academia", {
      title: "My Hero Academia",
      chaptersCount: 430,
      author: "Kōhei Horikoshi",
      artist: "Kōhei Horikoshi",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163139-JchZhUFlNTWU.jpg",
      status: "Completo",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 30. DEATH NOTE (2 Temporadas - 37 Episódios)
  {
    id: "death-note",
    title: "Death Note: O Duelo entre Kira e L",
    japaneseTitle: "デスノート (DEATH NOTE)",
    slug: "death-note",
    synopsis:
      "O brilhante estudante Light Yagami encontra o Death Note, um caderno sobrenatural pertencente ao Shinigami Ryuk que mata qualquer pessoa cujo nome seja escrito nele. Decidido a criar um novo mundo como o deus 'Kira', Light trava uma guerra psicológica implacável contra o enigmático detetive L.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535.jpg",
    rating: 9.6,
    ratingCount: 175000,
    episodesCount: getVerifiedEpisodesCount("death-note", 37),
    genres: ["Psicológico", "Mistério", "Sobrenatural", "Suspense", "Drama"],
    status: "Completo",
    season: "Série Completa (37 Episódios)",
    studio: "Madhouse",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("death-note", "NlJZ-YgAt-c"),
    broadcastDay: "Terça",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    rank: 30,
    malId: 1535,
    anilistId: 1535,
    imdbId: "tt0877057",
    seasons: getVerifiedSeasons("death-note"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("death-note", {
      title: "Death Note",
      chaptersCount: 108,
      author: "Tsugumi Ohba",
      artist: "Takeshi Obata",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-kUgkcrfOrkUM.jpg",
      status: "Completo",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 31. FULLMETAL ALCHEMIST: BROTHERHOOD (4 Temporadas - 64 Episódios)
  {
    id: "fullmetal-alchemist-brotherhood",
    title: "Fullmetal Alchemist: Brotherhood",
    japaneseTitle: "鋼の錬金術師 FULLMETAL ALCHEMIST",
    slug: "fullmetal-alchemist-brotherhood",
    synopsis:
      "Após perderem partes de seus corpos em uma tentativa proibida de transmutação humana para reviver sua mãe, os irmãos Edward e Alphonse Elric partem em busca da Pedra Filosofal, descobrindo uma conspiração nacional arquitetada pelos Homúnculos nas sombras de Amestris.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-nSWCgQlmOMtj.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/5114-q0V5URebphSG.jpg",
    rating: 9.8,
    ratingCount: 189000,
    episodesCount: getVerifiedEpisodesCount("fullmetal-alchemist-brotherhood", 64),
    genres: ["Ação", "Fantasia", "Drama", "Filosófico", "Shonen"],
    status: "Completo",
    season: "Série Completa (64 Episódios)",
    studio: "Bones",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("fullmetal-alchemist-brotherhood", "1ac3_YdSSy0"),
    broadcastDay: "Domingo",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    rank: 31,
    malId: 5114,
    anilistId: 5114,
    imdbId: "tt1355642",
    seasons: getVerifiedSeasons("fullmetal-alchemist-brotherhood"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("fullmetal-alchemist-brotherhood", {
      title: "Fullmetal Alchemist",
      chaptersCount: 108,
      author: "Hiromu Arakawa",
      artist: "Hiromu Arakawa",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-nSWCgQlmOMtj.jpg",
      status: "Completo",
      serialization: "Monthly Shōnen Gangan",
      publisher: "Square Enix",
    }),
  },

  // 32. SAKAMOTO DAYS (1 Temporada - 12 Episódios)
  {
    id: "sakamoto-days",
    title: "Sakamoto Days",
    japaneseTitle: "SAKAMOTO DAYS (サカモトデイズ)",
    slug: "sakamoto-days",
    synopsis:
      "Taro Sakamoto era o assassino de aluguel mais temido do submundo e membro lendário da Order — até se apaixonar, casar, ganhar peso e abrir um pacato mercadinho de bairro. Quando uma recompensa bilionária é colocada por sua cabeça, Sakamoto e o telepata Shin precisam proteger sua família sem matar ninguém.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx177709-e5Qx6RlsBgD5.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/177709-yeZ7ciQULJRx.jpg",
    rating: 9.1,
    ratingCount: 44800,
    episodesCount: getVerifiedEpisodesCount("sakamoto-days", 12),
    genres: ["Ação", "Comédia", "Shonen"],
    status: "Em lançamento",
    season: "Temporada de Inverno 2025",
    studio: "TMS Entertainment",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("sakamoto-days", "CdnMoPIgC5s"),
    broadcastDay: "Sábado",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 32,
    malId: 58939,
    anilistId: 177709,
    imdbId: "tt32491848",
    seasons: getVerifiedSeasons("sakamoto-days"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("sakamoto-days", {
      title: "Sakamoto Days",
      chaptersCount: 202,
      author: "Yuto Suzuki",
      artist: "Yuto Suzuki",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx177709-e5Qx6RlsBgD5.png",
      status: "Em publicação",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 33. DR. STONE (4 Temporadas - 59 Episódios)
  {
    id: "dr-stone",
    title: "Dr. STONE: Science Future & New World",
    japaneseTitle: "Dr.STONE SCIENCE FUTURE",
    slug: "dr-stone",
    synopsis:
      "Milhares de anos após um misterioso feixe de luz petrificar toda a humanidade, o gênio científico Senku Ishigami desperta em um Mundo de Pedra e decide reconstruir toda a civilização humana do zero usando o poder da ciência — da Idade da Pedra até a corrida espacial.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx172019-3cfZbrYBmV23.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/172019-qchFwdk8OM4m.jpg",
    rating: 9.2,
    ratingCount: 67200,
    episodesCount: getVerifiedEpisodesCount("dr-stone", 59),
    genres: ["Ficção Científica", "Ação", "Comédia", "Shonen"],
    status: "Em lançamento",
    season: "4 Temporadas (Stone World a Science Future)",
    studio: "TMS Entertainment",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("dr-stone", "pkMgTN4Joi4"),
    broadcastDay: "Quinta",
    featured: false,
    trending: true,
    isRecentTop: true,
    rank: 33,
    malId: 57592,
    anilistId: 172019,
    imdbId: "tt9679542",
    seasons: getVerifiedSeasons("dr-stone"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("dr-stone", {
      title: "Dr. STONE",
      chaptersCount: 232,
      author: "Riichiro Inagaki",
      artist: "Boichi",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx172019-3cfZbrYBmV23.jpg",
      status: "Completo",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 34. MOB PSYCHO 100 (3 Temporadas - 37 Episódios)
  {
    id: "mob-psycho-100",
    title: "Mob Psycho 100: Trilogia Completa",
    japaneseTitle: "モブサイコ100 III",
    slug: "mob-psycho-100",
    synopsis:
      "Shigeo 'Mob' Kageyama é um estudante do ensino fundamental com poderes psíquicos devastadores que tenta viver uma vida comum e controlar suas emoções para evitar atingir 100% de sua capacidade espiritual, trabalhando como assistente do carismático charlatão Arataka Reigen.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140439-bPKmhe1wNxc9.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/140439-r9SRh0q0UgX1.jpg",
    rating: 9.5,
    ratingCount: 82400,
    episodesCount: getVerifiedEpisodesCount("mob-psycho-100", 37),
    genres: ["Ação", "Sobrenatural", "Comédia", "Psicológico"],
    status: "Completo",
    season: "3 Temporadas Completas (I, II & III)",
    studio: "Bones",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("mob-psycho-100", "Ah7lTT-NKMw"),
    broadcastDay: "Quarta",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    rank: 34,
    malId: 50172,
    anilistId: 140439,
    imdbId: "tt5897304",
    seasons: getVerifiedSeasons("mob-psycho-100"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("mob-psycho-100", {
      title: "Mob Psycho 100",
      chaptersCount: 101,
      author: "ONE",
      artist: "ONE",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140439-bPKmhe1wNxc9.jpg",
      status: "Completo",
      serialization: "Ura Sunday / MangaONE",
      publisher: "Shogakukan",
    }),
  },

  // 35. SHANGRI-LA FRONTIER (2 Temporadas - 50 Episódios)
  {
    id: "shangri-la-frontier",
    title: "Shangri-La Frontier: Kusoge Hunter, Kamige ni Idoman to Su",
    japaneseTitle: "シャングリラ・フロンティア〜クソゲーハンター、神ゲーに挑まんとす〜",
    slug: "shangri-la-frontier",
    synopsis:
      "Rakuro Hizutome é um especialista em vencer jogos com defeitos, bugs e desequilíbrios quase impossíveis. Quando ele decide experimentar a obra-prima definitiva de realidade virtual 'Shangri-La Frontier' sob o avatar Sunraku, suas habilidades bizarras e espírito aventureiro o colocam na mira do lendário monstro único Lycagon, a Espreita da Noite.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151970-xtIx3VqEk02X.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151970-Tnnfp0f7NOzj.jpg",
    rating: 9.3,
    ratingCount: 57800,
    episodesCount: getVerifiedEpisodesCount("shangri-la-frontier", 50),
    genres: ["Ação", "Fantasia", "Ficção Científica", "Comédia", "Shonen"],
    status: "Em lançamento",
    season: "Temporada de Outono 2024 / Inverno 2025",
    studio: "C2C",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("shangri-la-frontier", "lW4x1Qe3R1g"),
    broadcastDay: "Domingo",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 35,
    malId: 52347,
    anilistId: 151970,
    imdbId: "tt21217316",
    seasons: getVerifiedSeasons("shangri-la-frontier"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("shangri-la-frontier", {
      title: "Shangri-La Frontier",
      chaptersCount: 195,
      author: "Katarina",
      artist: "Ryosuke Fuji",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151970-xtIx3VqEk02X.jpg",
      status: "Em publicação",
      serialization: "Weekly Shōnen Magazine",
      publisher: "Kodansha",
    }),
  },

  // 36. MASHLE: MAGIC AND MUSCLES (2 Temporadas - 24 Episódios)
  {
    id: "mashle",
    title: "Mashle: Magia e Músculos (Exame de Visionário Divino)",
    japaneseTitle: "マッシュル-MASHLE- 神覚者候補選抜試験編",
    slug: "mashle",
    synopsis:
      "Em um mundo onde a magia determina o status social e aqueles sem magia são executados, Mash Burnedead vive na floresta treinando seus músculos dia e noite. Para viver em paz com seu pai adotivo, ele ingressa na renomada Academia Easton visando se tornar um Visionário Divino usando apenas a força bruta de seus punhos.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151801-XxVf22Le6C8o.png",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151801-zBFaJMIJFWfS.jpg",
    rating: 9.2,
    ratingCount: 63100,
    episodesCount: getVerifiedEpisodesCount("mashle", 24),
    genres: ["Ação", "Comédia", "Fantasia", "Shonen"],
    status: "Completo",
    season: "2 Temporadas Completas",
    studio: "A-1 Pictures",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("mashle", "3CqU9uWv7aE"),
    broadcastDay: "Sábado",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 36,
    malId: 52211,
    anilistId: 151801,
    imdbId: "tt21217318",
    seasons: getVerifiedSeasons("mashle"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("mashle", {
      title: "Mashle: Magic and Muscles",
      chaptersCount: 162,
      author: "Hajime Komoto",
      artist: "Hajime Komoto",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151801-XxVf22Le6C8o.png",
      status: "Completo",
      serialization: "Weekly Shōnen Jump",
      publisher: "Shueisha",
    }),
  },

  // 37. WIND BREAKER (2 Temporadas - 25 Episódios)
  {
    id: "wind-breaker",
    title: "Wind Breaker: Os Protetores de Makochi",
    japaneseTitle: "WIND BREAKER (ウィンドブレイカー)",
    slug: "wind-breaker",
    synopsis:
      "Haruka Sakura é um delinquente solitário com cabelos bicolores que só quer lutar contra os mais fortes para chegar ao topo da infame Escola Secundária Furin. Ao chegar à cidade de Makochi, ele descobre com surpresa que os estudantes de Furin formam o grupo 'Bofurin', dedicados a proteger todos os cidadãos contra gangues e violência urbana.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163270-wboZJp0ybwVK.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/163270-fcjrqp3iKWdb.jpg",
    rating: 9.1,
    ratingCount: 49700,
    episodesCount: getVerifiedEpisodesCount("wind-breaker", 25),
    genres: ["Ação", "Drama", "Shonen"],
    status: "Em lançamento",
    season: "Temporada de Primavera 2024 / 2025",
    studio: "CloverWorks",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("wind-breaker", "h_O0qG3N7j8"),
    broadcastDay: "Quinta",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 37,
    malId: 54900,
    anilistId: 163270,
    imdbId: "tt27357062",
    seasons: getVerifiedSeasons("wind-breaker"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("wind-breaker", {
      title: "WIND BREAKER",
      chaptersCount: 175,
      author: "Satoru Nii",
      artist: "Satoru Nii",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163270-wboZJp0ybwVK.jpg",
      status: "Em publicação",
      serialization: "Magazine Pocket",
      publisher: "Kodansha",
    }),
  },

  // 38. HELL'S PARADISE: JIGOKURAKU (2 Temporadas - 25 Episódios)
  {
    id: "jigokuraku",
    title: "Hell's Paradise: Jigokuraku",
    japaneseTitle: "地獄楽 (Jigokuraku)",
    slug: "jigokuraku",
    synopsis:
      "Gabimaru, o Vazio, o assassino shinobi mais implacável da aldeia de Iwagakure, sobrevive a inúmeras tentativas de execução devido ao seu desejo secreto de reencontrar sua amada esposa. Ele recebe a proposta da carrasca Yamada Asaemon Sagiri: uma anistia imperial caso explore a misteriosa e mortal ilha de Shinsenkyo e traga o lendário Elixir da Imortalidade.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx128893-Gc2t8b8M0mVu.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/128893-pAA7PjY8l7dy.jpg",
    rating: 9.3,
    ratingCount: 65400,
    episodesCount: getVerifiedEpisodesCount("jigokuraku", 25),
    genres: ["Ação", "Sobrenatural", "Mistério", "Seinen", "Shonen"],
    status: "Em lançamento",
    season: "Temporada de Primavera / Verão",
    studio: "MAPPA",
    year: 2025,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("jigokuraku", "0by4G1iWj0A"),
    broadcastDay: "Sábado",
    featured: true,
    trending: true,
    isRecentTop: true,
    rank: 38,
    malId: 46569,
    anilistId: 128893,
    imdbId: "tt13918736",
    seasons: getVerifiedSeasons("jigokuraku"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("jigokuraku", {
      title: "Hell's Paradise: Jigokuraku",
      chaptersCount: 127,
      author: "Yuji Kaku",
      artist: "Yuji Kaku",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx128893-Gc2t8b8M0mVu.jpg",
      status: "Completo",
      serialization: "Shōnen Jump+",
      publisher: "Shueisha",
    }),
  },

  // 39. CLASSROOM OF THE ELITE (3 Temporadas - 38 Episódios)
  {
    id: "classroom-of-the-elite",
    title: "Classroom of the Elite: Trilogia Primeiro Ano",
    japaneseTitle: "ようこそ実力至上主義の教室へ",
    slug: "classroom-of-the-elite",
    synopsis:
      "O Colégio Metropolitano de Tóquio para Desenvolvimento Avançado parece um paraíso onde 100% dos formandos vão para a universidade ou encontram emprego. Kiyotaka Ayanokouji é colocado na Classe 1-D, onde os alunos considerados 'defeituosos' recebem pontos baseados em seu mérito. Enquanto seus colegas conspiram e se enfrentam, Kiyotaka esconde uma genialidade assustadora e fria.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx98659-WNyPLIZDpGGY.jpg",
    banner: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/98659-u46B5RCNl9il.jpg",
    rating: 9.2,
    ratingCount: 71200,
    episodesCount: getVerifiedEpisodesCount("classroom-of-the-elite", 38),
    genres: ["Psicológico", "Drama", "Mistério"],
    status: "Completo",
    season: "3 Temporadas Completas (1º Ano do Ensino Médio)",
    studio: "Lerche",
    year: 2024,
    audio: "Dublado & Legendado PT-BR",
    trailerYoutubeId: getVerifiedTrailer("classroom-of-the-elite", "r7qV6n3_F9Y"),
    broadcastDay: "Segunda",
    featured: false,
    trending: true,
    isDeepPhilosophical: true,
    rank: 39,
    malId: 35507,
    anilistId: 98659,
    imdbId: "tt7150982",
    seasons: getVerifiedSeasons("classroom-of-the-elite"),
    get episodes() {
      return this.seasons.flatMap((s) => s.episodes);
    },
    manga: buildMangaInfo("classroom-of-the-elite", {
      title: "Classroom of the Elite",
      chaptersCount: 95,
      author: "Shogo Kinugasa",
      artist: "Yuyu Ichino",
      cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx98659-WNyPLIZDpGGY.jpg",
      status: "Em publicação",
      serialization: "Monthly Comic Alive",
      publisher: "Media Factory / Kadokawa",
    }),
  },
];

/** LocalStorage Watchlist helper to save user favorites */
const WATCHLIST_STORAGE_KEY = "worscoi_anime_watchlist";
const MANGA_PROGRESS_KEY = "worscoi_manga_progress";

export const getAnimeWatchlist = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const toggleAnimeWatchlist = (animeId: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const list = getAnimeWatchlist();
    const exists = list.includes(animeId);
    const updated = exists ? list.filter((id) => id !== animeId) : [...list, animeId];
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("worscoi_watchlist_updated"));
    return !exists;
  } catch {
    return false;
  }
};

export const isAnimeInWatchlist = (animeId: string): boolean => {
  return getAnimeWatchlist().includes(animeId);
};

export interface MangaReadingProgress {
  animeId: string;
  chapterNumber: number;
  pageIndex: number;
  updatedAt: string;
}

export const saveMangaProgress = (animeId: string, chapterNumber: number, pageIndex: number) => {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MANGA_PROGRESS_KEY);
    const map: Record<string, MangaReadingProgress> = raw ? JSON.parse(raw) : {};
    map[animeId] = {
      animeId,
      chapterNumber,
      pageIndex,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(MANGA_PROGRESS_KEY, JSON.stringify(map));
  } catch {
    // Ignore error
  }
};

export const getMangaProgress = (animeId: string): MangaReadingProgress | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MANGA_PROGRESS_KEY);
    const map: Record<string, MangaReadingProgress> = raw ? JSON.parse(raw) : {};
    return map[animeId] || null;
  } catch {
    return null;
  }
};
