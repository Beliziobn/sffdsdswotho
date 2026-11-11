import type { Plugin } from 'vite';
import crypto from 'crypto';
import zlib from 'zlib';
import { Readable } from 'stream';

const VIDSTUCK_AES_PASSPHRASE = '7f4c9e2a81d63b05c4f7a9e8126d3b50e1a8c7f23d9465ab0c6e9f1d4a7b832c';

// Vidstuck backend obfuscated parameter keys
const K_TMDB_ID = 'a7f39c821d604e5b9157b';
const K_TS = '61d9a5274c8e3b2f8291e6';
const K_TOKEN = 'c492f7a183d0e36c538a716d';
const K_TITLE = '5e28c9147a0de29f3674b392a1';
const K_YEAR = 'b731e6c94f87f8341c306e';
const K_SEASON = 'd8427b5c82f957c3613e85b';
const K_EPISODE = '91c6ea5d1f785c92346b713d';
const K_SERVER = '6b491e28392e7561a9384c';
const K_MEDIA_TYPE = 'c1306d28147a35632e816b';
const K_DATE = 'e1649139e5814b3027';
const K_LATEST_DATE = 'e95416ad739e5814b3027';
const K_IMDB_ID = 'f35a814265e871c4933a725f';

export interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface ResolvedStream {
  id: string;
  server: string;
  label: string;
  type: 'mp4' | 'hls';
  audioMode: 'dublado' | 'legendado' | 'original' | 'multi';
  langCode: string;
  quality: string;
  url: string;
  proxyUrl: string;
}

interface OrionDubOption {
  type: number; // 0 = dub, 1 = sub
  lanCode: string;
  lanName: string;
}

interface OrionLinkItem {
  link?: string;
  type?: string;
  resolution?: string | number | null;
}

const resolveCache = new Map<string, { expiresAt: number; payload: any }>();
const subtitleVttCache = new Map<string, { expiresAt: number; vtt: string; cues: SubtitleCue[] }>();

function evpBytesToKey(password: string, salt: Buffer, keyLen = 32, ivLen = 16): { key: Buffer; iv: Buffer } {
  let dtot = Buffer.alloc(0);
  let d = Buffer.alloc(0);
  const passBuf = Buffer.from(password, 'utf8');
  while (dtot.length < keyLen + ivLen) {
    d = crypto
      .createHash('md5')
      .update(Buffer.concat([d, passBuf, salt]))
      .digest();
    dtot = Buffer.concat([dtot, d]);
  }
  return {
    key: dtot.subarray(0, keyLen),
    iv: dtot.subarray(keyLen, keyLen + ivLen),
  };
}

