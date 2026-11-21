import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ADMIN_EMAIL = 'miguelworscoi@gmail.com';
const DEFAULT_ADMIN_PASS_HASH = '1e2ce6c4c4cb90b408758f46a076e7a7873b838d572ee015b976623631a507a7';
const SESSION_COOKIE_NAME = 'worscoi_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PDF_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB raw PDF binary

function resolveStorageDir() {
  const localDir = path.join(process.cwd(), '.cache', 'wotho_editorial');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return localDir;
  } catch {
    return '/tmp';
  }
}

const EDITORIAL_STORAGE_DIR = resolveStorageDir();
const EDITORIAL_CLOUD_STORE_PATH = path.join(EDITORIAL_STORAGE_DIR, 'wotho_editorial_cloud_store_v1.json');
const LEGACY_TMP_STORE_PATH = path.join('/tmp', 'wotho_editorial_cloud_store_v1.json');
const UPLOADED_PDF_DIR = path.join(EDITORIAL_STORAGE_DIR, 'wotho_uploaded_pdfs');
const LEGACY_TMP_PDF_DIR = path.join('/tmp', 'wotho_uploaded_pdfs');
const ALLOWED_COLLECTIONS = new Set(['news', 'books', 'chapters', 'anime_overrides']);

let memoryEditorialStore = null;
let memoryStoreMtimeMs = 0;

function readEditorialCloudStore() {
  try {
    if (fs.existsSync(EDITORIAL_CLOUD_STORE_PATH)) {
      const stat = fs.statSync(EDITORIAL_CLOUD_STORE_PATH);
      if (memoryEditorialStore && stat.mtimeMs === memoryStoreMtimeMs) {
        return memoryEditorialStore;
      }
    }
  } catch {
    if (memoryEditorialStore) return memoryEditorialStore;
  }

  const empty = {
    news: {},
    books: {},
    chapters: {},
    anime_overrides: {},
  };

  for (const candidatePath of [EDITORIAL_CLOUD_STORE_PATH, LEGACY_TMP_STORE_PATH]) {
    try {
      if (fs.existsSync(candidatePath)) {
        const stat = fs.statSync(candidatePath);
        const raw = fs.readFileSync(candidatePath, 'utf8');
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
          memoryStoreMtimeMs = stat.mtimeMs;
          return memoryEditorialStore;
        }
      }
    } catch {
      // Try next path
    }
  }
  memoryEditorialStore = empty;
  return memoryEditorialStore;
}

function writeEditorialCloudStore(store) {
  memoryEditorialStore = store;
  const serialized = JSON.stringify(store);
  try {
    fs.writeFileSync(EDITORIAL_CLOUD_STORE_PATH, serialized, 'utf8');
    memoryStoreMtimeMs = fs.statSync(EDITORIAL_CLOUD_STORE_PATH).mtimeMs;
  } catch {
    // Ignore primary write errors
  }
  if (LEGACY_TMP_STORE_PATH !== EDITORIAL_CLOUD_STORE_PATH) {
    try {
      fs.writeFileSync(LEGACY_TMP_STORE_PATH, serialized, 'utf8');
    } catch {
      // Ignore /tmp mirror write errors
    }
  }
}

// Sliding-window rate limiter per IP (protects against password brute-force)
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function getExpectedEmail() {
  return (process.env.MASTER_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function getSessionSigningKey() {
  const configured = process.env.EDITORIAL_SESSION_SECRET;
  if (configured && configured.length >= 16) return configured;
  return crypto
    .createHash('sha256')
    .update(`worscoi-hmac-v2:${process.env.MASTER_ADMIN_PASSWORD || DEFAULT_ADMIN_PASS_HASH}:${getExpectedEmail()}`)
    .digest('hex');
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

function extractBearerToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (typeof authHeader !== 'string') return '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function authenticateAdminRequest(req) {
  const bearer = extractBearerToken(req);
  if (bearer) {
    const fromBearer = verifySessionToken(bearer);
    if (fromBearer) return { session: fromBearer, token: bearer };
  }
  const cookies = parseCookies(req);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    const fromCookie = verifySessionToken(cookieToken);
    if (fromCookie) return { session: fromCookie, token: cookieToken };
  }
  return null;
}

function isSameOriginOrCustomHeader(req) {
  const xrw = req.headers?.['x-requested-with'];
  if (typeof xrw === 'string' && xrw.trim().length > 0) return true;
  const origin = req.headers?.origin;
  const host = req.headers?.host;
  if (!origin || !host) return true;
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host.toLowerCase() === String(host).toLowerCase();
  } catch {
    return false;
  }
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

function sanitizeBookFileId(bookId) {
  const safe = String(bookId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 128);
  return safe || '';
}

function resolveConfinedPdfPath(dir, safeId) {
  if (!safeId) return null;
  const resolvedDir = path.resolve(dir);
  const target = path.resolve(resolvedDir, `${safeId}.pdf`);
  if (!target.startsWith(resolvedDir + path.sep)) {
    return null;
  }
  return target;
}

function saveUploadedPdfBuffer(bookId, buf) {
  if (!bookId || !Buffer.isBuffer(buf)) return false;
  if (buf.length <= 100 || buf.length > MAX_PDF_UPLOAD_BYTES) return false;
  if (!buf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) return false;

  const safeId = sanitizeBookFileId(bookId);
  if (!safeId) return false;

  let wroteAny = false;
  for (const dir of [UPLOADED_PDF_DIR, LEGACY_TMP_PDF_DIR]) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const targetPath = resolveConfinedPdfPath(dir, safeId);
      if (targetPath) {
        fs.writeFileSync(targetPath, buf);
        wroteAny = true;
      }
    } catch {
      // Try next storage directory
    }
  }
  return wroteAny;
}

