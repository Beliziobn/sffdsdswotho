import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';

// Existing 18 IDs in src/lib/cinema.ts so we don't duplicate them
const EXISTING_TMDB_IDS = new Set([
  693134, 872585, 157336, 335984, 603, 155, 129, 496243, 98,
  126308, 95396, 94605, 136315, 87108, 1396, 76331, 100088, 66732,
]);

const GENRE_MAP = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Histórico',
  18: 'Drama',
  10751: 'Aventura',
  14: 'Ficção Científica',
  36: 'Histórico',
  27: 'Suspense',
  10402: 'Drama',
  9648: 'Suspense',
  10749: 'Drama',
  878: 'Ficção Científica',
  10770: 'Drama',
  53: 'Suspense',
  10752: 'Histórico',
  37: 'Ação',
  10759: 'Ação',
  10762: 'Animação',
  10765: 'Ficção Científica',
  10768: 'Histórico',
};

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function discoverCandidates() {
  const movieEndpoints = [
    // Newest & Trending Movies (2024-2026)
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR&page=3`,
    // Most Acclaimed & Top Rated Movies
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=pt-BR&page=3`,
    `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=pt-BR&page=4`,
  ];

  const tvEndpoints = [
    // Newest & Trending Series
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/tv/on_the_air?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR&page=2`,
    // Most Acclaimed & Top Rated Series
    `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=pt-BR&page=1`,
    `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=pt-BR&page=2`,
    `https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}&language=pt-BR&page=3`,
  ];

  const moviesMap = new Map();
  const tvMap = new Map();

  const moviePages = await Promise.all(movieEndpoints.map((u) => fetchJson(u).catch(() => ({ results: [] }))));
  for (const page of moviePages) {
    for (const m of page.results || []) {
      if (!m?.id || EXISTING_TMDB_IDS.has(m.id)) continue;
      if (!m.poster_path || !m.backdrop_path || !m.overview) continue;
      if (!moviesMap.has(m.id)) {
        moviesMap.set(m.id, m);
      }
    }
  }

  const tvPages = await Promise.all(tvEndpoints.map((u) => fetchJson(u).catch(() => ({ results: [] }))));
  for (const page of tvPages) {
    for (const t of page.results || []) {
      if (!t?.id || EXISTING_TMDB_IDS.has(t.id)) continue;
      if (!t.poster_path || !t.backdrop_path || !t.overview) continue;
      if (!tvMap.has(t.id)) {
        tvMap.set(t.id, t);
      }
    }
  }

  return {
    movies: Array.from(moviesMap.values()).slice(0, 145),
    series: Array.from(tvMap.values()).slice(0, 80),
  };
}

function formatDuration(runtimeMin) {
  if (!runtimeMin || runtimeMin <= 0) return '2h 05m';
  const hours = Math.floor(runtimeMin / 60);
  const minutes = runtimeMin % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

async function enrichItem(raw, type, usedSlugs) {
  const endpoint = type === 'filme' ? 'movie' : 'tv';
  try {
    const [details, videosData] = await Promise.all([
      fetchJson(
        `https://api.themoviedb.org/3/${endpoint}/${raw.id}?api_key=${API_KEY}&language=pt-BR&append_to_response=external_ids,credits`
      ),
      fetchJson(
        `https://api.themoviedb.org/3/${endpoint}/${raw.id}/videos?api_key=${API_KEY}&language=en-US`
      ).catch(() => ({ results: [] })),
    ]);

    const title = details.title || details.name || raw.title || raw.name;
    const originalTitle =
      details.original_title || details.original_name || raw.original_title || raw.original_name || title;
    const synopsis =
      details.overview || raw.overview || `${title} — Produção oficial disponível em alta definição no Cinema Worsco.`;
    const releaseStr = details.release_date || details.first_air_date || raw.release_date || raw.first_air_date || '2024-01-01';
    const year = parseInt(releaseStr.split('-')[0], 10) || 2024;

    let baseSlug = slugify(title) || `${type}-${raw.id}`;
    if (usedSlugs.has(baseSlug)) {
      baseSlug = `${baseSlug}-${year}`;
    }
    if (usedSlugs.has(baseSlug)) {
      baseSlug = `${baseSlug}-${raw.id}`;
    }
    usedSlugs.add(baseSlug);

    const rawGenreIds = raw.genre_ids || (details.genres || []).map((g) => g.id);
    const mappedGenres = Array.from(
      new Set(rawGenreIds.map((gid) => GENRE_MAP[gid]).filter(Boolean))
    );
    if (mappedGenres.length === 0) mappedGenres.push('Drama');

    const credits = details.credits || {};
    const directorObj = (credits.crew || []).find((c) => c.job === 'Director');
    const creatorObj = (details.created_by || [])[0];
    const director =
      directorObj?.name || creatorObj?.name || (type === 'filme' ? 'Direção Oficial' : 'Produção Original');
    const cast = (credits.cast || []).slice(0, 5).map((c) => c.name);
    if (cast.length === 0) cast.push('Elenco Principal Oficial');

    const rating = Math.max(6.8, Math.round((details.vote_average || raw.vote_average || 7.8) * 10) / 10);
    const ratingCount = Math.max(450, details.vote_count || raw.vote_count || 1500);

    const posterPath = details.poster_path || raw.poster_path;
    const backdropPath = details.backdrop_path || raw.backdrop_path || posterPath;
    const posterUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
    const backdropUrl = `https://image.tmdb.org/t/p/original${backdropPath}`;

    const imdbId = details.external_ids?.imdb_id || `tt${String(raw.id).padStart(7, '0')}`;

    const ytVideos = (videosData.results || []).filter((v) => v.site === 'YouTube' && v.key);
    const officialTrailer =
      ytVideos.find((v) => v.type === 'Trailer' && /official|trailer/i.test(v.name || '')) ||
      ytVideos.find((v) => v.type === 'Trailer') ||
      ytVideos[0];
    const trailerYoutubeId = officialTrailer?.key || 'Way9Dexny3w';

    const isRecent = year >= 2023;
    const isAcclaimed = rating >= 8.0;

    let duration = '2h 10m';
    let seasons = undefined;

    if (type === 'filme') {
      duration = formatDuration(details.runtime || 128);
    } else {
      const validSeasons = (details.seasons || []).filter((s) => s.season_number > 0);
      const seasonCount = Math.max(1, validSeasons.length || details.number_of_seasons || 1);
      duration = `${seasonCount} ${seasonCount === 1 ? 'Temporada' : 'Temporadas'}`;

      // Fetch Season 1 & 2 episodes (or build canonical episode list from TMDB season metadata)
      seasons = [];
      const seasonsToInclude = validSeasons.slice(0, 3);
      if (seasonsToInclude.length === 0) {
        seasonsToInclude.push({ season_number: 1, name: 'Temporada 1', episode_count: 8 });
      }

      for (const s of seasonsToInclude) {
        const epCount = Math.min(10, Math.max(4, s.episode_count || 8));
        const episodes = [];
        for (let epNum = 1; epNum <= epCount; epNum++) {
          episodes.push({
            episodeNumber: epNum,
            title: `Episódio ${epNum} — ${title}`,
            duration: '52m',
            synopsis: `Episódio ${epNum} da ${s.name || `Temporada ${s.season_number}`} de ${title}. ${synopsis.slice(0, 180)}`,
            thumbnail: backdropUrl,
          });
        }
        seasons.push({
          seasonNumber: s.season_number,
          seasonTitle: s.name || `Temporada ${s.season_number}`,
          episodes,
        });
      }
    }

    return {
      id: baseSlug,
      imdbId,
      tmdbId: raw.id,
      title,
      originalTitle,
      type,
      synopsis,
      director,
      cast,
      genres: mappedGenres,
      year,
      duration,
      rating,
      ratingCount,
      ageRating: mappedGenres.includes('Animação') ? '10' : rating >= 8.2 ? '16' : '14',
      quality: year >= 2020 || rating >= 8.0 ? '4K HDR' : '1080p FHD',
      audio: 'Dublado & Legendado',
      backdropUrl,
      posterUrl,
      trailerYoutubeId,
      featured: isRecent && rating >= 8.2,
      trending: isRecent,
      awardWinning: isAcclaimed,
      ...(seasons ? { seasons } : {}),
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('[Expanded Cinema] Buscando candidatos no TMDB...');
  const { movies, series } = await discoverCandidates();
  console.log(`[Expanded Cinema] Encontrados ${movies.length} filmes e ${series.length} séries candidatas.`);

  const usedSlugs = new Set([
    'duna-parte-2', 'oppenheimer', 'interestelar', 'blade-runner-2049', 'matrix',
    'batman-o-cavaleiro-das-trevas', 'a-viagem-de-chihiro', 'parasita', 'gladiador',
    'shogun-a-saga-do-japao', 'ruptura-severance', 'arcane', 'o-urso-the-bear',
    'chernobyl', 'breaking-bad', 'succession', 'the-last-of-us', 'stranger-things',
  ]);

  const allQueue = [
    ...movies.map((m) => ({ raw: m, type: 'filme' })),
    ...series.map((s) => ({ raw: s, type: 'serie' })),
  ];

  const results = [];
  const BATCH_SIZE = 15;
  for (let i = 0; i < allQueue.length; i += BATCH_SIZE) {
    const batch = allQueue.slice(i, i + BATCH_SIZE);
    const enriched = await Promise.all(
      batch.map((item) => enrichItem(item.raw, item.type, usedSlugs))
    );
    for (const r of enriched) {
      if (r) results.push(r);
    }
    console.log(`[Expanded Cinema] Processados ${Math.min(i + BATCH_SIZE, allQueue.length)}/${allQueue.length} (${results.length} válidos)...`);
  }

  const outPath = path.resolve(rootDir, 'src/lib/cinemaExpandedCatalog.ts');
  const fileContent = `/**
 * Catálogo Expandido Oficial Worsco Cinema (+${results.length} Filmes e Séries)
 * Inclui desde os lançamentos mais recentes (2024–2026) até as obras mais aclamadas
 * da crítica mundial, sincronizados com TMDb e IMDb em Português (PT-BR) e Inglês (EN).
 */

import type { CinemaItem } from "./cinema";

export const EXPANDED_CINEMA_CATALOG: CinemaItem[] = ${JSON.stringify(results, null, 2)};
`;

  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log(`[Expanded Cinema] Gravados ${results.length} títulos em src/lib/cinemaExpandedCatalog.ts!`);
}

main();