function decryptVidstuckLink(enc: string): string | null {
  try {
    if (!enc) return null;
    const innerB64 = enc.startsWith('xArD_')
      ? Buffer.from(enc.slice(5), 'base64').toString('utf8')
      : enc;
    const raw = Buffer.from(innerB64, 'base64');
    if (raw.length < 17) return null;
    const salt = raw.subarray(8, 16);
    const ct = raw.subarray(16);
    const { key, iv } = evpBytesToKey(VIDSTUCK_AES_PASSPHRASE, salt);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8').trim();
    if (!decrypted) return null;
    if (decrypted.startsWith('/')) {
      return `https://vidstuck.cc${decrypted}`;
    }
    return decrypted;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 9500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAndromedaToken(
  commonHeaders: Record<string, string>,
  tmdbId: string,
  mediaType: 'movie' | 'tv',
  serverKey: string,
  season?: string,
  episode?: string
): Promise<{ token: string; ts: number } | null> {
  try {
    const tokenBody: Record<string, any> = {
      [K_TMDB_ID]: String(tmdbId),
      [K_MEDIA_TYPE]: mediaType,
      [K_SERVER]: serverKey,
    };
    if (mediaType === 'tv') {
      tokenBody[K_SEASON] = Number(season || '1');
      tokenBody[K_EPISODE] = Number(episode || '1');
    }

    const tokRes = await fetchWithTimeout(
      'https://vidstuck.cc/backend/andromeda',
      {
        method: 'POST',
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenBody),
      },
      10000
    );
    if (!tokRes.ok) return null;
    const tok = (await tokRes.json()) as { token?: string; ts?: number } | null;
    if (!tok?.token || !tok?.ts) return null;
    return { token: tok.token, ts: tok.ts };
  } catch {
    return null;
  }
}

async function queryOrionVariant(params: {
  commonHeaders: Record<string, string>;
  tmdbId: string;
  mediaType: 'movie' | 'tv';
  title: string;
  year: string;
  date: string;
  latestDate: string;
  imdbId: string;
  season?: string;
  episode?: string;
  dubCode: string;
  dubType: '0' | '1';
}): Promise<{ links: OrionLinkItem[]; dubs: OrionDubOption[] } | null> {
  const tok = await fetchAndromedaToken(
    params.commonHeaders,
    params.tmdbId,
    params.mediaType,
    'orion',
    params.season,
    params.episode
  );
  if (!tok) return null;

  const q = new URLSearchParams({
    [K_TMDB_ID]: String(params.tmdbId),
    [K_SERVER]: 'orion',
    [K_MEDIA_TYPE]: params.mediaType,
    [K_TS]: String(tok.ts),
    [K_TOKEN]: tok.token,
    [K_TITLE]: params.title,
    [K_YEAR]: params.year,
    [K_DATE]: params.date,
    dubCode: params.dubCode,
    dubType: params.dubType,
  });

  if (params.mediaType === 'tv') {
    q.set(K_SEASON, String(params.season || '1'));
    q.set(K_EPISODE, String(params.episode || '1'));
    if (params.latestDate) {
      q.set(K_LATEST_DATE, params.latestDate);
    }
  }
  if (params.imdbId) {
    q.set(K_IMDB_ID, params.imdbId);
  }

  try {
    const srvRes = await fetchWithTimeout(
      `https://vidstuck.cc/backend/servers/orion?${q.toString()}`,
      { headers: params.commonHeaders },
      11000
    );
    if (!srvRes.ok) return null;
    const data = (await srvRes.json()) as {
      links?: OrionLinkItem[];
      dubs?: OrionDubOption[];
    } | null;
    if (!data || !Array.isArray(data.links) || data.links.length === 0) return null;
    return {
      links: data.links,
      dubs: Array.isArray(data.dubs) ? data.dubs : [],
    };
  } catch {
    return null;
  }
}

function appendOrionLinksAsStreams(
  streams: ResolvedStream[],
  links: OrionLinkItem[],
  audioMode: 'dublado' | 'legendado' | 'original',
  langCode: string,
  labelPrefix: string
) {
  const sorted = [...links].sort((a, b) => {
    const resA = parseInt(String(a.resolution || '0'), 10) || 0;
    const resB = parseInt(String(b.resolution || '0'), 10) || 0;
    return resB - resA;
  });

  sorted.forEach((item, idx) => {
    if (!item.link) return;
    const decryptedUrl = decryptVidstuckLink(item.link);
    if (!decryptedUrl || !decryptedUrl.startsWith('http')) return;
    const resNum = parseInt(String(item.resolution || '1080'), 10) || 1080;
    const qualityLabel = resNum >= 1080 ? '1080p FHD' : resNum >= 720 ? '720p HD' : `${resNum}p`;
    const isHls = item.type === 'hls' || decryptedUrl.includes('.m3u8');

    streams.push({
      id: `orion-${audioMode}-${langCode}-${resNum}-${idx}`,
      server: 'orion',
      label: `${labelPrefix} (${qualityLabel})`,
      type: isHls ? 'hls' : 'mp4',
      audioMode,
      langCode,
      quality: qualityLabel,
      url: decryptedUrl,
      proxyUrl: isHls
        ? `/api/cinema/hls-proxy?url=${encodeURIComponent(decryptedUrl)}`
        : `/api/cinema/mp4-proxy?url=${encodeURIComponent(decryptedUrl)}`,
    });
  });
}

async function resolveVidstuckStreams(params: {
  tmdbId: string;
  imdbId: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  season?: string;
  episode?: string;
}): Promise<{
  streams: ResolvedStream[];
  resolvedImdbId: string;
  hasPtDub: boolean;
  hasPtSub: boolean;
}> {
  const refererUrl =
    params.type === 'tv'
      ? `https://vidstuck.cc/embed/tv/${params.tmdbId}/${params.season || '1'}/${params.episode || '1'}`
      : `https://vidstuck.cc/embed/movie/${params.tmdbId}`;

  const commonHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Referer: refererUrl,
    Origin: 'https://vidstuck.cc',
    Accept: 'application/json',
  };

  // Step 1: Fetch canonical TMDb details from vidstuck backend so title/release_date/imdb_id match exactly
  let canonicalTitle = params.title;
  let canonicalDate = params.year ? `${params.year}-01-01` : '2024-01-01';
  let canonicalLatestDate = '';
  let canonicalYear = params.year || '2024';
  let canonicalImdbId = params.imdbId;

  try {
    const detailsRes = await fetchWithTimeout(
      `https://vidstuck.cc/backend/tmdb/details/${params.type}/${params.tmdbId}?language=en-US`,
      { headers: commonHeaders },
      9500
    );
    if (detailsRes.ok) {
      const d = (await detailsRes.json()) as {
        title?: string;
        name?: string;
        release_date?: string;
        first_air_date?: string;
        last_air_date?: string;
        imdb_id?: string;
      };
      if (d.title || d.name) canonicalTitle = (d.title || d.name)!;
      // Note: vidstuck returns d.release_date for both movie and tv details
      const rel = d.release_date || d.first_air_date;
      if (rel) {
        canonicalDate = String(rel);
        const y = new Date(rel).getFullYear();
        if (!Number.isNaN(y)) canonicalYear = String(y);
      }
      if (d.last_air_date) canonicalLatestDate = String(d.last_air_date);
      if (d.imdb_id) canonicalImdbId = d.imdb_id;
    }
  } catch {
    // Fallback to passed params
  }

  const streams: ResolvedStream[] = [];
  let hasPtDub = false;
  let hasPtSub = false;

  // Step 2: Query Orion Multi-Audio Server (Real PT-BR Dublado MP4, PT-BR Legendado MP4, and Original Audio MP4)
  // and HLS Servers (atlas, milkyway, berkas, andromeda) in parallel
  const orionPromise = (async () => {
    // Request ptbr:0 first so if Brazilian Portuguese Dub exists, we get it immediately in 1 round-trip
    let initialOrion = await queryOrionVariant({
      commonHeaders,
      tmdbId: params.tmdbId,
      mediaType: params.type,
      title: canonicalTitle,
      year: canonicalYear,
      date: canonicalDate,
      latestDate: canonicalLatestDate,
      imdbId: canonicalImdbId,
      season: params.season,
      episode: params.episode,
      dubCode: 'ptbr',
      dubType: '0',
    });

    // If canonicalTitle had special characters (e.g., 【OSHI NO KO】) and returned null, retry with ASCII title
    if (!initialOrion && /[^\x20-\x7E]/.test(canonicalTitle)) {
      const asciiTitle = canonicalTitle
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s:'-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (asciiTitle && asciiTitle !== canonicalTitle) {
        initialOrion = await queryOrionVariant({
          commonHeaders,
          tmdbId: params.tmdbId,
          mediaType: params.type,
          title: asciiTitle,
          year: canonicalYear,
          date: canonicalDate,
          latestDate: canonicalLatestDate,
          imdbId: canonicalImdbId,
          season: params.season,
          episode: params.episode,
          dubCode: 'ptbr',
          dubType: '0',
        });
        if (initialOrion) {
          canonicalTitle = asciiTitle;
        }
      }
    }

    if (!initialOrion) return;

    const dubs = initialOrion.dubs;
    const hasPtbrDub = dubs.some((d) => d.lanCode === 'ptbr' && d.type === 0);
    const hasPtStdDub = dubs.some((d) => d.lanCode === 'pt' && d.type === 0);
    const ptSubOption = dubs.find((d) => (d.lanCode === 'ptbr' || d.lanCode === 'pt') && d.type === 1);
    const origOption =
      dubs.find((d) => /original/i.test(d.lanName) && d.type === 0) ||
      dubs.find((d) => (d.lanCode === 'en' || d.lanCode === 'ja' || d.lanCode === 'ko') && d.type === 0);

    if (hasPtbrDub) {
      hasPtDub = true;
      appendOrionLinksAsStreams(
        streams,
        initialOrion.links,
        'dublado',
        'ptbr',
        'Português Dublado (PT-BR)'
      );
    } else {
      // When ptbr:0 is not in dubs, Orion returns the default/original audio links in initialOrion.links
      appendOrionLinksAsStreams(
        streams,
        initialOrion.links,
        'original',
        origOption?.lanCode || 'en',
        'Áudio Original'
      );
    }

    const followUpTasks: Promise<void>[] = [];

    // If pt:0 exists (and not ptbr:0), fetch Portuguese Dub
    if (!hasPtbrDub && hasPtStdDub) {
      followUpTasks.push(
        (async () => {
          const ptDubRes = await queryOrionVariant({
            commonHeaders,
            tmdbId: params.tmdbId,
            mediaType: params.type,
            title: canonicalTitle,
            year: canonicalYear,
            date: canonicalDate,
            latestDate: canonicalLatestDate,
            imdbId: canonicalImdbId,
            season: params.season,
            episode: params.episode,
            dubCode: 'pt',
            dubType: '0',
          });
          if (ptDubRes && ptDubRes.links.length > 0) {
            hasPtDub = true;
            appendOrionLinksAsStreams(
              streams,
              ptDubRes.links,
              'dublado',
              'pt',
              'Português Dublado'
            );
          }
        })()
      );
    }

    // If pt:1 / ptbr:1 (Portuguese Subtitled MP4) exists, fetch it so Legendado mode has burned/native PT subtitles
    if (ptSubOption) {
      followUpTasks.push(
        (async () => {
          const ptSubRes = await queryOrionVariant({
            commonHeaders,
            tmdbId: params.tmdbId,
            mediaType: params.type,
            title: canonicalTitle,
            year: canonicalYear,
            date: canonicalDate,
            latestDate: canonicalLatestDate,
            imdbId: canonicalImdbId,
            season: params.season,
            episode: params.episode,
            dubCode: ptSubOption.lanCode,
            dubType: '1',
          });
          if (ptSubRes && ptSubRes.links.length > 0) {
            hasPtSub = true;
            appendOrionLinksAsStreams(
              streams,
              ptSubRes.links,
              'legendado',
              ptSubOption.lanCode,
              'Português Legendado (PT-BR)'
            );
          }
        })()
      );
    }

    // If initialOrion returned ptbr:0 (Dublado), also fetch Original Audio (en:0 / ja:0) so user can switch to Original
    if (hasPtbrDub && origOption && origOption.lanCode !== 'ptbr') {
      followUpTasks.push(
        (async () => {
          const origRes = await queryOrionVariant({
            commonHeaders,
            tmdbId: params.tmdbId,
            mediaType: params.type,
            title: canonicalTitle,
            year: canonicalYear,
            date: canonicalDate,
            latestDate: canonicalLatestDate,
            imdbId: canonicalImdbId,
            season: params.season,
            episode: params.episode,
            dubCode: origOption.lanCode,
            dubType: '0',
          });
          if (origRes && origRes.links.length > 0) {
            appendOrionLinksAsStreams(
              streams,
              origRes.links,
              'original',
              origOption.lanCode,
              'Áudio Original'
            );
          }
        })()
      );
    }

    await Promise.all(followUpTasks);
  })();

  // HLS Servers (atlas, milkyway, berkas, andromeda)
  const hlsServers = [
    { key: 'atlas', label: 'Stream 1080p FHD (Atlas)' },
    { key: 'milkyway', label: 'Stream 1080p FHD (Milkyway)' },
    { key: 'berkas', label: 'Stream 1080p FHD (Berkas)' },
    { key: 'andromeda', label: 'Stream 1080p FHD (Andromeda)' },
  ];

  const hlsPromises = hlsServers.map(async (srv, idx) => {
    try {
      const tok = await fetchAndromedaToken(
        commonHeaders,
        params.tmdbId,
        params.type,
        srv.key,
        params.season,
        params.episode
      );
      if (!tok) return;

      const q = new URLSearchParams({
        [K_TMDB_ID]: String(params.tmdbId),
        [K_SERVER]: srv.key,
        [K_MEDIA_TYPE]: params.type,
        [K_TS]: String(tok.ts),
        [K_TOKEN]: tok.token,
        [K_TITLE]: canonicalTitle,
        [K_YEAR]: canonicalYear,
        [K_DATE]: canonicalDate,
      });
      if (params.type === 'tv') {
        q.set(K_SEASON, String(params.season || '1'));
        q.set(K_EPISODE, String(params.episode || '1'));
        if (canonicalLatestDate) {
          q.set(K_LATEST_DATE, canonicalLatestDate);
        }
      }
      if (canonicalImdbId) {
        q.set(K_IMDB_ID, canonicalImdbId);
      }

      const srvRes = await fetchWithTimeout(
        `https://vidstuck.cc/backend/servers/${srv.key}?${q.toString()}`,
        { headers: commonHeaders },
        8500
      );
      if (!srvRes.ok) return;
      const data = (await srvRes.json()) as {
        links?: OrionLinkItem[];
      } | null;
      if (!Array.isArray(data?.links) || data!.links.length === 0) return;

      const firstLink = data!.links.find((l) => l.type === 'hls' && l.link) || data!.links[0];
      if (!firstLink?.link) return;

      const decryptedUrl = decryptVidstuckLink(firstLink.link);
      if (!decryptedUrl || !decryptedUrl.startsWith('http')) return;

      const isMp4 = firstLink.type === 'mp4' || /\.mp4($|\?)/i.test(decryptedUrl);
      streams.push({
        id: `hls-${srv.key}-${idx}`,
        server: srv.key,
        label: srv.label,
        type: isMp4 ? 'mp4' : 'hls',
        audioMode: 'multi',
        langCode: 'en',
        quality: '1080p FHD',
        url: decryptedUrl,
        proxyUrl: isMp4
          ? `/api/cinema/mp4-proxy?url=${encodeURIComponent(decryptedUrl)}`
          : `/api/cinema/hls-proxy?url=${encodeURIComponent(decryptedUrl)}`,
      });
    } catch {
      // Ignore single server error
    }
  });

  await Promise.all([orionPromise, ...hlsPromises]);

  // Sort streams: Orion Dublado PT-BR first, then Orion Legendado PT-BR, then Orion Original, then HLS servers
  const modePriority: Record<ResolvedStream['audioMode'], number> = {
    dublado: 0,
    legendado: 1,
    original: 2,
    multi: 3,
  };
  streams.sort((a, b) => modePriority[a.audioMode] - modePriority[b.audioMode]);

  return { streams, resolvedImdbId: canonicalImdbId, hasPtDub, hasPtSub };
}

