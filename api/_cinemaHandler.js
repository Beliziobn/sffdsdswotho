import crypto from 'crypto';
import zlib from 'zlib';
import { Readable } from 'stream';

let activeAesPassphrase = '7f4c9e2a81d63b05c4f7a9e8126d3b50e1a8c7f23d9465ab0c6e9f1d4a7b832c';
let activePayloadKey = 'meow';

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

const resolveCache = new Map();
const resolveInFlight = new Map();
const tmdbDetailsCache = new Map();
const tmdbEpRuntimeCache = new Map();
const subtitleVttCache = new Map();
const mp4DurationCache = new Map();
let andromedaQueueTail = Promise.resolve();
let lastAndromedaRequestAt = 0;

const LANGUAGE_METADATA = {
  'ptbr:0': { label: 'Português (Dublado PT-BR)', shortLabel: '🇧🇷 Dublado PT-BR', flag: '🇧🇷', audioMode: 'dublado' },
  'pt:0': { label: 'Português (Dublado PT)', shortLabel: '🇵🇹 Dublado PT', flag: '🇵🇹', audioMode: 'dublado' },
  'ptbr:1': { label: 'Português (Legendado PT-BR)', shortLabel: '🇧🇷 Legendado PT-BR', flag: '🇧🇷', audioMode: 'legendado' },
  'pt:1': { label: 'Português (Legendado)', shortLabel: '🇧🇷 Português (Leg)', flag: '🇧🇷', audioMode: 'legendado' },
  'en:0': { label: 'Inglês (Áudio Original)', shortLabel: '🇺🇸 Inglês (Original)', flag: '🇺🇸', audioMode: 'original' },
  'en:1': { label: 'Inglês (Legendado)', shortLabel: '🇺🇸 Inglês (Leg)', flag: '🇺🇸', audioMode: 'original' },
  'esla:0': { label: 'Espanhol Latino (Dublado)', shortLabel: '🇲🇽 Espanhol Latino', flag: '🇲🇽', audioMode: 'multi' },
  'es:0': { label: 'Espanhol (Dublado)', shortLabel: '🇪🇸 Espanhol (Dub)', flag: '🇪🇸', audioMode: 'multi' },
  'es:1': { label: 'Espanhol (Legendado)', shortLabel: '🇪🇸 Espanhol (Leg)', flag: '🇪🇸', audioMode: 'multi' },
  'fr:0': { label: 'Francês (Dublado)', shortLabel: '🇫🇷 Francês (Dub)', flag: '🇫🇷', audioMode: 'multi' },
  'fr:1': { label: 'Francês (Legendado)', shortLabel: '🇫🇷 Francês (Leg)', flag: '🇫🇷', audioMode: 'multi' },
  'it:0': { label: 'Italiano (Dublado)', shortLabel: '🇮🇹 Italiano (Dub)', flag: '🇮🇹', audioMode: 'multi' },
  'de:0': { label: 'Alemão (Dublado)', shortLabel: '🇩🇪 Alemão (Dub)', flag: '🇩🇪', audioMode: 'multi' },
  'ja:0': { label: 'Japonês (Original)', shortLabel: '🇯🇵 Japonês', flag: '🇯🇵', audioMode: 'original' },
  'ko:0': { label: 'Coreano (Original)', shortLabel: '🇰🇷 Coreano', flag: '🇰🇷', audioMode: 'original' },
  'ru:0': { label: 'Russo (Dublado)', shortLabel: '🇷🇺 Russo (Dub)', flag: '🇷🇺', audioMode: 'multi' },
  'ru:1': { label: 'Russo (Legendado)', shortLabel: '🇷🇺 Russo (Leg)', flag: '🇷🇺', audioMode: 'multi' },
  'hi:0': { label: 'Hindi (Dublado)', shortLabel: '🇮🇳 Hindi (Dub)', flag: '🇮🇳', audioMode: 'multi' },
  'ar:0': { label: 'Árabe (Dublado)', shortLabel: '🇸🇦 Árabe (Dub)', flag: '🇸🇦', audioMode: 'multi' },
  'ar:1': { label: 'Árabe (Legendado)', shortLabel: '🇸🇦 Árabe (Leg)', flag: '🇸🇦', audioMode: 'multi' },
  'id:1': { label: 'Indonésio (Legendado)', shortLabel: '🇮🇩 Indonésio (Leg)', flag: '🇮🇩', audioMode: 'multi' },
  'bn:0': { label: 'Bengali (Dublado)', shortLabel: '🇧🇩 Bengali', flag: '🇧🇩', audioMode: 'multi' },
  'ta:0': { label: 'Tâmil (Dublado)', shortLabel: '🇮🇳 Tâmil', flag: '🇮🇳', audioMode: 'multi' },
  'te:0': { label: 'Telugu (Dublado)', shortLabel: '🇮🇳 Telugu', flag: '🇮🇳', audioMode: 'multi' },
};

function formatDubOption(d) {
  const code = String(d.lanCode || '').toLowerCase();
  const type = Number(d.type ?? 0);
  const key = `${code}:${type}`;
  const known = LANGUAGE_METADATA[key];
  if (known) {
    return {
      id: key,
      dubCode: code,
      dubType: String(type),
      label: known.label,
      shortLabel: known.shortLabel,
      flag: known.flag,
      audioMode: known.audioMode,
      isOriginal: Boolean(d.original),
    };
  }
  const suffix = type === 1 ? 'Legendado' : 'Dublado';
  const rawName = d.lanName || code.toUpperCase();
  return {
    id: key,
    dubCode: code,
    dubType: String(type),
    label: `${rawName} (${suffix})`,
    shortLabel: `🌐 ${rawName}`,
    flag: '🌐',
    audioMode: d.original ? 'original' : 'multi',
    isOriginal: Boolean(d.original),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function evpBytesToKey(password, salt, keyLen = 32, ivLen = 16) {
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

function encryptVidstuckPayload(obj) {
  const salt = crypto.randomBytes(8);
  const { key, iv } = evpBytesToKey(activeAesPassphrase, salt, 32, 16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  return Buffer.concat([Buffer.from('Salted__', 'utf8'), salt, ct]).toString('base64');
}

function decryptVidstuckLink(enc) {
  try {
    if (!enc) return null;
    const innerB64 = enc.startsWith('xArD_')
      ? Buffer.from(enc.slice(5), 'base64').toString('utf8')
      : enc;
    const raw = Buffer.from(innerB64, 'base64');
    if (raw.length < 17) return null;
    const salt = raw.subarray(8, 16);
    const ct = raw.subarray(16);
    const { key, iv } = evpBytesToKey(activeAesPassphrase, salt);
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 6500) {
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

let lastDiscoveryAt = 0;
async function discoverVidstuckPayloadKey() {
  if (Date.now() - lastDiscoveryAt < 30000) return;
  lastDiscoveryAt = Date.now();
  try {
    const htmlRes = await fetchWithTimeout(
      'https://vidstuck.cc/embed/movie/693134',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      },
      4500
    );
    if (!htmlRes.ok) return;
    const html = await htmlRes.text();
    const scripts = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]);
    for (const s of scripts) {
      const u = s.startsWith('http') ? s : `https://vidstuck.cc${s.startsWith('/') ? s : `/${s}`}`;
      const jsRes = await fetchWithTimeout(
        u,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
        4500
      );
      if (!jsRes.ok) continue;
      const js = await jsRes.text();
      if (!js.includes('/backend/andromeda')) continue;
      const keyMatch = js.match(/\/backend\/andromeda",\{[^}]*,([a-zA-Z0-9_$]+):[a-zA-Z0-9_$]+\(\{id:/);
      if (keyMatch?.[1]) {
        activePayloadKey = keyMatch[1];
      }
      const aesMatch = js.match(/AES\.encrypt\(JSON\.stringify\([^)]+\),"([a-f0-9]{64})"\)/i);
      if (aesMatch?.[1]) {
        activeAesPassphrase = aesMatch[1];
      }
      break;
    }
  } catch {
    // Keep defaults
  }
}

async function enqueueAndromedaCall(fn) {
  const run = async () => {
    const elapsed = Date.now() - lastAndromedaRequestAt;
    if (elapsed < 160) {
      await sleep(160 - elapsed);
    }
    lastAndromedaRequestAt = Date.now();
    return fn();
  };
  const next = andromedaQueueTail.then(run, run);
  andromedaQueueTail = next.catch(() => {});
  return next;
}

async function fetchAndromedaToken(commonHeaders, tmdbId, mediaType, serverKey, season, episode) {
  const promise = (async () => {
    const abcdPayload = {
      id: String(tmdbId),
      media_type: mediaType,
      path: serverKey,
    };
    if (mediaType === 'tv') {
      abcdPayload.season = Number(season || '1');
      abcdPayload.episode = Number(episode || '1');
    }

    const backoffs = [450, 950, 1650];

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const encrypted = encryptVidstuckPayload(abcdPayload);
        const tokenBody = {
          [K_TMDB_ID]: String(tmdbId),
          [K_MEDIA_TYPE]: mediaType,
          [K_SERVER]: serverKey,
          [activePayloadKey]: encrypted,
          meow: encrypted,
        };
        if (mediaType === 'tv') {
          tokenBody[K_SEASON] = Number(season || '1');
          tokenBody[K_EPISODE] = Number(episode || '1');
        }

        const tokRes = await enqueueAndromedaCall(() =>
          fetchWithTimeout(
            'https://vidstuck.cc/backend/andromeda',
            {
              method: 'POST',
              headers: {
                ...commonHeaders,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(tokenBody),
            },
            6000
          )
        );

        if (tokRes.status === 400 && attempt === 0) {
          await discoverVidstuckPayloadKey();
          continue;
        }
        if (tokRes.status === 429 && attempt < backoffs.length) {
          const jitter = Math.floor(Math.random() * 200);
          await sleep(backoffs[attempt] + jitter);
          continue;
        }
        if (!tokRes.ok) return null;

        const text = await tokRes.text();
        if (!text.startsWith('{')) return null;
        const tok = JSON.parse(text);
        if (!tok?.token || !tok?.ts) return null;
        return { token: tok.token, ts: tok.ts };
      } catch {
        if (attempt < 2) {
          await sleep(250 * (attempt + 1));
        }
      }
    }
    return null;
  })();

  return promise;
}

async function queryOrionVariant(params) {
  const tok =
    params.preFetchedToken ||
    (await fetchAndromedaToken(
      params.commonHeaders,
      params.tmdbId,
      params.mediaType,
      'orion',
      params.season,
      params.episode
    ));
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
  });

  if (params.dubCode && params.dubType !== undefined && params.dubType !== '') {
    q.set('dubCode', params.dubCode);
    q.set('dubType', String(params.dubType));
  }

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
      6500
    );
    if (!srvRes.ok) return null;
    const text = await srvRes.text();
    if (!text.startsWith('{')) return null;
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.links) || data.links.length === 0) return null;
    return {
      links: data.links,
      dubs: Array.isArray(data.dubs) ? data.dubs : [],
    };
  } catch {
    return null;
  }
}

