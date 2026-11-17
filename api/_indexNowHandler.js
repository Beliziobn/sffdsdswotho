const DEFAULT_ORIGIN = (process.env.VITE_APP_URL || 'https://wotho.vercel.app').replace(/\/+$/, '');
const DEFAULT_HOST = (() => {
  try {
    return new URL(DEFAULT_ORIGIN).host;
  } catch {
    return 'wotho.vercel.app';
  }
})();

export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || 'wotho8c4e9b2f1a7d3e6c5b0a9f8d2e1c4b7a';
export const INDEXNOW_KEY_LOCATION = `${DEFAULT_ORIGIN}/${INDEXNOW_KEY}.txt`;

const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

// Deduplicate real-time single-URL notifications (60s window) to prevent batch/spam pings
const recentSubmissionMap = new Map();
const recentLog = [];
const MAX_LOG_SIZE = 50;

export function toCanonicalIndexNowUrl(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  let resolved;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      resolved = `${DEFAULT_ORIGIN}${parsed.pathname.replace(/\/+$/, '') || '/'}`;
    } catch {
      return null;
    }
  } else {
    const cleanPath = trimmed.split('?')[0].split('#')[0];
    const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    resolved =
      normalized === '/'
        ? `${DEFAULT_ORIGIN}/`
        : `${DEFAULT_ORIGIN}${normalized.replace(/\/+$/, '')}`;
  }

  return resolved;
}

/**
 * Sends a single-URL real-time IndexNow ping (avoids batch submissions)
 * for content additions, updates, permanent redirects, or 404 removals.
 */
export async function notifyIndexNowUrl(urlOrPath, action = 'update') {
  const canonicalUrl = toCanonicalIndexNowUrl(urlOrPath);
  if (!canonicalUrl) {
    return { ok: false, skipped: true, reason: 'invalid_url' };
  }

  const normalizedAction = action === 'delete' ? 'delete' : 'update';
  const cacheKey = `${normalizedAction}:${canonicalUrl}`;
  const now = Date.now();
  const prevTs = recentSubmissionMap.get(cacheKey);

  if (prevTs && now - prevTs < 60_000) {
    return {
      ok: true,
      deduplicated: true,
      url: canonicalUrl,
      action: normalizedAction,
    };
  }
  recentSubmissionMap.set(cacheKey, now);

  // Clean old entries periodically
  if (recentSubmissionMap.size > 500) {
    for (const [k, ts] of recentSubmissionMap.entries()) {
      if (now - ts > 300_000) recentSubmissionMap.delete(k);
    }
  }

  const results = [];
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const pingUrl = `${endpoint}?url=${encodeURIComponent(canonicalUrl)}&key=${encodeURIComponent(
        INDEXNOW_KEY
      )}&keyLocation=${encodeURIComponent(INDEXNOW_KEY_LOCATION)}`;

      const upstreamRes = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Wotho-IndexNow-Client/1.0',
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(4500),
      });

      results.push({
        endpoint,
        status: upstreamRes.status,
        ok: upstreamRes.status >= 200 && upstreamRes.status < 300,
      });
    } catch (err) {
      results.push({
        endpoint,
        status: 0,
        ok: false,
        error: err?.message || 'network_error',
      });
    }
  }

  const entry = {
    url: canonicalUrl,
    action: normalizedAction,
    timestamp: new Date(now).toISOString(),
    results,
  };

  recentLog.unshift(entry);
  if (recentLog.length > MAX_LOG_SIZE) {
    recentLog.length = MAX_LOG_SIZE;
  }

  return {
    ok: results.some((r) => r.ok),
    url: canonicalUrl,
    action: normalizedAction,
    host: DEFAULT_HOST,
    keyLocation: INDEXNOW_KEY_LOCATION,
    results,
  };
}

export function getIndexNowStats() {
  return {
    enabled: true,
    host: DEFAULT_HOST,
    keyLocation: INDEXNOW_KEY_LOCATION,
    realtimeSingleUrlOnly: true,
    recentCount: recentLog.length,
    recentSubmissions: recentLog.slice(0, 15),
  };
}

export async function handleIndexNowRequest(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const parsed = new URL(req.url || '/', `https://${req.headers?.host || DEFAULT_HOST}`);
    const targetUrl = parsed.searchParams.get('url');
    const action = parsed.searchParams.get('action') || 'update';
    if (!targetUrl) {
      res.statusCode = 200;
      res.end(JSON.stringify(getIndexNowStats()));
      return;
    }
    const result = await notifyIndexNowUrl(targetUrl, action);
    res.statusCode = 200;
    res.end(JSON.stringify(result));
    return;
  }

  if (req.method === 'POST') {
    let rawBody = '';
    if (typeof req.body === 'object' && req.body !== null) {
      rawBody = JSON.stringify(req.body);
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = await new Promise((resolve) => {
        let buf = '';
        req.on('data', (chunk) => {
          buf += chunk;
        });
        req.on('end', () => resolve(buf));
      });
    }

    let payload = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = {};
    }

    const singleUrl = payload.url || payload.path;
    const action = payload.action || 'update';

    if (!singleUrl || typeof singleUrl !== 'string') {
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Informe uma única URL ou caminho canônico no campo "url" (envios em lote são evitados).',
        })
      );
      return;
    }

    const result = await notifyIndexNowUrl(singleUrl, action);
    res.statusCode = 200;
    res.end(JSON.stringify(result));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
}