function parseSrtTimeToSeconds(timeStr: string): number {
  const cleaned = timeStr.trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length !== 3) return 0;
  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function srtToVttAndCues(srtRaw: string): { vtt: string; cues: SubtitleCue[] } {
  const normalized = srtRaw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const cues: SubtitleCue[] = [];
  const vttLines: string[] = ['WEBVTT', ''];

  let cueIndex = 1;
  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    let timeLineIdx = 0;
    if (!lines[0].includes('-->') && lines[1]?.includes('-->')) {
      timeLineIdx = 1;
    }
    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startRaw, endRaw] = timeLine.split('-->').map((s) => s.trim().split(' ')[0]);
    if (!startRaw || !endRaw) continue;

    const startSec = parseSrtTimeToSeconds(startRaw);
    const endSec = parseSrtTimeToSeconds(endRaw);
    if (endSec <= startSec) continue;

    const rawText = lines
      .slice(timeLineIdx + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\{[^}]+\}/g, '')
      .trim();

    if (!rawText) continue;
    if (
      /opensubtitles|subscene|yify|addic7ed|osdb\.link|watch online|free movies|legenda por|sincronizado por|traduzido por|www\.|http/i.test(
        rawText
      )
    ) {
      continue;
    }

    const vttStart = startRaw.replace(',', '.');
    const vttEnd = endRaw.replace(',', '.');
    vttLines.push(`${cueIndex}`);
    vttLines.push(`${vttStart} --> ${vttEnd}`);
    vttLines.push(lines.slice(timeLineIdx + 1).join('\n'));
    vttLines.push('');

    cues.push({
      id: cueIndex,
      start: Number(startSec.toFixed(2)),
      end: Number(endSec.toFixed(2)),
      text: rawText,
    });
    cueIndex++;
  }

  return {
    vtt: vttLines.join('\n'),
    cues,
  };
}

