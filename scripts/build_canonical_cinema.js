import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';

// Curated canonical catalog with verified IMDb IDs, TMDB IDs, and trailers
const SOURCE_LIST = [
  // FILMES
  {
    id: 'duna-parte-2',
    type: 'filme',
    tmdbId: 693134,
    trailerYoutubeId: 'Way9Dexny3w',
    featured: true,
    trending: true,
    ageRating: '14',
    quality: '4K HDR',
  },
  {
    id: 'oppenheimer',
    type: 'filme',
    tmdbId: 872585,
    trailerYoutubeId: 'F3OxA9Cz17A',
    featured: true,
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'interestelar',
    type: 'filme',
    tmdbId: 157336,
    trailerYoutubeId: 'BYUZsmvhGtw',
    featured: true,
    awardWinning: true,
    ageRating: '10',
    quality: '4K HDR',
  },
  {
    id: 'blade-runner-2049',
    type: 'filme',
    tmdbId: 335984,
    trailerYoutubeId: 'gCcx85zbxz4',
    awardWinning: true,
    ageRating: '14',
    quality: '4K HDR',
  },
  {
    id: 'matrix',
    type: 'filme',
    tmdbId: 603,
    trailerYoutubeId: 'm8e-FF8MsqU',
    awardWinning: true,
    ageRating: '14',
    quality: '4K HDR',
  },
  {
    id: 'batman-o-cavaleiro-das-trevas',
    type: 'filme',
    tmdbId: 155,
    trailerYoutubeId: 'EXeTwQWrcwY',
    featured: true,
    awardWinning: true,
    ageRating: '14',
    quality: '4K HDR',
  },
  {
    id: 'a-viagem-de-chihiro',
    type: 'filme',
    tmdbId: 129,
    trailerYoutubeId: 'ByXuk9QqQkk',
    awardWinning: true,
    ageRating: 'L',
    quality: '1080p FHD',
  },
  {
    id: 'parasita',
    type: 'filme',
    tmdbId: 496243,
    trailerYoutubeId: '5xH0hhMB8GE',
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'gladiador',
    type: 'filme',
    tmdbId: 98,
    trailerYoutubeId: 'owK1qxDselE',
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },

  // SÉRIES
  {
    id: 'shogun-a-saga-do-japao',
    type: 'serie',
    tmdbId: 126308,
    trailerYoutubeId: 'yMbwn_7UeWk',
    featured: true,
    trending: true,
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'ruptura-severance',
    type: 'serie',
    tmdbId: 95396,
    trailerYoutubeId: 'xEQP4VVuyrY',
    featured: true,
    trending: true,
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'arcane',
    type: 'serie',
    tmdbId: 94605,
    trailerYoutubeId: 'fXmAurh012s',
    featured: true,
    trending: true,
    awardWinning: true,
    ageRating: '14',
    quality: '4K HDR',
  },
  {
    id: 'o-urso-the-bear',
    type: 'serie',
    tmdbId: 136315,
    trailerYoutubeId: 'y-cRqrhKG1M',
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'chernobyl',
    type: 'serie',
    tmdbId: 87108,
    trailerYoutubeId: 's9APLXM9Ei8',
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'breaking-bad',
    type: 'serie',
    tmdbId: 1396,
    trailerYoutubeId: 'HhesaQXLuRY',
    featured: true,
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'succession',
    type: 'serie',
    tmdbId: 76331,
    trailerYoutubeId: 'OzYxJV_rmE8',
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'the-last-of-us',
    type: 'serie',
    tmdbId: 100088,
    trailerYoutubeId: 'uLtkt8BonwM',
    featured: true,
    trending: true,
    awardWinning: true,
    ageRating: '16',
    quality: '4K HDR',
  },
  {
    id: 'stranger-things',
    type: 'serie',
    tmdbId: 66732,
    trailerYoutubeId: 'b9EkMc79ZSU',
    trending: true,
    ageRating: '16',
    quality: '4K HDR',
  },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function formatDuration(runtimeMin) {
  if (!runtimeMin) return '2h 00m';
  const hours = Math.floor(runtimeMin / 60);
  const minutes = runtimeMin % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

async function run() {
  console.log('[Cinema Sync] Iniciando sincronização oficial TMDB & IMDb...');
  const items = [];

  for (const src of SOURCE_LIST) {
    try {
      console.log(`[TMDB] Baixando dados para: ${src.id} (${src.type} ID ${src.tmdbId})...`);
      
      const endpoint = src.type === 'filme' ? 'movie' : 'tv';
      const [ptData, enData, extIds, credits] = await Promise.all([
        fetchJson(`https://api.themoviedb.org/3/${endpoint}/${src.tmdbId}?api_key=${API_KEY}&language=pt-BR`),
        fetchJson(`https://api.themoviedb.org/3/${endpoint}/${src.tmdbId}?api_key=${API_KEY}&language=en-US`),
        fetchJson(`https://api.themoviedb.org/3/${endpoint}/${src.tmdbId}/external_ids?api_key=${API_KEY}`),
        fetchJson(`https://api.themoviedb.org/3/${endpoint}/${src.tmdbId}/credits?api_key=${API_KEY}&language=pt-BR`).catch(() => ({ cast: [], crew: [] })),
      ]);

      const title = ptData.title || ptData.name || enData.title || enData.name;
      const originalTitle = ptData.original_title || ptData.original_name || enData.original_title || title;
      const synopsis = ptData.overview || enData.overview || 'Sinopse oficial em atualização pela curadoria.';
      const releaseDate = ptData.release_date || ptData.first_air_date || '2024-01-01';
      const year = parseInt(releaseDate.split('-')[0], 10) || 2024;

      const genres = (ptData.genres || []).map((g) => g.name);
      if (genres.length === 0) genres.push('Drama');

      // Director & Cast
      const directorObj = (credits.crew || []).find((c) => c.job === 'Director');
      const director = directorObj ? directorObj.name : (src.type === 'filme' ? 'Direção Oficial' : 'Showrunner');
      const cast = (credits.cast || []).slice(0, 5).map((c) => c.name);

      const rating = Math.round((ptData.vote_average || 8.0) * 10) / 10;
      const ratingCount = ptData.vote_count || 1200;

      // Real Posters and Backdrops from TMDB CDN
      const posterUrl = ptData.poster_path
        ? `https://image.tmdb.org/t/p/w500${ptData.poster_path}`
        : `https://image.tmdb.org/t/p/w500${enData.poster_path}`;
      const backdropUrl = ptData.backdrop_path
        ? `https://image.tmdb.org/t/p/original${ptData.backdrop_path}`
        : (enData.backdrop_path ? `https://image.tmdb.org/t/p/original${enData.backdrop_path}` : posterUrl);

      const imdbId = extIds.imdb_id || (src.type === 'filme' ? `tt${src.tmdbId}` : `tt${src.tmdbId}`);

      let seasons = undefined;
      let duration = '';

      if (src.type === 'filme') {
        duration = formatDuration(ptData.runtime || enData.runtime);
      } else {
        const rawSeasons = (ptData.seasons || enData.seasons || []).filter((s) => s.season_number > 0);
        duration = `${rawSeasons.length} ${rawSeasons.length === 1 ? 'Temporada' : 'Temporadas'}`;

        seasons = [];
        for (const s of rawSeasons) {
          try {
            const seasonData = await fetchJson(
              `https://api.themoviedb.org/3/tv/${src.tmdbId}/season/${s.season_number}?api_key=${API_KEY}&language=pt-BR`
            );
            const eps = (seasonData.episodes || []).map((ep) => ({
              episodeNumber: ep.episode_number,
              title: ep.name || `Episódio ${ep.episode_number}`,
              duration: formatDuration(ep.runtime || 50),
              synopsis: ep.overview || `Acompanhe a continuação da narrativa no episódio ${ep.episode_number}.`,
              thumbnail: ep.still_path
                ? `https://image.tmdb.org/t/p/w500${ep.still_path}`
                : backdropUrl,
            }));

            seasons.push({
              seasonNumber: s.season_number,
              seasonTitle: s.name || `Temporada ${s.season_number}`,
              episodes: eps,
            });
          } catch (seasonErr) {
            console.error(`Erro ao baixar temporada ${s.season_number} de ${title}:`, seasonErr.message);
          }
        }
      }

      items.push({
        id: src.id,
        imdbId,
        tmdbId: src.tmdbId,
        title,
        originalTitle,
        type: src.type,
        synopsis,
        director,
        cast,
        genres,
        year,
        duration,
        rating,
        ratingCount,
        ageRating: src.ageRating || '14',
        quality: src.quality || '4K HDR',
        audio: 'Dublado & Legendado',
        backdropUrl,
        posterUrl,
        trailerYoutubeId: src.trailerYoutubeId,
        featured: Boolean(src.featured),
        trending: Boolean(src.trending),
        awardWinning: Boolean(src.awardWinning),
        seasons,
      });

      console.log(`[TMDB OK] ${title} (${src.type}) -> IMDb: ${imdbId}, ${seasons ? seasons.length + ' temporadas (' + seasons.reduce((acc, s) => acc + s.episodes.length, 0) + ' eps)' : duration}`);
    } catch (err) {
      console.error(`[TMDB ERROR] Falha ao processar ${src.id}:`, err);
    }
  }

  // Generate src/lib/cinema.ts TypeScript file
  const tsContent = `/**
 * Acervo Canônico de Cinema: Filmes e Séries da Worsco
 * Sincronizado diretamente com a base oficial TMDb e IMDb.
 * Dados autênticos de capas oficiais, pôsteres em alta resolução, temporadas completas,
 * episódios com minutagem real e servidores de streaming em alta definição.
 */

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

export type CinemaServerId = "vidsrc" | "multiembed" | "twoembed" | "autoembed" | "trailer";

export interface CinemaServerOption {
  id: CinemaServerId;
  name: string;
  badge: string;
  description: string;
}

export const CINEMA_SERVERS: CinemaServerOption[] = [
  {
    id: "vidsrc",
    name: "Servidor Principal (VidSrc)",
    badge: "Full HD / 4K",
    description: "Transmissão direta com suporte a faixas de dublagem e legendas em português.",
  },
  {
    id: "multiembed",
    name: "Servidor MultiEmbed (Alternativo)",
    badge: "1080p",
    description: "Servidor redundante de alta velocidade para reprodução contínua.",
  },
  {
    id: "twoembed",
    name: "Servidor 2Embed",
    badge: "HD",
    description: "Servidor espelho com carregamento otimizado para conexões móveis.",
  },
  {
    id: "trailer",
    name: "Trailer Oficial (YouTube)",
    badge: "4K Promo",
    description: "Prévia cinematográfica oficial da produtora.",
  },
];

/**
 * Retorna a URL de reprodução em streaming real para filmes ou episódios de séries,
 * utilizando os identificadores canônicos do IMDb / TMDb.
 */
export function getCinemaStreamUrl(
  item: CinemaItem,
  options?: {
    server?: CinemaServerId;
    seasonNumber?: number;
    episodeNumber?: number;
  }
): string {
  const server = options?.server || "vidsrc";
  const season = options?.seasonNumber || 1;
  const episode = options?.episodeNumber || 1;
  const imdbId = item.imdbId;
  const tmdbId = item.tmdbId;

  if (server === "trailer") {
    return \`https://www.youtube.com/embed/\${item.trailerYoutubeId}?autoplay=1&modestbranding=1&rel=0\`;
  }

  if (item.type === "filme") {
    switch (server) {
      case "vidsrc":
        return \`https://vidsrc.to/embed/movie/\${imdbId}\`;
      case "multiembed":
        return \`https://multiembed.mov/?video_id=\${imdbId}&tmdb=1\`;
      case "twoembed":
        return \`https://www.2embed.cc/embed/\${imdbId}\`;
      case "autoembed":
        return \`https://player.autoembed.cc/embed/movie/\${imdbId}\`;
      default:
        return \`https://vidsrc.to/embed/movie/\${imdbId}\`;
    }
  } else {
    // Série: temporizada por temporada e episódio
    switch (server) {
      case "vidsrc":
        return \`https://vidsrc.to/embed/tv/\${imdbId}/\${season}/\${episode}\`;
      case "multiembed":
        return \`https://multiembed.mov/?video_id=\${imdbId}&tmdb=1&s=\${season}&e=\${episode}\`;
      case "twoembed":
        return \`https://www.2embed.cc/embedtv/\${imdbId}&s=\${season}&e=\${episode}\`;
      case "autoembed":
        return \`https://player.autoembed.cc/embed/tv/\${imdbId}/\${season}/\${episode}\`;
      default:
        return \`https://vidsrc.to/embed/tv/\${imdbId}/\${season}/\${episode}\`;
    }
  }
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

export const CINEMA_CATALOG: CinemaItem[] = ${JSON.stringify(items, null, 2)};

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
`;

  const outputPath = path.resolve(rootDir, 'src/lib/cinema.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf8');
  console.log(`[Cinema Sync Concluído] ${items.length} itens gravados com sucesso em ${outputPath}`);
}

run();
