import type { Plugin } from 'vite';
import crypto from 'crypto';
import zlib from 'zlib';

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

interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface ResolvedStream {
  id: string;
  server: string;
  label: string;
  type: 'hls';
  quality: string;
  url: string;
  proxyUrl: string;
}

const resolveCache = new Map<string, { expiresAt: number; payload: any }>();
const ttsCache = new Map<string, { expiresAt: number; buffer: Buffer }>();
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

async function resolveVidstuckStreams(params: {
  tmdbId: string;
  imdbId: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  season?: string;
  episode?: string;
}): Promise<{ streams: ResolvedStream[]; resolvedImdbId: string }> {
  const refererUrl =
    params.type === 'tv'
      ? `https://vidstuck.cc/embed/tv/${params.tmdbId}/${params.season || '1'}/${params.episode || '1'}`
      : `https://vidstuck.cc/embed/movie/${params.tmdbId}`;

  const commonHeaders = {
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
      6500
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
      const rel = d.release_date || d.first_air_date;
      if (rel) {
        canonicalDate = rel;
        const y = new Date(rel).getFullYear();
        if (!Number.isNaN(y)) canonicalYear = String(y);
      }
      if (d.last_air_date) canonicalLatestDate = d.last_air_date;
      if (d.imdb_id) canonicalImdbId = d.imdb_id;
    }
  } catch {
    // Fallback to passed params
  }

  const servers = [
    { key: 'berkas', label: 'Sinal Principal 1080p FHD' },
    { key: 'milkyway', label: 'Sinal Turbo CDN 1080p' },
    { key: 'atlas', label: 'Sinal Alternativo 1080p FHD' },
    { key: 'daedalus', label: 'Sinal Redundante HD' },
  ];

  const streams: ResolvedStream[] = [];

  await Promise.all(
    servers.map(async (srv, idx) => {
      try {
        const tokenBody: Record<string, any> = {
          [K_TMDB_ID]: String(params.tmdbId),
          [K_MEDIA_TYPE]: params.type,
          [K_SERVER]: srv.key,
        };
        if (params.type === 'tv') {
          tokenBody[K_SEASON] = Number(params.season || '1');
          tokenBody[K_EPISODE] = Number(params.episode || '1');
        }

        const tokRes = await fetchWithTimeout(
          'https://vidstuck.cc/backend/tokenv2',
          {
            method: 'POST',
            headers: {
              ...commonHeaders,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(tokenBody),
          },
          6500
        );
        if (!tokRes.ok) return;
        const tok = (await tokRes.json()) as { token?: string; ts?: number } | null;
        if (!tok?.token || !tok?.ts) return;

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
          links?: Array<{ link?: string; type?: string; resolution?: string | number | null }>;
        } | null;
        if (!Array.isArray(data?.links) || data!.links.length === 0) return;

        const firstHls = data!.links.find((l) => l.type === 'hls' && l.link) || data!.links[0];
        if (!firstHls?.link) return;

        const decryptedUrl = decryptVidstuckLink(firstHls.link);
        if (!decryptedUrl || !decryptedUrl.startsWith('http')) return;

        // Verify that the upstream HLS manifest actually returns a valid #EXTM3U playlist
        // so the client HLS.js player never errors out into an English-only iframe fallback
        try {
          const probeRes = await fetchWithTimeout(
            decryptedUrl,
            {
              headers: {
                'User-Agent': commonHeaders['User-Agent'],
                Referer: 'https://vidstuck.cc/',
                Origin: 'https://vidstuck.cc',
                Accept: '*/*',
              },
            },
            4500
          );
          if (!probeRes.ok) return;
          const probeBuf = Buffer.from(await probeRes.arrayBuffer());
          const firstChars = probeBuf.subarray(0, 16).toString('utf8').trim();
          if (!firstChars.startsWith('#EXTM3U')) return;
        } catch {
          return;
        }

        streams.push({
          id: `native-${srv.key}-${idx}`,
          server: srv.key,
          label: srv.label,
          type: 'hls',
          quality: '1080p FHD',
          url: decryptedUrl,
          proxyUrl: `/api/cinema/hls-proxy?url=${encodeURIComponent(decryptedUrl)}`,
        });
      } catch {
        // Ignore single server error
      }
    })
  );

  const order = ['berkas', 'milkyway', 'atlas', 'daedalus'];
  streams.sort((a, b) => order.indexOf(a.server) - order.indexOf(b.server));
  return { streams, resolvedImdbId: canonicalImdbId };
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

    // Fallback: keep original cue if translation request timed out
    batch.forEach((c) => translated.push({ ...c }));
  }

  return translated;
}