async function fetchOpenSubtitlesTrack(params: {
  imdbId: string;
  lang3: 'pob' | 'por' | 'eng';
  type: 'movie' | 'tv';
  season?: string;
  episode?: string;
}): Promise<{ vtt: string; cues: SubtitleCue[] } | null> {
  const cleanImdb = params.imdbId.replace(/^tt/i, '');
  if (!cleanImdb) return null;

  const cacheKey = `${cleanImdb}:${params.lang3}:${params.type}:${params.season || 0}:${params.episode || 0}`;
  const cached = subtitleVttCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { vtt: cached.vtt, cues: cached.cues };
  }

  let searchUrl = `https://rest.opensubtitles.org/search/imdbid-${cleanImdb}/sublanguageid-${params.lang3}`;
  if (params.type === 'tv' && params.season && params.episode) {
    searchUrl = `https://rest.opensubtitles.org/search/episode-${params.episode}/imdbid-${cleanImdb}/season-${params.season}/sublanguageid-${params.lang3}`;
  }

  try {
    const res = await fetchWithTimeout(
      searchUrl,
      {
        headers: {
          'User-Agent': 'TemporaryUserAgent',
          'X-User-Agent': 'TemporaryUserAgent',
          Accept: 'application/json',
        },
      },
      7000
    );
    if (!res.ok) return null;
    const list = (await res.json()) as Array<{
      SubFormat?: string;
      SubDownloadLink?: string;
      SubDownloadsCnt?: string;
      SubBad?: string;
    }>;
    if (!Array.isArray(list) || list.length === 0) return null;

    const candidates = list
      .filter((item) => (item.SubFormat === 'srt' || !item.SubFormat) && item.SubDownloadLink && item.SubBad !== '1')
      .sort((a, b) => (parseInt(b.SubDownloadsCnt || '0', 10) || 0) - (parseInt(a.SubDownloadsCnt || '0', 10) || 0));

    const chosen = candidates[0] || list[0];
    if (!chosen?.SubDownloadLink) return null;

    const gzRes = await fetchWithTimeout(
      chosen.SubDownloadLink,
      {
        headers: {
          'User-Agent': 'TemporaryUserAgent',
        },
      },
      7500
    );
    if (!gzRes.ok) return null;
    const gzBuf = Buffer.from(await gzRes.arrayBuffer());
    let srtText: string;
    try {
      srtText = zlib.gunzipSync(gzBuf).toString('utf8');
    } catch {
      srtText = gzBuf.toString('utf8');
    }

    const parsed = srtToVttAndCues(srtText);
    subtitleVttCache.set(cacheKey, {
      expiresAt: Date.now() + 1000 * 60 * 60 * 6,
      vtt: parsed.vtt,
      cues: parsed.cues,
    });
    return parsed;
  } catch {
    return null;
  }
}

