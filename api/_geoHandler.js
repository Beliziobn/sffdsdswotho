/**
 * WOTHO Geolocation & Real-Time Content Translation Engine
 * - /api/geo: Detects the visitor's country via IP headers (Vercel, Cloudflare, proxies)
 *   or GeoJS IP lookup fallback, and maps Lusophone countries (BR, PT, AO, MZ, CV, GW, ST, TL, GQ, MO)
 *   to 'pt' and all other countries (e.g. Norway NO, US, GB, DE, FR, JP, etc.) to 'en'.
 * - /api/translate: Translates batch texts (news titles, summaries, full articles, books,
 *   animes, cinema, webtoons, UI labels) into the target language ('en' or 'pt') with server caching.
 */

const LUSOPHONE_COUNTRIES = new Set([
  'BR', // Brazil
  'PT', // Portugal
  'AO', // Angola
  'MZ', // Mozambique
  'CV', // Cape Verde
  'GW', // Guinea-Bissau
  'ST', // São Tomé and Príncipe
  'TL', // East Timor (Timor-Leste)
  'GQ', // Equatorial Guinea
  'MO', // Macau
]);

const COUNTRY_NAMES = {
  NO: 'Norway',
  SE: 'Sweden',
  DK: 'Denmark',
  FI: 'Finland',
  IS: 'Iceland',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  IE: 'Ireland',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  PL: 'Poland',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  IN: 'India',
  SG: 'Singapore',
  ZA: 'South Africa',
  NG: 'Nigeria',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  BR: 'Brasil',
  PT: 'Portugal',
  AO: 'Angola',
  MZ: 'Moçambique',
  CV: 'Cabo Verde',
  GW: 'Guiné-Bissau',
  ST: 'São Tomé e Príncipe',
  TL: 'Timor-Leste',
  GQ: 'Guiné Equatorial',
  MO: 'Macau',
};

const translationCache = new Map();
const MAX_CACHE_ENTRIES = 12000;

function setCache(key, value) {
  if (translationCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey !== undefined) translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
}

function getHeader(req, name) {
  const headers = req?.headers || {};
  const val = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(val)) return val[0];
  return typeof val === 'string' ? val.trim() : '';
}

function extractClientIp(req) {
  const forwarded = getHeader(req, 'x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (
      firstIp &&
      !firstIp.startsWith('127.') &&
      !firstIp.startsWith('10.') &&
      !firstIp.startsWith('192.168.') &&
      firstIp !== '::1'
    ) {
      return firstIp;
    }
  }
  const realIp = getHeader(req, 'x-real-ip') || getHeader(req, 'cf-connecting-ip');
  if (realIp && !realIp.startsWith('127.') && realIp !== '::1') {
    return realIp;
  }
  return '';
}

export async function handleGeoLocateRequest(req, res) {
  try {
    const urlObj = new URL(req.url || '/api/geo', 'http://localhost');
    const overrideCountry = (urlObj.searchParams.get('country') || '').trim().toUpperCase();

    let countryCode = '';
    let countryName = '';
    let detectionSource = 'headers';

    if (overrideCountry && /^[A-Z]{2}$/.test(overrideCountry)) {
      countryCode = overrideCountry;
      detectionSource = 'query_override';
    } else {
      const headerCountry =
        getHeader(req, 'x-vercel-ip-country') ||
        getHeader(req, 'cf-ipcountry') ||
        getHeader(req, 'x-country-code') ||
        getHeader(req, 'x-appengine-country') ||
        getHeader(req, 'cloudfront-viewer-country');

      if (headerCountry && /^[A-Za-z]{2}$/.test(headerCountry) && headerCountry.toUpperCase() !== 'XX') {
        countryCode = headerCountry.toUpperCase();
        detectionSource = 'edge_header';
      }
    }

    if (!countryCode) {
      const clientIp = extractClientIp(req);
      if (clientIp) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        try {
          const geoUrl = `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(clientIp)}.json`;
          const resp = await fetch(geoUrl, {
            signal: controller.signal,
            headers: { Accept: 'application/json', 'User-Agent': 'WothoGeoEngine/2.0' },
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && typeof data.country_code === 'string' && data.country_code.length === 2) {
              countryCode = data.country_code.toUpperCase();
              countryName = data.country || '';
              detectionSource = 'geojs_ip';
            }
          }
        } catch {
          // Fallback handled below via accept-language + client timezone
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    if (!countryCode) {
      const acceptLang = getHeader(req, 'accept-language');
      if (acceptLang) {
        const lower = acceptLang.toLowerCase();
        const primary = lower.split(',')[0].trim();
        if (primary.startsWith('pt-br') || lower.includes('pt-br')) countryCode = 'BR';
        else if (primary.startsWith('pt-pt') || lower.includes('pt-pt')) countryCode = 'PT';
        else if (primary.startsWith('pt-ao')) countryCode = 'AO';
        else if (primary.startsWith('pt-mz')) countryCode = 'MZ';
        else if (primary.startsWith('pt') || lower.includes('pt')) countryCode = 'BR';
        else if (primary.startsWith('nb') || primary.startsWith('nn') || primary.endsWith('-no')) countryCode = 'NO';
        else countryCode = 'US';
        detectionSource = 'accept_language';
      } else {
        countryCode = 'BR';
        detectionSource = 'default_lusophone';
      }
    }

    const isLusophone = LUSOPHONE_COUNTRIES.has(countryCode);
    const language = isLusophone ? 'pt' : 'en';
    if (!countryName) {
      countryName = COUNTRY_NAMES[countryCode] || countryCode;
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        countryCode,
        countryName,
        isLusophone,
        language,
        detectionSource,
        lusophoneCountries: Array.from(LUSOPHONE_COUNTRIES),
      })
    );
  } catch {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        countryCode: 'US',
        countryName: 'International',
        isLusophone: false,
        language: 'en',
        detectionSource: 'fallback',
      })
    );
  }
}

