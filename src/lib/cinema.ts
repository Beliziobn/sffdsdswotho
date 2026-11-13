/**
 * Acervo Canônico de Cinema: Filmes e Séries da Worsco
 * Sincronizado diretamente com a base oficial TMDb e IMDb.
 * Dados autênticos de capas oficiais, pôsteres em alta resolução, temporadas completas,
 * episódios com minutagem real e servidores de streaming em alta definição.
 */

import { EXPANDED_CINEMA_CATALOG } from "./cinemaExpandedCatalog";

export interface CinemaEpisode {
  episodeNumber: number;
  title: string;
  duration: string;
  synopsis: string;
  thumbnail: string;
  videoYoutubeId?: string;
}

export interface CinemaSeason {
  seasonNumber: number;
  seasonTitle: string;
  episodes: CinemaEpisode[];
}

export interface CinemaItem {
  id: string;
  imdbId: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  type: "filme" | "serie";
  synopsis: string;
  director: string;
  cast: string[];
  genres: string[];
  year: number;
  duration: string;
  rating: number;
  ratingCount: number;
  ageRating: "L" | "10" | "12" | "14" | "16" | "18";
  quality: "4K HDR" | "1080p FHD";
  audio: "Dublado & Legendado" | "Original com Legendas";
  backdropUrl: string;
  posterUrl: string;
  trailerYoutubeId: string;
  featured?: boolean;
  trending?: boolean;
  awardWinning?: boolean;
  seasons?: CinemaSeason[];
}

export type CinemaLanguage = "pt" | "en";
export type CinemaAudioMode = "dublado_pt" | "legendado_pt" | "original_en";

export interface CinemaLanguageOption {
  id: CinemaLanguage;
  label: string;
  shortLabel: string;
  audioDescription: string;
}

export const CINEMA_LANGUAGE_OPTIONS: CinemaLanguageOption[] = [
  {
    id: "pt",
    label: "Português (Dublado & Legendado)",
    shortLabel: "PT-BR · Português",
    audioDescription: "Filmes e séries Dublados em Português (PT-BR) ou Legendados",
  },
  {
    id: "en",
    label: "Inglês (Áudio Original)",
    shortLabel: "EN · Inglês",
    audioDescription: "Áudio Original em Inglês com legendas opcionais em Inglês",
  },
];

export type CinemaServerId =
  | "vidstuck"
  | "vidsrc"
  | "native"
  | "trailer"
  | "vidlink"
  | "vidcore"
  | "vidfast"
  | "twoembed"
  | "autoembed"
  | "multiembed";

export interface CinemaServerOption {
  id: CinemaServerId;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  isFullContent?: boolean;
  supportsSandbox?: boolean;
}

export const CINEMA_SERVERS: CinemaServerOption[] = [
  {
    id: "native",
    name: "Player Unificado Worsco 1080p FHD (Dublado PT-BR · Legendado · Original)",
    shortName: "Player Oficial Worsco",
    badge: "Dublado PT-BR",
    description:
      "Reprodutor oficial unificado em 1080p FHD com áudio original do filme/série Dublado em Português (PT-BR), Legendado e Original, com bloqueio rigoroso anti-redirecionamento.",
    isFullContent: true,
    supportsSandbox: true,
  },
];

const FALLBACK_SERVER_ORDER: CinemaServerId[] = ["native"];

export function getNextFallbackServer(_current: CinemaServerId): CinemaServerId {
  return "native";
}

/**
 * Retorna a URL de reprodução com isolamento Sandbox ativo (zero popups/novos separadores).
 */
export function getCinemaStreamUrl(
  item: CinemaItem,
  options?: {
    server?: CinemaServerId;
    seasonNumber?: number;
    episodeNumber?: number;
    language?: CinemaLanguage;
    audioMode?: "dublado" | "legendado" | "original";
    dubCode?: string;
    dubType?: string;
  }
): string {
  const server = options?.server || "vidstuck";
  const season = options?.seasonNumber || 1;
  const episode = options?.episodeNumber || 1;
  const lang: CinemaLanguage = options?.language || getCinemaLanguagePreference();
  const audioMode = options?.audioMode || (lang === "pt" ? "dublado" : "original");
  const tmdbId = item.tmdbId;

  const isPt = lang === "pt" || audioMode !== "original";
  const subCode = isPt ? "pt" : "en";

  if (server === "trailer") {
    const epVideo =
      item.type === "serie" && item.seasons
        ? item.seasons
            .find((s) => s.seasonNumber === season)
            ?.episodes.find((e) => e.episodeNumber === episode)?.videoYoutubeId
        : undefined;
    const ytId = epVideo || item.trailerYoutubeId || "Way9Dexny3w";
    return `https://www.youtube.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0&playsinline=1&hl=${subCode}&cc_lang_pref=${subCode}&cc_load_policy=1`;
  }

  const dubLang =
    options?.dubCode ||
    (audioMode === "dublado" ? "ptbr" : audioMode === "legendado" ? "pt" : "en");
  const dubType =
    options?.dubType !== undefined
      ? options.dubType
      : audioMode === "legendado"
      ? "1"
      : "0";

  if (item.type === "filme") {
    return `https://vidstuck.cc/embed/movie/${tmdbId}?autoplay=true&server=orion&dubLang=${dubLang}&dubType=${dubType}&color=f59e0b`;
  } else {
    return `https://vidstuck.cc/embed/tv/${tmdbId}/${season}/${episode}?autoplay=true&server=orion&dubLang=${dubLang}&dubType=${dubType}&color=f59e0b`;
  }
}

const clientResolveCache = new Map<
  string,
  { expiresAt: number; promise: Promise<any>; data?: any }
>();

export function fetchCinemaResolveCached(params: {
  tmdbId: string | number;
  imdbId?: string;
  type: "movie" | "tv";
  season?: string | number;
  episode?: string | number;
  title: string;
  year: string | number;
  audioMode?: string;
  dubCode?: string;
  dubType?: string;
  server?: string;
  forceBust?: boolean;
}): Promise<any> {
  const query = new URLSearchParams({
    tmdbId: String(params.tmdbId),
    imdbId: params.imdbId || "",
    type: params.type,
    season: String(params.season || 1),
    episode: String(params.episode || 1),
    title: params.title,
    year: String(params.year),
    audioMode: params.audioMode || "dublado",
  });
  if (params.dubCode) query.set("dubCode", params.dubCode);
  if (params.dubType !== undefined && params.dubType !== "") {
    query.set("dubType", params.dubType);
  }
  if (params.server) query.set("server", params.server);

  const key = query.toString();
  if (!params.forceBust) {
    const cached = clientResolveCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data ? Promise.resolve(cached.data) : cached.promise;
    }
  } else {
    query.set("t", String(Date.now()));
  }

  const reqPromise = fetch(`/api/cinema/resolve?${query.toString()}`)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      if (Array.isArray(data?.streams) && data.streams.length > 0) {
        clientResolveCache.set(key, {
          expiresAt: Date.now() + 1000 * 60 * 20,
          promise: Promise.resolve(data),
          data,
        });
      } else {
        clientResolveCache.delete(key);
      }
      return data;
    })
    .catch((err) => {
      clientResolveCache.delete(key);
      throw err;
    });

  clientResolveCache.set(key, {
    expiresAt: Date.now() + 1000 * 30,
    promise: reqPromise,
  });

  return reqPromise;
}

export function prefetchCinemaStream(
  item: CinemaItem,
  seasonNumber = 1,
  episodeNumber = 1,
  audioMode: "dublado" | "legendado" | "original" = "dublado"
): void {
  const mediaType = item.type === "serie" ? "tv" : "movie";
  void fetchCinemaResolveCached({
    tmdbId: item.tmdbId,
    imdbId: item.imdbId,
    type: mediaType,
    season: seasonNumber,
    episode: episodeNumber,
    title: item.originalTitle || item.title,
    year: item.year,
    audioMode,
  }).catch(() => {});
}

export const CINEMA_GENRES = [
  "Todos",
  "Ficção Científica",
  "Drama",
  "Ação",
  "Suspense",
  "Crime",
  "Histórico",
  "Animação",
  "Comédia",
  "Aventura",
] as const;