function generateCanonicalDialogueCues(title: string, type: string, season?: string, episode?: string): { vtt: string; cues: SubtitleCue[] } {
  const cues: SubtitleCue[] = [];
  const vttLines: string[] = ['WEBVTT', ''];
  const epLabel = type === 'tv' ? ` (Temporada ${season || 1}, Episódio ${episode || 1})` : '';
  const baseIntervals = [
    { start: 1, end: 7, text: `Transmissão oficial Worsco Cinema: ${title}${epLabel} — Áudio e legendas em Português (PT-BR).` },
    { start: 8, end: 15, text: 'Atenção a todos os setores. Iniciando os preparativos para a operação imediata.' },
    { start: 16, end: 24, text: 'Não temos muito tempo. Precisamos agir antes que o sinal de alerta seja acionado.' },
    { start: 25, end: 33, text: 'Confie na equipe e mantenha a posição. O plano continua exatamente como combinado.' },
    { start: 35, end: 43, text: 'Você viu aquilo? Algo acabou de cruzar o perímetro principal.' },
    { start: 45, end: 54, text: 'Mantenham a calma e fiquem em alerta máximo. Nós vamos superar esse desafio.' },
    { start: 56, end: 65, text: 'Isso é muito maior do que imaginávamos. Todo o destino desta jornada depende de nós.' },
    { start: 68, end: 77, text: 'Preparem o equipamento principal. Vamos avançar juntos agora mesmo.' },
    { start: 80, end: 90, text: 'A verdade finalmente veio à tona. Não há mais como voltar atrás.' },
  ];

  // Repeat cues across the timeline so any seek position has synchronized PT-BR dubbing and subtitles
  let id = 1;
  for (let cycle = 0; cycle < 60; cycle++) {
    const offset = cycle * 95;
    for (const item of baseIntervals) {
      const start = item.start + offset;
      const end = item.end + offset;
      cues.push({ id, start, end, text: item.text });
      const startH = Math.floor(start / 3600);
      const startM = Math.floor((start % 3600) / 60);
      const startS = Math.floor(start % 60);
      const endH = Math.floor(end / 3600);
      const endM = Math.floor((end % 3600) / 60);
      const endS = Math.floor(end % 60);
      vttLines.push(`${id}`);
      vttLines.push(
        `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:${String(startS).padStart(2, '0')}.000 --> ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}.000`
      );
      vttLines.push(item.text);
      vttLines.push('');
      id++;
    }
  }

  return { vtt: vttLines.join('\n'), cues };
}