function appendOrionLinksAsStreams(streams, links, audioMode, langCode, labelPrefix, metaParams) {
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

    const extraQuery = metaParams
      ? `&tmdbId=${encodeURIComponent(metaParams.tmdbId)}&imdbId=${encodeURIComponent(metaParams.imdbId || '')}&type=${metaParams.type}&season=${encodeURIComponent(metaParams.season || '1')}&episode=${encodeURIComponent(metaParams.episode || '1')}&title=${encodeURIComponent(metaParams.title)}&year=${encodeURIComponent(metaParams.year)}&audioMode=${audioMode}&quality=${encodeURIComponent(qualityLabel)}`
      : '';

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
        : `/api/cinema/mp4-proxy?url=${encodeURIComponent(decryptedUrl)}${extraQuery}`,
    });
  });
}

async function queryHlsServer(srvKey, srvLabel, commonHeaders, metaParams, safeLatestDate) {
  try {
    const tok = await fetchAndromedaToken(
      commonHeaders,
      metaParams.tmdbId,
      metaParams.type,
      srvKey,
      metaParams.season,
      metaParams.episode
    );
    if (!tok) return [];

    const q = new URLSearchParams({
      [K_TMDB_ID]: String(metaParams.tmdbId),
      [K_SERVER]: srvKey,
      [K_MEDIA_TYPE]: metaParams.type,
      [K_TS]: String(tok.ts),
      [K_TOKEN]: tok.token,
      [K_TITLE]: metaParams.title,
      [K_YEAR]: metaParams.year,
      [K_DATE]: metaParams.date,
    });
    if (metaParams.type === 'tv') {
      q.set(K_SEASON, String(metaParams.season || '1'));
      q.set(K_EPISODE, String(metaParams.episode || '1'));
      if (safeLatestDate) {
        q.set(K_LATEST_DATE, safeLatestDate);
      }
    }
    if (metaParams.imdbId) {
      q.set(K_IMDB_ID, metaParams.imdbId);
    }

    const srvRes = await fetchWithTimeout(
      `https://vidstuck.cc/backend/servers/${srvKey}?${q.toString()}`,
      { headers: commonHeaders },
      5500
    );
    if (!srvRes.ok) return [];
    const text = await srvRes.text();
    if (!text.startsWith('{')) return [];
    const data = JSON.parse(text);
    if (!Array.isArray(data?.links) || data.links.length === 0) return [];

    const out = [];
    for (let idx = 0; idx < data.links.length; idx++) {
      const l = data.links[idx];
      if (!l?.link) continue;
      const decryptedUrl = decryptVidstuckLink(l.link);
      if (!decryptedUrl || !decryptedUrl.startsWith('http')) continue;
      const isMp4 = l.type === 'mp4' || /\.mp4($|\?)/i.test(decryptedUrl);
      out.push({
        id: `hls-${srvKey}-${idx}`,
        server: srvKey,
        label: srvLabel,
        type: isMp4 ? 'mp4' : 'hls',
        audioMode: 'multi',
        langCode: 'en',
        quality: '1080p FHD',
        url: decryptedUrl,
        proxyUrl: isMp4
          ? `/api/cinema/mp4-proxy?url=${encodeURIComponent(decryptedUrl)}`
          : `/api/cinema/hls-proxy?url=${encodeURIComponent(decryptedUrl)}`,
      });
    }
    return out;
  } catch {
    return [];
  }
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function decodeHtmlAndJsonEscapes(str) {
  return String(str || '')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u003d/gi, '=')
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\\//g, '/');
}