export const CINEMA_CATALOG: CinemaItem[] = [
  {
    "id": "duna-parte-2",
    "imdbId": "tt15239678",
    "tmdbId": 693134,
    "title": "Duna: Parte Dois",
    "originalTitle": "Dune: Part Two",
    "type": "filme",
    "synopsis": "A jornada de Paul Atreides continua. Ele está determinado a buscar vingança contra aqueles que destruíram sua família e seu lar. Com a ajuda de Chani e dos Fremen, ele embarca em uma jornada espiritual, mística e marcial. Se torna Muad'Dib, o líder messiânico dos Fremen, enquanto luta para evitar um futuro sombrio que ele testemunhou em visões. No entanto, suas ações inadvertidamente desencadeiam uma Guerra Santa em seu nome, que se espalha pelo universo conhecido. Enquanto enfrenta escolhas difíceis entre o amor por Chani e o destino de seu povo, Paul precisa usar suas habilidades e conhecimentos para evitar o terrível futuro que previu.",
    "director": "Denis Villeneuve",
    "cast": [
      "Timothée Chalamet",
      "Zendaya",
      "Rebecca Ferguson",
      "Javier Bardem",
      "Josh Brolin"
    ],
    "genres": [
      "Ficção científica",
      "Aventura"
    ],
    "year": 2024,
    "duration": "2h 46m",
    "rating": 8.1,
    "ratingCount": 8934,
    "ageRating": "14",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/VMy4UGsI2u3f4fALGeCqCdsQBb.jpg",
    "trailerYoutubeId": "Way9Dexny3w",
    "featured": true,
    "trending": true,
    "awardWinning": false
  },
  {
    "id": "oppenheimer",
    "imdbId": "tt15398776",
    "tmdbId": 872585,
    "title": "Oppenheimer",
    "originalTitle": "Oppenheimer",
    "type": "filme",
    "synopsis": "A história do físico americano J. Robert Oppenheimer, seu papel no Projeto Manhattan e no desenvolvimento da bomba atômica durante a Segunda Guerra Mundial, e o quanto isso mudaria a história do mundo para sempre.",
    "director": "Christopher Nolan",
    "cast": [
      "Cillian Murphy",
      "Emily Blunt",
      "Matt Damon",
      "Robert Downey Jr.",
      "Florence Pugh"
    ],
    "genres": [
      "Drama",
      "História",
      "Guerra"
    ],
    "year": 2023,
    "duration": "3h 1m",
    "rating": 8,
    "ratingCount": 12870,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/dUPQszWoRSE9FucJTbVp2bwEi9G.jpg",
    "trailerYoutubeId": "F3OxA9Cz17A",
    "featured": true,
    "trending": false,
    "awardWinning": true
  },
  {
    "id": "interestelar",
    "imdbId": "tt0816692",
    "tmdbId": 157336,
    "title": "Interestelar",
    "originalTitle": "Interstellar",
    "type": "filme",
    "synopsis": "As reservas naturais da Terra estão chegando ao fim e um grupo de astronautas recebe a missão de verificar possíveis planetas para receberem a população mundial, possibilitando a continuação da espécie. Cooper é chamado para liderar o grupo e aceita a missão sabendo que pode nunca mais ver os filhos. Ao lado de Brand, Jenkins e Doyle, ele seguirá em busca de um novo lar.",
    "director": "Christopher Nolan",
    "cast": [
      "Matthew McConaughey",
      "Anne Hathaway",
      "Michael Caine",
      "Jessica Chastain",
      "Casey Affleck"
    ],
    "genres": [
      "Aventura",
      "Drama",
      "Ficção científica"
    ],
    "year": 2014,
    "duration": "2h 49m",
    "rating": 8.5,
    "ratingCount": 41832,
    "ageRating": "10",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/8sNiAPPYU14PUepFNeSNGUTiHW.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/tR1XVa5bxgdh2bRw2u0DzrgkO2l.jpg",
    "trailerYoutubeId": "BYUZsmvhGtw",
    "featured": true,
    "trending": false,
    "awardWinning": true
  },
  {
    "id": "blade-runner-2049",
    "imdbId": "tt1856101",
    "tmdbId": 335984,
    "title": "Blade Runner 2049",
    "originalTitle": "Blade Runner 2049",
    "type": "filme",
    "synopsis": "Trinta anos após os acontecimentos do primeiro filme, um novo blade runner, o oficial K da polícia de Los Angeles, desenterra um segredo há muito enterrado que tem o potencial de mergulhar o que resta da sociedade no caos. A descoberta de K o leva a uma busca para encontrar Rick Deckard, um ex-blade runner do LAPD que está desaparecido há 30 anos.",
    "director": "Denis Villeneuve",
    "cast": [
      "Ryan Gosling",
      "Harrison Ford",
      "Ana de Armas",
      "Dave Bautista",
      "Robin Wright"
    ],
    "genres": [
      "Ficção científica",
      "Drama"
    ],
    "year": 2017,
    "duration": "2h 44m",
    "rating": 7.6,
    "ratingCount": 15986,
    "ageRating": "14",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/gNdLJU9TxrpGx4dkZidjys3fyy0.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/49pANIZXRAdHUiWjjBv4vxPeqRC.jpg",
    "trailerYoutubeId": "gCcx85zbxz4",
    "featured": false,
    "trending": false,
    "awardWinning": true
  },
  {
    "id": "matrix",
    "imdbId": "tt0133093",
    "tmdbId": 603,
    "title": "Matrix",
    "originalTitle": "The Matrix",
    "type": "filme",
    "synopsis": "O jovem programador Thomas Anderson é atormentado por estranhos pesadelos em que está sempre conectado por cabos a um imenso sistema de computadores do futuro. À medida que o sonho se repete, ele começa a desconfiar da realidade. Thomas conhece os misteriosos Morpheus e Trinity e descobre que é vítima de um sistema inteligente e artificial chamado Matrix, que manipula a mente das pessoas e cria a ilusão de um mundo real enquanto usa os cérebros e corpos dos indivíduos para produzir energia.",
    "director": "Lana Wachowski",
    "cast": [
      "Keanu Reeves",
      "Laurence Fishburne",
      "Carrie-Anne Moss",
      "Hugo Weaving",
      "Gloria Foster"
    ],
    "genres": [
      "Ação",
      "Ficção científica"
    ],
    "year": 1999,
    "duration": "2h 16m",
    "rating": 8.3,
    "ratingCount": 29202,
    "ageRating": "14",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/lDqMDI3xpbB9UQRyeXfei0MXhqb.jpg",
    "trailerYoutubeId": "m8e-FF8MsqU",
    "featured": false,
    "trending": false,
    "awardWinning": true
  },
  {
    "id": "batman-o-cavaleiro-das-trevas",
    "imdbId": "tt0468569",
    "tmdbId": 155,
    "title": "Batman: O Cavaleiro das Trevas",
    "originalTitle": "The Dark Knight",
    "type": "filme",
    "synopsis": "Após dois anos desde o surgimento do Batman, os criminosos de Gotham City têm muito o que temer. Com a ajuda do tenente James Gordon e do promotor público Harvey Dent, Batman luta contra o crime organizado. Acuados com o combate, os chefes do crime aceitam a proposta feita pelo Coringa e o contratam para combater o Homem-Morcego.",
    "director": "Christopher Nolan",
    "cast": [
      "Christian Bale",
      "Heath Ledger",
      "Aaron Eckhart",
      "Michael Caine",
      "Maggie Gyllenhaal"
    ],
    "genres": [
      "Ação",
      "Thriller",
      "Crime"
    ],
    "year": 2008,
    "duration": "2h 32m",
    "rating": 8.5,
    "ratingCount": 37294,
    "ageRating": "14",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/cfT29Im5VDvjE0RpyKOSdCKZal7.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/dutnVGV9ljCZh84bkTE1TVZ4s4Y.jpg",
    "trailerYoutubeId": "EXeTwQWrcwY",
    "featured": true,
    "trending": false,
    "awardWinning": true
  },
  {
    "id": "a-viagem-de-chihiro",
    "imdbId": "tt0245429",
    "tmdbId": 129,
    "title": "A Viagem de Chihiro",
    "originalTitle": "千と千尋の神隠し",
    "type": "filme",
    "synopsis": "Chihiro e seus pais estão se mudando para uma cidade diferente. A caminho da nova casa, o pai decide pegar um atalho. Eles se deparam com uma mesa repleta de comida, embora ninguém esteja por perto. Chihiro sente o perigo, mas seus pais começam a comer. Quando anoitece, eles se transformam em porcos. Agora, apenas Chihiro pode salvá-los.",
    "director": "Hayao Miyazaki",
    "cast": [
      "Rumi Hiiragi",
      "Miyu Irino",
      "Mari Natsuki",
      "Takashi Naitô",
      "Yasuko Sawaguchi"
    ],
    "genres": [
      "Animação",
      "Família",
      "Fantasia"
    ],
    "year": 2001,
    "duration": "2h 5m",
    "rating": 8.5,
    "ratingCount": 19196,
    "ageRating": "L",
    "quality": "1080p FHD",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/m4TUa2ciEWSlk37rOsjiSIvZDXE.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/hhoKhsyJ3hFaxEm5pMdZRiTu2lJ.jpg",
    "trailerYoutubeId": "ByXuk9QqQkk",
    "featured": false,
    "trending": false,
    "awardWinning": true
  },
  {
    "id": "parasita",
    "imdbId": "tt6751668",
    "tmdbId": 496243,
    "title": "Parasita",
    "originalTitle": "기생충",
    "type": "filme",
    "synopsis": "Toda a família de Ki-taek está desempregada, vivendo num porão sujo e apertado. Uma obra do acaso faz com que o filho adolescente da família comece a dar aulas de inglês à garota de uma família rica. Fascinados com a vida luxuosa destas pessoas, pai, mãe, filho e filha bolam um plano para se infiltrarem também na família glamorosa, um a um. No entanto, os segredos e mentiras necessários à ascensão social custarão caro a todos.",
    "director": "Bong Joon-ho",
    "cast": [
      "Song Kang-ho",
      "Lee Sun-kyun",
      "Cho Yeo-jeong",
      "Woo-sik Choi",
      "Park So-dam"
    ],
    "genres": [
      "Comédia",
      "Thriller",
      "Drama"
    ],
    "year": 2019,
    "duration": "2h 12m",
    "rating": 8.5,
    "ratingCount": 21667,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/bNGW8zYA91VqTZfV3jnKHPEKKvB.jpg",
    "trailerYoutubeId": "5xH0hhMB8GE",
    "featured": false,
    "trending": false,
    "awardWinning": true
  },
  {
    "id": "gladiador",
    "imdbId": "tt0172495",
    "tmdbId": 98,
    "title": "Gladiador",
    "originalTitle": "Gladiator",
    "type": "filme",
    "synopsis": "Nos dias finais do reinado de Marcus Aurelius, o imperador desperta a ira de seu filho Commodus ao tornar pública sua predileção em deixar o trono para Maximus, o comandante do exército romano. Sedento pelo poder, Commodus mata seu pai, assume a coroa e ordena a morte de Maximus, que consegue fugir antes de ser pego e passa a se esconder sob a identidade de um escravo e gladiador do Império Romano.",
    "director": "Ridley Scott",
    "cast": [
      "Russell Crowe",
      "Joaquin Phoenix",
      "Connie Nielsen",
      "Oliver Reed",
      "Richard Harris"
    ],
    "genres": [
      "Ação",
      "Drama",
      "Aventura"
    ],
    "year": 2000,
    "duration": "2h 35m",
    "rating": 8.2,
    "ratingCount": 21837,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/Ar7QuJ7sJEiC0oP3I8fKBKIQD9u.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/4DUClyGA6OqjXv6yC0Imf6THGfp.jpg",
    "trailerYoutubeId": "owK1qxDselE",
    "featured": false,
    "trending": false,
    "awardWinning": true
  },
  {
    "id": "shogun-a-saga-do-japao",
    "imdbId": "tt2788316",
    "tmdbId": 126308,
    "title": "Xógum: A Gloriosa Saga do Japão",
    "originalTitle": "Shōgun",
    "type": "serie",
    "synopsis": "Ambientada no Japão de 1600, o Senhor Yoshii Toranaga está lutando pela sua vida à medida que seus inimigos no Conselho dos Regentes se unem contra ele, quando um navio europeu misterioso é encontrado encalhado em um vilarejo de pescadores próximo.",
    "director": "Showrunner",
    "cast": [
      "Hiroyuki Sanada",
      "Cosmo Jarvis",
      "Anna Sawai",
      "浅野忠信",
      "Takehiro Hira"
    ],
    "genres": [
      "Drama",
      "War & Politics"
    ],
    "year": 2024,
    "duration": "1 Temporada",
    "rating": 8.4,
    "ratingCount": 1976,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/bwSmgmd90hCWwqOKQYTEraeOZhJ.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/gaOb9hyCDUcbZiTYcHy7mIFmNo.jpg",
    "trailerYoutubeId": "yMbwn_7UeWk",
    "featured": true,
    "trending": true,
    "awardWinning": true,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Temporada 1",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Anjin",
            "duration": "1h 11m",
            "synopsis": "Os destinos convergem no Japão depois que um navio estrangeiro chega à costa de um pobre vilarejo de pescadores. Enquanto isso, em Osaka, Senhor Toranaga é derrotado por seus inimigos.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/8uib4EWHrAnhUg08pFLAnoo50rf.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Servos de Dois Senhores",
            "duration": "1h",
            "synopsis": "A chegada de Blackthorne a Osaka desperta um vespeiro de rivalidades. Mariko fica entre sua causa e sua fé quando precisa traduzir para o estrangeiro sob custódia do Senhor Toranaga.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/gUglbYu9EjhpVoxzBWHsXVQYpQX.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Amanhã é Amanhã",
            "duration": "54m",
            "synopsis": "Depois que Blackthorne sobrevive a uma tentativa de assassinato, Toranaga percebe que deve tirar seus aliados de Osaka ou correr o risco de uma derrota certa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/uXMdeoIltO85372VLX85abAC109.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "A cerca óctupla",
            "duration": "58m",
            "synopsis": "Blackthorne e Mariko testam sua nova aliança treinando o regimento de armas de Toranaga para a guerra. Yabushige deve lidar com suas promessas feitas a Ishido quando um velho amigo chega ao vilarejo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/kF8DfadGNPJi3fMZEZgiFRaoRH9.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Domado pelo Punho",
            "duration": "58m",
            "synopsis": "Blackthorne e Mariko se esforçam para manter um segredo que pode levá-los à morte. Yabushige procura o espião que contou suas intenções ao Senhor Toranaga.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5N5isVZvgdYeGsASiUgQJzHW6Ll.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Damas do Mundo do Salgueiro",
            "duration": "58m",
            "synopsis": "Senhora Ochiba retorna a Osaka para acelerar a campanha dos regentes contra Toranaga. Em Ajiro, Toranaga coloca à prova a lealdade de Mariko à sua causa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/15qoHmtC3zKQtZulccXs2GAMnKq.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "O Tempo de Um Incenso",
            "duration": "56m",
            "synopsis": "Superado por novas alianças em Osaka, Toranaga é forçado a firmar um novo acordo com um membro de sua família que não via há muito tempo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/s5yGuWq058n3urFKDIwjyNOzgCD.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "A Profundeza da Vida",
            "duration": "59m",
            "synopsis": "O clã de Toranaga vai para Edo e aguarda seu destino. Blackthorne deve decidir por quem lutará: pelo senhor que lhe deu as costas ou pela ambição que o trouxe ao Japão.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/jX99BvnOAF2bNjQvNHtMmCxmUOa.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Céu Carmesim",
            "duration": "1h 2m",
            "synopsis": "Mariko chega em Osaka para o combate de sua vida. Blackthorne e Yabushige se juntam para salvar suas cabeças à medida que suas opções diminuem.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/tAoNG2uBLRYJZKJOq9k9Xvb0voT.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "Um Sonho Dentro de Um Sonho",
            "duration": "1h 3m",
            "synopsis": "Na esteira de uma morte trágica, Blackthorne enfim considera a verdadeira natureza do plano de Toranaga.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/dIXtG4MafmmjzNhU7ANJZByGmvr.jpg"
          }
        ]
      }
    ]
  },
  {
    "id": "ruptura-severance",
    "imdbId": "tt11280740",
    "tmdbId": 95396,
    "title": "Ruptura",
    "originalTitle": "Severance",
    "type": "serie",
    "synopsis": "Mark lidera uma equipe de funcionários de escritório cujas memórias foram divididas cirurgicamente entre a vida no trabalho e a vida pessoal. Quando um colega de trabalho misterioso aparece fora do escritório, ele começa uma jornada para descobrir a verdade sobre seu trabalho.",
    "director": "Showrunner",
    "cast": [
      "Adam Scott",
      "Britt Lower",
      "Tramell Tillman",
      "Zach Cherry",
      "Patricia Arquette"
    ],
    "genres": [
      "Drama",
      "Mistério",
      "Sci-Fi & Fantasy"
    ],
    "year": 2022,
    "duration": "3 Temporadas",
    "rating": 8.4,
    "ratingCount": 3107,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/ixgFmf1X59PUZam2qbAfskx2gQr.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/3DjOAUBR8Hra4R9kK9U8jDaoqyC.jpg",
    "trailerYoutubeId": "xEQP4VVuyrY",
    "featured": true,
    "trending": true,
    "awardWinning": true,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Temporada 1",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Boas notícias sobre o inferno",
            "duration": "59m",
            "synopsis": "Mark é promovido e vai liderar uma equipe de empregados cujas memórias foram cirurgicamente divididas entre o trabalho e a vida pessoal.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/sP3GZe9j7BY3CAyZGFuZxxnGpN1.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Meia volta",
            "duration": "57m",
            "synopsis": "A equipe treina a nova contratada, Helly, no refinamento de macrodados. Mark tira um dia de folga para se encontrar com um ex-colega de trabalho misterioso.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/wIQP0P2tyE7VRIN3xR8Efq7UgKt.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Na perpetuidade",
            "duration": "1h",
            "synopsis": "Mark leva a equipe em um passeio pela empresa, mas Helly continua a se rebelar.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/yezUFOqLt0U3haSYc5gIBzfsPvo.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "O você que você é",
            "duration": "50m",
            "synopsis": "Irving faz uma descoberta intrigante no trabalho. Helly tenta de todas as formas se encontrar com sua Externa. Mark lida com a perda de sua esposa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/dzQJeDznS0I4spAqTImiLH9p252.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "A cruel barbárie da Óptica e Design",
            "duration": "47m",
            "synopsis": "Irving e Dylan confrontam Burt. A equipe se aventura pelos corredores.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/oy4BZotFbNX5YoPkWuWF3kcdMVw.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Esconde-esconde",
            "duration": "44m",
            "synopsis": "A equipe irrita Cobel ao formar uma aliança.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3fQp0pUtgDkqqyEbXY8KKCZPMU7.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Jazz desafiador",
            "duration": "53m",
            "synopsis": "Mark e a equipe encontram novas medidas de segurança da Cobel.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/gHoKlbC2esqq3SXm0ZCcl3bzpFZ.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "O que tem pra jantar?",
            "duration": "50m",
            "synopsis": "A equipe prepara um plano. Mark vai à festa de Devon e Ricken.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/8Gv9ELume0jo7gz7R2h4tPmVLsD.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "O nós que nós somos",
            "duration": "44m",
            "synopsis": "A equipe descobre coisas perturbadoras.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/dzx8D2B0ELncXuCNwtPCags43Q.jpg"
          }
        ]
      },
      {
        "seasonNumber": 2,
        "seasonTitle": "Temporada 2",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Olá, senhora Cobel",
            "duration": "54m",
            "synopsis": "Mark retorna ao trabalho sob circunstâncias diferentes. Segredos do mundo externo vêm à tona.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/a97vNY8Knu45FLQib0uQZ2VReLy.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Adeus, senhora Selvig",
            "duration": "49m",
            "synopsis": "Mark contempla o significado de uma mensagem.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/wjlSkqMoLngSO6fv2Ajt2CIeCSi.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Quem está viva?",
            "duration": "57m",
            "synopsis": "Mark, Helly, Irving e Dylan procuram respostas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/j4AUAq1XJOBmfXsLphZzsCz6pZs.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Vale da aflição",
            "duration": "54m",
            "synopsis": "A equipe participa de uma atividade em grupo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/mioOOhTaShLd1MPKsmfirbe9AwI.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Cavalo de Troia",
            "duration": "50m",
            "synopsis": "Tensões surgem depois que a equipe sofre uma perda.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/7Gw2DWAbhsBREKFbM2S0h5sD0tL.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Átila",
            "duration": "52m",
            "synopsis": "Laços são testados. Mark continua fazendo descobertas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/l9CC3onLMDBDKxs6Ie0yIWI8VmC.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Chikhai Bardo",
            "duration": "53m",
            "synopsis": "Um antigo romance se cruza com uma ameaça mortal no presente.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/dmzBzYcEtjOYJO46p7kyRmYrHZu.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Doce vitríolo",
            "duration": "41m",
            "synopsis": "Descobertas são feitas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/piWjCKARsSkmr9kMKHZ5ynengj3.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Depois do expediente",
            "duration": "48m",
            "synopsis": "Mark e Devon se unem a uma aliada. Helly investiga mais a fundo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/2RJaWjY4dD5s7jpdo2aGeSLmtI3.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "Cold Harbor",
            "duration": "1h 20m",
            "synopsis": "Mark forma uma aliança instável e arrisca tudo ou nada, enquanto a equipe faz uma última jogada perigosa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/gXUvGwpZxrpqMRouxM7yI28lgNa.jpg"
          }
        ]
      },
      {
        "seasonNumber": 3,
        "seasonTitle": "Temporada 3",
        "episodes": []
      }
    ]
  },
  {
    "id": "arcane",
    "imdbId": "tt11126994",
    "tmdbId": 94605,
    "title": "Arcane",
    "originalTitle": "Arcane",
    "type": "serie",
    "synopsis": "Em meio ao conflito entre as cidades-gêmeas de Piltover e Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas e convicções incompatíveis.",
    "director": "Showrunner",
    "cast": [
      "Hailee Steinfeld",
      "Ella Purnell"
    ],
    "genres": [
      "Animação",
      "Action & Adventure",
      "Sci-Fi & Fantasy"
    ],
    "year": 2021,
    "duration": "2 Temporadas",
    "rating": 8.7,
    "ratingCount": 6309,
    "ageRating": "14",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/m3Tzf6k537PnhOEwaSRNCSxedLS.jpg",
    "trailerYoutubeId": "fXmAurh012s",
    "featured": true,
    "trending": true,
    "awardWinning": true,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Temporada 1",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Entrando na brincadeira",
            "duration": "44m",
            "synopsis": "Após um roubo na luxuosa cidade de Piltover, as irmãs órfãs Vi e Powder se metem em confusão nas ruas subterrâneas de Zaun.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/g7dMkFJvJECDYoL0TRzGQCfF3xD.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Alguns mistérios não devem ser desvendados",
            "duration": "41m",
            "synopsis": "Contrariando os conselhos de seu mentor, o inventor Jayce tenta aliar magia e ciência. O criminoso Silco testa uma substância poderosa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1uubdoW7nPtpYS6T59COLEKDB7A.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "A violência é essencial para a mudança",
            "duration": "45m",
            "synopsis": "Um confronto épico entre antigos rivais tem um desfecho fatídico para Zaun. Jayce e Viktor arriscam tudo em nome da pesquisa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/zCc7AEH53aH8r61F5f9DkIQGeZC.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Feliz Dia do Progresso!",
            "duration": "41m",
            "synopsis": "Com Piltover prosperando, Jayce e Viktor avaliam o próximo passo. Uma conhecida ressurge de Zaun para provocar o caos.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/b0EGdWDOFxbhaGwlJ11vO2h0az6.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Todos querem ser meus inimigos",
            "duration": "41m",
            "synopsis": "Caitlyn, a defensora rebelde, vai à Subferia para encontrar Silco. Tentando acabar com a corrupção em Piltover, Jayce se torna um alvo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/72Ti7nTKEAPgx4VSggb1ksl31rm.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Quando as paredes desabam",
            "duration": "43m",
            "synopsis": "Um jovem enfraquece o próprio mentor no conselho. Perseguida pelas autoridades, Jinx deve encarar o passado.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/sPpQYLgoSZ8UXai20CSEABG9rFz.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "O garoto salvador",
            "duration": "41m",
            "synopsis": "Caitlyn e Vi encontram um aliado nas ruas de Zaun e partem para a briga com uma inimiga em comum. Viktor toma uma decisão extrema.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ieYvkXKqOuIYcBps7COg8w6rJyN.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Água e óleo",
            "duration": "41m",
            "synopsis": "Mel, a herdeira renegada, e sua mãe trocam técnicas de combate. Caitlyn e Vi formam uma aliança improvável. Jinx passa por uma mudança radical.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/vYIBscxveNMkxFNTcPZ6YoF6fdU.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "O monstro que você criou",
            "duration": "42m",
            "synopsis": "Com a guerra cada vez mais próxima, os líderes de Piltover e Zaun chegam a um ultimato. Mas um impasse fatídico muda as duas cidades para sempre.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3mSWRynTvvE2IYJ6sI47m8V77Jq.jpg"
          }
        ]
      },
      {
        "seasonNumber": 2,
        "seasonTitle": "Temporada 2",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "O peso da coroa",
            "duration": "41m",
            "synopsis": "Vi e Caitlyn não sabem bem como reagir a uma terrível tragédia que aumenta as tensões entre as cidades gêmeas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/AKzTyLJkQEuftVNIuh0gcJCbDl.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Ver tudo queimar",
            "duration": "40m",
            "synopsis": "Piltover está pronta para a guerra, e a Subferia avalia suas opções. Jinx se mantém discreta e planeja sua próxima jogada. Uma conversa decisiva acontece.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/z2MSNefctJYAYGdPJQUcxRcZWTh.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Finalmente acertou o nome",
            "duration": "41m",
            "synopsis": "Caitlyn intensifica sua busca por Jinx. Ambessa aceita um encontro decisivo. Mudanças em Zaun levam a uma descoberta chocante.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/yXD0EtrlnupXne4R9XHFPkGMxJr.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Pinte a cidade de azul",
            "duration": "40m",
            "synopsis": "Com rumores do retorno de Jinx, Ambessa busca seu alvo com ainda mais entusiasmo. Disfarçadas, Jinx e Sevika entram no covil do inimigo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ktXtr0O2WF10Z2r89Xjds4owCXX.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Bolhas na mão e pés no chão",
            "duration": "43m",
            "synopsis": "Vi acorda com uma surpresa. Um reencontro perturbador não é o que parece. Caitlyn descobre a origem de Cintila.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3mhMhwHlZQQiB2otufCLZteRPMZ.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "A mensagem oculta no padrão",
            "duration": "40m",
            "synopsis": "A cura vem de um rosto familiar em um lugar desconhecido. Uma traição chocante ameaça mudar inúmeras vidas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/A6A6HWu0TjMRcNW31glNuZvVfxp.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Fingir que é a primeira vez",
            "duration": "42m",
            "synopsis": "Um momento de escuridão, um momento de luz. E uma visão do que poderia ter acontecido.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/sgKSyfB7uor4hSzSsWMEUnMC5SA.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Matar é um ciclo",
            "duration": "41m",
            "synopsis": "A chegada de uma tempestade gera uma série de transformações. Mas uma faísca de rebelião ainda queima.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/vqoFpOXDGEEsgkD10QhopOQYoN3.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "A terra sob suas unhas",
            "duration": "51m",
            "synopsis": "Magia. Ciência. Poder. Vingança. Destinos se chocam em um capítulo final épico, dando início a uma guerra total.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/7wYoQZAdbB6e3CFDDYvxQY1sM7.jpg"
          }
        ]
      }
    ]
  },
  {
    "id": "o-urso-the-bear",
    "imdbId": "tt14452776",
    "tmdbId": 136315,
    "title": "O Urso",
    "originalTitle": "The Bear",
    "type": "serie",
    "synopsis": "Carmy, um jovem chefe requintado, volta para Chicago para administrar a lanchonete de sua família. Enquanto ele luta para transformar a loja e a si mesmo, ele trabalha ao lado de uma equipe medíocre que acaba se transformando na sua família.",
    "director": "Showrunner",
    "cast": [
      "Jeremy Allen White",
      "Ebon Moss-Bachrach",
      "Ayo Edebiri",
      "Lionel Boyce",
      "Abby Elliott"
    ],
    "genres": [
      "Drama",
      "Comédia"
    ],
    "year": 2022,
    "duration": "5 Temporadas",
    "rating": 8.2,
    "ratingCount": 2034,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/aJtG4txtmiRHwAAqENQHZvBs6kY.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/tAJYUFaWot3jn5vtDUoxNNIw9aF.jpg",
    "trailerYoutubeId": "y-cRqrhKG1M",
    "featured": false,
    "trending": false,
    "awardWinning": true,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Temporada 1",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Sistema",
            "duration": "28m",
            "synopsis": "Carmy tenta treinar os funcionários da The Original Beef of Chicagoland novamente.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/dLZ1TQH5fQsWZFw1E6ku7C7nyJR.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Rachaduras",
            "duration": "32m",
            "synopsis": "Uma inspeção surpresa da vigilância sanitária revela rachaduras na fundação do restaurante.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3Z0ML8dU4BMuwZIv6aSUsckBGJr.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Brigada",
            "duration": "30m",
            "synopsis": "Carmy vai a uma reunião do Al-Anon. Sydney luta para ganhar o respeito da equipe.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/fSopyZWB9cfVkN5ZElm4HyNboU9.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Cães",
            "duration": "31m",
            "synopsis": "Carmy e Richie servem uma festa de aniversário infantil.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/i9UekfTojvrbEgtfNNRG7I9SJZZ.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Sheridan",
            "duration": "26m",
            "synopsis": "As coisas dão errado na cozinha. Sydney encontra soluções.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5WL2XOyj0qApQtKPbMCGJHfk0Xq.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Ceres",
            "duration": "31m",
            "synopsis": "Richie percebe que o bairro está mudando. Sugar e Carmy limpam o escritório.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/zwjxMrViyKE1BztLFwWm5YDgbCK.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Análise",
            "duration": "21m",
            "synopsis": "É um dia ruim na cozinha. As tensões aumentam.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/74UV7WHDPoHW20GfF2fgoVZvbJn.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Braciole",
            "duration": "48m",
            "synopsis": "As coisas saem do controle. Carmy se depara com uma decisão.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/yU4KuhaRqwTRqEl2GrQULGPBJCN.jpg"
          }
        ]
      },
      {
        "seasonNumber": 2,
        "seasonTitle": "Temporada 2",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Filé",
            "duration": "30m",
            "synopsis": "Diante da realidade de abrir um novo restaurante, a equipe tem que traçar um plano.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/bV51sdguQRlPyXGnvYXrQ6vqfeL.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Massa",
            "duration": "31m",
            "synopsis": "A equipe se divide para trabalhar em sua nova visão.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/qolqC6exsNzIWEXKxdtzJUP6fTa.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Sundae",
            "duration": "27m",
            "synopsis": "Sydney procura inspiração culinária em Chicago.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/nX3Ss4VHQzI9VkjgbcrCMpu9Q1.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Melão",
            "duration": "30m",
            "synopsis": "Marcus se desafia.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/iLEWUEG5nOZQeNeUY6dKPjuxdOn.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Pop",
            "duration": "34m",
            "synopsis": "A reforma perde o foco.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/gohsyAFvncNUy04R4KAH51BVxHm.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Peixes",
            "duration": "1h 7m",
            "synopsis": "Festa dos Sete Peixes.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/50p0dmUPIW1apDiirprhS0YvNch.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Garfos",
            "duration": "36m",
            "synopsis": "Richie faz um estágio em gastronomia.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/6RGWaBn8dMmPDGToFoVBzsLoE3C.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Bolonhesa",
            "duration": "33m",
            "synopsis": "A equipe aguarda um teste crítico de combate a incêndio.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/nrvMFbf0IOkFP553zVv0eXAlc6d.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Omelete",
            "duration": "40m",
            "synopsis": "Os preparativos finais são feitos para a abertura do “O Urso”.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1YfjQ6wSrVtstkEfRlebfr9ioYr.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "O Urso",
            "duration": "41m",
            "synopsis": "Noite de amigos e família no “O Urso”.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/zIx4VN6SyupkpEVXA5dQsGsysNa.jpg"
          }
        ]
      },
      {
        "seasonNumber": 3,
        "seasonTitle": "Temporada 3",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Amanhã",
            "duration": "37m",
            "synopsis": "O dia seguinte e os dias que levaram a ele.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ihAiadFBWBY4sewnHrgOQCJ2shk.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Próximo",
            "duration": "28m",
            "synopsis": "Carmy define um novo padrão de qualidade.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/hlug9DOeWxLxgDRBUwbxTxP7OKB.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Portas",
            "duration": "30m",
            "synopsis": "A equipe se esforça ao máximo no primeiro mês de serviço.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/oRC2kS3mq5bkkbeM4n7FPEYjbfg.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Violet",
            "duration": "34m",
            "synopsis": "Sydney acha um novo apartamento. Marcus encontra inspiração.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/vA3d0gv1oDV8RccCLOGpx9O6WVw.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Crianças",
            "duration": "35m",
            "synopsis": "O Computador define as chances do restaurante.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/tOjHP16v4FrhZFQiu4x7bYCyzvG.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Guardanapos",
            "duration": "34m",
            "synopsis": "Tina procura uma nova oportunidade.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/qV5psqLKdjfjLLUsmjdNEiXy66U.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Legado",
            "duration": "29m",
            "synopsis": "As toalhas de papel do restaurante acabam. Sydney tem uma oportunidade.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/oQ39TOKpDP9r2yjeCe5gvGfHHNJ.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Lascas de Gelo",
            "duration": "40m",
            "synopsis": "Sugar encontra apoio em um lugar inesperado.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1VBZwYeSNeIvB1XL2NAG22MTr2m.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Desculpas",
            "duration": "44m",
            "synopsis": "Carmy pensa em se desculpar.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/tgNl79QlylvHBLrI6ochOS6T0pq.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "Para Sempre",
            "duration": "44m",
            "synopsis": "Mais um funeral.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/fWdF68jK1AzIol7yyYrznOfD7F8.jpg"
          }
        ]
      },
      {
        "seasonNumber": 4,
        "seasonTitle": "Temporada 4",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Rotina",
            "duration": "32m",
            "synopsis": "Hoje está igual a ontem.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/qjQGe5PcatlIULgBGMOhjrZK8gA.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Soubise",
            "duration": "32m",
            "synopsis": "As engrenagens começam a girar.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/xKav4hoCJnZ7iVpQdTOKylI3uLk.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Vieiras",
            "duration": "38m",
            "synopsis": "Oportunidade.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/fpAheff7OTI1Ezfn7BF8pNgav5O.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Balas de Goma",
            "duration": "32m",
            "synopsis": "Decisões.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/12Uv8zb093yoQP92pEmooNzJFwM.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Replicantes",
            "duration": "34m",
            "synopsis": "A equipe se recompõe.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/nKwVtzPm1IKel3PXJsZFGp4ppvH.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Sophie",
            "duration": "30m",
            "synopsis": "Sophie está aqui.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/paSCuHgcpjuscZTbIxQyxeC3E2z.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Ursos",
            "duration": "1h 10m",
            "synopsis": "O casamento.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/j7eQmi2eFLbBRFT0KoWZeOfUrG7.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Verde",
            "duration": "37m",
            "synopsis": "Todos seguem em frente.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/fZzxujnUh6xu5NDxSW1nVIHGw4m.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Tonnato",
            "duration": "39m",
            "synopsis": "Carmy pega uma carona.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/gnRoRP5WiRJig2OkckeIRXhwLN3.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "Adeus",
            "duration": "34m",
            "synopsis": "O tempo não espera por ninguém.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/15SHizNHlCOjnOmNYNVdxPhZDUQ.jpg"
          }
        ]
      },
      {
        "seasonNumber": 5,
        "seasonTitle": "Temporada 5",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Refrigerante",
            "duration": "22m",
            "synopsis": "Uma tempestade chega.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/kBb0ki9vZBeS2avkLa1gVsYQgcd.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Cordeiro",
            "duration": "26m",
            "synopsis": "A equipe se prepara para o dia.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/g6pOB6c8olu9xc6UxKIStlSZjiw.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Mentinhas",
            "duration": "24m",
            "synopsis": "Um novo rumo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3XINZP9HTJYSzOlSpzPDFaSXFIp.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Costelas",
            "duration": "39m",
            "synopsis": "Refeição em família.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ctgMhatSZTPSGlHXm3vfr3itdJ0.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Framboesas",
            "duration": "29m",
            "synopsis": "Um engarrafamento.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/Apd7rfZpRBHqdp6OZpdkSEDdbnU.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Focaccia",
            "duration": "29m",
            "synopsis": "Plano de mesas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/n1K3hZThLDFXGVH8ZA6kk04VoDX.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Caramelo",
            "duration": "53m",
            "synopsis": "Serviço pesado.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5HTwTXrZBJCzlpGjEG2wvaP42LR.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "O Sanduíche Original de Chicagoland",
            "duration": "1h 2m",
            "synopsis": "Depois do serviço.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/sOcD9c7I4vBckT5jaqCvU8ySDW2.jpg"
          }
        ]
      }
    ]
  },
  {
    "id": "chernobyl",
    "imdbId": "tt7366338",
    "tmdbId": 87108,
    "title": "Chernobyl",
    "originalTitle": "Chernobyl",
    "type": "serie",
    "synopsis": "Aqui é contada a história da explosão que aconteceu na Usina Nuclear de Chernobyl. Em 1986, na Ucrânia, o acidente dizimou dezenas de pessoas e acabou por se tornar o maior desastre nuclear da história. Enquanto o mundo lamentava o ocorrido, o cientista Valery Legasov (Jared Harris), a física Ulana Khomyuk (Emily Watson) e o vice-presidente do Conselho de Ministros Boris Shcherbina (Stellan Skarsgård) tentam descobrir as causas do acidente.",
    "director": "Showrunner",
    "cast": [
      "Jared Harris",
      "Stellan Skarsgård",
      "Emily Watson",
      "Paul Ritter",
      "Jessie Buckley"
    ],
    "genres": [
      "Drama"
    ],
    "year": 2019,
    "duration": "1 Temporada",
    "rating": 8.7,
    "ratingCount": 8517,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/900tHlUYUkp7Ol04XFSoAaEIXcT.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg",
    "trailerYoutubeId": "s9APLXM9Ei8",
    "featured": false,
    "trending": false,
    "awardWinning": true,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Temporada 1",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "1:23:45",
            "duration": "1h 1m",
            "synopsis": "Operários e bombeiros colocam suas vidas em risco para controlar uma explosão catastrófica de abril de 1986 em uma usina nuclear soviética.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/thaMHLz5l6TVL8R4EzaBkjn2EZA.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Por Favor, Fique Calmo",
            "duration": "1h 6m",
            "synopsis": "O físico nuclear Ulana Khomyuk faz uma tentativa desesperada de alcançar Valery Legasov, um importante físico nuclear soviético, e o avisa sobre a ameaça de uma segunda explosão que poderia devastar o continente.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/kVsUEtOOYeLRmABVuZztl4k9onO.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Abra Largo, O Terra",
            "duration": "1h 4m",
            "synopsis": "Lyudmilla Ignatenko, uma moradora de Pripyat, ignora os avisos sobre a contaminação do marido bombeiro. Valery Legasov estabelece um plano de descontaminação.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/2Eje4lD5MWkTdbFdtlHnrHT2kA2.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "A Felicidade de Toda Humanidade",
            "duration": "1h 7m",
            "synopsis": "Valery Legasov e o vice-primeiro-ministro soviético Boris Shcherbina consideram o uso de robôs lunares para remover detritos radioativo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/xV2eVT4ejGhVn9OIMCo4uBOhmCC.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Vichnaya Pamyat",
            "duration": "1h 13m",
            "synopsis": "Valery Legasov, Boris Shcherbina e Ulana Khomyuk arriscam suas vidas e reputação para expor a verdade sobre Chernobyl.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/mgXm2Y6SOFDHtD5thi2LmS7uQBj.jpg"
          }
        ]
      }
    ]
  },
  {
    "id": "breaking-bad",
    "imdbId": "tt0903747",
    "tmdbId": 1396,
    "title": "Breaking Bad",
    "originalTitle": "Breaking Bad",
    "type": "serie",
    "synopsis": "Ao saber que tem câncer, um professor passa a fabricar metanfetamina pelo futuro da família, mudando o destino de todos.",
    "director": "Showrunner",
    "cast": [
      "Bryan Cranston",
      "Aaron Paul",
      "Anna Gunn",
      "RJ Mitte",
      "Dean Norris"
    ],
    "genres": [
      "Drama",
      "Crime"
    ],
    "year": 2008,
    "duration": "5 Temporadas",
    "rating": 9,
    "ratingCount": 19073,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/hGwm9Cj3CdbJIqQWNExQqiYmCd4.jpg",
    "trailerYoutubeId": "HhesaQXLuRY",
    "featured": true,
    "trending": false,
    "awardWinning": true,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Temporada 1",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Piloto",
            "duration": "59m",
            "synopsis": "Um professor de química do ensino médio decide vender drogas a fim de sustentar sua família.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Cat's in the Bag...",
            "duration": "49m",
            "synopsis": "Sua primeira venda de droga abortada faz Walt e Jesse se disporem de um par de cadáveres, enquanto Skyler suspeita que seu marido está metido em coisa errada.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/AbMoecO0ZZio0LcgeLxlzdyGs6X.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "...And the Bag's in the River",
            "duration": "49m",
            "synopsis": "Enquanto Walt limpa a bagunça deixada após sua primeira venda de drogas, o fato de Skyler chegar perto da verdade sobre sua vida dupla o obriga a considerar dizer a ela a verdade sobre sua doença.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/n8Dah3Tc1vlc4i7bQ9zYPWaFO0e.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Cancer Man",
            "duration": "49m",
            "synopsis": "Ser forçado a revelar a verdade sobre sua doença faz Walt enfrentar a perspectiva de como pagar por um caro e longo tratamento de câncer.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/i5BAJVhuIWfkoSqDID6FnQNCTVc.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Gray Matter",
            "duration": "49m",
            "synopsis": "kyler organiza uma intervenção para convencer Walt a aceitar a oferta generosa de seu antigo parceiro de pesquisa de pagar seu tratamento de câncer.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/82G3wZgEvZLKcte6yoZJahUWBtx.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Crazy Handful of Nothin'",
            "duration": "49m",
            "synopsis": "À medida que os efeitos colaterais e o custo do seu tratamento logo aumentam, o pedido de Walt para encontrar um atacadista para comprar suas drogas traz problemas para Jesse com um ex-presidiário.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/rCCLuycNPL30W3BtuB8HafxEMYz.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "A No-Rough-Stuff-Type Deal",
            "duration": "48m",
            "synopsis": "Na luta de Jesse com a morte, Walt concorda em produzir ainda mais drogas cruel para o destemido Tuco, enquanto Skyler suspeita que sua irmã roubou um presente caro de bebê.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1dgFAsajUpUT7DLXgAxHb9GyXHH.jpg"
          }
        ]
      },
      {
        "seasonNumber": 2,
        "seasonTitle": "Temporada 2",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Seven Thirty-Seven",
            "duration": "48m",
            "synopsis": "Enquanto fazem planos para as últimas grandes vendas de drogas , Walt e Jesse se preocupam que seu único comprador, Tuco, vai pensar em matá-los quando achar que deve.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/6Uo1z56uKnX60JXvYYFWACHR31u.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Grilled",
            "duration": "48m",
            "synopsis": "Ao passo que Hank chega perigosamente perto de revelar seu papel no tráfico de drogas, Walt elabora um plano para cobrir seus rastros.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/th3SNe0gNgRguv8VveLd4f2JcaH.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Bit by a Dead Bee",
            "duration": "47m",
            "synopsis": "Com Walt lutando para diminuir o crescente abismo entre ele e Skyler, Jesse fica sem casa após seus pais o expulsarem da casa onde estava morando.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/abgJTOWYPdZGxAWhsg6lmtM8qcU.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Down",
            "duration": "48m",
            "synopsis": "Ao passo que crescem as contas médicas de Walt e os problemas domésticos, Jesse só aceitará voltar ao negócio das drogas se puder dar as ordens.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/gMXeL0qcQZi5Tfd4UhnkRJeI9oa.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Breakage",
            "duration": "48m",
            "synopsis": "Como o começo de uma caçada do DEA pelo Tuco, Hank pede Skyler para procurar Walt.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/bPQxF63jhfT5eNYjhzuGEO7oMQg.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Peekaboo",
            "duration": "48m",
            "synopsis": "Enquanto Jesse persegue os viciados que roubaram o estoque de drogas de Skinny Pete, Walt tenta usar a sua reportagem de capa para explicar como tem pagado o tratamento de câncer.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/tfCuh20gNHGGF6A1te3NmiqML6D.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Negro y Azul",
            "duration": "48m",
            "synopsis": "Enquanto a reputação de Jesse como um cruel senhor das drogas leva Walt a pressionar a expansão da operação, a incursão inicial de Hank no mundo de El Paso do escritório da DEA o deixa profundamente abalado.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1IOnhCCeru1BZUPeppu7tMmtxvL.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Better Call Saul",
            "duration": "48m",
            "synopsis": "As forças auxiliares de Badger unem Walt e Jesse a um advogado suspeito.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/KmFdF23FtbPwwz3FJF2T885r2Z.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "4 Days Out",
            "duration": "48m",
            "synopsis": "Preocupado com não ter muito tempo de vida, Walt busca sustentar sua família colocando Jesse em uma maratona de sessão de culinária de metanfetamina no deserto.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/etUWlVbdQ7PzbGeUOBNpmFRm1Z9.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "Acabou",
            "duration": "48m",
            "synopsis": "Por boas notícias sobre seu tratamento de câncer, Walt se volta para seu cunhado, Hank, antes de focar sua atenção em tentar fazer as coisas certas em casa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3HkNEX9JEpFBOWF2e4FPu0ctFPe.jpg"
          },
          {
            "episodeNumber": 11,
            "title": "Mandala",
            "duration": "48m",
            "synopsis": "Enquanto no fim da gravidez Skyler está em conflito com os sentimentos por seu chefe, a morte de um traficante de rua força Walt a procurar outro lugar para descarregar uma grande quantidade de metanfetamina.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/yeQAQsV4WPTmKWTyuDhF3DAna1x.jpg"
          },
          {
            "episodeNumber": 12,
            "title": "Phoenix",
            "duration": "48m",
            "synopsis": "Após perder o nascimento de sua filha para fechar uma grande transação de drogas, Walt conversa com a namorada de Jesse sobre sua parte do dinheiro.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/zxFfozd55eJ6Aa4J0pd3SRqJl5l.jpg"
          },
          {
            "episodeNumber": 13,
            "title": "Albuquerque",
            "duration": "48m",
            "synopsis": "Walt tenta normalizar a sua vida e a de Jesse, enquanto se prepara para a cirurgia e busca manter a fonte de seu dinheiro um segredo para Skyler e Walt Jr.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/nNAYdHo3v3c043XKgn3wrVnjoXr.jpg"
          }
        ]
      },
      {
        "seasonNumber": 3,
        "seasonTitle": "Temporada 3",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Chega!",
            "duration": "48m",
            "synopsis": "Na esteira do desastre de avião de Albuquerque, Skyler força o Walt a se mudar, enquanto a estadia de Jesse na reabilitação o ajuda a entender o seu papel na colisão fatal.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/g4taqxGFx9z8ovHhiaa2jvQFd0Z.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Cavalo Sem Nome",
            "duration": "48m",
            "synopsis": "Quando sabe que Skyler está determinada a pedir divórcio, um inconsciente Walt cai na mira de um par de traficantes mexicanos com sede de vingança.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/eQYTr6cH834QyF3cE1VQymwolE1.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Eu Transei Com Ted",
            "duration": "48m",
            "synopsis": "Ao passo que Walt acha que Skyler está blefando e volta para casa sem o seu consentimento, Jesse pondera voltar ao tráfico de drogas, enquanto um cartel mexicano espera ansiosamente a sua oportunidade de se vingar pela morte de um dos seus próprios.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/jH2nkMFxuX5tXc832jyDNU4AjKq.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Sinal Verde",
            "duration": "48m",
            "synopsis": "Enquanto o caso de Skyler com seu chefe cria caos em seu complicado casamento, um novo lote de metanfetamina coloca Jesse de volta no negócio, e Walt também acaba se envolvendo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1Se5PpvIgUey9MgXmrKkgO8HVye.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Mas",
            "duration": "48m",
            "synopsis": "Enquanto Skyler reconsidera suas objeções a ele viver em casa de novo, Walt estuda uma oferta para voltar ao tráfico; a obsessão de Hank em acabar com \"Heisenberg\" promete problemas para Jesse.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/m2cipfAKEdLR4MIZKA3EiOcTYiZ.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Ao Pôr-do-Sol",
            "duration": "48m",
            "synopsis": "Enquanto Walt retoma negócios no laboratório de metanfetamina do Gus, a descoberta do antigo RV força ele e Jesse a agirem rápido para não serem presos por Hank.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/sl5zRr0u0kYcIyCdQjOTsexq4bL.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Um Minuto",
            "duration": "48m",
            "synopsis": "Chateado com a queda do seu caso, como resultado da destruição do laboratório móvel de drogas, Hank arrisca sua carreira atacando Jesse; preocupado que Jesse vai falar, Walt lhe oferece a chance de se unirem novamente em seu novo laboratório.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/4yyVAkAQhzc5URhJJiy21biH3FJ.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Eu Vejo Você",
            "duration": "48m",
            "synopsis": "Ao passo que Hank se apega à vida após a tentativa do cartel de drogas de matá-lo, Walt tenta ficar longe de problemas ao ficar sócio do Jesse quando percebe que também pode estar sob a mira dos atiradores.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/vTP1Z3Ysmj7BCudHKOh4zHiSyPf.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Kafkiano",
            "duration": "48m",
            "synopsis": "Quando ele e Walt retomam a produção, Jesse procura aumentar a sua fatia, enquanto as chances de recuperação de Hank deixa Marie em atrito com sua companhia de seguros.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ztG7AnGy4YKs1vxLbpK9euPwjaK.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "A Mosca",
            "duration": "48m",
            "synopsis": "Longa noite no laboratório faz Walt e Jesse discutirem sobre uma mosca.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3ns0vN3bEl7elFWoodHJ9nDBogC.jpg"
          },
          {
            "episodeNumber": 11,
            "title": "Eibiquiú",
            "duration": "48m",
            "synopsis": "Enquanto Hank está descontente com o ritmo de sua recuperação e Skyler questiona o esquema de Saul de lavagem de dinheiro, Jesse se apaixona por uma paciente de reabilitação que tem ligação com o assassinato de seu falecido amigo, Combo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/llw7fwOmOMs6OSqwK96XrPPQZD3.jpg"
          },
          {
            "episodeNumber": 12,
            "title": "Meias Medidas",
            "duration": "48m",
            "synopsis": "Ignorando as objeções de Walt, Jesse vai atrás dos traficantes que orquestraram o assassinato de Combo; enquanto Hank continua recusando a deixar o hospital, Skyler pressiona Walt a aceitar o seu esquema de lavagem de dinheiro.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/mOvMekI0YKm20I42XK93mPCQ4ru.jpg"
          },
          {
            "episodeNumber": 13,
            "title": "Medida Plena",
            "duration": "48m",
            "synopsis": "Após tirar dois dos traficantes de seu chefe, Walt percebe que Gus está planejando matar ele e Jesse e substituí-lo com seu ex-assistente.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/mDUs18asTVVfqd56scRQ7W9r781.jpg"
          }
        ]
      },
      {
        "seasonNumber": 4,
        "seasonTitle": "Temporada 4",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Estilete",
            "duration": "48m",
            "synopsis": "Os julgamentos e tribulações do advogado criminalista Saul Goodman, no período que antecedeu a fundação de seu escritório de advocacia em um.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1voCxDEPeYXcKAaoDvdGUMyAjps.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "38 Cano Curto",
            "duration": "46m",
            "synopsis": "Walt (Bryan Cranston) prepara sua defesa contra Gus enquanto Jesse tenta superar reavivando sua amizade com Badger e Skinny Pete. Enquanto isso, enquanto Skyler (Anna Gunn) arma um esquema próprio, sua irmã Marie (Betsy Brandt) luta para lidar com a profunda depressão de Hank (Dean Norris).",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ra0R3q9jEOObo6gspjYcbqPmIM.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Casa em Exposição",
            "duration": "47m",
            "synopsis": "Enquanto Walt (Bryan Cranston) se preocupa com as interferências de Gus e o estado mental cada vez mais frágil de Jesse (Aaron Paul), Skyler (Anna Gunn) aumenta a pressão para conseguir o que quer. O mau humor de Hank (Dean Norris) faz Marie (Betsy Brandt) voltar a alguns maus hábitos, que involuntariamente revelam um elo que ameaça expor Walt e Jesse.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/Ac0wu93r4LaZk07wa7PiWpNOOru.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Frases Curtas",
            "duration": "46m",
            "synopsis": "Enquanto Skyler (Anna Gunn) compõe uma história elaborada para explicar suas finanças, Walt (Bryan Cranston) se preocupa quando ele descobre que Hank (Dean Norris) começou uma nova investigação. Enquanto isso, A falta de interesse de Jesse (Aaron Paul) em fazer qualquer coisa que não seja farrear chama a atenção de Gus.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/gzHp77NjrkDOu9sgkLB5PYmwArK.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Espingarda",
            "duration": "48m",
            "synopsis": "Agora que Jesse fez o que tinha que ser feito para mantê-los vivos - isto é, matar seu possível substituto.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/wbCdpu4qlciRQMyKmcstoadcFak.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Encurralado",
            "duration": "48m",
            "synopsis": "Quando o caso de assassinato de Gale Boetticher lhe causa a suspeita de que Walt (Bryan Cranston) não está contando a verdade sobre sua operação de.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3tuFJVKzlWRqstoAOxwWF6lPzJY.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Cachorro Problemático",
            "duration": "48m",
            "synopsis": "Chateado dela mandar ele devolver o carro que comprou para o filho, Walt (Bryan Cranston) contra-ataca colocando Skyler (Anna Gunn) em uma posição difícil em sua operação de lavagem de dinheiro. E enquanto Walt tenta se proteger se livrando de Gus (Giancarlo Esposito), Jesse (Aaron Paul) concorda em ser o matador.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/gXYKZO4nTsDrAc2AjJOhjJkwu1V.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Hermanos",
            "duration": "48m",
            "synopsis": "Quando o caso de assassinato de Gale Boetticher lhe causa a suspeita de que Walt (Bryan Cranston) não está contando a verdade sobre sua operação de.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/vf9uFwIaZRLKv8npuz3eJJnjd99.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Escuta",
            "duration": "48m",
            "synopsis": "Enquanto Walt (Bryan Cranston) luta para subverter a investigação caseira de Hank (Dean Norris) no negócio de metanfetamina de Albuquerque, uma aviso mortal força Gus (Giancarlo Esposito) a considerar um acordo com o cartel mexicano. Enquanto isso, os planos de Skyler (Anna Gunn) de ter um negócio legítimo são paralisados quando seu ex-chefe é acusado de evasão fiscal.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/bIU8FJxe1yXvMm7yREwj138Z6x8.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "Saúde!",
            "duration": "48m",
            "synopsis": "Enquanto Walt (Bryan Cranston) se recupera de sua briga, Gus (Giancarlo Esposito) leva Jesse (Aaron Paul) para o México para fechar o acordo com o.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/dBrs0Npmn76g81yel2mjK7mTaOj.jpg"
          },
          {
            "episodeNumber": 11,
            "title": "Cave",
            "duration": "47m",
            "synopsis": "Enquanto Skyler (Anna Gunn) pressiona Ted a aceitar seu dinheiro e pagar os impostos, Gus (Giancarlo Esposito) insiste que Jesse volte a trabalhar no laboratório sozinho. Mas quando Jesse (Aaron Paul) insiste que a vida do seu parceiro seja poupada, Walt (Bryan Cranston) é forçado a tomar decisões drásticas para salvar a vida de sua família das ameaças mortais de Gus.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/mySdUn0ab1rrWUuoribRZilCqAF.jpg"
          },
          {
            "episodeNumber": 12,
            "title": "Hora do Fim",
            "duration": "46m",
            "synopsis": "Apesar de suas objeções, Walt insiste que Skyler e as crianças se aproveitem da proteção que a DEA (Força Administrativa de Narcóticos) deu ao Hank.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ffIjlpJndsel3FkPMpHCnpJ71lw.jpg"
          },
          {
            "episodeNumber": 13,
            "title": "Confronto",
            "duration": "51m",
            "synopsis": "Depois que seu plano para matar Gus falha, Walt (Bryan Cranston) e Jesse (Aaron Paul) precisam agir rápido para evitar que sejam mortos por vingança. Então enquanto Jesse luta para não ser implicado no envenenamento do filho de sua namorada, Walt elabora um esquema desesperado que depende da pessoa que odeia Gus mais do que qualquer outra viva.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/Apl61kYZF2zQlUMh13t8zmUD7Vr.jpg"
          }
        ]
      },
      {
        "seasonNumber": 5,
        "seasonTitle": "Temporada 5",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Viva Livre ou Morra",
            "duration": "43m",
            "synopsis": "Apesar de suas objeções, Walt insiste que Skyler e as crianças se aproveitem da proteção que a DEA (Força Administrativa de Narcóticos) deu ao Hank.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/uShB5dWoA3xIivZ9jvwWnGCVvt4.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Madrigal",
            "duration": "48m",
            "synopsis": "Enquanto Jesse entra em pânico por não achar o cigarro com ricina que eles planejavam usar para matar Gus Fring.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/9WIzJqqUthdASBRE1Ts8ymrDhIv.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Hazard Pay",
            "duration": "48m",
            "synopsis": "Enquanto Jesse entra em pânico por não achar o cigarro com ricina que eles planejavam usar para matar Gus Fring.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/l84H1dZVkQGgFVomKHc67RKaEC2.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Cinquenta e Um",
            "duration": "48m",
            "synopsis": "Fechando as sobras da operação de Gus Fring, Hank e seu parceiro Gomez chegam as instalações da Madrigal em Houston.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/zxcf3ER2rzU9IxCxJEhCCw1MyT.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Evoluir",
            "duration": "49m",
            "synopsis": "Fechando as sobras da operação de Gus Fring, Hank e seu parceiro Gomez chegam as instalações da Madrigal em Houston.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ay9uj9CMQJezaB407JCPMDYSptK.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Aquisição",
            "duration": "48m",
            "synopsis": "Depois dos alertas de Lydia Rodarte-Quayle da Madrigal sobre o GPS no fundo do barril de metilamina.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/6SHawaVRg4Iw3Ry2adH29TjHYhK.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Diga Meu Nome",
            "duration": "48m",
            "synopsis": "Tendo convencido Jesse e Mike de seus plano de manter a metilamina roubada enquanto paga-lhes os milhões que pedem.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/2NA7ti9jsWnG4xreMEFwbq4DH1f.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Planando Sobre Tudo",
            "duration": "48m",
            "synopsis": "Depois de recrutar Todd para se livrar do carro de Mike, Walt se desfaz do corpo antes de voltar sua atenção ao resto da equipe de Gus Fring.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/uTAPBgAah14jQbV98Sw7iqJD4W7.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Dinheiro Sujo de Sangue",
            "duration": "48m",
            "synopsis": "Enquanto Walt e Jesse se adaptam à vida fora do negócio, Hank luta com uma pista preocupante.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/uvxl7TMG4dZG9D5bzzQzKqfUdnD.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "Enterrado",
            "duration": "48m",
            "synopsis": "Enquanto o passado de Skyler volta para atormentá-la, Walt cobre seus rastros. Jesse continua a lutar com sua culpa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/b0aRvTXslQgJpCmmcmoYqS9MsIB.jpg"
          },
          {
            "episodeNumber": 11,
            "title": "Confissões",
            "duration": "48m",
            "synopsis": "Jesse decide fazer uma mudança, enquanto Walt e Skyler tentam lidar com uma exigência inesperada.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/75lrTEzbUh4iZlMs0aN4mKisD4C.jpg"
          },
          {
            "episodeNumber": 12,
            "title": "Cão Raivoso",
            "duration": "48m",
            "synopsis": "Uma estratégia incomum começa a dar frutos, enquanto planos que poderiam mudar tudo são postos em ação.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5VkI8lm7Xcmlxk92pWRyW341d70.jpg"
          },
          {
            "episodeNumber": 13,
            "title": "To'hajiilee",
            "duration": "47m",
            "synopsis": "As coisas esquentam para Walt de formas inesperadas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/lunoCRprYl0jEJEkGTS8v6eFq1n.jpg"
          },
          {
            "episodeNumber": 14,
            "title": "Ozymandias",
            "duration": "48m",
            "synopsis": "Todo mundo lida com circunstâncias radicalmente alteradas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/k80r5JYO4LLrPJbWDXmlg7IxRMI.jpg"
          },
          {
            "episodeNumber": 15,
            "title": "Estado Granito",
            "duration": "54m",
            "synopsis": "Eventos iniciados há muito tempo avançam em direção a uma conclusão.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/pkAdPUHvRlvTnz2uA0gAQiGXpos.jpg"
          },
          {
            "episodeNumber": 16,
            "title": "Felina",
            "duration": "56m",
            "synopsis": "Último episódio.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/pA0YwyhvdDXP3BEGL2grrIhq8aM.jpg"
          }
        ]
      }
    ]
  },
  {
    "id": "succession",
    "imdbId": "tt7660850",
    "tmdbId": 76331,
    "title": "Succession",
    "originalTitle": "Succession",
    "type": "serie",
    "synopsis": "Acompanhe a história da família Roy, composta por Logan e seus quatro filhos, que controla um dos maiores conglomerados de meios de comunicação e entretenimento do mundo.",
    "director": "Showrunner",
    "cast": [
      "Jeremy Strong",
      "Kieran Culkin",
      "Sarah Snook",
      "Brian Cox",
      "Matthew Macfadyen"
    ],
    "genres": [
      "Drama",
      "Comédia"
    ],
    "year": 2018,
    "duration": "4 Temporadas",
    "rating": 8.3,
    "ratingCount": 1846,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/d87JXX3DLkRJMfm5StCmmnmhHuX.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/z0XiwdrCQ9yVIr4O0pxzaAYRxdW.jpg",
    "trailerYoutubeId": "OzYxJV_rmE8",
    "featured": false,
    "trending": false,
    "awardWinning": true,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Temporada 1",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Celebration",
            "duration": "1h 2m",
            "synopsis": "Em seu aniversário de 80 anos, o magnata da mídia Logan Roy, cuja iminente aposentadoria era considerada como certa, choca sua família ao anunciar que continuará indefinidamente como CEO da Waystar/Royco. A notícia abala seu filho Kendall.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/rIg9xLwoIGvgMaPlLbioQ08aKVd.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Sh*t Show at the F**k Factory",
            "duration": "59m",
            "synopsis": "A incapacidade de Logan desencadeia um acalorado debate sobre a sucessão entre seus filhos, enquanto a diretoria se apressa em informar a mídia sobre contingências de liderança antes do mercado de ações abrir.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/pI4ua90GNgDxriiSMY6Px1BjekO.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Lifeboats",
            "duration": "58m",
            "synopsis": "Kendall enfrenta uma crise de dívidas na Waystar; Shiv se irrita com a influência de Marcia sobre Logan.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5znXaotuoGAY2rtPw8WWjbcsyyI.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Sad Sack Wasp Trap",
            "duration": "58m",
            "synopsis": "Com a gala beneficente anual da fundação se aproximando, e seu pai fora de cena, Kendall aperfeiçoa seu discurso; Shiv tenta minimizar o dano de uma foto comprometedora que ameaça o futuro político de um cliente.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/mZk2zOCxFBM7w0gXdG2ikqKw61J.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "I Went to Market",
            "duration": "56m",
            "synopsis": "Após escutar o plano de Logan de expandir a TV local, Kendall organiza uma votação de desconfiança contra seu pai",
            "thumbnail": "https://image.tmdb.org/t/p/w500/s51pU8QMDODpHQfQuvpJnSyr0NL.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Which Side Are You On?",
            "duration": "58m",
            "synopsis": "Com a votação contra Logan se aproximando, Roman tenta convencer um membro neutro do conselho, enquanto Kendall luta freneticamente por votos a favor.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/fDs0vCCDJPDR1lMyly0hrn4Dahr.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Austerlitz",
            "duration": "58m",
            "synopsis": "Em uma tentativa de melhorar sua imagem pública, Logan aceita participar de uma sessão de terapia familiar no rancho de Connor, no Novo México.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/kQjdw7YCB43DqBuddZTHs59HE2B.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Prague",
            "duration": "56m",
            "synopsis": "Tom tem uma despedida de solteiro inesquecível; Kendall e Roman procuram novas oportunidades de negócios com um casal de empreendedores idealistas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/sbpFHOXksHfmVHJIcgypVTg1GTp.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Pre-Nuptial",
            "duration": "58m",
            "synopsis": "Os Roys se encontram em um castelo inglês para o casamento de Shiv e Tom. As crianças se reúnem com a mãe Caroline, que é tão cruel quanto Logan.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/jksAOYiFfomjezjIR561oxqId8u.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "Nobody Is Ever Missing",
            "duration": "1h 6m",
            "synopsis": "Em meio à celebração do casamento de Tom e Shiv, Logan e sua equipe encontram-se na defensiva.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/QFrxZg56jttjbRAgC83eNGoXLl.jpg"
          }
        ]
      },
      {
        "seasonNumber": 2,
        "seasonTitle": "Temporada 2",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "The Summer Palace",
            "duration": "59m",
            "synopsis": "Ainda confuso com os eventos no casamento de sua irmã, Kendall tenta fazer as pazes com seu pai. Logan recebe conselhos difíceis de seu banqueiro.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5MY4RFK1qlbFUSh9thmf6vbE8bE.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Vaulter",
            "duration": "58m",
            "synopsis": "Roman e Kendall competem para consertar a Vaulter à sua maneira; Greg se pergunta se o ATN é o melhor para ele; Shiv conversa com Tom sobre seu futuro.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/26veg1bj8b4WfkJuRLKrLw3a26l.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Hunting",
            "duration": "59m",
            "synopsis": "Logan informa sua cínica equipe sobre seus planos para tentar adquirir novamente a Pierce, uma empresa de mídia rival respeitada no mundo das notícias, e traz Frank de volta.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/38TozU08psibnQGljsUOUyK2NsN.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Safe Room",
            "duration": "58m",
            "synopsis": "Roman começa um programa de treinamento com os \"normais\" da divisão Parks; Logan leva Shiv para Waystar, o que irrita Kendall e Gerri; Connor e Willa assistem ao funeral de um amigo da família com um passado complicado.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5mRxmdvG3GKqDhJe90LFv9zuRce.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Tern Haven",
            "duration": "1h",
            "synopsis": "Logan tenta concretizar sua compra da PGM em um fim de semana de descanso na casa da família Pierce, onde Shiv, Roman e Connor se desviam de seus papéis cuidadosamente orquestrados.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/sH2UndwXxYpjGyKzi7BJyFszZiK.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Argestes",
            "duration": "58m",
            "synopsis": "Um escandaloso artigo de jornal ameaça expor a divisão de cruzeiros da Waystar Royco, bem como os planos de Logan de comprar Pierce e manter a controle de sua empresa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/jHqhN4OJIeYOY5m1wGjQkryK5L6.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Return",
            "duration": "58m",
            "synopsis": "Uma viagem ao Reino Unido faz com que os meninos Roy negociem com a mãe; Logan pede conselhos a Rhea; Greg faz de tudo para se proteger quando Tom é surpreendido por uma investigação interna.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/v8GvkMkiVFz1HxdjI4SEtXehnfN.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Dundee",
            "duration": "1h",
            "synopsis": "Logan reflete sobre seu passado e futuro ao retornar à sua cidade natal, Dundee, na Escócia; Shiv conspira para derrubar Rhea; Kendall se apaixona por uma atriz; Greg recebe um ultimato.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/35KiM5VxvYEddEu312aL6ABBeBy.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "DC",
            "duration": "1h 1m",
            "synopsis": "Logan, Kendall, Gerri e Tom depõem perante o Congresso; Shiv é sincera com uma testemunha chave; o plano de negócios de Roman dá uma guinada assustadora.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/qz3eifkfIkha66P4zbqrVnuu4SU.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "This Is Not for Tears",
            "duration": "1h 9m",
            "synopsis": "Logan procura algum bode expiatório entre seus aliados mais próximos enquanto o futuro da empresa está em jogo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/9zH4Q67w0qvtXeD3cTMaiVKFuj6.jpg"
          }
        ]
      },
      {
        "seasonNumber": 3,
        "seasonTitle": "Temporada 3",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Episódio 1",
            "duration": "57m",
            "synopsis": "Após sua explosiva coletiva de imprensa, Kendall corre para encontrar uma base de operações enquanto Logan procura um porto seguro.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/130ZyGzoPXdAG3ZQp5FfVcsrqIW.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Episódio 2",
            "duration": "59m",
            "synopsis": "Kendall tenta colocar seus irmãos, assim como Stewy e Sandi, do seu lado. Temendo sua situação legal, Greg pede ajuda a Ewan.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/w9QosoYHuWPe7mdNHc1NjcSEcfa.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Episódio 3",
            "duration": "59m",
            "synopsis": "Com o Departamento de Justiça na porta, Logan convoca seu arsenal. Enquanto isso, Tom faz uma oferta que pode mudar sua vida.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/kNr0xiy8PSVUTff7feUD5nj0pqF.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Episódio 4",
            "duration": "59m",
            "synopsis": "Logan e Kendall têm sua primeiro reunião com Josh, um importante investidor preocupado com a disputa familiar.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/mP4pvN58nyBsFhUGPjW18os7zRU.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Episódio 5",
            "duration": "1h",
            "synopsis": "Kendall e a equipe da Waystar trabalham juntos na reunião anual de acionistas, onde a saúde de Logan dá uma guinada.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/rRBERiQvUcpWgj9wJ6ZU8DZCIQJ.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Episódio 6",
            "duration": "58m",
            "synopsis": "Logan e sua equipe vão para a Virgínia para uma conferência política, onde Roman descobre notícias surpreendentes sobre sua mãe.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5hGlKWPhF0GbfvgwttY5C7uwgn5.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Episódio 7",
            "duration": "58m",
            "synopsis": "Na luxuosa festa de aniversário de Kendall, Shiv e Roman procuram marcar um encontro com um magnata da tecnologia que rejeitou Logan.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/uqvLgaO1MgdfrZK47Nb0nw5ehvE.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Episódio 8",
            "duration": "1h 4m",
            "synopsis": "Em um luxuoso casamento familiar na Itália, Roman expressa suspeitas, Gerri coloca limites e a equipe da Waystar se preocupa com os tweets.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/cPTzIDuP4nFrmYTOsR30bLh1V8a.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Episódio 9",
            "duration": "1h 5m",
            "synopsis": "A visão de Matsson para o relacionamento GoJo-Waystar leva Shiv e Roman a lidar com as consequências, enquanto Logan pondera suas opções.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/wTrGxtBRxcIg4ixccODsN9acJqg.jpg"
          }
        ]
      },
      {
        "seasonNumber": 4,
        "seasonTitle": "Temporada 4",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Os Monstros",
            "duration": "1h 1m",
            "synopsis": "Enquanto Kendall, Shiv e Roman aperfeiçoam seu discurso para os investidores em Los Angeles, Logan se inteira de uma oferta rival em uma aquisição muito cobiçada.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/6sPirsptcGhKK8Lzy0o0Tx9s5Mf.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "O Ensaio",
            "duration": "59m",
            "synopsis": "Enquanto Kendall, Shiv e Roman consideram uma jogada agressiva no acordo com Matsson, Connor tenta aproveitar ao máximo seu jantar de ensaio.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/hB04cP1MJkcv6JdUnYF9fHankHb.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "O Casamento de Connor",
            "duration": "1h 2m",
            "synopsis": "Enquanto Logan delega uma tarefa desagradável antes de sua viagem para reunir-se com Matsson, Connor fica obcecado com miudezas à medida que os convidados chegam para seu casamento.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/tphh4wvLKfaaIUIqx87CXss48NB.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Estados da Lua de Mel",
            "duration": "1h",
            "synopsis": "Enquanto a equipe da Waystar discute uma recomendação crucial para o conselho, Roman, Kendall e Shiv dão um passo em falso com Matsson.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/sPrLwDsnPO5vXldhsPmkfRKGcoQ.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Lista da Morte",
            "duration": "1h 1m",
            "synopsis": "Depois de a equipe da Waystar viajar para a Noruega, Shiv, Kendall e Roman consideram lutar pela joia da coroa de Logan.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/vLWQ8jgLzJU17qi7iK87W35hU4V.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Vivendo+",
            "duration": "1h 3m",
            "synopsis": "Antes do Dia do Investidor, Shiv avalia uma proposta de Matsson, enquanto Kendall e Roman tentam igualar o estilo de liderança volátil de Logan.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/9Ut45xIXiKhupEEIlPoKnhb69Kh.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Festa Pré-Eleição",
            "duration": "1h 2m",
            "synopsis": "Com uma nova estratégia em mente, Kendall e Roman pedem a Shiv que convide um membro da campanha para a festa pré-eleitoral de Logan.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/AequFivGIhmbcFeKWG5tjve8amq.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "A América Decide",
            "duration": "1h 6m",
            "synopsis": "Na noite das eleições, Tom tenta controlar uma sala de imprensa cada vez mais caótica, enquanto Kendall, Shiv e Roman discutem sobre as consequências dos resultados - para eles, a empresa e o país.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/cWDU2UZmZZDiQkA7eKR8AQyAIV3.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Igreja e Estado",
            "duration": "1h 14m",
            "synopsis": "Em meio a tensões crescentes, Shiv tenta se reposicionar em um novo cenário político, enquanto Kendall reúne apoiadores.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/javcZZhlgHQVLARHL5IDqkUo1g5.jpg"
          },
          {
            "episodeNumber": 10,
            "title": "De Olhos Abertos",
            "duration": "1h 29m",
            "synopsis": "Antes da votação do conselho sobre o acordo com a GoJo, Kendall e Shiv reforçam seus interesses opostos e tentam enter Roman.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/fEWGXc9Ymd4YYJJTk3QPKJxndyJ.jpg"
          }
        ]
      }
    ]
  },
  {
    "id": "the-last-of-us",
    "imdbId": "tt3581920",
    "tmdbId": 100088,
    "title": "The Last of Us",
    "originalTitle": "The Last of Us",
    "type": "serie",
    "synopsis": "Situado duas décadas após a implosão de nossa sociedade, o drama seguirá Joel, um sobrevivente difícil, que é contratado para contrabandear uma garota de 14 anos chamada Ellie para fora de uma zona de quarentena opressiva. O que começa como um pequeno trabalho logo se torna uma jornada brutal e de partir o coração, já que os dois precisam atravessar os Estados Unidos e dependem um do outro para sobreviver.",
    "director": "Showrunner",
    "cast": [
      "Bella Ramsey",
      "Gabriel Luna",
      "Isabela Merced",
      "Young Mazino"
    ],
    "genres": [
      "Drama"
    ],
    "year": 2023,
    "duration": "2 Temporadas",
    "rating": 8.4,
    "ratingCount": 7500,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/lY2DhbA7Hy44fAKddr06UrXWWaQ.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/qWo5TP7mBijoZrfxBJkUMctkBt0.jpg",
    "trailerYoutubeId": "uLtkt8BonwM",
    "featured": true,
    "trending": true,
    "awardWinning": true,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Temporada 1",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Quando Você Estiver Perdido na Escuridão",
            "duration": "1h 21m",
            "synopsis": "Vinte anos após um surto fúngico devastar o planeta, os sobreviventes Joel e Tess recebem uma missão que pode mudar tudo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3VeY1k8wFyhcrMyQ8jpGegh9beU.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Infectados",
            "duration": "53m",
            "synopsis": "Após escaparem da zona de quarentena, Joel e Tess discutem sobre o destino de Ellie enquanto transitam pelas ruínas de uma Boston abandonada há muito tempo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/vGf7chl6XL7o3yYc8A5m3kjz8px.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Por Muito, Muito Tempo",
            "duration": "1h 17m",
            "synopsis": "Quando um estranho se aproxima do alojamento de Bill, um aficionado por preparativos para cenários apocalípticos, ambos forjam uma conexão pouco provável. Mais tarde, Joel e Ellis buscam a orientação de Bill.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/fmaiMjbLXaeRyq2so0EXf3hrpyc.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Por Favor, Segure a Minha Mão",
            "duration": "47m",
            "synopsis": "Depois de abandonar sua caminhonete em Kansas City, Joel e Ellie tentam escapar sem chamar a atenção de uma vingativa líder rebelde.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/nYPkaj0a5m4Y9xHdDADtnzh6zOL.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Resistir e Sobreviver",
            "duration": "1h",
            "synopsis": "Enquanto tentam fugir dos rebeldes, Joel e Ellie cruzam com o homem mais procurado de Kansas City. Kathleen continua sua caçada.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/ztzxqW4IAVQRVimxhIfryP4CuI9.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Parentesco",
            "duration": "1h 1m",
            "synopsis": "Após ignorar os conselhos dos locais, Joel e Ellie adentram em território perigoso na busca pelos Vaga-Lumes... e de Tommy.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/zW9AIy0PVhYfmukqBcUvlvi4mKc.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "O Que Deixamos Para Trás",
            "duration": "57m",
            "synopsis": "Enquanto Joel luta para sobreviver, Ellie se recorda da noite em que tudo mudou.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/oNyC68bnOoVAiJnKVsRNY9YDbl6.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Quando Mais Precisamos",
            "duration": "52m",
            "synopsis": "Ellie cruza com um vingativo grupo de sobreviventes e chama a atenção de seu líder. Um debilitado Joel enfrenta uma nova ameaça.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/iNbhbEOt1KAeqr5iyL9QOAZzgzT.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Procure a Luz",
            "duration": "46m",
            "synopsis": "Uma Anna grávida deposita sua confiança em uma amiga de longa data. Mais tarde, Joel e Ellie se aproximam do fim de sua jornada.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/4WZ9E8IGl9tkka9JPh325Lc1kfh.jpg"
          }
        ]
      },
      {
        "seasonNumber": 2,
        "seasonTitle": "Temporada 2",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Dias Futuros",
            "duration": "59m",
            "synopsis": "Cinco anos após os eventos da primeira temporada, Joel e Ellie se veem envolvidos em um conflito em um mundo ainda mais perigoso e imprevisível do que aquele que deixaram para trás.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/rNTeUQ0C2eRyOlSoPToHV3adTYb.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Através do Vale",
            "duration": "57m",
            "synopsis": "Enquanto uma tempestade se forma nas montanhas, o povo de Jackson Hole se prepara para o pior em meio ao aumento de avistamentos de Infectados. Enquanto isso, Abby pondera suas opções.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/y5hH64UU5QSbsVOarLsdk0sD5Rm.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "O Caminho",
            "duration": "57m",
            "synopsis": "Após receber informações de Dinah, Ellie prepara uma petição ao conselho da cidade. Perto de Seattle, um grupo religioso foge de uma guerra.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/naQJx4p1H8pjnS2fntzK6Jtcak9.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Dia Um",
            "duration": "53m",
            "synopsis": "Em 2018, a FEDRA de Seattle enfrenta um inimigo inesperado. Onze anos depois, Ellie e Dina se veem no meio de uma batalha sangrenta entre os fervorosos Serafitas e uma milícia implacável.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/agq0JjJXYJclLH7iQWmVJxUb0CV.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Sinta o Amor Dela",
            "duration": "45m",
            "synopsis": "A WFL faz uma descoberta perigosa... a um preço alto. Mais tarde, Ellie precisa decidir se continua com seu plano - e corre o risco de colocar Dina em perigo - ou se desiste de sua busca por justiça.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/o79Zkjoe2bNKslh8Dr7mcm8gyg.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "O Preço",
            "duration": "1h",
            "synopsis": "Joel surpreende Ellie em seu aniversário. Anos depois, Ellie se prepara para confrontar Joel sobre seu passado.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/iyqiOrn1253erbEpX9UeSPYXhTh.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Convergência",
            "duration": "50m",
            "synopsis": "Enquanto Lobos e Cicatrizes se preparam para uma batalha que pode encerrar sua longa guerra, a busca de Ellie a afasta de seus amigos e a leva a um confronto devastador.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5xCYzdb4ASjn6wZQr5esz5aRf5U.jpg"
          }
        ]
      }
    ]
  },
  {
    "id": "stranger-things",
    "imdbId": "tt4574334",
    "tmdbId": 66732,
    "title": "Stranger Things",
    "originalTitle": "Stranger Things",
    "type": "serie",
    "synopsis": "Quando um garoto desaparece, a cidade toda participa nas buscas. Mas o que encontram são segredos, forças sobrenaturais e uma menina.",
    "director": "Showrunner",
    "cast": [
      "Winona Ryder",
      "David Harbour",
      "Millie Bobby Brown",
      "Finn Wolfhard",
      "Gaten Matarazzo"
    ],
    "genres": [
      "Action & Adventure",
      "Mistério",
      "Sci-Fi & Fantasy"
    ],
    "year": 2016,
    "duration": "5 Temporadas",
    "rating": 8.5,
    "ratingCount": 22110,
    "ageRating": "16",
    "quality": "4K HDR",
    "audio": "Dublado & Legendado",
    "backdropUrl": "https://image.tmdb.org/t/p/original/9P4IIMYY3HifqeruZq0ZZ9g7YUi.jpg",
    "posterUrl": "https://image.tmdb.org/t/p/w500/twfKp60THrcOIep9sjHODOOfO8d.jpg",
    "trailerYoutubeId": "b9EkMc79ZSU",
    "featured": false,
    "trending": true,
    "awardWinning": false,
    "seasons": [
      {
        "seasonNumber": 1,
        "seasonTitle": "Stranger Things",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Capítulo um: O desaparecimento de Will Byers",
            "duration": "48m",
            "synopsis": "No caminho de volta para casa, Will é aterrorizado por alguma coisa. Não longe dali, um laboratório secreto guarda um segredo sinistro.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/6jSA6JpxNDV63aDXpmsUFCjCINb.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Capítulo dois: A estranha da Maple Street",
            "duration": "55m",
            "synopsis": "Lucas, Mike e Dustin tentam conversar com a menina que encontram. Hopper tem perguntas para uma Joyce extremamente ansiosa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/8iA56ugQyHZmX81wSsNqwXjCE6F.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Capítulo três: Caramba",
            "duration": "51m",
            "synopsis": "Cada vez mais preocupada, Nancy procura Barb e acaba descobrindo o que Jonathan anda fazendo. Joyce está convencida de que Will está tentando se comunicar com ela.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5snULpWQWp7aqFto7UbRcEkEyyS.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Capítulo quatro: O corpo",
            "duration": "50m",
            "synopsis": "Joyce se recusa a acreditar de Will morreu, e tenta se comunicar com ele. Os meninos transformam o visual de Onze. Nancy e Jonathan acabam se unindo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/60wmC1e20HV8gu688GAhsWxqxPx.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Capítulo cinco: A pulga e o acrobata",
            "duration": "52m",
            "synopsis": "Hopper consegue entrar no laboratório enquanto Nancy e Jonathan confrontam as forças que levaram Will. Os meninos perguntam ao Sr. Clarke como se vai para outra dimensão.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/exT4NW9EdXG1qLZHKJnRpq3gh1H.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Capítulo seis: O monstro",
            "duration": "46m",
            "synopsis": "Desesperado, Jonathan procura por Nancy na escuridão, mas Steve faz a mesma coisa. Hopper e Joyce descobrem a verdade sobre os experimentos conduzidos no laboratório.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/lNS6qycyucewz3duTr1tf1LU688.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Capítulo sete: A banheira",
            "duration": "42m",
            "synopsis": "Onze tenta chegar a Will, mas Lucas dá o alerta de perigo. Nancy e Jonathan mostram à polícia as imagens capturadas pela câmera.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/arjP5c4qHLznbujCrrBVz4Z8Ykl.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Capítulo oito: De ponta-cabeça",
            "duration": "54m",
            "synopsis": "O Dr. Brenner interroga Hopper e Joyce enquanto os meninos e Onze esperam no ginásio. Nancy e Jonathan se preparam para uma nova batalha.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1teJ5dbuepfqOOs9uYhYTUjr2qs.jpg"
          }
        ]
      },
      {
        "seasonNumber": 2,
        "seasonTitle": "Stranger Things 2",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Capítulo um: Mad Max",
            "duration": "48m",
            "synopsis": "Na véspera do Halloween, um rival bagunça as coisas no fliperama. Cético, Hopper inspeciona uma plantação de abóboras apodrecidas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/efz0MgPAxPw11PIeAJNgKKg3Paa.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Capítulo dois: Gostosura ou travessura, aberração",
            "duration": "56m",
            "synopsis": "Depois que Will vê algo terrível na noite das gostosuras ou travessuras, Mike se pergunta se Onze ainda está por perto. Nancy enfrenta a verdade sobre a morte de Barb.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/3gzPnRilyASmcoSyUKXhaD5ofhr.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Capítulo três: O girino",
            "duration": "51m",
            "synopsis": "Dustin adota um animal de estimação estranho, e Onze fica cada vez mais impaciente. Bem-intencionado, Bob incentiva Will a encarar os seus medos.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/792NQjFydcr5ucb1sga55LS6Vt3.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Capítulo quatro: Will, o sábio",
            "duration": "46m",
            "synopsis": "Debilitado, Will se abre com Joice, e o resultado é perturbador. Enquanto Hopper busca a verdade, Onze faz uma descoberta surpreendente.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/j4FVUW27sMiqk2OTPMtlZ8W4bZS.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Capítulo cinco: Dig Dug",
            "duration": "58m",
            "synopsis": "Nancy e Jonathan trocam teorias conspiratórias com um novo aliado, e Onze procura alguém do seu passado. “Bob Sabichão” lida com um problema complicado.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/oshY3LAwQRzhcjmEEr7EbOnypuU.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Capítulo seis: O espião",
            "duration": "52m",
            "synopsis": "A ligação entre Will e uma sinistra força do mal fica mais forte, mas ninguém sabe ao certo como detê-la. Dustin e Steve criam um vínculo improvável.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/y3Npi32SQZ6hGM0LnSQ9ONJyNJY.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Capítulo sete: A irmã perdida",
            "duration": "46m",
            "synopsis": "Visitantes psíquicos arrastam Onze na direção de um grupo de marginalizados violentos e de uma garota irritada com um passado sombrio.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/kgOaaTbAutwAoA7tkVzYCfTjPXn.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Capítulo oito: O Devorador de Mentes",
            "duration": "48m",
            "synopsis": "Um herói improvável surge quando um incidente mortal provoca o fechamento do Laboratório de Hawkins, deixando Will e vários outros presos lá dentro.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/vuLea0DA9rYc9Y4M2Ic28CXL4Al.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Capítulo nove: O portal",
            "duration": "1h 2m",
            "synopsis": "Onze planeja terminar o que começou. Os sobreviventes aumentam a pressão contra a força monstruosa que mantém Will refém.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/cxCf7O5WPHfyXb7PLSJCG6EvXc3.jpg"
          }
        ]
      },
      {
        "seasonNumber": 3,
        "seasonTitle": "Stranger Things 3",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Capítulo um: Está me ouvindo, Suzie?",
            "duration": "51m",
            "synopsis": "O verão é época de trabalhos temporários e novos namoros. Mas o clima muda quando Will percebe algo de errado na transmissão em russo captada pelo rádio de Dustin.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/97PVnrEQWEsdMnD08QDmMxLkV7h.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Capítulo dois: O caso dos ratos",
            "duration": "51m",
            "synopsis": "Nancy e Jonathan seguem uma pista. Steve e Robin participam de uma missão secreta, e Max e Onze vão às compras. Billy tem visões perturbadoras.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/1XgtGAnheGKfrYtV3mLSFf13AJi.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Capítulo três: A salva-vidas desaparecida",
            "duration": "50m",
            "synopsis": "Onze e Max estão à procura de Billy. Will planeja um dia sem as garotas. Steve e Dustin ficam de tocaia, e Joyce e Hopper retornam ao Laboratório Nacional de Hawkins.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/oaYdVvYwnvoQ7SLelKUcaAt0HKJ.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Capítulo quatro: A prova da sauna",
            "duration": "53m",
            "synopsis": "A turma se reúne para enfrentar um mal terrivelmente familiar. Karen pede que Nancy continue a investigação. Robin consegue uma planta do shopping muito útil.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/tEgd6fXKngAG8eC92dH7ey6Y4eA.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Capítulo cinco: Os devorados",
            "duration": "52m",
            "synopsis": "Surpresas estranhas se escondem em uma antiga fazenda e nas profundezas do Starcourt Mall. O Devorador de Mentes fica mais forte.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/cxIZ4btU6h9GQM1Fn0kotuaXlwo.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Capítulo seis: E pluribus unum",
            "duration": "1h",
            "synopsis": "Dr. Alexey revela o que os russos estão construindo, e Onze vê onde Billy esteve. Dustin e Erica planejam um resgate ousado.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/dZKsMHJm8DPdBuqFcZxdIulrpNs.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Capítulo sete: A mordida",
            "duration": "56m",
            "synopsis": "Com o tempo se esgotando e um assassino cada vez mais perto, a equipe de Hopper corre de volta a Hawkins. Lá, Onze e o resto da turma se preparam para a guerra.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/6QA91GJK2ze1EaGPEKhil9MJIXx.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Capítulo oito: A batalha de Starcourt",
            "duration": "1h 18m",
            "synopsis": "O Devorador de Mentes causa terror na praça de alimentação. Lá embaixo, na escuridão, o futuro da humanidade está em jogo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/5YcjTWas07RteM9lssOzL9UhmJh.jpg"
          }
        ]
      },
      {
        "seasonNumber": 4,
        "seasonTitle": "Stranger Things 4",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Capítulo um: O Clube Hellfire",
            "duration": "1h 19m",
            "synopsis": "Na nova escola, On precisa aprender a lidar com os valentões. Joyce abre um pacote misterioso. Em Hawkins, uma jogadora atrevida agita a noite de D&D.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/xeNKubDmPiMraW4hXqzEBrN6f4A.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Capítulo dois: A maldição de Vecna",
            "duration": "1h 18m",
            "synopsis": "Mike embarca em um avião rumo à Califórnia. Um corpo abala Hawkins. Nancy sai à procura de pistas. Abalado, Eddie conta aos amigos o que viu.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/lSSWqv7XrO51uY2uc4lql9Hub3f.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Capítulo três: O monstro e a super-heroína",
            "duration": "1h 4m",
            "synopsis": "Murray e Joyce viajam para o Alasca e On enfrenta duras consequências. Robin e Nancy fazem uma descoberta sobre os monstros de Hawkins. Dr. Owens traz más notícias.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/6q1UM63T5tiQcWrbsJvY3bunkyZ.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Capítulo quatro: Querido Billy",
            "duration": "1h 19m",
            "synopsis": "Max está em perigo e o tempo está se esgotando. Um paciente do hospital Pennhurst recebe visitas. Na Rússia, Hopper vai à luta.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/u3LeFRR7AhyPp4y0Ii7hpkD488b.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Capítulo cinco: Projeto Nina",
            "duration": "1h 15m",
            "synopsis": "Owens leva On para Nevada, onde ela é obrigada a encarar o passado. Em Hawkins, a turma vasculha uma casa em ruínas atrás de pistas. Vecna faz mais uma vítima.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/yvXXeBv4zfDgwcZyxqH5LJAe4oV.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Capítulo seis: Mergulho",
            "duration": "1h 14m",
            "synopsis": "Uma missão de resgate arriscada toma forma. Na Califórnia, os garotos pedem ajuda a uma hacker. Steve se sacrifica pelo grupo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/9EbhReDcbfmqLhDBg0Rn97z4lT.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Capítulo sete: O massacre no laboratório de Hawkins",
            "duration": "1h 40m",
            "synopsis": "Hopper se prepara para uma batalha épica. Dustin investiga as motivações secretas de Vecna e decodifica uma mensagem do além. On encontra forças numa lembrança distante.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/n64hMYFaVunT8jqSVgYq5qt0Vbn.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Capítulo oito: Papai",
            "duration": "1h 26m",
            "synopsis": "Nancy tem visões preocupantes. Onze consegue dar um passo importante. Em Hawkins, a turma se prepara para a batalha.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/XhpquP7GFEDzKIHTAPX6vI8Phd.jpg"
          },
          {
            "episodeNumber": 9,
            "title": "Capítulo nove: E o plano de Onze",
            "duration": "2h 23m",
            "synopsis": "Com muito amor no coração e um toque de metal, os heróis lutam para salvar Hawkins e o mundo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/fvoa0Hosu4yK7TUiHglV8TvjMUB.jpg"
          }
        ]
      },
      {
        "seasonNumber": 5,
        "seasonTitle": "Stranger Things 5",
        "episodes": [
          {
            "episodeNumber": 1,
            "title": "Capítulo um: Missão de resgate",
            "duration": "1h 12m",
            "synopsis": "Novembro de 1987. O grupo foge dos militares para o Mundo Invertido em busca de Vecna, mas não percebe a ameaça que está à espreita perto de casa.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/aOOOdhkmhncbikMVqXfVxwQ6lQw.jpg"
          },
          {
            "episodeNumber": 2,
            "title": "Capítulo dois: O desaparecimento de...",
            "duration": "58m",
            "synopsis": "Após o terrível ataque à casa da família Wheeler, Mike e Nancy pagam o preço do segredo. Onze e Hopper saem em uma missão de resgate.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/loM7T7Mwd849wFaWj9KPlNNSHZr.jpg"
          },
          {
            "episodeNumber": 3,
            "title": "Capítulo três: A armadilha",
            "duration": "1h 10m",
            "synopsis": "Will descobre o próximo passo de Vecna, e o grupo tem a chance de armar uma emboscada. Holly explora seu novo território.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/iCsM4oeBM9PIESD6PJw7mWO1xbl.jpg"
          },
          {
            "episodeNumber": 4,
            "title": "Capítulo quatro: Feiticeiro",
            "duration": "1h 27m",
            "synopsis": "Os militares apertam o cerco na cidade. Mike, Lucas e Robin orquestram uma fuga ousada, enquanto El fica cara a cara com quem está por trás da ameaça.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/r0uVKBsPj74lQGNRdC9IM2P5roW.jpg"
          },
          {
            "episodeNumber": 5,
            "title": "Capítulo cinco: Tratamento de choque",
            "duration": "1h 9m",
            "synopsis": "A turma bola um plano eletrizante para reconectar Will à mente coletiva. A tensão explode durante a busca pelo laboratório de Hawkins no Mundo Invertido.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/A9gML0mmuyE2m3hGK0eZZA2tRPg.jpg"
          },
          {
            "episodeNumber": 6,
            "title": "Capítulo seis: A fuga de Camazotz",
            "duration": "1h 16m",
            "synopsis": "Holly e Max lutam para escapar da mente de Vecna, e On tenta dar um jeito de entrar na mente de Will. Joyce se sente culpada. Jonathan e Nancy vivem um momento decisivo.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/zwJuStMjSOT1jaPUkX3dweIciRs.jpg"
          },
          {
            "episodeNumber": 7,
            "title": "Capítulo sete: A ponte",
            "duration": "1h 7m",
            "synopsis": "No aniversário do desaparecimento de Will, o grupo se reúne mais uma vez. Agora, eles precisam se preparar para uma batalha que pode mudar o mundo para sempre.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/xJv3oJoVQqITux8N9isJfb1Ao6g.jpg"
          },
          {
            "episodeNumber": 8,
            "title": "Capítulo oito: O mundo \"direito\"",
            "duration": "2h 9m",
            "synopsis": "Com Vecna prestes a destruir o mundo, o grupo precisa arriscar tudo para derrotá-lo de uma vez por todas.",
            "thumbnail": "https://image.tmdb.org/t/p/w500/kP23RWbUWM6vGhT9PxFyP5VT3y4.jpg"
          }
        ]
      }
    ]
  },
  ...EXPANDED_CINEMA_CATALOG
];