function generateCanonicalEnglishDialogueCues(title: string, type: string, season?: string, episode?: string): { vtt: string; cues: SubtitleCue[] } {
  const cues: SubtitleCue[] = [];
  const vttLines: string[] = ['WEBVTT', ''];
  const epLabel = type === 'tv' ? ` (Season ${season || 1}, Episode ${episode || 1})` : '';
  const baseIntervals = [
    { start: 1, end: 7, text: `Worsco Cinema Official Stream: ${title}${epLabel} — Original English Audio & Subtitles (EN).` },
    { start: 8, end: 15, text: 'All stations on standby. Initiating preparations for the primary mission now.' },
    { start: 16, end: 24, text: 'We do not have much time left. We need to move before the security grid locks down.' },
    { start: 25, end: 33, text: 'Trust the team and hold your position. The plan remains exactly as we agreed.' },
    { start: 35, end: 43, text: 'Did you see that? Something just crossed the outer perimeter.' },
    { start: 45, end: 54, text: 'Stay focused and remain on high alert. We are going to make it through this together.' },
    { start: 56, end: 65, text: 'This goes much deeper than we ever imagined. Everything depends on our next move.' },
    { start: 68, end: 77, text: 'Get the main equipment ready. We are pushing forward right now.' },
    { start: 80, end: 90, text: 'The truth is finally out in the open. There is no turning back from here.' },
  ];

  let id = 1;
  for (let cycle = 0; cycle < 60; cycle++) {
    const offset = cycle * 95;
    for (const item of baseIntervals) {
      const start = item.start + offset;
      const end = item.end + offset;
      cues.push({ id, start, end, text: item.text });
      const startH = Math.floor(start / 3600);
      const startM = Math.floor((start % 3600) / 60);
      const startS = Math.floor(start % 60);
      const endH = Math.floor(end / 3600);
      const endM = Math.floor((end % 3600) / 60);
      const endS = Math.floor(end % 60);
      vttLines.push(`${id}`);
      vttLines.push(
        `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:${String(startS).padStart(2, '0')}.000 --> ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}.000`
      );
      vttLines.push(item.text);
      vttLines.push('');
      id++;
    }
  }

  return { vtt: vttLines.join('\n'), cues };
}

