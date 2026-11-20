import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ADMIN_EMAIL = 'miguelworscoi@gmail.com';
const DEFAULT_ADMIN_PASS_HASH = '1e2ce6c4c4cb90b408758f46a076e7a7873b838d572ee015b976623631a507a7';
const DEFAULT_EDITORIAL_PROOF = 'wotho-ed-proof-9f81c4a7b2e6d309581a';
const SESSION_COOKIE_NAME = 'worscoi_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EDITORIAL_CLOUD_STORE_PATH = path.join('/tmp', 'wotho_editorial_cloud_store_v1.json');
const ALLOWED_COLLECTIONS = new Set(['news', 'books', 'chapters', 'anime_overrides']);

let memoryEditorialStore = null;

function readEditorialCloudStore() {
  if (memoryEditorialStore) return memoryEditorialStore;
  const empty = {
    news: {},
    books: {},
    chapters: {},
    anime_overrides: {},
  };
  try {
    if (fs.existsSync(EDITORIAL_CLOUD_STORE_PATH)) {
      const raw = fs.readFileSync(EDITORIAL_CLOUD_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryEditorialStore = {
          news: parsed.news && typeof parsed.news === 'object' ? parsed.news : {},
          books: parsed.books && typeof parsed.books === 'object' ? parsed.books : {},
          chapters: parsed.chapters && typeof parsed.chapters === 'object' ? parsed.chapters : {},
          anime_overrides:
            parsed.anime_overrides && typeof parsed.anime_overrides === 'object'
              ? parsed.anime_overrides
              : {},
        };
        return memoryEditorialStore;
      }
    }
  } catch {
    // Fallback to in-memory store
  }
  memoryEditorialStore = empty;
  return memoryEditorialStore;
}

function writeEditorialCloudStore(store) {
  memoryEditorialStore = store;
  try {
    fs.writeFileSync(EDITORIAL_CLOUD_STORE_PATH, JSON.stringify(store), 'utf8');
  } catch {
    // Ignore /tmp write errors
  }
}

// Simple sliding-window rate limiter per IP (protects against password brute-force)
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function getSessionSigningKey() {
  const configured = process.env.EDITORIAL_SESSION_SECRET;
  if (configured && configured.length >= 16) return configured;
  return crypto
    .createHash('sha256')
    .update(`worscoi-hmac:${process.env.MASTER_ADMIN_PASSWORD || DEFAULT_ADMIN_PASS_HASH}:${getEditorialProof()}`)
    .digest('hex');
}

function getExpectedEmail() {
  return (process.env.MASTER_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function getEditorialProof() {
  return (process.env.EDITORIAL_CLOUD_PROOF || DEFAULT_EDITORIAL_PROOF).trim();
}

function verifyPassword(submittedPassword) {
  const clean = typeof submittedPassword === 'string' ? submittedPassword.trim() : '';
  if (!clean) return false;

  const submittedHash = crypto.createHash('sha256').update(clean, 'utf8').digest();
  const envPass = process.env.MASTER_ADMIN_PASSWORD;
  const expectedHex = envPass
    ? crypto.createHash('sha256').update(envPass.trim(), 'utf8').digest('hex')
    : DEFAULT_ADMIN_PASS_HASH;
  const expectedBuf = Buffer.from(expectedHex, 'hex');

  if (submittedHash.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(submittedHash, expectedBuf);
}

function signSessionToken(email) {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role: 'admin',
      exp: Date.now() + SESSION_TTL_MS,
    }),
    'utf8'
  ).toString('base64url');

  const sig = crypto
    .createHmac('sha256', getSessionSigningKey())
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSigningKey())
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed?.email || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    if (String(parsed.email).toLowerCase() !== getExpectedEmail()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

function getClientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (now - entry.windowStart > RATE_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

function clearFailures(ip) {
  loginAttempts.delete(ip);
}

const UPLOADED_PDF_DIR = path.join('/tmp', 'wotho_uploaded_pdfs');

function saveUploadedPdfFromDataUrl(bookId, maybeDataUrl) {
  if (!bookId || typeof maybeDataUrl !== 'string') return false;
  const trimmed = maybeDataUrl.trim();
  let rawBase64 = '';
  if (trimmed.startsWith('data:application/pdf;base64,')) {
    rawBase64 = trimmed.slice('data:application/pdf;base64,'.length);
  } else if (trimmed.startsWith('JVBERi0')) {
    rawBase64 = trimmed;
  }
  if (!rawBase64) return false;
  try {
    const safeId = String(bookId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    if (!fs.existsSync(UPLOADED_PDF_DIR)) {
      fs.mkdirSync(UPLOADED_PDF_DIR, { recursive: true });
    }
    const buf = Buffer.from(rawBase64, 'base64');
    if (buf.length > 100 && buf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      fs.writeFileSync(path.join(UPLOADED_PDF_DIR, `${safeId}.pdf`), buf);
      return true;
    }
  } catch {
    // Ignore /tmp disk write error
  }
  return false;
}

async function readJsonBody(req, maxBytes = 16 * 1024 * 1024) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > maxBytes) {
        resolve({});
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function buildCookieString(value, maxAgeSeconds, req) {
  const isHttps =
    req.headers?.['x-forwarded-proto'] === 'https' ||
    Boolean(req.socket?.encrypted);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHttps) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

export async function handleAdminLoginRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return sendJson(res, 429, {
      ok: false,
      error: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
    });
  }

  const body = await readJsonBody(req, 32 * 1024);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (email !== getExpectedEmail() || !verifyPassword(password)) {
    recordFailure(ip);
    return sendJson(res, 401, {
      ok: false,
      error: 'Credenciais inválidas. Verifique o e-mail e a senha mestra.',
    });
  }

  clearFailures(ip);
  const token = signSessionToken(email);
  res.setHeader('Set-Cookie', buildCookieString(token, Math.floor(SESSION_TTL_MS / 1000), req));

  return sendJson(res, 200, {
    ok: true,
    user: {
      id: 'master-admin-miguel-worscoi',
      email,
      role: 'admin',
      displayName: 'Miguel Worscoi (Editor-Chefe)',
    },
    editorialProofToken: getEditorialProof(),
  });
}

export async function handleAdminSessionRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'GET') {
    return sendJson(res, 405, { authenticated: false });
  }

  const cookies = parseCookies(req);
  const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
  if (!session) {
    return sendJson(res, 200, { authenticated: false });
  }

  return sendJson(res, 200, {
    authenticated: true,
    user: {
      id: 'master-admin-miguel-worscoi',
      email: session.email,
      role: 'admin',
      displayName: 'Miguel Worscoi (Editor-Chefe)',
    },
    editorialProofToken: getEditorialProof(),
  });
}