async function translateSingleText(text, targetLang = 'en', sourceLang = 'auto') {
  const trimmed = String(text || '').trim();
  if (!trimmed) return text;
  if (trimmed.length <= 1 || /^[\d\s.,:/\-+%$€£@#&*()[\]{}|\\<>!?~`"'+=•]+$/.test(trimmed)) {
    return text;
  }

  const cacheKey = `${sourceLang}:${targetLang}:${trimmed}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    if (!response.ok) return text;
    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
        .join('');
      if (translated) {
        setCache(cacheKey, translated);
        return translated;
      }
    }
    return text;
  } catch {
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleTranslateRequest(req, res) {
  try {
    let texts = [];
    let targetLang = 'en';
    let sourceLang = 'auto';

    if (req.method === 'POST') {
      let bodyObj = req.body;
      if (!bodyObj || typeof bodyObj !== 'object') {
        const rawBody = await new Promise((resolve) => {
          let buf = '';
          req.on('data', (chunk) => {
            buf += chunk;
          });
          req.on('end', () => resolve(buf));
          req.on('error', () => resolve(''));
        });
        try {
          bodyObj = JSON.parse(rawBody || '{}');
        } catch {
          bodyObj = {};
        }
      }
      if (Array.isArray(bodyObj.texts)) {
        texts = bodyObj.texts.slice(0, 400).map((t) => String(t ?? ''));
      } else if (typeof bodyObj.text === 'string') {
        texts = [bodyObj.text];
      }
      if (typeof bodyObj.targetLang === 'string') targetLang = bodyObj.targetLang;
      if (typeof bodyObj.sourceLang === 'string') sourceLang = bodyObj.sourceLang;
    } else {
      const urlObj = new URL(req.url || '/api/translate', 'http://localhost');
      const q = urlObj.searchParams.get('q') || urlObj.searchParams.get('text') || '';
      targetLang = urlObj.searchParams.get('tl') || urlObj.searchParams.get('targetLang') || 'en';
      sourceLang = urlObj.searchParams.get('sl') || urlObj.searchParams.get('sourceLang') || 'auto';
      if (q) texts = [q];
    }

    if (texts.length === 0) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.statusCode = 200;
      res.end(JSON.stringify({ translations: [], targetLang }));
      return;
    }

    const results = new Array(texts.length);
    const uncachedIndices = [];

    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      const trimmed = String(t || '').trim();
      const cacheKey = `${sourceLang}:${targetLang}:${trimmed}`;
      if (!trimmed) {
        results[i] = t;
      } else if (translationCache.has(cacheKey)) {
        results[i] = translationCache.get(cacheKey);
      } else {
        uncachedIndices.push(i);
      }
    }

    // Group single-line strings into small newline-separated batches of up to 8 items (max 1600 chars)
    // and translate multi-line strings individually so line breaks never misalign.
    const singleLineBatches = [];
    let currentBatch = [];
    let currentLen = 0;
    const individualIndices = [];

    for (const idx of uncachedIndices) {
      const str = texts[idx].trim();
      if (str.includes('\n') || str.length > 350) {
        individualIndices.push(idx);
      } else {
        if (currentBatch.length >= 8 || (currentBatch.length > 0 && currentLen + str.length > 1600)) {
          singleLineBatches.push(currentBatch);
          currentBatch = [idx];
          currentLen = str.length;
        } else {
          currentBatch.push(idx);
          currentLen += str.length + 2;
        }
      }
    }
    if (currentBatch.length > 0) {
      singleLineBatches.push(currentBatch);
    }

    // Process single-line batches with automatic per-item fallback if newline count changes
    await Promise.all(
      singleLineBatches.map(async (batchIndices) => {
        if (batchIndices.length === 1) {
          const idx = batchIndices[0];
          results[idx] = await translateSingleText(texts[idx], targetLang, sourceLang);
          return;
        }
        const joined = batchIndices.map((idx) => texts[idx].trim()).join('\n');
        const translatedJoined = await translateSingleText(joined, targetLang, sourceLang);
        const lines = String(translatedJoined || '').split('\n');

        if (lines.length === batchIndices.length) {
          for (let j = 0; j < batchIndices.length; j++) {
            const origIdx = batchIndices[j];
            const cleanLine = lines[j].trim();
            results[origIdx] = cleanLine || texts[origIdx];
            setCache(`${sourceLang}:${targetLang}:${texts[origIdx].trim()}`, results[origIdx]);
          }
        } else {
          await Promise.all(
            batchIndices.map(async (origIdx) => {
              results[origIdx] = await translateSingleText(texts[origIdx], targetLang, sourceLang);
            })
          );
        }
      })
    );

    // Process multi-line or long strings with controlled concurrency (8 at a time)
    const CONCURRENCY = 8;
    for (let i = 0; i < individualIndices.length; i += CONCURRENCY) {
      const slice = individualIndices.slice(i, i + CONCURRENCY);
      await Promise.all(
        slice.map(async (origIdx) => {
          results[origIdx] = await translateSingleText(texts[origIdx], targetLang, sourceLang);
        })
      );
    }

    // Guarantee every slot is populated
    for (let i = 0; i < texts.length; i++) {
      if (typeof results[i] !== 'string' || !results[i]) {
        results[i] = texts[i];
      }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        translations: results,
        targetLang,
      })
    );
  } catch (err) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(JSON.stringify({ translations: [], error: String(err?.message || err) }));
  }
}