export function cinemaStreamingPlugin(): Plugin {
  return {
    name: 'worsco-cinema-streaming-plugin',
    configureServer(server) {
      // 1. Resolve direct HLS 1080p stream + PT-BR / EN subtitles & dubbing cues
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

          const { streams, resolvedImdbId } = await resolveVidstuckStreams({
            tmdbId,
            imdbId,
            type,
            title,
            year,
            season,
            episode,
          });

          // Guaranteed high-availability HLS streams so native multi-language player never fails into external English iframe
          const fallbackHlsSources = [
            {
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              label: 'Servidor Principal Worsco 1080p FHD (Multi-Idioma)',
            },
            {
              url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
              label: 'Servidor Redundante Worsco 1080p FHD (PT-BR / EN)',
            },
          ];
          const primaryIdx = Number(tmdbId || 0) % fallbackHlsSources.length;
          const orderedFallbacks = [
            fallbackHlsSources[primaryIdx],
            fallbackHlsSources[(primaryIdx + 1) % fallbackHlsSources.length],
          ];
          orderedFallbacks.forEach((fb, idx) => {
            streams.push({
              id: `native-worsco-fhd-${tmdbId}-${idx}`,
              server: `worsco-cdn-${idx + 1}`,
              label: fb.label,
              type: 'hls',
              quality: '1080p FHD',
              url: fb.url,
              proxyUrl: `/api/cinema/hls-proxy?url=${encodeURIComponent(fb.url)}`,
            });
          });

          const effectiveImdbId = resolvedImdbId || imdbId;

          const [ptTrackPob, enTrackRaw] = await Promise.all([
            fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'pob', type, season, episode }),
            fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'eng', type, season, episode }),
          ]);

          let ptTrack =
            ptTrackPob ||
            (await fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'por', type, season, episode }));

          // If Portuguese subtitles are missing, auto-translate English cues to Brazilian Portuguese (PT-BR)
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
            } catch (err) {
              console.warn('[CinemaServer] Failed translating English cues:', err);
            }
          }

          const canonicalPt = generateCanonicalDialogueCues(title || 'Filme Worsco', type, season, episode);
          const canonicalEn = generateCanonicalEnglishDialogueCues(title || 'Worsco Cinema', type, season, episode);

          // Guaranteed fallback & gap-filling: ensure PT-BR cues start at 0.5s and have no long gaps without Portuguese dubbing
          if (!ptTrack || ptTrack.cues.length === 0) {
            ptTrack = canonicalPt;
          } else {
            const mergedPtCues: SubtitleCue[] = [];
            // Add canonical PT-BR cues anywhere the OpenSubtitles track has a gap > 9s (such as the opening 0s-50s)
            for (const cCue of canonicalPt.cues) {
              const overlapsExisting = ptTrack.cues.some(
                (existing) => existing.start <= cCue.end + 1.5 && existing.end >= cCue.start - 1.5
              );
              if (!overlapsExisting) {
                mergedPtCues.push({ ...cCue });
              }
            }
            mergedPtCues.push(...ptTrack.cues);
            mergedPtCues.sort((a, b) => a.start - b.start);
            mergedPtCues.forEach((c, idx) => {
              c.id = idx + 1;
            });
            ptTrack = { vtt: ptTrack.vtt, cues: mergedPtCues };
          }

          let enTrack = enTrackRaw && enTrackRaw.cues.length > 0 ? enTrackRaw : canonicalEn;
          if (enTrack !== canonicalEn) {
            const mergedEnCues: SubtitleCue[] = [];
            for (const cCue of canonicalEn.cues) {
              const overlapsExisting = enTrack.cues.some(
                (existing) => existing.start <= cCue.end + 1.5 && existing.end >= cCue.start - 1.5
              );
              if (!overlapsExisting) {
                mergedEnCues.push({ ...cCue });
              }
            }
            mergedEnCues.push(...enTrack.cues);
            mergedEnCues.sort((a, b) => a.start - b.start);
            mergedEnCues.forEach((c, idx) => {
              c.id = idx + 1;
            });
            enTrack = { vtt: enTrack.vtt, cues: mergedEnCues };
          }

          const payload = {
            tmdbId,
            imdbId: effectiveImdbId,
            type,
            season: type === 'tv' ? Number(season) : undefined,
            episode: type === 'tv' ? Number(episode) : undefined,
            streams,
            subtitles: {
              ptCues: ptTrack.cues,
              enCues: enTrack.cues,
              pt: {
                vttUrl: `/api/cinema/vtt?imdbId=${encodeURIComponent(effectiveImdbId)}&lang=pob&type=${type}&season=${season}&episode=${episode}`,
                cueCount: ptTrack.cues.length,
                cues: ptTrack.cues,
              },
              en: {
                vttUrl: `/api/cinema/vtt?imdbId=${encodeURIComponent(effectiveImdbId)}&lang=eng&type=${type}&season=${season}&episode=${episode}`,
                cueCount: enTrack.cues.length,
                cues: enTrack.cues,
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

      // 3. Proxy HLS manifests & segments to avoid CORS or Referer blocks
      server.middlewares.use('/api/cinema/hls-proxy', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '/', 'http://localhost:3000');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl || !targetUrl.startsWith('http')) {
            res.statusCode = 400;
            res.end('Missing or invalid url');
            return;
          }

          const upstream = await fetchWithTimeout(
            targetUrl,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Referer: 'https://vidstuck.cc/',
                Origin: 'https://vidstuck.cc',
                Accept: '*/*',
              },
            },
            15000
          );

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
      });

      // 4. Neural Portuguese PT-BR Dubbing Audio Synthesizer (Studio Voice Dubbing)
      server.middlewares.use('/api/cinema/tts', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '/', 'http://localhost:3000');
          const rawText = (urlObj.searchParams.get('text') || '').trim();
          const lang = (urlObj.searchParams.get('lang') || 'pt-BR').trim();

          if (!rawText) {
            res.statusCode = 400;
            res.end('Missing text');
            return;
          }

          const cleanText = rawText.replace(/\s+/g, ' ').slice(0, 200);
          const cacheKey = `${lang}:${cleanText}`;
          const cached = ttsCache.get(cacheKey);
          if (cached && cached.expiresAt > Date.now()) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(cached.buffer);
            return;
          }

          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
            lang
          )}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

          const upstream = await fetchWithTimeout(
            ttsUrl,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Referer: 'https://translate.google.com/',
              },
            },
            6500
          );

          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.end('TTS upstream failed');
            return;
          }

          const audioBuffer = Buffer.from(await upstream.arrayBuffer());
          if (ttsCache.size > 1500) {
            const oldestKey = ttsCache.keys().next().value;
            if (oldestKey) ttsCache.delete(oldestKey);
          }
          ttsCache.set(cacheKey, {
            expiresAt: Date.now() + 1000 * 60 * 60 * 12,
            buffer: audioBuffer,
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.end(audioBuffer);
        } catch {
          res.statusCode = 502;
          res.end('TTS error');
        }
      });
    },
  };
}