function deleteUploadedPdfFile(bookId) {
  const safeId = sanitizeBookFileId(bookId);
  if (!safeId) return;
  for (const dir of [UPLOADED_PDF_DIR, LEGACY_TMP_PDF_DIR]) {
    try {
      const targetPath = resolveConfinedPdfPath(dir, safeId);
      if (targetPath && fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

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
    const buf = Buffer.from(rawBase64, 'base64');
    return saveUploadedPdfBuffer(bookId, buf);
  } catch {
    return false;
  }
}

async function readRawBodyBuffer(req, maxBytes = MAX_PDF_UPLOAD_BYTES) {
  if (Buffer.isBuffer(req.body)) {
    return req.body.length <= maxBytes ? req.body : null;
  }
  return new Promise((resolve) => {
    const chunks = [];
    let total = 0;
    let exceeded = false;
    req.on('data', (chunk) => {
      if (exceeded) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > maxBytes) {
        exceeded = true;
        resolve(null);
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (exceeded) return;
      resolve(Buffer.concat(chunks));
    });
    req.on('error', () => resolve(null));
  });
}

async function readJsonBody(req, maxBytes = 24 * 1024 * 1024) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
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
    let exceeded = false;
    req.on('data', (chunk) => {
      if (exceeded) return;
      raw += chunk;
      if (raw.length > maxBytes) {
        exceeded = true;
        resolve({});
      }
    });
    req.on('end', () => {
      if (exceeded) return;
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
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHttps) {
    parts.push('SameSite=None', 'Secure', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
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
    sessionToken: token,
    user: {
      id: 'master-admin-miguel-worscoi',
      email,
      role: 'admin',
      displayName: 'Miguel Worscoi (Editor-Chefe)',
    },
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

  const auth = authenticateAdminRequest(req);
  if (!auth) {
    return sendJson(res, 200, { authenticated: false });
  }

  return sendJson(res, 200, {
    authenticated: true,
    sessionToken: auth.token,
    user: {
      id: 'master-admin-miguel-worscoi',
      email: auth.session.email,
      role: 'admin',
      displayName: 'Miguel Worscoi (Editor-Chefe)',
    },
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

export async function handleEditorialPdfUploadRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
  }

  const auth = authenticateAdminRequest(req);
  if (!auth || !isSameOriginOrCustomHeader(req)) {
    return sendJson(res, 401, {
      ok: false,
      error: 'Sessão de administrador necessária para enviar arquivos PDF.',
    });
  }

  const host = req.headers?.host || 'localhost';
  const parsedUrl = new URL(req.url || '/', `http://${host}`);
  const rawBookId = (parsedUrl.searchParams.get('id') || '').trim();
  const safeId = sanitizeBookFileId(rawBookId);

  if (!safeId) {
    return sendJson(res, 400, {
      ok: false,
      error: 'Identificador de livro inválido para upload de PDF.',
    });
  }

  const buf = await readRawBodyBuffer(req, MAX_PDF_UPLOAD_BYTES);
  if (!buf || buf.length <= 100) {
    return sendJson(res, 400, {
      ok: false,
      error: 'Arquivo PDF vazio ou excedeu o limite máximo de 25 MB.',
    });
  }

  if (!buf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
    return sendJson(res, 400, {
      ok: false,
      error: 'O arquivo enviado não possui assinatura válida de documento PDF.',
    });
  }

  const saved = saveUploadedPdfBuffer(rawBookId, buf);
  if (!saved) {
    return sendJson(res, 500, {
      ok: false,
      error: 'Não foi possível salvar o arquivo PDF no servidor.',
    });
  }

  const encodedId = encodeURIComponent(rawBookId);
  return sendJson(res, 200, {
    ok: true,
    id: rawBookId,
    sizeBytes: buf.length,
    pdfUrl: `/api/books/pdf-proxy?id=${encodedId}`,
    downloadUrl: `/api/books/pdf-proxy?id=${encodedId}&download=true`,
  });
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
        const direct =
          bucket[docId] ||
          Object.values(bucket).find((it) => it && (it.id === docId || it.slug === docId)) ||
          null;
        return sendJson(res, 200, { ok: true, item: direct });
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
    const auth = authenticateAdminRequest(req);
    if (!auth || !isSameOriginOrCustomHeader(req)) {
      return sendJson(res, 401, {
        ok: false,
        error: 'Sessão de administrador inválida ou expirada. Entre novamente no painel.',
      });
    }

    const body = await readJsonBody(req);
    const col = typeof body?.collection === 'string' ? body.collection.trim() : '';
    const docId = typeof body?.docId === 'string' ? body.docId.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.trim() : 'upsert';

    if (!ALLOWED_COLLECTIONS.has(col) || !docId) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Coleção ou identificador inválido.',
      });
    }

    if (!store[col] || typeof store[col] !== 'object') {
      store[col] = {};
    }

    if (action === 'delete' || req.method === 'DELETE') {
      delete store[col][docId];
      if (col === 'books') {
        deleteUploadedPdfFile(docId);
        const chaptersBucket = store.chapters || {};
        for (const [chKey, chVal] of Object.entries(chaptersBucket)) {
          if (chVal && (chVal.book_id === docId || chVal.book_id === `pdfbin-${docId}`)) {
            delete chaptersBucket[chKey];
          }
        }
      }
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
          (typeof nextPayload.pdf_url === 'string' &&
            (nextPayload.pdf_url.startsWith('data:application/pdf') ||
              nextPayload.pdf_url.startsWith('idb://')))
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