async function resolveWatchPlayEmbed({ embedUrl, wantedAudioMode, idSuffix }) {
  try {
    const res = await fetchWithTimeout(
      embedUrl,
      {
        headers: {
          'User-Agent': BROWSER_UA,
          Referer: 'https://playerflix.ink/',
          Accept: 'text/html,*/*',
        },
      },
      4500
    );
    if (!res.ok) return [];
    const html = await res.text();
    const audioMatch = html.match(/MyPlayerAudio\s*=\s*["']([^"']+)["']/i);
    const urlMatch = html.match(/url\s*:\s*["']([^"']+)["']/i);
    if (!urlMatch?.[1]) return [];

    const streamUrl = urlMatch[1].replace(/\\\//g, '/').trim();
    if (!streamUrl.startsWith('http')) return [];

    const declaredAudio = (audioMatch?.[1] || '').trim();
    const isDeclaredSub = /legend|sub|eng|orig/i.test(declaredAudio);
    const isDeclaredDub = /dub/i.test(declaredAudio);

    if (wantedAudioMode === 'dublado' && isDeclaredSub && !isDeclaredDub) {
      return [];
    }

    const actualMode = isDeclaredDub
      ? 'dublado'
      : isDeclaredSub
      ? 'legendado'
      : wantedAudioMode;
    const isMp4 = /\.mp4($|\?)/i.test(streamUrl) && !streamUrl.includes('.m3u8');
    const langCode = actualMode === 'dublado' ? 'ptbr' : 'pt';
    const label =
      actualMode === 'dublado'
        ? 'Português (Dublado PT-BR · WatchPlay 1080p)'
        : 'Português (Legendado PT-BR · WatchPlay 1080p)';

    return [
      {
        id: `watchplay-${actualMode}-${idSuffix || '0'}`,
        server: 'watchplay',
        label,
        type: isMp4 ? 'mp4' : 'hls',
        audioMode: actualMode,
        langCode,
        quality: '1080p FHD',
        url: streamUrl,
        requiresProxy: true,
        proxyUrl: isMp4
          ? `/api/cinema/mp4-proxy?url=${encodeURIComponent(streamUrl)}&ref=wp2`
          : `/api/cinema/hls-proxy?url=${encodeURIComponent(streamUrl)}&ref=wp2`,
      },
    ];
  } catch {
    return [];
  }
}

async function resolveEmbedplayer2Embed({ embedUrl, embedId, wantedAudioMode, idSuffix }) {
  try {
    const eid =
      embedId ||
      embedUrl
        .split('/video/')[1]
        ?.split(/[?#&/]/)[0]
        ?.trim();
    if (!eid) return [];

    const postRes = await fetchWithTimeout(
      `https://embedplayer2.xyz/player/index.php?data=${encodeURIComponent(eid)}&do=getVideo`,
      {
        method: 'POST',
        headers: {
          'User-Agent': BROWSER_UA,
          Referer: embedUrl.startsWith('http') ? embedUrl : `https://embedplayer2.xyz/video/${eid}`,
          Origin: 'https://embedplayer2.xyz',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json, text/plain, */*',
        },
        body: `hash=${encodeURIComponent(eid)}&r=${encodeURIComponent('https://playerflix.ink/')}`,
      },
      8000
    );
    if (!postRes.ok) return [];
    const data = await postRes.json();
    const securedLink = (data?.securedLink || data?.videoSource || '').trim();
    if (!securedLink || !securedLink.startsWith('http')) return [];

    const preferLang = wantedAudioMode === 'dublado' ? '&preferLang=por' : '';
    const isMp4 = /\.mp4($|\?)/i.test(securedLink) && !securedLink.includes('.m3u8');

    return [
      {
        id: `embedplayer2-${wantedAudioMode}-${idSuffix || '0'}`,
        server: 'embedplayer2',
        label:
          wantedAudioMode === 'dublado'
            ? 'Português (Dublado PT-BR · EmbedPlayer HD)'
            : 'Português (Legendado PT-BR · EmbedPlayer HD)',
        type: isMp4 ? 'mp4' : 'hls',
        audioMode: wantedAudioMode,
        langCode: wantedAudioMode === 'dublado' ? 'ptbr' : 'pt',
        quality: '1080p FHD',
        url: securedLink,
        requiresProxy: true,
        proxyUrl: isMp4
          ? `/api/cinema/mp4-proxy?url=${encodeURIComponent(securedLink)}`
          : `/api/cinema/hls-proxy?url=${encodeURIComponent(securedLink)}${preferLang}`,
      },
    ];
  } catch {
    return [];
  }
}

async function resolveBloggerEmbed({ embedUrl, wantedAudioMode, idSuffix }) {
  try {
    const res = await fetchWithTimeout(
      embedUrl,
      {
        headers: {
          'User-Agent': BROWSER_UA,
          Referer: 'https://playerflix.ink/',
          Accept: 'text/html,*/*',
        },
      },
      4500
    );
    if (!res.ok) return [];
    const html = await res.text();
    const decoded = decodeHtmlAndJsonEscapes(html);
    const rawMatches = [
      ...decoded.matchAll(/https:\/\/[a-z0-9.-]*googlevideo\.com\/videoplayback\?[^"'\\<\s\]]+/gi),
    ].map((m) => m[0]);

    if (rawMatches.length === 0) return [];

    const byItag = new Map();
    for (const u of rawMatches) {
      let itag = '18';
      try {
        const parsed = new URL(u);
        itag = parsed.searchParams.get('itag') || '18';
      } catch {}
      if (!byItag.has(itag)) {
        byItag.set(itag, u);
      }
    }

    const priorityItags = ['37', '22', '59', '18'];
    const orderedUrls = [];
    for (const tag of priorityItags) {
      if (byItag.has(tag)) {
        orderedUrls.push({ itag: tag, url: byItag.get(tag) });
        byItag.delete(tag);
      }
    }
    for (const [tag, u] of byItag.entries()) {
      orderedUrls.push({ itag: tag, url: u });
    }

    return orderedUrls.slice(0, 2).map((entry, idx) => {
      const quality =
        entry.itag === '37'
          ? '1080p FHD'
          : entry.itag === '22'
          ? '720p HD'
          : entry.itag === '59'
          ? '480p'
          : '360p';
      return {
        id: `blogger-${wantedAudioMode}-${entry.itag}-${idSuffix || '0'}-${idx}`,
        server: 'blogger',
        label:
          wantedAudioMode === 'dublado'
            ? `Português (Dublado PT-BR · ${quality})`
            : `Português (Legendado PT-BR · ${quality})`,
        type: 'mp4',
        audioMode: wantedAudioMode,
        langCode: wantedAudioMode === 'dublado' ? 'ptbr' : 'pt',
        quality,
        url: entry.url,
        requiresProxy: true,
        proxyUrl: `/api/cinema/mp4-proxy?url=${encodeURIComponent(entry.url)}`,
      };
    });
  } catch {
    return [];
  }
}

function resolvePlayerFlixNativeEmbed({ embedUrl, wantedAudioMode, idSuffix }) {
  try {
    const parsed = new URL(embedUrl);
    const b64 = parsed.searchParams.get('video_url');
    if (!b64) return [];
    const decoded = Buffer.from(b64, 'base64').toString('utf8').trim();
    if (!decoded.startsWith('http')) return [];
    const isMp4 = /\.mp4($|\?)/i.test(decoded) && !decoded.includes('.m3u8');
    return [
      {
        id: `pfnative-${wantedAudioMode}-${idSuffix || '0'}`,
        server: 'playerflix-native',
        label:
          wantedAudioMode === 'dublado'
            ? 'Português (Dublado PT-BR · Turbo 1080p)'
            : 'Português (Legendado PT-BR · Turbo 1080p)',
        type: isMp4 ? 'mp4' : 'hls',
        audioMode: wantedAudioMode,
        langCode: wantedAudioMode === 'dublado' ? 'ptbr' : 'pt',
        quality: '1080p FHD',
        url: decoded,
        requiresProxy: false,
        proxyUrl: isMp4
          ? `/api/cinema/mp4-proxy?url=${encodeURIComponent(decoded)}`
          : `/api/cinema/hls-proxy?url=${encodeURIComponent(decoded)}`,
      },
    ];
  } catch {
    return [];
  }
}

async function resolvePlayerFlixStreams({ tmdbId, type, season, episode, wantedAudioMode }) {
  const ajaxUrl = `https://playerflix.ink/inc/Ajax.php?type=${type}&id=${encodeURIComponent(
    String(tmdbId)
  )}&season=${type === 'tv' ? encodeURIComponent(String(season || '1')) : ''}&episode=${
    type === 'tv' ? encodeURIComponent(String(episode || '1')) : ''
  }`;

  const directWatchPlayUrl =
    type === 'tv'
      ? `https://v1.watchplay.shop/tvshow/${tmdbId}/${season || '1'}/${episode || '1'}`
      : `https://v1.watchplay.shop/movie/${tmdbId}`;

  const ptbrEmbedUrls = [];
  let options = [];

  try {
    const res = await fetchWithTimeout(
      ajaxUrl,
      {
        headers: {
          'User-Agent': BROWSER_UA,
          Referer: 'https://playerflix.ink/',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json, text/plain, */*',
        },
      },
      8000
    );
    if (res.ok) {
      const json = await res.json();
      options = Array.isArray(json?.data?.options)
        ? json.data.options
        : Array.isArray(json?.data?.players)
        ? json.data.players
        : [];
    }
  } catch {
    options = [];
  }

  const wantedLangSet =
    wantedAudioMode === 'dublado'
      ? new Set(['pt-br', 'pt', 'ptbr'])
      : new Set(['en-us', 'pt-br-leg', 'legendado', 'sub']);

  const matchingOptions = options.filter((opt) => {
    const lang = String(opt?.lang || '').toLowerCase().trim();
    return wantedLangSet.has(lang);
  });

  if (wantedAudioMode === 'dublado') {
    const hasPtOptions = matchingOptions.length > 0;
    if (hasPtOptions) {
      const pageEmbed =
        type === 'tv'
          ? `https://playerflix.ink/serie/${tmdbId}/${season || '1'}/${episode || '1'}`
          : `https://playerflix.ink/filme/${tmdbId}`;
      const vidlinkEmbed =
        type === 'tv'
          ? `https://vidlink.pro/tv/${tmdbId}/${season || '1'}/${episode || '1'}`
          : `https://vidlink.pro/movie/${tmdbId}`;
      ptbrEmbedUrls.push(pageEmbed, vidlinkEmbed);
    }
  }

  const tasks = [];
  let hasWatchPlayOption = false;

  matchingOptions.forEach((opt, idx) => {
    const embedUrl = String(opt?.embed || '').trim();
    if (!embedUrl.startsWith('http')) return;
    const lowerUrl = embedUrl.toLowerCase();

    if (lowerUrl.includes('watchplay.shop') || opt?.id === 'watchplay') {
      hasWatchPlayOption = true;
      tasks.push({
        priority: 0,
        promise: resolveWatchPlayEmbed({ embedUrl, wantedAudioMode, idSuffix: idx }),
      });
    } else if (lowerUrl.includes('embedplayer2.xyz') || opt?.id === 'embedplayer') {
      tasks.push({
        priority: 1,
        promise: resolveEmbedplayer2Embed({
          embedUrl,
          embedId: opt?.embed_id,
          wantedAudioMode,
          idSuffix: idx,
        }),
      });
    } else if (lowerUrl.includes('blogger.com/video.g')) {
      tasks.push({
        priority: 2,
        promise: resolveBloggerEmbed({ embedUrl, wantedAudioMode, idSuffix: idx }),
      });
    } else if (lowerUrl.includes('players/native') || lowerUrl.includes('video_url=')) {
      tasks.push({
        priority: 3,
        promise: Promise.resolve(
          resolvePlayerFlixNativeEmbed({ embedUrl, wantedAudioMode, idSuffix: idx })
        ),
      });
    }
  });

  // Always probe WatchPlay directly when seeking PT-BR dub and PlayerFlix didn't return it
  if (wantedAudioMode === 'dublado' && !hasWatchPlayOption) {
    tasks.push({
      priority: 0,
      promise: resolveWatchPlayEmbed({
        embedUrl: directWatchPlayUrl,
        wantedAudioMode: 'dublado',
        idSuffix: 'direct',
      }),
    });
  }

  const settled = await Promise.all(
    tasks.map(async (t) => ({
      priority: t.priority,
      streams: await t.promise.catch(() => []),
    }))
  );

  settled.sort((a, b) => a.priority - b.priority);
  const streams = [];
  const seenUrls = new Set();
  for (const item of settled) {
    for (const s of item.streams) {
      if (!s?.url || seenUrls.has(s.url)) continue;
      seenUrls.add(s.url);
      streams.push(s);
    }
  }

  return {
    streams,
    ptbrEmbedUrls,
    hasPtOptionsInPlayerFlix: matchingOptions.length > 0 || streams.length > 0,
  };
}

function parseMvhdDurationSec(buf) {
  const idx = buf.indexOf(Buffer.from('mvhd'));
  if (idx === -1 || idx + 24 >= buf.length) return null;
  const version = buf[idx + 4];
  if (version === 0 && idx + 24 <= buf.length) {
    const ts = buf.readUInt32BE(idx + 16);
    const dur = buf.readUInt32BE(idx + 20);
    return ts ? dur / ts : null;
  } else if (version === 1 && idx + 36 <= buf.length) {
    const ts = buf.readUInt32BE(idx + 24);
    const dur = Number(buf.readBigUInt64BE(idx + 28));
    return ts ? dur / ts : null;
  }
  return null;
}

async function fetchMp4DurationSec(url) {
  if (!url || !url.startsWith('http')) return null;
  const baseKey = url.split('?')[0];
  const cached = mp4DurationCache.get(baseKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.durationSec;
  }
  try {
    const r = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': BROWSER_UA,
          Range: 'bytes=0-65535',
        },
      },
      2200
    );
    if (!r.ok && r.status !== 206) return null;
    const buf1 = Buffer.from(await r.arrayBuffer());
    let dur = parseMvhdDurationSec(buf1);
    if (!dur) {
      const cr = r.headers.get('content-range') || '';
      const total = cr.includes('/') ? parseInt(cr.split('/')[1], 10) : 0;
      if (total > 65536) {
        const start = Math.max(0, total - 131072);
        const r2 = await fetchWithTimeout(
          url,
          {
            headers: {
              'User-Agent': BROWSER_UA,
              Range: `bytes=${start}-${total - 1}`,
            },
          },
          2200
        );
        if (r2.ok || r2.status === 206) {
          dur = parseMvhdDurationSec(Buffer.from(await r2.arrayBuffer()));
        }
      }
    }
    if (dur && Number.isFinite(dur) && dur > 0) {
      mp4DurationCache.set(baseKey, {
        durationSec: dur,
        expiresAt: Date.now() + 1000 * 60 * 60 * 6,
      });
      return dur;
    }
    return null;
  } catch {
    return null;
  }
}

async function getExpectedRuntimeMinutes(tmdbId, type, season, episode, detailsData) {
  if (type === 'movie') {
    const r = Number(detailsData?.runtime || 0);
    if (r > 0) return r;
  }
  const cacheKey = `${type}:${tmdbId}:${season || 1}:${episode || 1}`;
  const cached = tmdbEpRuntimeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.runtime;
  }
  const TMDB_READ_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
  try {
    const endpoint =
      type === 'tv'
        ? `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season || 1}/episode/${episode || 1}?api_key=${TMDB_READ_KEY}`
        : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_READ_KEY}`;
    const res = await fetchWithTimeout(endpoint, { headers: { Accept: 'application/json' } }, 2200);
    if (res.ok) {
      const json = await res.json();
      const rt = Number(json?.runtime || 0);
      if (rt > 0) {
        tmdbEpRuntimeCache.set(cacheKey, { runtime: rt, expiresAt: Date.now() + 1000 * 60 * 60 * 12 });
        return rt;
      }
    }
  } catch {}
  const epRt = Array.isArray(detailsData?.episode_run_time)
    ? Number(detailsData.episode_run_time[0] || 0)
    : 0;
  return epRt > 0 ? epRt : null;
}

async function isOrionBtStreamValid({
  decryptedUrl,
  tmdbId,
  type,
  season,
  episode,
  detailsData,
  commonHeaders,
  metaParams,
  origOption,
}) {
  if (!decryptedUrl || !decryptedUrl.includes('/bt/')) return true;

  const [mp4DurSec, expectedMin] = await Promise.all([
    fetchMp4DurationSec(decryptedUrl),
    getExpectedRuntimeMinutes(tmdbId, type, season, episode, detailsData),
  ]);

  if (!mp4DurSec) return true;
  const mp4Min = mp4DurSec / 60;

  if (expectedMin && expectedMin > 0) {
    const diffMin = Math.abs(mp4Min - expectedMin);
    const allowedSlackMin = Math.max(2.0, expectedMin * 0.035);
    if (diffMin > allowedSlackMin) {
      return false;
    }
  }

  // Cross-check against Orion's official original audio track when available for sub-minute accuracy
  if (origOption?.lanCode) {
    const origRes = await queryOrionVariant({
      commonHeaders,
      tmdbId,
      mediaType: type,
      title: metaParams.title,
      year: metaParams.year,
      date: metaParams.date,
      latestDate: metaParams.latestDate,
      imdbId: metaParams.imdbId,
      season,
      episode,
      dubCode: origOption.lanCode,
      dubType: String(origOption.type ?? 0),
    }).catch(() => null);
    const origEnc = origRes?.links?.[0]?.link;
    const origUrl = origEnc ? decryptVidstuckLink(origEnc) : null;
    if (origUrl && !origUrl.includes('/bt/')) {
      const origDurSec = await fetchMp4DurationSec(origUrl);
      if (origDurSec && Math.abs(mp4DurSec - origDurSec) > 120) {
        return false;
      }
    }
  }

  return true;
}

export async function resolveVidstuckStreams(params) {
  const refererUrl =
    params.type === 'tv'
      ? `https://vidstuck.cc/embed/tv/${params.tmdbId}/${params.season || '1'}/${params.episode || '1'}`
      : `https://vidstuck.cc/embed/movie/${params.tmdbId}`;

  const commonHeaders = {
    'User-Agent': BROWSER_UA,
    Referer: refererUrl,
    Origin: 'https://vidstuck.cc',
    Accept: 'application/json',
  };

  let canonicalTitle = String(params.title || '').trim();
  let canonicalYear = String(params.year || '2024').trim();
  let canonicalDate = canonicalYear ? `${canonicalYear}-01-01` : '2024-01-01';
  let canonicalLatestDate = canonicalDate;
  let canonicalImdbId = String(params.imdbId || '').trim();

  const detailsCacheKey = `${params.type}:${params.tmdbId}`;
  let detailsData = tmdbDetailsCache.get(detailsCacheKey)?.data;

  const targetServer = params.preferredServer || 'orion';

  if (!detailsData) {
    try {
      const detailsRes = await fetchWithTimeout(
        `https://vidstuck.cc/backend/tmdb/details/${params.type}/${params.tmdbId}?language=en-US`,
        { headers: commonHeaders },
        2500
      );
      if (detailsRes.ok) {
        detailsData = await detailsRes.json();
        tmdbDetailsCache.set(detailsCacheKey, {
          expiresAt: Date.now() + 1000 * 60 * 60 * 12,
          data: detailsData,
        });
      }
    } catch {}
  }

  if (detailsData) {
    if (detailsData.title || detailsData.name) {
      canonicalTitle = detailsData.title || detailsData.name;
    }
    const rel = detailsData.release_date || detailsData.first_air_date;
    if (rel) {
      canonicalDate = String(rel);
      const y = new Date(rel).getFullYear();
      if (!Number.isNaN(y)) canonicalYear = String(y);
    }
    if (detailsData.last_air_date) {
      canonicalLatestDate = String(detailsData.last_air_date);
    }
    if (detailsData.imdb_id) {
      canonicalImdbId = detailsData.imdb_id;
    }
  }

  if (/[^\x20-\x7E]/.test(canonicalTitle)) {
    const cleaned = canonicalTitle
      .replace(/\s*\([^)]*[^\x20-\x7E]+[^)]*\)/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s:'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned) canonicalTitle = cleaned;
  }

  const safeLatestDate =
    canonicalLatestDate && /^202[5-9]/.test(canonicalLatestDate)
      ? canonicalDate
      : canonicalLatestDate || canonicalDate;

  const metaParams = {
    tmdbId: params.tmdbId,
    imdbId: canonicalImdbId,
    type: params.type,
    title: canonicalTitle,
    year: canonicalYear,
    date: canonicalDate,
    season: params.season,
    episode: params.episode,
  };

  // If user explicitly requested fast HLS server (atlas / berkas / milkyway)
  if (targetServer === 'atlas' || targetServer === 'berkas' || targetServer === 'milkyway') {
    const hlsStreams = await queryHlsServer(
      targetServer,
      `Stream 1080p FHD (${targetServer.toUpperCase()})`,
      commonHeaders,
      metaParams,
      safeLatestDate
    );
    if (hlsStreams.length > 0) {
      return {
        streams: hlsStreams,
        availableDubs: [],
        resolvedImdbId: canonicalImdbId,
        hasPtDub: false,
        hasPtSub: true,
      };
    }
  }

  const streams = [];
  let availableDubs = [];
  let hasPtDub = false;
  let hasPtSub = false;

  const isSteelBallRun =
    String(params.tmdbId) === '45790' && String(params.season) === '6';

  // Determine exact dubCode and dubType requested
  let reqDubCode = params.dubCode || '';
  let reqDubType = params.dubType !== undefined && params.dubType !== '' ? String(params.dubType) : '';

  if (!reqDubCode) {
    if (params.preferredAudioMode === 'legendado') {
      reqDubCode = 'pt';
      reqDubType = '1';
    } else if (params.preferredAudioMode === 'original') {
      reqDubCode = isSteelBallRun ? 'ja' : 'en';
      reqDubType = '0';
    } else {
      reqDubCode = 'ptbr';
      reqDubType = '0';
    }
  } else if (isSteelBallRun && reqDubCode === 'en') {
    reqDubCode = 'ja';
    reqDubType = '0';
  }

  const sbrOrionEpisodeMap = {
    '1': '1',
    '2': reqDubCode === 'fr' ? '2' : '3',
    '3': '3',
    '4': reqDubCode === 'fr' ? '4' : '5',
    '5': '5',
    '6': '6',
    '7': reqDubCode === 'fr' ? '7' : '6',
    '8': reqDubCode === 'fr' ? '7' : '6',
    '9': '6',
  };
  const effectiveOrionEpisode = isSteelBallRun
    ? sbrOrionEpisodeMap[String(params.episode)] || '6'
    : params.episode;

  const isWantingPtDub =
    (reqDubCode === 'ptbr' || reqDubCode === 'pt') && reqDubType === '0';
  const isWantingPtSub =
    (reqDubCode === 'ptbr' || reqDubCode === 'pt') && reqDubType === '1';

  const [initialOrionResult, playerFlixResult] = await Promise.all([
    queryOrionVariant({
      commonHeaders,
      tmdbId: params.tmdbId,
      mediaType: params.type,
      title: canonicalTitle,
      year: canonicalYear,
      date: canonicalDate,
      latestDate: safeLatestDate,
      imdbId: canonicalImdbId,
      season: params.season,
      episode: effectiveOrionEpisode,
      dubCode: reqDubCode,
      dubType: reqDubType,
    }),
    isWantingPtDub || isWantingPtSub
      ? resolvePlayerFlixStreams({
          tmdbId: params.tmdbId,
          type: params.type,
          season: params.season,
          episode: params.episode,
          wantedAudioMode: isWantingPtDub ? 'dublado' : 'legendado',
        })
      : Promise.resolve({ streams: [], ptbrEmbedUrls: [], hasPtOptionsInPlayerFlix: false }),
  ]);

  let initialOrion = initialOrionResult;

  if (!initialOrion && isSteelBallRun) {
    // Fallback to authentic 1080p Steel Ball Run on Orion (ptbr:0 or ja:0) so it never serves Part 1
    initialOrion = await queryOrionVariant({
      commonHeaders,
      tmdbId: params.tmdbId,
      mediaType: params.type,
      title: canonicalTitle,
      year: canonicalYear,
      date: canonicalDate,
      latestDate: safeLatestDate,
      imdbId: canonicalImdbId,
      season: params.season,
      episode: sbrOrionEpisodeMap[String(params.episode)] || '1',
      dubCode: 'ptbr',
      dubType: '0',
    });
  }

  if (!initialOrion && params.type === 'tv' && !isSteelBallRun) {
    initialOrion = await queryOrionVariant({
      commonHeaders,
      tmdbId: params.tmdbId,
      mediaType: params.type,
      title: canonicalTitle,
      year: canonicalYear,
      date: canonicalDate,
      latestDate: safeLatestDate,
      imdbId: canonicalImdbId,
      season: params.season,
      episode: params.episode,
      dubCode: '',
      dubType: '',
    });
  }

  let origOption = null;

  const metaWithLatest = { ...metaParams, latestDate: safeLatestDate };
  const orionCandidateStreams = [];

  if (initialOrion) {
    const dubs = initialOrion.dubs || [];
    const seenDubKeys = new Set();
    for (const d of dubs) {
      const formatted = formatDubOption(d);
      if (!seenDubKeys.has(formatted.id)) {
        seenDubKeys.add(formatted.id);
        availableDubs.push(formatted);
      }
    }

    const hasPtbrDub = dubs.some((d) => d.lanCode === 'ptbr' && d.type === 0);
    const hasPtStdDub = dubs.some((d) => d.lanCode === 'pt' && d.type === 0);
    const ptSubOption = dubs.find((d) => (d.lanCode === 'ptbr' || d.lanCode === 'pt') && d.type === 1);
    origOption =
      dubs.find((d) => /original/i.test(d.lanName) && d.type === 0) ||
      dubs.find((d) => (d.lanCode === 'en' || d.lanCode === 'ja' || d.lanCode === 'ko') && d.type === 0);

    const matchedReqOption = availableDubs.find(
      (d) => d.dubCode === reqDubCode.toLowerCase() && d.dubType === String(reqDubType)
    );

    if (matchedReqOption) {
      const firstOrionDecrypted = initialOrion.links[0]?.link
        ? decryptVidstuckLink(initialOrion.links[0].link)
        : null;
      const btOk = await isOrionBtStreamValid({
        decryptedUrl: firstOrionDecrypted,
        tmdbId: params.tmdbId,
        type: params.type,
        season: params.season,
        episode: params.episode,
        detailsData,
        commonHeaders,
        metaParams: metaWithLatest,
        origOption,
      });
      if (btOk) {
        appendOrionLinksAsStreams(
          orionCandidateStreams,
          initialOrion.links,
          matchedReqOption.audioMode,
          matchedReqOption.dubCode,
          matchedReqOption.label,
          metaParams
        );
      }
    } else if (reqDubCode === 'ptbr' && !hasPtbrDub && hasPtStdDub) {
      const ptDubRes = await queryOrionVariant({
        commonHeaders,
        tmdbId: params.tmdbId,
        mediaType: params.type,
        title: canonicalTitle,
        year: canonicalYear,
        date: canonicalDate,
        latestDate: safeLatestDate,
        imdbId: canonicalImdbId,
        season: params.season,
        episode: params.episode,
        dubCode: 'pt',
        dubType: '0',
      });
      if (ptDubRes && ptDubRes.links.length > 0) {
        const firstDec = ptDubRes.links[0]?.link ? decryptVidstuckLink(ptDubRes.links[0].link) : null;
        const btOk = await isOrionBtStreamValid({
          decryptedUrl: firstDec,
          tmdbId: params.tmdbId,
          type: params.type,
          season: params.season,
          episode: params.episode,
          detailsData,
          commonHeaders,
          metaParams: metaWithLatest,
          origOption,
        });
        if (btOk) {
          appendOrionLinksAsStreams(
            orionCandidateStreams,
            ptDubRes.links,
            'dublado',
            'pt',
            'Português (Dublado)',
            metaParams
          );
        }
      }
    } else if ((reqDubCode === 'pt' || reqDubCode === 'ptbr') && reqDubType === '1' && ptSubOption && ptSubOption.lanCode !== reqDubCode) {
      const ptSubRes = await queryOrionVariant({
        commonHeaders,
        tmdbId: params.tmdbId,
        mediaType: params.type,
        title: canonicalTitle,
        year: canonicalYear,
        date: canonicalDate,
        latestDate: safeLatestDate,
        imdbId: canonicalImdbId,
        season: params.season,
        episode: params.episode,
        dubCode: ptSubOption.lanCode,
        dubType: '1',
      });
      if (ptSubRes && ptSubRes.links.length > 0) {
        appendOrionLinksAsStreams(
          orionCandidateStreams,
          ptSubRes.links,
          'legendado',
          ptSubOption.lanCode,
          'Português (Legendado)',
          metaParams
        );
      }
    }

    const orionPtDubValid =
      (hasPtbrDub || hasPtStdDub) &&
      (!isWantingPtDub || orionCandidateStreams.some((s) => s.audioMode === 'dublado'));
    hasPtDub =
      orionPtDubValid ||
      playerFlixResult.streams.some((s) => s.audioMode === 'dublado') ||
      Boolean(playerFlixResult.hasPtOptionsInPlayerFlix);
    hasPtSub = Boolean(ptSubOption) || playerFlixResult.streams.some((s) => s.audioMode === 'legendado');
  } else {
    hasPtDub = playerFlixResult.streams.some((s) => s.audioMode === 'dublado');
    hasPtSub = playerFlixResult.streams.some((s) => s.audioMode === 'legendado');
  }

  // Prioritize TMDB-verified PlayerFlix routes (WatchPlay, EmbedPlayer2, Blogger) FIRST when wanting PT-BR
  // so Orion /bt/ third-party scraped files never supersede exact TMDB-matched PT-BR streams.
  const existingUrls = new Set();
  const pushUnique = (s) => {
    if (!s?.url || existingUrls.has(s.url)) return;
    existingUrls.add(s.url);
    streams.push(s);
  };

  if (isWantingPtDub || isWantingPtSub) {
    playerFlixResult.streams.forEach(pushUnique);
    orionCandidateStreams.forEach(pushUnique);
  } else {
    orionCandidateStreams.forEach(pushUnique);
    playerFlixResult.streams.forEach(pushUnique);
  }

  // Ensure ptbr:0 is listed in availableDubs whenever any PT-BR route found dublado audio
  if (hasPtDub && !availableDubs.some((d) => d.id === 'ptbr:0' || d.id === 'pt:0')) {
    availableDubs.unshift({
      id: 'ptbr:0',
      dubCode: 'ptbr',
      dubType: '0',
      label: LANGUAGE_METADATA['ptbr:0'].label,
      shortLabel: LANGUAGE_METADATA['ptbr:0'].shortLabel,
      flag: LANGUAGE_METADATA['ptbr:0'].flag,
      audioMode: 'dublado',
      isOriginal: false,
    });
  }
  if (hasPtSub && !availableDubs.some((d) => d.id === 'pt:1' || d.id === 'ptbr:1')) {
    availableDubs.push({
      id: 'pt:1',
      dubCode: 'pt',
      dubType: '1',
      label: LANGUAGE_METADATA['pt:1'].label,
      shortLabel: LANGUAGE_METADATA['pt:1'].shortLabel,
      flag: LANGUAGE_METADATA['pt:1'].flag,
      audioMode: 'legendado',
      isOriginal: false,
    });
  }

  // Sort availableDubs: Portuguese Dub -> Portuguese Sub -> English -> Spanish -> French -> Others
  const langPriority = (opt) => {
    if (opt.id === 'ptbr:0') return 0;
    if (opt.id === 'pt:0') return 1;
    if (opt.id === 'ptbr:1' || opt.id === 'pt:1') return 2;
    if (opt.id === 'en:0' || opt.isOriginal) return 3;
    if (opt.dubCode === 'esla' || opt.dubCode === 'es') return 4;
    if (opt.dubCode === 'fr') return 5;
    if (opt.dubCode === 'it' || opt.dubCode === 'de') return 6;
    return 10;
  };
  availableDubs.sort((a, b) => langPriority(a) - langPriority(b));

  // If Orion's PT-BR /bt/ link was rejected due to duration mismatch, fetch authentic original audio link instead
  if (streams.length === 0 && origOption?.lanCode) {
    const origRes = await queryOrionVariant({
      commonHeaders,
      tmdbId: params.tmdbId,
      mediaType: params.type,
      title: canonicalTitle,
      year: canonicalYear,
      date: canonicalDate,
      latestDate: safeLatestDate,
      imdbId: canonicalImdbId,
      season: params.season,
      episode: params.episode,
      dubCode: origOption.lanCode,
      dubType: String(origOption.type ?? 0),
    }).catch(() => null);
    if (origRes && origRes.links.length > 0) {
      appendOrionLinksAsStreams(
        streams,
        origRes.links,
        reqDubType === '1' ? 'legendado' : 'original',
        origOption.lanCode,
        `${origOption.lanName || 'Áudio Original'} (Legenda PT-BR)`,
        metaParams
      );
    }
  }

  // Only fall back to non-PT Orion default links or English HLS servers if NO matching PT stream was found.
  // Tag fallback streams honestly with their actual audioMode so the player never hides missing PT-BR dubs.
  if (streams.length === 0 && initialOrion && initialOrion.links.length > 0) {
    const firstDec = initialOrion.links[0]?.link ? decryptVidstuckLink(initialOrion.links[0].link) : null;
    const btOk = await isOrionBtStreamValid({
      decryptedUrl: firstDec,
      tmdbId: params.tmdbId,
      type: params.type,
      season: params.season,
      episode: params.episode,
      detailsData,
      commonHeaders,
      metaParams: metaWithLatest,
      origOption,
    });
    if (btOk) {
      const actualLang = origOption?.lanCode || 'en';
      const actualMode = reqDubType === '1' ? 'legendado' : 'original';
      const actualLabel =
        actualMode === 'legendado'
          ? 'Português (Legendado)'
          : `${origOption?.lanName || 'Áudio Original'} (Sem Dublagem PT-BR)`;
      appendOrionLinksAsStreams(
        streams,
        initialOrion.links,
        actualMode,
        actualLang,
        actualLabel,
        metaParams
      );
    }
  }

  if (streams.length === 0) {
    const hlsServers = [
      { key: 'atlas', label: 'Áudio Original 1080p FHD (Atlas · Legenda PT)' },
      { key: 'berkas', label: 'Áudio Original 1080p FHD (Berkas · Legenda PT)' },
      { key: 'milkyway', label: 'Áudio Original 1080p FHD (Milkyway · Legenda PT)' },
    ];

    for (const srv of hlsServers) {
      const found = await queryHlsServer(srv.key, srv.label, commonHeaders, metaParams, safeLatestDate);
      if (found.length > 0) {
        found.forEach((s) => {
          s.audioMode = 'original';
        });
        streams.push(...found);
        break;
      }
    }
  }

  return {
    streams,
    availableDubs,
    resolvedImdbId: canonicalImdbId,
    hasPtDub,
    hasPtSub,
    ptbrEmbedUrls: playerFlixResult.ptbrEmbedUrls || [],
  };
}

function parseSrtTimeToSeconds(timeStr) {
  const cleaned = timeStr.trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length !== 3) return 0;
  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function srtToVttAndCues(srtRaw) {
  const normalized = srtRaw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const cues = [];
  const vttLines = ['WEBVTT', ''];

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

async function fetchOpenSubtitlesTrack(params) {
  const cleanImdb = (params.imdbId || '').replace(/^tt/i, '');
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
      4000
    );
    if (!res.ok) return null;
    const list = await res.json();
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
      4000
    );
    if (!gzRes.ok) return null;
    const gzBuf = Buffer.from(await gzRes.arrayBuffer());
    let srtText;
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

export async function handleCinemaResolveRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const urlObj = new URL(req.url || '/', 'http://localhost:3000');
    const tmdbId = (urlObj.searchParams.get('tmdbId') || '').trim();
    const imdbId = (urlObj.searchParams.get('imdbId') || '').trim();
    const type = urlObj.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
    const title = (urlObj.searchParams.get('title') || '').trim();
    const year = (urlObj.searchParams.get('year') || '').trim();
    const season = (urlObj.searchParams.get('season') || '1').trim();
    const episode = (urlObj.searchParams.get('episode') || '1').trim();
    const rawMode = (urlObj.searchParams.get('audioMode') || 'dublado').trim();
    const preferredAudioMode =
      rawMode === 'legendado' || rawMode === 'original' ? rawMode : 'dublado';
    const dubCode = (urlObj.searchParams.get('dubCode') || '').trim().toLowerCase();
    const dubType = (urlObj.searchParams.get('dubType') || '').trim();
    const preferredServer = (urlObj.searchParams.get('server') || 'orion').trim().toLowerCase();
    const forceBust = Boolean(urlObj.searchParams.get('t'));

    if (!tmdbId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing tmdbId' }));
      return;
    }

    const cacheKey = `${type}:${tmdbId}:${imdbId}:${season}:${episode}:${preferredAudioMode}:${dubCode}:${dubType}:${preferredServer}`;
    const cached = !forceBust ? resolveCache.get(cacheKey) : undefined;
    if (cached && cached.expiresAt > Date.now() && Array.isArray(cached.payload?.streams) && cached.payload.streams.length > 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(cached.payload));
      return;
    }

    let payloadPromise = !forceBust ? resolveInFlight.get(cacheKey) : undefined;
    if (!payloadPromise) {
      payloadPromise = (async () => {
        const { streams, availableDubs, resolvedImdbId, hasPtDub, hasPtSub, ptbrEmbedUrls } =
          await resolveVidstuckStreams({
            tmdbId,
            imdbId,
            type,
            title,
            year,
            season,
            episode,
            preferredAudioMode,
            dubCode,
            dubType,
            preferredServer,
          });

        const effectiveImdbId = resolvedImdbId || imdbId;
        const cleanImdb = (effectiveImdbId || '').replace(/^tt/i, '');

        // Check if subtitles are already warm in memory cache, or fetch PT-BR subtitles with a fast 3.2s race
        let cachedPt =
          subtitleVttCache.get(`${cleanImdb}:pob:${type}:${season || 0}:${episode || 0}`) ||
          subtitleVttCache.get(`${cleanImdb}:por:${type}:${season || 0}:${episode || 0}`);
        const cachedEn = subtitleVttCache.get(`${cleanImdb}:eng:${type}:${season || 0}:${episode || 0}`);

        if (cleanImdb && !cachedPt) {
          cachedPt = await Promise.race([
            fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'pob', type, season, episode }).then(
              (resTrack) =>
                resTrack ||
                fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'por', type, season, episode })
            ),
            new Promise((resolve) => setTimeout(() => resolve(null), 3200)),
          ]).catch(() => null);
        }

        const ptCues = cachedPt?.cues || [];
        const enCues = cachedEn?.cues || [];
        const finalHasPtSub = Boolean(hasPtSub || ptCues.length > 0);

        if (cleanImdb && !cachedEn) {
          fetchOpenSubtitlesTrack({ imdbId: effectiveImdbId, lang3: 'eng', type, season, episode }).catch(() => {});
        }

        const resultPayload = {
          tmdbId,
          imdbId: effectiveImdbId,
          type,
          season: type === 'tv' ? Number(season) : undefined,
          episode: type === 'tv' ? Number(episode) : undefined,
          hasPtDub,
          hasPtSub: finalHasPtSub,
          availableDubs,
          ptbrEmbedUrls: ptbrEmbedUrls || [],
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
            expiresAt: Date.now() + 1000 * 60 * 30,
            payload: resultPayload,
          });
        }

        return resultPayload;
      })();

      if (!forceBust) {
        resolveInFlight.set(cacheKey, payloadPromise);
      }
    }

    let payload;
    try {
      payload = await payloadPromise;
    } finally {
      if (resolveInFlight.get(cacheKey) === payloadPromise) {
        resolveInFlight.delete(cacheKey);
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Internal resolve error', streams: [] }));
  }
}

export async function handleCinemaVttRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '/', 'http://localhost:3000');
    const imdbId = (urlObj.searchParams.get('imdbId') || '').trim();
    const lang = urlObj.searchParams.get('lang') === 'eng' ? 'eng' : 'pob';
    const type = urlObj.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
    const season = (urlObj.searchParams.get('season') || '1').trim();
    const episode = (urlObj.searchParams.get('episode') || '1').trim();
    const format = (urlObj.searchParams.get('format') || '').trim().toLowerCase();

    let track = await fetchOpenSubtitlesTrack({ imdbId, lang3: lang, type, season, episode });
    if (!track && lang === 'pob') {
      track = await fetchOpenSubtitlesTrack({ imdbId, lang3: 'por', type, season, episode });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    if (format === 'json') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ cues: track?.cues || [] }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.end(track ? track.vtt : 'WEBVTT\n\n');
  } catch {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.end('WEBVTT\n\n');
  }
}

export async function handleCinemaMp4ProxyRequest(req, res) {
  const abortController = new AbortController();
  const cleanup = () => {
    try {
      abortController.abort();
    } catch {}
  };
  res.on?.('close', () => {
    if (!res.writableEnded) cleanup();
  });

  try {
    const urlObj = new URL(req.url || '/', 'http://localhost:3000');
    let targetUrl = urlObj.searchParams.get('url');
    if (!targetUrl || !targetUrl.startsWith('http')) {
      res.statusCode = 400;
      res.end('Missing or invalid url');
      return;
    }

    const mp4RefHint = (urlObj.searchParams.get('ref') || '').trim().toLowerCase();
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: '*/*',
    };
    if (mp4RefHint === 'wp2' || targetUrl.includes('hclod.qzz.io') || targetUrl.includes('watchplay')) {
      headers.Referer = 'https://v2.watchplay.shop/';
      headers.Origin = 'https://v2.watchplay.shop';
    } else if (mp4RefHint === 'ep2' || targetUrl.includes('embedplayer2.xyz') || targetUrl.includes('embedvip.xyz')) {
      headers.Referer = 'https://embedplayer2.xyz/';
      headers.Origin = 'https://embedplayer2.xyz';
    }

    const isVercel = Boolean(process.env.VERCEL);
    const incomingRange = req.headers?.range ? String(req.headers.range) : '';
    if (isVercel) {
      const match = incomingRange.match(/bytes=(\d+)-(\d*)/);
      const start = match ? parseInt(match[1], 10) : 0;
      const requestedEnd = match && match[2] ? parseInt(match[2], 10) : start + 4000000;
      const cappedEnd = Math.min(requestedEnd, start + 4000000);
      headers['Range'] = `bytes=${start}-${cappedEnd}`;
    } else if (incomingRange) {
      headers['Range'] = incomingRange;
    }

    let upstream = await fetch(targetUrl, { headers, signal: abortController.signal });

    // Self-healing token refresh if expired
    if ((upstream.status === 403 || upstream.status === 410 || upstream.status === 429) && urlObj.searchParams.get('tmdbId')) {
      const tmdbId = urlObj.searchParams.get('tmdbId') || '';
      const imdbId = urlObj.searchParams.get('imdbId') || '';
      const type = urlObj.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
      const title = urlObj.searchParams.get('title') || '';
      const year = urlObj.searchParams.get('year') || '';
      const season = urlObj.searchParams.get('season') || '1';
      const episode = urlObj.searchParams.get('episode') || '1';
      const rawAudio = urlObj.searchParams.get('audioMode') || 'dublado';
      const preferredAudioMode =
        rawAudio === 'legendado' || rawAudio === 'original' ? rawAudio : 'dublado';
      const reqQuality = urlObj.searchParams.get('quality') || '';

      const refreshed = await resolveVidstuckStreams({
        tmdbId,
        imdbId,
        type,
        title,
        year,
        season,
        episode,
        preferredAudioMode,
      });

      const matchingStream =
        refreshed.streams.find((s) => s.audioMode === preferredAudioMode && (!reqQuality || s.quality === reqQuality)) ||
        refreshed.streams.find((s) => s.audioMode === preferredAudioMode) ||
        refreshed.streams[0];

      if (matchingStream?.url) {
        targetUrl = matchingStream.url;
        upstream = await fetch(targetUrl, { headers, signal: abortController.signal });
      }
    }

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

    if (urlObj.searchParams.get('download') === '1' || urlObj.searchParams.get('download') === 'true') {
      const rawName = (urlObj.searchParams.get('filename') || 'video-wotho.mp4').trim();
      const asciiName = rawName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 120) || 'video-wotho.mp4';
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(rawName.slice(0, 140))}`
      );
    }

    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.on('error', () => {
        if (!res.writableEnded) {
          try {
            res.destroy();
          } catch {
            res.end();
          }
        }
      });
      res.on?.('close', () => {
        if (!res.writableEnded) nodeStream.destroy();
      });
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.end(err?.message || 'MP4 Proxy error');
    }
  }
}

export async function handleCinemaHlsProxyRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '/', 'http://localhost:3000');
    const primaryUrl = (urlObj.searchParams.get('url') || '').trim();
    const fallbackUrl = (urlObj.searchParams.get('fallbackUrl') || '').trim();
    const preferLang = (urlObj.searchParams.get('preferLang') || '').trim().toLowerCase();
    const refHint = (urlObj.searchParams.get('ref') || '').trim().toLowerCase();

    const candidates = [];
    if (primaryUrl && primaryUrl.startsWith('http')) {
      candidates.push(primaryUrl);
      if (primaryUrl.includes('maximaimg.online')) {
        const cleanPrimary = primaryUrl.split('?')[0];
        const v2Variant = cleanPrimary.replace(/\/(\d+)\.mp4\//, '/$1v2.mp4/');
        if (v2Variant !== cleanPrimary && !candidates.includes(v2Variant)) {
          candidates.push(v2Variant);
        }
      }
    }
    if (fallbackUrl && fallbackUrl.startsWith('http') && !candidates.includes(fallbackUrl)) {
      candidates.push(fallbackUrl);
      if (fallbackUrl.includes('maximaimg.online')) {
        const cleanFallback = fallbackUrl.split('?')[0];
        const v2Fallback = cleanFallback.replace(/\/(\d+)\.mp4\//, '/$1v2.mp4/');
        if (v2Fallback !== cleanFallback && !candidates.includes(v2Fallback)) {
          candidates.push(v2Fallback);
        }
      }
    }

    if (candidates.length === 0) {
      res.statusCode = 400;
      res.end('Missing or invalid url');
      return;
    }

    const getUpstreamHeaders = (cand) => {
      let referer = 'https://vidstuck.cc/';
      let origin = 'https://vidstuck.cc';
      if (cand.includes('maximaimg.online')) {
        referer = 'https://maximaimg.online/';
        origin = 'https://maximaimg.online';
      } else if (
        refHint === 'ep2' ||
        cand.includes('embedplayer2.xyz') ||
        cand.includes('embedvip.xyz')
      ) {
        referer = 'https://embedplayer2.xyz/';
        origin = 'https://embedplayer2.xyz';
      } else if (
        refHint === 'wp2' ||
        cand.includes('hclod.qzz.io') ||
        cand.includes('watchplay')
      ) {
        referer = 'https://v2.watchplay.shop/';
        origin = 'https://v2.watchplay.shop';
      }
      return {
        'User-Agent': BROWSER_UA,
        Referer: referer,
        Origin: origin,
        Accept: '*/*',
      };
    };

    let upstream = null;
    let targetUrl = candidates[0];

    for (const cand of candidates) {
      try {
        const r = await fetchWithTimeout(
          cand,
          { headers: getUpstreamHeaders(cand) },
          22000
        );
        if (r.ok) {
          upstream = r;
          targetUrl = cand;
          break;
        }
      } catch {}
    }

    if (!upstream || !upstream.ok) {
      res.statusCode = 404;
      res.end('Upstream HLS stream not found');
      return;
    }

    const contentType = upstream.headers.get('content-type') || '';
    const isMaximaImg = targetUrl.includes('maximaimg.online');
    const isEp2Flow =
      refHint === 'ep2' ||
      targetUrl.includes('embedplayer2.xyz') ||
      targetUrl.includes('embedvip.xyz');
    const isWp2Flow =
      refHint === 'wp2' ||
      targetUrl.includes('hclod.qzz.io') ||
      targetUrl.includes('watchplay');
    const isEmbedPlayerPlaylist =
      targetUrl.includes('embedplayer2.xyz/cdn/hls/') ||
      targetUrl.includes('embedplayer2.xyz/hls/');
    const textCandidate =
      isEmbedPlayerPlaylist ||
      targetUrl.includes('.m3u8') ||
      targetUrl.includes('/edge') ||
      targetUrl.includes('workers.dev') ||
      contentType.includes('mpegurl') ||
      contentType.includes('application/x-mpegURL') ||
      contentType.includes('text/plain');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');

    const proxyExtraSuffix = `${
      preferLang ? `&preferLang=${encodeURIComponent(preferLang)}` : ''
    }${isEp2Flow ? '&ref=ep2' : ''}${isWp2Flow ? '&ref=wp2' : ''}`;

    const canDirectBypassCdn = (resolvedUrl) => {
      if (resolvedUrl.includes('.m3u8') || resolvedUrl.includes('embedplayer2.xyz/hls/')) {
        return false;
      }
      if (resolvedUrl.includes('maximaimg.online')) {
        return true;
      }
      return false;
    };

    if (textCandidate) {
      const arrayBuf = await upstream.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      const firstBytes = buf.subarray(0, 16).toString('utf8').trim();
      if (firstBytes.startsWith('#EXTM3U')) {
        let text = buf.toString('utf8');
        const baseUri = new URL(targetUrl);

        // When requesting PT-BR audio on multi-audio HLS manifests (e.g. embedplayer2.xyz),
        // promote the Portuguese track to DEFAULT=YES so players start in PT-BR immediately.
        if (preferLang === 'por' || targetUrl.includes('embedplayer2.xyz')) {
          const hasPorAudio = /#EXT-X-MEDIA:[^\n]*TYPE=AUDIO[^\n]*(?:LANGUAGE="por"|NAME="Portug)/i.test(
            text
          );
          if (hasPorAudio) {
            text = text
              .split('\n')
              .map((line) => {
                if (!line.startsWith('#EXT-X-MEDIA:') || !/TYPE=AUDIO/i.test(line)) {
                  return line;
                }
                const isPor = /LANGUAGE="por"|NAME="Portug/i.test(line);
                let updated = line
                  .replace(/DEFAULT=(?:YES|NO)/i, `DEFAULT=${isPor ? 'YES' : 'NO'}`)
                  .replace(/AUTOSELECT=(?:YES|NO)/i, `AUTOSELECT=${isPor ? 'YES' : 'NO'}`);
                if (!/DEFAULT=/i.test(updated)) {
                  updated += `,DEFAULT=${isPor ? 'YES' : 'NO'}`;
                }
                return updated;
              })
              .join('\n');
          }
        }

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
                  if (isMaximaImg || canDirectBypassCdn(resolved)) {
                    return `${tag}\n${resolved}`;
                  }
                  return `${tag}\n/api/cinema/hls-proxy?url=${encodeURIComponent(resolved)}${proxyExtraSuffix}`;
                } catch {
                  return line;
                }
              }
              return line.replace(/URI="([^"]+)"/g, (_match, uriVal) => {
                try {
                  const resolved = new URL(uriVal, baseUri).toString();
                  if (isMaximaImg || canDirectBypassCdn(resolved)) {
                    return `URI="${resolved}"`;
                  }
                  return `URI="/api/cinema/hls-proxy?url=${encodeURIComponent(resolved)}${proxyExtraSuffix}"`;
                } catch {
                  return _match;
                }
              });
            }
            try {
              const resolved = new URL(trimmed, baseUri).toString();
              if (isMaximaImg || canDirectBypassCdn(resolved)) {
                return resolved;
              }
              return `/api/cinema/hls-proxy?url=${encodeURIComponent(resolved)}${proxyExtraSuffix}`;
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
      res.setHeader(
        'Content-Type',
        isEp2Flow ? 'video/mp2t' : contentType || 'video/mp2t'
      );
      res.end(buf);
      return;
    }

    res.statusCode = 200;
    res.setHeader(
      'Content-Type',
      isEp2Flow ? 'video/mp2t' : contentType || 'video/mp2t'
    );
    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.on('error', () => {
        if (!res.writableEnded) res.end();
      });
      nodeStream.pipe(res);
    } else {
      const arrayBuf = await upstream.arrayBuffer();
      res.end(Buffer.from(arrayBuf));
    }
  } catch (err) {
    res.statusCode = 502;
    res.end(err?.message || 'Proxy error');
  }
}