export async function handleAdminLogoutRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  res.setHeader('Set-Cookie', buildCookieString('', 0, req));
  return sendJson(res, 200, { ok: true });
}

export async function handleEditorialCloudSyncRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const store = readEditorialCloudStore();
  const host = req.headers?.host || 'localhost';
  const parsedUrl = new URL(req.url || '/', `http://${host}`);

  if (req.method === 'GET') {
    const col = (parsedUrl.searchParams.get('collection') || '').trim();
    const bookId = (parsedUrl.searchParams.get('bookId') || '').trim();
    const docId = (parsedUrl.searchParams.get('docId') || '').trim();

    if (col && ALLOWED_COLLECTIONS.has(col)) {
      const bucket = store[col] || {};
      if (docId) {
        return sendJson(res, 200, { ok: true, item: bucket[docId] || null });
      }
      let items = Object.values(bucket);
      if (col === 'chapters' && bookId) {
        items = items
          .filter((c) => c && c.book_id === bookId)
          .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
      } else if (col === 'books' || col === 'news') {
        items = items.filter((it) => it && it.published !== false);
      }
      if (col === 'anime_overrides') {
        return sendJson(res, 200, { ok: true, overrides: bucket });
      }
      return sendJson(res, 200, { ok: true, items });
    }

    return sendJson(res, 200, {
      ok: true,
      news: Object.values(store.news || {}).filter((it) => it && it.published !== false),
      books: Object.values(store.books || {}).filter((it) => it && it.published !== false),
      anime_overrides: store.anime_overrides || {},
    });
  }

  if (req.method === 'POST' || req.method === 'DELETE') {
    const body = await readJsonBody(req);
    const cookies = parseCookies(req);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    const headerProof =
      typeof req.headers?.['x-editorial-proof'] === 'string'
        ? req.headers['x-editorial-proof'].trim()
        : '';
    const bodyProof = typeof body?.proofToken === 'string' ? body.proofToken.trim() : '';
    const submittedProof = headerProof || bodyProof;
    const expectedProof = getEditorialProof();

    if (!session && submittedProof !== expectedProof) {
      return sendJson(res, 401, {
        ok: false,
        error: 'Não autorizado para gravação editorial.',
      });
    }

    const col = typeof body?.collection === 'string' ? body.collection.trim() : '';
    const docId = typeof body?.docId === 'string' ? body.docId.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.trim() : 'upsert';

    if (!ALLOWED_COLLECTIONS.has(col) || !docId) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Coleção ou docId inválido.',
      });
    }

    if (!store[col] || typeof store[col] !== 'object') {
      store[col] = {};
    }

    if (action === 'delete' || req.method === 'DELETE') {
      delete store[col][docId];
    } else if (body?.payload && typeof body.payload === 'object') {
      const nextPayload = {
        ...body.payload,
        id: body.payload.id || docId,
      };
      if (col === 'books') {
        const rawPdf = nextPayload.pdf_base64 || nextPayload.pdf_url || nextPayload.download_url || '';
        const savedDiskPdf = saveUploadedPdfFromDataUrl(nextPayload.id || docId, rawPdf);
        delete nextPayload.pdf_base64;
        if (
          savedDiskPdf ||
          (typeof nextPayload.pdf_url === 'string' && nextPayload.pdf_url.startsWith('data:application/pdf'))
        ) {
          const cleanBookId = encodeURIComponent(nextPayload.id || docId);
          nextPayload.pdf_url = `/api/books/pdf-proxy?id=${cleanBookId}`;
          nextPayload.download_url = `/api/books/pdf-proxy?id=${cleanBookId}&download=true`;
        }
      }
      store[col][docId] = nextPayload;
    }

    writeEditorialCloudStore(store);
    return sendJson(res, 200, { ok: true, collection: col, docId, action });
  }

  return sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
}