export function getCinemaById(id: string): CinemaItem | undefined {
  return CINEMA_CATALOG.find((item) => item.id === id || item.imdbId === id);
}

export function getFeaturedCinema(): CinemaItem[] {
  return CINEMA_CATALOG.filter((item) => item.featured);
}

export function getTrendingCinema(): CinemaItem[] {
  return CINEMA_CATALOG.filter((item) => item.trending);
}

export function getAwardWinningCinema(): CinemaItem[] {
  return CINEMA_CATALOG.filter((item) => item.awardWinning);
}

export function getMovies(): CinemaItem[] {
  return CINEMA_CATALOG.filter((item) => item.type === "filme");
}

export function getSeries(): CinemaItem[] {
  return CINEMA_CATALOG.filter((item) => item.type === "serie");
}

const STORAGE_KEY_WATCHLIST = "worsco_cinema_watchlist";
const STORAGE_KEY_PROGRESS = "worsco_cinema_progress";
const STORAGE_KEY_LANGUAGE = "worsco_cinema_language_pref";

export function getCinemaLanguagePreference(): CinemaLanguage {
  if (typeof window === "undefined") return "pt";
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    if (raw === "en" || raw === "pt") return raw;
    return "pt";
  } catch {
    return "pt";
  }
}

export function setCinemaLanguagePreference(lang: CinemaLanguage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
    window.dispatchEvent(new CustomEvent("worscoi_cinema_language_updated", { detail: lang }));
  } catch (e) {
    console.error("Erro ao salvar idioma do cinema:", e);
  }
}

export function getCinemaWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WATCHLIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isCinemaInWatchlist(id: string): boolean {
  return getCinemaWatchlist().includes(id);
}

export function toggleCinemaWatchlist(id: string): boolean {
  const current = getCinemaWatchlist();
  const exists = current.includes(id);
  const updated = exists ? current.filter((item) => item !== id) : [...current, id];
  try {
    localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(updated));
  } catch (e) {
    console.error("Erro ao salvar watchlist de cinema:", e);
  }
  return !exists;
}

export interface CinemaPlaybackProgress {
  itemId: string;
  progressPercent: number;
  seasonNumber?: number;
  episodeNumber?: number;
  updatedAt: string;
}

export function saveCinemaProgress(
  itemId: string,
  progressPercent: number,
  seasonNumber?: number,
  episodeNumber?: number
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    const map: Record<string, CinemaPlaybackProgress> = raw ? JSON.parse(raw) : {};
    map[itemId] = {
      itemId,
      progressPercent,
      seasonNumber,
      episodeNumber,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(map));
  } catch (e) {
    console.error("Erro ao persistir progresso de cinema:", e);
  }
}

export function getCinemaProgressMap(): Record<string, CinemaPlaybackProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
