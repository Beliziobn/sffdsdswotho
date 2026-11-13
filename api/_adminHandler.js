import crypto from 'node:crypto';

const DEFAULT_ADMIN_EMAIL = 'miguelworscoi@gmail.com';
const DEFAULT_ADMIN_PASS_HASH = '1e2ce6c4c4cb90b408758f46a076e7a7873b838d572ee015b976623631a507a7';
const DEFAULT_EDITORIAL_PROOF = 'wotho-ed-proof-9f81c4a7b2e6d309581a';
const SESSION_COOKIE_NAME = 'worscoi_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

async function readJsonBody(req) {
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
      if (raw.length > 32 * 1024) {
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

  const body = await readJsonBody(req);
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