async function translateCuesToPortuguese(cues: SubtitleCue[]): Promise<SubtitleCue[]> {
  if (!cues || cues.length === 0) return [];
  const translated: SubtitleCue[] = [];
  const BATCH_SIZE = 25;

  for (let i = 0; i < cues.length; i += BATCH_SIZE) {
    const batch = cues.slice(i, i + BATCH_SIZE);
    const combined = batch.map((c) => c.text.replace(/\s+/g, ' ')).join(' __BR__ ');
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(combined)}`;
      const res = await fetchWithTimeout(url, {}, 5000);
      if (res.ok) {
        const json = await res.json();
        const fullTranslated = (json?.[0] || []).map((s: any) => s[0] || '').join('');
        const parts = fullTranslated.split('__BR__').map((s: string) => s.trim());
        batch.forEach((c, idx) => {
          translated.push({
            id: c.id,
            start: c.start,
            end: c.end,
            text: parts[idx] || c.text,
          });
        });
        continue;
      }
    } catch {}

    batch.forEach((c) => translated.push({ ...c }));
  }

  return translated;
}

export function cinemaStreamingPlugin(): Plugin {
  return {
    name: 'worsco-cinema-streaming-plugin',
    configureServer(server) {
      // 1. Resolve authentic multi-audio MP4 & HLS 1080p streams + real PT-BR / EN subtitles
      server.middlewares.use('/api/cinema/resolve', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '/', 'http://localhost:3000');
          const tmdbId = (urlObj.searchParams.get('tmdbId') || '').trim();
          const imdbId = (urlObj.searchParams.get('imdbId') || '').trim();
          const type = urlObj.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
          const title = (urlObj.searchParams.get('title') || '').trim();
          const year = (urlObj.searchParams.get('year') || '').trim();
          const season = (urlObj.searchParams.get('season') || '1').trim();
          const episode = (urlObj.searchParams.get('episode') || '1').trim();

          if (!tmdbId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing tmdbId' }));
            return;
          }

          const cacheKey = `${type}:${tmdbId}:${imdbId}:${season}:${episode}`;
          const cached = resolveCache.get(cacheKey);
          if (cached && cached.expiresAt > Date.now()) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(cached.payload));
            return;
          }

          const { streams, resolvedImdbId, hasPtDub, hasPtSub } = await resolveVidstuckStreams({
            tmdbId,
            imdbId,
            type,
            title,
            year,
            season,
            episode,
          });

          const effectiveImdbId = resolvedImdbId || imdbId;

          const [ptTrackPob, enTrackRaw] = await Promise.all([
            fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'pob', type, season, episode }),
            fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'eng', type, season, episode }),
          ]);

          let ptTrack =
            ptTrackPob ||
            (await fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'por', type, season, episode }));

          // If Portuguese subtitles are missing, translate authentic English subtitle cues to PT-BR
          if (!ptTrack && enTrackRaw && enTrackRaw.cues.length > 0) {
            try {
              const translatedCues = await translateCuesToPortuguese(enTrackRaw.cues);
              if (translatedCues.length > 0) {
                const vttLines = ['WEBVTT', ''];
                translatedCues.forEach((c) => {
                  vttLines.push(`${c.id}`);
                  const startM = Math.floor(c.start / 60);
                  const startS = Math.floor(c.start % 60);
                  const startMs = Math.round((c.start % 1) * 1000);
                  const endM = Math.floor(c.end / 60);
                  const endS = Math.floor(c.end % 60);
                  const endMs = Math.round((c.end % 1) * 1000);
                  const vtStart = `00:${String(startM).padStart(2, '0')}:${String(startS).padStart(2, '0')}.${String(startMs).padStart(3, '0')}`;
                  const vtEnd = `00:${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}.${String(endMs).padStart(3, '0')}`;
                  vttLines.push(`${vtStart} --> ${vtEnd}`);
                  vttLines.push(c.text);
                  vttLines.push('');
                });
                ptTrack = { vtt: vttLines.join('\n'), cues: translatedCues };
              }
            } catch {
              // ignore translation failure
            }
          }

          const ptCues = ptTrack?.cues || [];
          const enCues = enTrackRaw?.cues || [];

          const payload = {
            tmdbId,
            imdbId: effectiveImdbId,
            type,
            season: type === 'tv' ? Number(season) : undefined,
            episode: type === 'tv' ? Number(episode) : undefined,
            hasPtDub,
            hasPtSub,
            streams,
            subtitles: {
              ptCues,
              enCues,
              pt: {
                vttUrl: `/api/cinema/vtt?imdbId=${encodeURIComponent(effectiveImdbId)}&lang=pob&type=${type}&season=${season}&episode=${episode}`,
                cueCount: ptCues.length,
                cues: ptCues,
              },
              en: {
                vttUrl: `/api/cinema/vtt?imdbId=${encodeURIComponent(effectiveImdbId)}&lang=eng&type=${type}&season=${season}&episode=${episode}`,
                cueCount: enCues.length,
                cues: enCues,
              },
            },
          };

          if (streams.length > 0) {
            resolveCache.set(cacheKey, {
              expiresAt: Date.now() + 1000 * 60 * 20,
              payload,
            });
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Internal resolve error', streams: [] }));
        }
      });

      // 2. Serve WebVTT subtitle tracks directly to <track> tags
      server.middlewares.use('/api/cinema/vtt', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '/', 'http://localhost:3000');
          const imdbId = (urlObj.searchParams.get('imdbId') || '').trim();
          const lang = urlObj.searchParams.get('lang') === 'eng' ? 'eng' : 'pob';
          const type = urlObj.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
          const season = (urlObj.searchParams.get('season') || '1').trim();
          const episode = (urlObj.searchParams.get('episode') || '1').trim();

          let track = await fetchOpenSubtitlesTrack({ imdbId, lang3: lang, type, season, episode });
          if (!track && lang === 'pob') {
            track = await fetchOpenSubtitlesTrack({ imdbId, lang3: 'por', type, season, episode });
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(track ? track.vtt : 'WEBVTT\n\n');
        } catch {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
          res.end('WEBVTT\n\n');
        }
      });

      // 3. Proxy MP4 streams with HTTP Range support & stripped Referer (required by hakunaymatata.com CDN)
      server.middlewares.use('/api/cinema/mp4-proxy', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '/', 'http://localhost:3000');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl || !targetUrl.startsWith('http')) {
            res.statusCode = 400;
            res.end('Missing or invalid url');
            return;
          }

          const headers: Record<string, string> = {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: '*/*',
          };
          if (req.headers.range) {
            headers['Range'] = String(req.headers.range);
          }

          const upstream = await fetch(targetUrl, { headers });
          if (!upstream.ok && upstream.status !== 206) {
            res.statusCode = upstream.status;
            res.end(`Upstream error ${upstream.status}`);
            return;
          }

          res.statusCode = upstream.status;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes');
          const ct = upstream.headers.get('content-type');
          if (ct) res.setHeader('Content-Type', ct);
          const cl = upstream.headers.get('content-length');
          if (cl) res.setHeader('Content-Length', cl);
          const cr = upstream.headers.get('content-range');
          if (cr) res.setHeader('Content-Range', cr);

          if (upstream.body) {
            const nodeStream = Readable.fromWeb(upstream.body as any);
            req.on('close', () => {
              nodeStream.destroy();
            });
            nodeStream.pipe(res);
          } else {
            res.end();
          }
        } catch (err: any) {
          if (!res.headersSent) {
            res.statusCode = 502;
            res.end(err?.message || 'MP4 Proxy error');
          }
        }
      });

      // 4. Proxy HLS manifests & segments to avoid CORS or Referer blocks
      const handleHlsProxyRequest = async (req: any, res: any) => {
        try {
          const urlObj = new URL(req.url || '/', 'http://localhost:3000');
          let targetUrl = urlObj.searchParams.get('url');
          const fallbackUrl = urlObj.searchParams.get('fallbackUrl');
          if (!targetUrl || !targetUrl.startsWith('http')) {
            if (fallbackUrl && fallbackUrl.startsWith('http')) {
              targetUrl = fallbackUrl;
            } else {
              res.statusCode = 400;
              res.end('Missing or invalid url');
              return;
            }
          }

          let upstream: Response;
          try {
            upstream = await fetchWithTimeout(
              targetUrl,
              {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  Referer: targetUrl.includes('maximaimg.online') ? 'https://maximaimg.online/' : 'https://vidstuck.cc/',
                  Origin: targetUrl.includes('maximaimg.online') ? 'https://maximaimg.online' : 'https://vidstuck.cc',
                  Accept: '*/*',
                },
              },
              15000
            );
          } catch (fetchErr) {
            if (fallbackUrl && fallbackUrl !== targetUrl && fallbackUrl.startsWith('http')) {
              upstream = await fetchWithTimeout(
                fallbackUrl,
                {
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    Referer: fallbackUrl.includes('maximaimg.online') ? 'https://maximaimg.online/' : 'https://vidstuck.cc/',
                    Origin: fallbackUrl.includes('maximaimg.online') ? 'https://maximaimg.online' : 'https://vidstuck.cc',
                    Accept: '*/*',
                  },
                },
                15000
              );
              targetUrl = fallbackUrl;
            } else {
              throw fetchErr;
            }
          }

          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.end(`Upstream error ${upstream.status}`);
            return;
          }

          const contentType = upstream.headers.get('content-type') || '';
          const textCandidate =
            targetUrl.includes('.m3u8') ||
            targetUrl.includes('/edge') ||
            targetUrl.includes('workers.dev') ||
            contentType.includes('mpegurl') ||
            contentType.includes('application/x-mpegURL') ||
            contentType.includes('text/plain');

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=300');

          if (textCandidate) {
            const arrayBuf = await upstream.arrayBuffer();
            const buf = Buffer.from(arrayBuf);
            const firstBytes = buf.subarray(0, 16).toString('utf8').trim();
            if (firstBytes.startsWith('#EXTM3U')) {
              const text = buf.toString('utf8');
              const baseUri = new URL(targetUrl);
              const rewritten = text
                .split('\n')
                .map((line) => {
                  const trimmed = line.trim();
                  if (!trimmed) return line;
                  if (trimmed.startsWith('#')) {
                    if (trimmed.startsWith('#EXTINF') && trimmed.includes(',http')) {
                      const commaIdx = trimmed.indexOf(',http');
                      const tag = trimmed.slice(0, commaIdx + 1);
                      const segmentRaw = trimmed.slice(commaIdx + 1);
                      try {
                        const resolved = new URL(segmentRaw, baseUri).toString();
                        return `${tag}\n/api/cinema/hls-proxy?url=${encodeURIComponent(resolved)}`;
                      } catch {
                        return line;
                      }
                    }
                    return line.replace(/URI="([^"]+)"/g, (_match, uriVal) => {
                      try {
                        const resolved = new URL(uriVal, baseUri).toString();
                        return `URI="/api/cinema/hls-proxy?url=${encodeURIComponent(resolved)}"`;
                      } catch {
                        return _match;
                      }
                    });
                  }
                  try {
                    const resolved = new URL(trimmed, baseUri).toString();
                    return `/api/cinema/hls-proxy?url=${encodeURIComponent(resolved)}`;
                  } catch {
                    return line;
                  }
                })
                .join('\n');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
              res.end(rewritten);
              return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType || 'video/mp2t');
            res.end(buf);
            return;
          }

          const arrayBuf = await upstream.arrayBuffer();
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType || 'video/mp2t');
          res.end(Buffer.from(arrayBuf));
        } catch (err: any) {
          res.statusCode = 502;
          res.end(err?.message || 'Proxy error');
        }
      };

      server.middlewares.use('/api/cinema/hls-proxy', handleHlsProxyRequest);
      server.middlewares.use('/api/anime/hls-manifest', handleHlsProxyRequest);
      server.middlewares.use('/api/anime/proxy', handleHlsProxyRequest);
    },
  };
}
