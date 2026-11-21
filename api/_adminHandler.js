import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ADMIN_EMAIL = 'miguelworscoi@gmail.com';
const DEFAULT_ADMIN_PASS_HASH = '1e2ce6c4c4cb90b408758f46a076e7a7873b838d572ee015b976623631a507a7';
const SESSION_COOKIE_NAME = 'worscoi_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PDF_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB raw PDF binary
const PDF_B64_CHUNK_CHARS = 600_000; // Fits safely inside Firestore's 650 KB chapter content rule & 1 MiB doc limit
const FIRESTORE_COMMIT_BATCH_LIMIT = 6; // Max ~3.6 MB per Firestore REST commit
const FIRESTORE_READ_CACHE_TTL_MS = 300_000; // 5-minute shared server read cache (invalidated instantly on any write/delete)
const FIRESTORE_QUOTA_BACKOFF_MS = 120_000; // Pause Firestore reads for 2 min after HTTP 429 RESOURCE_EXHAUSTED
let firestoreQuotaBackoffUntil = 0;

function isQuotaExceededMessage(status, text) {
  if (status === 429) return true;
  const s = String(text || '').toLowerCase();
  return s.includes('resource_exhausted') || s.includes('quota exceeded') || s.includes('quota limit exceeded');
}

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

// Short-lived in-memory cache for Firestore REST reads (invalidated on every write/delete)
const firestoreReadCache = new Map();

function invalidateFirestoreReadCache(col) {
  if (!col) {
    firestoreReadCache.clear();
    return;
  }
  for (const key of firestoreReadCache.keys()) {
    if (key.startsWith(`${col}:`) || key === col) {
      firestoreReadCache.delete(key);
    }
  }
}

// ============================================================
// Firestore REST Persistence Helpers (Server-Side Global Store)
// ============================================================

let cachedFirebaseCfg = null;
let cachedFirebaseCfgMtime = 0;

function loadFirebaseAppletConfig() {
  try {
    const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const mtime = fs.statSync(cfgPath).mtimeMs;
      if (cachedFirebaseCfg && mtime === cachedFirebaseCfgMtime) {
        return cachedFirebaseCfg;
      }
      cachedFirebaseCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      cachedFirebaseCfgMtime = mtime;
      return cachedFirebaseCfg;
    }
  } catch {
    // Ignore config read errors
  }
  return cachedFirebaseCfg || {};
}

function getServerEditorialProofToken() {
  const envProof = process.env.EDITORIAL_FIRESTORE_PROOF;
  if (envProof && envProof.trim().length >= 16) {
    return envProof.trim().slice(0, 128);
  }
  return crypto
    .createHash('sha256')
    .update(`wotho-srv-proof-v3:${DEFAULT_ADMIN_PASS_HASH}:${DEFAULT_ADMIN_EMAIL}`)
    .digest('hex');
}

function sanitizeFirestoreDocId(raw) {
  const safe = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 128);
  return safe || '';
}

function encodeFsValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER) {
      return { integerValue: String(val) };
    }
    return { doubleValue: Number.isFinite(val) ? val : 0 };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFsValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = encodeFsValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function encodeFsFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined) {
      fields[k] = encodeFsValue(v);
    }
  }
  return fields;
}

function decodeFsValue(v) {
  if (!v || typeof v !== 'object') return v;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) {
    return Array.isArray(v.arrayValue?.values) ? v.arrayValue.values.map(decodeFsValue) : [];
  }
  if ('mapValue' in v) {
    const out = {};
    for (const [k, val] of Object.entries(v.mapValue?.fields || {})) {
      out[k] = decodeFsValue(val);
    }
    return out;
  }
  return undefined;
}

function decodeFsDocument(docObj) {
  if (!docObj?.fields) return null;
  const out = {};
  for (const [k, v] of Object.entries(docObj.fields)) {
    out[k] = decodeFsValue(v);
  }
  if (!out.id && typeof docObj.name === 'string') {
    out.id = docObj.name.split('/').pop();
  }
  return out;
}

function sanitizePayloadForFirestore(col, docId, payload) {
  const src = payload && typeof payload === 'object' ? payload : {};
  if (col === 'books') {
    const out = {
      id: sanitizeFirestoreDocId(src.id || docId) || docId,
      title: String(src.title || 'Sem título').trim().slice(0, 300) || 'Sem título',
      author: String(src.author || 'Autor Editorial').trim().slice(0, 150) || 'Autor Editorial',
      published: src.published !== false,
    };
    if (typeof src.description === 'string') out.description = src.description.slice(0, 10000);
    if (typeof src.cover_url === 'string' && src.cover_url.trim()) {
      out.cover_url = src.cover_url.trim().slice(0, 500000);
    }
    if (src.price_cents !== undefined && Number.isFinite(Number(src.price_cents))) {
      out.price_cents = Math.max(0, Math.round(Number(src.price_cents)));
    }
    if (typeof src.currency === 'string' && src.currency.trim()) {
      out.currency = src.currency.trim().slice(0, 10);
    }
    if (typeof src.category === 'string' && src.category.trim()) {
      out.category = src.category.trim().slice(0, 100);
    }
    if (typeof src.featured === 'boolean') out.featured = src.featured;
    if (typeof src.created_at === 'string' && src.created_at.trim()) {
      out.created_at = src.created_at.trim().slice(0, 100);
    } else {
      out.created_at = new Date().toISOString();
    }
    if (typeof src.pdf_url === 'string' && src.pdf_url.trim() && !src.pdf_url.startsWith('data:')) {
      out.pdf_url = src.pdf_url.trim().slice(0, 500000);
    }
    if (typeof src.download_url === 'string' && src.download_url.trim() && !src.download_url.startsWith('data:')) {
      out.download_url = src.download_url.trim().slice(0, 500000);
    }
    if (src.original_pages_count !== undefined && Number.isFinite(Number(src.original_pages_count))) {
      out.original_pages_count = Math.max(0, Math.round(Number(src.original_pages_count)));
    }
    if (typeof src.file_size_formatted === 'string' && src.file_size_formatted.trim()) {
      out.file_size_formatted = src.file_size_formatted.trim().slice(0, 50);
    }
    if (typeof src.edition_notes === 'string' && src.edition_notes.trim()) {
      out.edition_notes = src.edition_notes.trim().slice(0, 1000);
    }
    if (typeof src.source_repository === 'string' && src.source_repository.trim()) {
      out.source_repository = src.source_repository.trim().slice(0, 200);
    }
    if (typeof src.has_cloud_pdf_binary === 'boolean') {
      out.has_cloud_pdf_binary = src.has_cloud_pdf_binary;
    }
    return out;
  }

  if (col === 'chapters') {
    const bookId = sanitizeFirestoreDocId(src.book_id) || String(src.book_id || '').trim().slice(0, 128);
    const out = {
      id: sanitizeFirestoreDocId(src.id || docId) || docId,
      book_id: bookId,
      title: String(src.title || 'Capítulo').trim().slice(0, 300) || 'Capítulo',
      content: String(src.content || '').slice(0, 650000),
      position: Number.isFinite(Number(src.position)) ? Number(src.position) : 1,
    };
    if (typeof src.is_free_preview === 'boolean') out.is_free_preview = src.is_free_preview;
    return out;
  }

  if (col === 'news') {
    const out = {
      id: sanitizeFirestoreDocId(src.id || docId) || docId,
      title: String(src.title || 'Notícia').trim().slice(0, 300) || 'Notícia',
      slug: String(src.slug || docId).trim().slice(0, 150) || docId,
      content: String(src.content || '').slice(0, 50000),
      published: src.published !== false,
    };
    if (typeof src.excerpt === 'string') out.excerpt = src.excerpt.slice(0, 2000);
    if (typeof src.cover_url === 'string' && src.cover_url.trim()) {
      out.cover_url = src.cover_url.trim().slice(0, 500000);
    }
    if (typeof src.category === 'string' && src.category.trim()) {
      out.category = src.category.trim().slice(0, 100);
    }
    if (typeof src.published_at === 'string' && src.published_at.trim()) {
      out.published_at = src.published_at.trim().slice(0, 100);
    }
    if (typeof src.created_at === 'string' && src.created_at.trim()) {
      out.created_at = src.created_at.trim().slice(0, 100);
    }
    if (typeof src.updated_at === 'string' && src.updated_at.trim()) {
      out.updated_at = src.updated_at.trim().slice(0, 100);
    }
    if (typeof src.author === 'string' && src.author.trim()) {
      out.author = src.author.trim().slice(0, 150);
    }
    if (typeof src.source_name === 'string' && src.source_name.trim()) {
      out.source_name = src.source_name.trim().slice(0, 150);
    }
    if (typeof src.source_url === 'string' && src.source_url.trim()) {
      out.source_url = src.source_url.trim().slice(0, 1000);
    }
    return out;
  }

  if (col === 'anime_overrides') {
    const out = {
      id: sanitizeFirestoreDocId(src.id || docId) || docId,
    };
    if (typeof src.title === 'string') out.title = src.title.slice(0, 300);
    if (typeof src.synopsis === 'string') out.synopsis = src.synopsis.slice(0, 5000);
    if (typeof src.cover === 'string') out.cover = src.cover.slice(0, 500000);
    if (typeof src.banner === 'string') out.banner = src.banner.slice(0, 500000);
    if (typeof src.trailerYoutubeId === 'string') out.trailerYoutubeId = src.trailerYoutubeId.slice(0, 100);
    if (typeof src.updatedAt === 'string') out.updatedAt = src.updatedAt.slice(0, 100);
    return out;
  }

  return src;
}

function buildFirestoreDocPath(cfg, col, docId) {
  return `projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents/${col}/${docId}`;
}

function buildEditorialProofWrite(cfg, proofId) {
  const safeProofId = sanitizeFirestoreDocId(proofId);
  return {
    update: {
      name: buildFirestoreDocPath(cfg, 'editorial_auth', safeProofId),
      fields: {
        token: { stringValue: getServerEditorialProofToken() },
      },
    },
    updateTransforms: [
      {
        fieldPath: 'updatedAt',
        setToServerValue: 'REQUEST_TIME',
      },
    ],
  };
}

async function executeFirestoreCommit(writes, timeoutMs = 15_000) {
  const cfg = loadFirebaseAppletConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId || !cfg?.apiKey) {
    return { ok: false, error: 'Configuração do Firebase ausente no servidor.' };
  }
  const dbPath = `projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}`;
  const url = `https://firestore.googleapis.com/v1/${dbPath}/documents:commit?key=${encodeURIComponent(cfg.apiKey)}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) {
      return { ok: true };
    }
    const errText = await res.text().catch(() => '');
    const quotaExceeded = isQuotaExceededMessage(res.status, errText);
    if (quotaExceeded) {
      firestoreQuotaBackoffUntil = Date.now() + FIRESTORE_QUOTA_BACKOFF_MS;
    }
    return {
      ok: false,
      status: res.status,
      quotaExceeded,
      error: quotaExceeded
        ? 'Cota diária gratuita do Firestore atingida (HTTP 429 RESOURCE_EXHAUSTED). A cota reinicia amanhã ou pode ser ampliada no console do Firebase.'
        : `Firestore HTTP ${res.status}: ${errText.slice(0, 240)}`,
    };
  } catch (err) {
    return {
      ok: false,
      quotaExceeded: false,
      error: err instanceof Error ? err.message : 'Falha de rede ao gravar no Firestore.',
    };
  }
}

async function commitFirestoreUpsert(col, rawDocId, payload) {
  const cfg = loadFirebaseAppletConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId || !cfg?.apiKey) {
    return { ok: false, error: 'Configuração do Firebase ausente no servidor.' };
  }
  const docId = sanitizeFirestoreDocId(rawDocId);
  if (!docId) return { ok: false, error: 'Identificador de documento inválido.' };

  const cleanPayload = sanitizePayloadForFirestore(col, docId, payload);
  const writes = [
    buildEditorialProofWrite(cfg, docId),
    {
      update: {
        name: buildFirestoreDocPath(cfg, col, docId),
        fields: encodeFsFields(cleanPayload),
      },
    },
  ];
  const result = await executeFirestoreCommit(writes);
  if (result.ok) {
    invalidateFirestoreReadCache(col);
  }
  return result;
}

async function queryFirestoreChaptersByBookId(bookId) {
  const cfg = loadFirebaseAppletConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId || !cfg?.apiKey || !bookId) return [];
  const dbPath = `projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}`;
  const url = `https://firestore.googleapis.com/v1/${dbPath}/documents:runQuery?key=${encodeURIComponent(cfg.apiKey)}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'chapters' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'book_id' },
              op: 'EQUAL',
              value: { stringValue: String(bookId).slice(0, 128) },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    const out = [];
    for (const row of rows) {
      const decoded = decodeFsDocument(row?.document);
      if (decoded) {
        decoded._docPath = row.document.name;
        out.push(decoded);
      }
    }
    return out.sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
  } catch {
    return [];
  }
}

async function deleteFirestoreChaptersForBookId(bookId) {
  const cfg = loadFirebaseAppletConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId || !cfg?.apiKey || !bookId) return { ok: true };
  const safeBookId = sanitizeFirestoreDocId(bookId);
  if (!safeBookId) return { ok: true };

  const existing = await queryFirestoreChaptersByBookId(safeBookId);
  if (existing.length === 0) return { ok: true };

  for (let i = 0; i < existing.length; i += 40) {
    const slice = existing.slice(i, i + 40);
    const writes = [
      buildEditorialProofWrite(cfg, safeBookId),
      ...slice.map((ch) => ({
        delete: ch._docPath || buildFirestoreDocPath(cfg, 'chapters', sanitizeFirestoreDocId(ch.id)),
      })),
    ];
    await executeFirestoreCommit(writes);
  }
  invalidateFirestoreReadCache('chapters');
  return { ok: true };
}

async function commitFirestoreDelete(col, rawDocId) {
  const cfg = loadFirebaseAppletConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId || !cfg?.apiKey) {
    return { ok: false, error: 'Configuração do Firebase ausente no servidor.' };
  }
  const docId = sanitizeFirestoreDocId(rawDocId);
  if (!docId) return { ok: false, error: 'Identificador de documento inválido.' };

  const writes = [
    buildEditorialProofWrite(cfg, docId),
    {
      delete: buildFirestoreDocPath(cfg, col, docId),
    },
  ];
  const result = await executeFirestoreCommit(writes);
  if (result.ok) {
    invalidateFirestoreReadCache(col);
    if (col === 'books') {
      await deleteFirestoreChaptersForBookId(docId).catch(() => {});
      await deleteFirestoreChaptersForBookId(`pdfbin-${docId}`.slice(0, 128)).catch(() => {});
    }
  }
  return result;
}

async function commitFirestorePdfBase64Chunks(bookId, base64Str, startPosition = 1) {
  const cfg = loadFirebaseAppletConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId || !cfg?.apiKey) {
    return { ok: false, error: 'Configuração do Firebase ausente no servidor.' };
  }
  const safeBookId = sanitizeFirestoreDocId(bookId);
  if (!safeBookId || !base64Str) {
    return { ok: false, error: 'Identificador ou conteúdo PDF inválido.' };
  }

  const binBookId = sanitizeFirestoreDocId(`pdfbin-${safeBookId}`).slice(0, 128);
  const subChunks = [];
  for (let offset = 0; offset < base64Str.length; offset += PDF_B64_CHUNK_CHARS) {
    subChunks.push(base64Str.slice(offset, offset + PDF_B64_CHUNK_CHARS));
  }

  let currentPos = startPosition;
  for (let i = 0; i < subChunks.length; i += FIRESTORE_COMMIT_BATCH_LIMIT) {
    const batchSlice = subChunks.slice(i, i + FIRESTORE_COMMIT_BATCH_LIMIT);
    const writes = [buildEditorialProofWrite(cfg, binBookId)];

    for (const chunkContent of batchSlice) {
      const suffix = `-c${currentPos}`;
      const basePrefix = binBookId.slice(0, 120 - suffix.length);
      const chunkDocId = sanitizeFirestoreDocId(`${basePrefix}${suffix}`);
      const chunkPayload = {
        id: chunkDocId,
        book_id: binBookId,
        title: `PDF Binary Segment ${currentPos}`,
        content: chunkContent,
        position: currentPos,
        is_free_preview: true,
      };
      writes.push({
        update: {
          name: buildFirestoreDocPath(cfg, 'chapters', chunkDocId),
          fields: encodeFsFields(chunkPayload),
        },
      });
      currentPos += 1;
    }

    const res = await executeFirestoreCommit(writes, 25_000);
    if (!res.ok) {
      return res;
    }
  }

  invalidateFirestoreReadCache('chapters');
  return { ok: true, chunksWritten: subChunks.length, nextPosition: currentPos };
}

async function queryFirestoreCollectionRest(col, opts = {}) {
  const cfg = loadFirebaseAppletConfig();
  if (!cfg?.projectId || !cfg?.firestoreDatabaseId || !cfg?.apiKey) return null;

  const { bookId = '', docId = '' } = opts;
  const cacheKey = `${col}:${bookId}:${docId}`;
  const cached = firestoreReadCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FIRESTORE_READ_CACHE_TTL_MS) {
    return cached.data;
  }

  if (Date.now() < firestoreQuotaBackoffUntil) {
    return cached ? cached.data : null;
  }

  const dbPath = `projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}`;

  if (docId) {
    const safeDocId = sanitizeFirestoreDocId(docId);
    if (!safeDocId) return null;
    try {
      const url = `https://firestore.googleapis.com/v1/${dbPath}/documents/${col}/${encodeURIComponent(safeDocId)}?key=${encodeURIComponent(cfg.apiKey)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(7_000) });
      if (res.status === 429) {
        firestoreQuotaBackoffUntil = Date.now() + FIRESTORE_QUOTA_BACKOFF_MS;
        return cached ? cached.data : null;
      }
      if (!res.ok) return null;
      const docObj = await res.json();
      const decoded = decodeFsDocument(docObj);
      firestoreReadCache.set(cacheKey, { data: decoded, ts: Date.now() });
      return decoded;
    } catch {
      return null;
    }
  }

  const structuredQuery = {
    from: [{ collectionId: col }],
    limit: col === 'chapters' ? 500 : 250,
  };

  if (col === 'chapters' && bookId) {
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: 'book_id' },
        op: 'EQUAL',
        value: { stringValue: String(bookId).slice(0, 128) },
      },
    };
  } else if (col === 'books' || col === 'news') {
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: 'published' },
        op: 'EQUAL',
        value: { booleanValue: true },
      },
    };
  }

  try {
    const url = `https://firestore.googleapis.com/v1/${dbPath}/documents:runQuery?key=${encodeURIComponent(cfg.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
      signal: AbortSignal.timeout(9_000),
    });
    if (res.status === 429) {
      firestoreQuotaBackoffUntil = Date.now() + FIRESTORE_QUOTA_BACKOFF_MS;
      return cached ? cached.data : null;
    }
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    const items = [];
    for (const row of rows) {
      const decoded = decodeFsDocument(row?.document);
      if (decoded) items.push(decoded);
    }
    if (col === 'chapters') {
      items.sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
    }
    firestoreReadCache.set(cacheKey, { data: items, ts: Date.now() });
    return items;
  } catch {
    return null;
  }
}

// ============================================================
// Local Warm Disk Cache Helpers
// ============================================================

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

// ============================================================
// Master Admin Auth & Session Verification
// ============================================================

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

// ============================================================
// Local Warm PDF Disk Cache Helpers
// ============================================================

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

function extractRawPdfBase64(maybeDataUrl) {
  if (typeof maybeDataUrl !== 'string') return '';
  const trimmed = maybeDataUrl.trim();
  if (trimmed.startsWith('data:application/pdf;base64,')) {
    return trimmed.slice('data:application/pdf;base64,'.length);
  }
  if (trimmed.startsWith('JVBERi0')) {
    return trimmed;
  }
  return '';
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

// ============================================================
// Public & Admin API Handlers
// ============================================================

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

/**
 * Accepts either a full PDF binary (<= 3.2 MB) or base64-aligned slices (e.g. 2.4 MB each,
 * safely under Vercel's 4.5 MB serverless body limit) and persists all chunks atomically
 * to global Firestore (`chapters` with `book_id: "pdfbin-{bookId}"`) so ANY user on ANY
 * device or cold Vercel instance can read and download the exact original PDF!
 */
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
  const safeDocId = sanitizeFirestoreDocId(rawBookId);

  if (!safeDocId) {
    return sendJson(res, 400, {
      ok: false,
      error: 'Identificador de livro inválido para upload de PDF.',
    });
  }

  const chunkIndexParam = parsedUrl.searchParams.get('chunkIndex');
  const totalChunksParam = parsedUrl.searchParams.get('totalChunks');
  const startPositionParam = parsedUrl.searchParams.get('startPosition');
  const isChunked = chunkIndexParam !== null && totalChunksParam !== null;
  const chunkIndex = isChunked ? Math.max(0, parseInt(chunkIndexParam, 10) || 0) : 0;
  const totalChunks = isChunked ? Math.max(1, parseInt(totalChunksParam, 10) || 1) : 1;
  const startPosition = Math.max(1, parseInt(startPositionParam || '1', 10) || 1);

  const buf = await readRawBodyBuffer(req, MAX_PDF_UPLOAD_BYTES);
  if (!buf || buf.length === 0) {
    return sendJson(res, 400, {
      ok: false,
      error: 'Arquivo PDF vazio ou excedeu o limite máximo de 25 MB.',
    });
  }

  if (chunkIndex === 0) {
    if (buf.length <= 100 || !buf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      return sendJson(res, 400, {
        ok: false,
        error: 'O arquivo enviado não possui assinatura válida de documento PDF.',
      });
    }
    // Clear any stale warm disk file or older Firestore binary chunks before writing fresh PDF
    deleteUploadedPdfFile(rawBookId);
    await deleteFirestoreChaptersForBookId(`pdfbin-${safeDocId}`.slice(0, 128)).catch(() => {});
  }

  // Write warm local disk cache (supports both single-shot and chunked append so server-backed publishing still works during Firestore 429 quota pauses)
  let savedToDisk = false;
  if (!isChunked || totalChunks === 1) {
    savedToDisk = saveUploadedPdfBuffer(rawBookId, buf);
  } else {
    const safeFileId = sanitizeBookFileId(rawBookId);
    if (safeFileId) {
      for (const dir of [UPLOADED_PDF_DIR, LEGACY_TMP_PDF_DIR]) {
        try {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const targetPath = resolveConfinedPdfPath(dir, safeFileId);
          if (targetPath) {
            if (chunkIndex === 0) fs.writeFileSync(targetPath, buf);
            else fs.appendFileSync(targetPath, buf);
            savedToDisk = true;
          }
        } catch {}
      }
    }
  }

  // Persist globally to Firestore (works across all Vercel serverless instances & devices!)
  const base64Slice = buf.toString('base64');
  const fsRes = await commitFirestorePdfBase64Chunks(safeDocId, base64Slice, startPosition);
  const encodedId = encodeURIComponent(rawBookId);

  if (!fsRes.ok) {
    if (fsRes.quotaExceeded && savedToDisk) {
      return sendJson(res, 200, {
        ok: true,
        firestoreSynced: false,
        serverSynced: true,
        quotaExceeded: true,
        warning: fsRes.error,
        id: rawBookId,
        sizeBytes: buf.length,
        chunkIndex,
        totalChunks,
        nextPosition: startPosition + Math.ceil(base64Slice.length / PDF_B64_CHUNK_CHARS),
        chunksWritten: Math.ceil(base64Slice.length / PDF_B64_CHUNK_CHARS),
        pdfUrl: `/api/books/pdf-proxy?id=${encodedId}`,
        downloadUrl: `/api/books/pdf-proxy?id=${encodedId}&download=true`,
      });
    }
    return sendJson(res, fsRes.quotaExceeded ? 429 : 502, {
      ok: false,
      firestoreSynced: false,
      quotaExceeded: Boolean(fsRes.quotaExceeded),
      error: fsRes.error || 'Falha ao persistir o arquivo PDF na base de dados global.',
    });
  }

  return sendJson(res, 200, {
    ok: true,
    firestoreSynced: true,
    serverSynced: true,
    id: rawBookId,
    sizeBytes: buf.length,
    chunkIndex,
    totalChunks,
    nextPosition: fsRes.nextPosition,
    chunksWritten: fsRes.chunksWritten,
    pdfUrl: `/api/books/pdf-proxy?id=${encodedId}`,
    downloadUrl: `/api/books/pdf-proxy?id=${encodedId}&download=true`,
  });
}

function mergeById(primaryList, fallbackMap) {
  const out = new Map();
  if (Array.isArray(primaryList)) {
    for (const item of primaryList) {
      if (item && item.id) out.set(item.id, item);
    }
  }
  if (fallbackMap && typeof fallbackMap === 'object') {
    for (const [k, item] of Object.entries(fallbackMap)) {
      const id = item?.id || k;
      if (item && id && !out.has(id)) {
        out.set(id, item);
      }
    }
  }
  return Array.from(out.values());
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
        const fsDoc = await queryFirestoreCollectionRest(col, { docId });
        const direct =
          fsDoc ||
          bucket[docId] ||
          Object.values(bucket).find((it) => it && (it.id === docId || it.slug === docId)) ||
          null;
        return sendJson(res, 200, { ok: true, item: direct });
      }

      const fsItems = await queryFirestoreCollectionRest(col, { bookId });
      if (col === 'anime_overrides') {
        const overrides = { ...bucket };
        if (Array.isArray(fsItems)) {
          for (const item of fsItems) {
            if (item?.id) overrides[item.id] = item;
          }
        }
        return sendJson(res, 200, { ok: true, overrides });
      }

      let items = mergeById(fsItems || [], bucket);
      if (col === 'chapters' && bookId) {
        items = items
          .filter((c) => c && c.book_id === bookId)
          .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
      } else if (col === 'books' || col === 'news') {
        items = items.filter((it) => it && it.published !== false);
      }
      return sendJson(res, 200, { ok: true, items });
    }

    const [fsNews, fsBooks, fsOverrides] = await Promise.all([
      queryFirestoreCollectionRest('news'),
      queryFirestoreCollectionRest('books'),
      queryFirestoreCollectionRest('anime_overrides'),
    ]);

    const mergedOverrides = { ...(store.anime_overrides || {}) };
    if (Array.isArray(fsOverrides)) {
      for (const item of fsOverrides) {
        if (item?.id) mergedOverrides[item.id] = item;
      }
    }

    return sendJson(res, 200, {
      ok: true,
      news: mergeById(fsNews || [], store.news).filter((it) => it && it.published !== false),
      books: mergeById(fsBooks || [], store.books).filter((it) => it && it.published !== false),
      anime_overrides: mergedOverrides,
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
    const rawDocId = typeof body?.docId === 'string' ? body.docId.trim() : '';
    const docId = sanitizeFirestoreDocId(rawDocId);
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

    let firestoreRes = { ok: false, error: '' };

    if (action === 'delete' || req.method === 'DELETE') {
      firestoreRes = await commitFirestoreDelete(col, docId);
      delete store[col][rawDocId];
      delete store[col][docId];
      if (col === 'books') {
        deleteUploadedPdfFile(rawDocId);
        deleteUploadedPdfFile(docId);
        const chaptersBucket = store.chapters || {};
        for (const [chKey, chVal] of Object.entries(chaptersBucket)) {
          if (
            chVal &&
            (chVal.book_id === rawDocId ||
              chVal.book_id === docId ||
              chVal.book_id === `pdfbin-${rawDocId}` ||
              chVal.book_id === `pdfbin-${docId}`)
          ) {
            delete chaptersBucket[chKey];
          }
        }
      }
      writeEditorialCloudStore(store);
      if (!firestoreRes.ok) {
        return sendJson(res, 502, {
          ok: false,
          firestoreSynced: false,
          error: firestoreRes.error || 'Falha ao remover publicação na base global.',
        });
      }
      return sendJson(res, 200, {
        ok: true,
        firestoreSynced: true,
        collection: col,
        docId,
        action: 'delete',
      });
    }

    if (body?.payload && typeof body.payload === 'object') {
      const nextPayload = {
        ...body.payload,
        id: body.payload.id || docId,
      };

      if (col === 'books') {
        const rawPdf = nextPayload.pdf_base64 || nextPayload.pdf_url || nextPayload.download_url || '';
        const inlineB64 = extractRawPdfBase64(rawPdf);
        let savedInlinePdf = false;
        if (inlineB64) {
          try {
            const pdfBuf = Buffer.from(inlineB64, 'base64');
            if (pdfBuf.length > 100 && pdfBuf.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
              saveUploadedPdfBuffer(docId, pdfBuf);
              await deleteFirestoreChaptersForBookId(`pdfbin-${docId}`.slice(0, 128)).catch(() => {});
              const pdfCommit = await commitFirestorePdfBase64Chunks(docId, inlineB64, 1);
              savedInlinePdf = pdfCommit.ok;
            }
          } catch {
            // Ignore malformed inline pdf_base64
          }
        }
        delete nextPayload.pdf_base64;

        if (
          savedInlinePdf ||
          nextPayload.has_cloud_pdf_binary ||
          (typeof nextPayload.pdf_url === 'string' &&
            (nextPayload.pdf_url.startsWith('data:application/pdf') ||
              nextPayload.pdf_url.startsWith('idb://')))
        ) {
          const cleanBookId = encodeURIComponent(nextPayload.id || docId);
          nextPayload.pdf_url = `/api/books/pdf-proxy?id=${cleanBookId}`;
          nextPayload.download_url = `/api/books/pdf-proxy?id=${cleanBookId}&download=true`;
          nextPayload.has_cloud_pdf_binary = true;
        }
      }

      firestoreRes = await commitFirestoreUpsert(col, docId, nextPayload);
      store[col][docId] = sanitizePayloadForFirestore(col, docId, nextPayload);
      writeEditorialCloudStore(store);

      if (!firestoreRes.ok) {
        if (firestoreRes.quotaExceeded) {
          return sendJson(res, 200, {
            ok: true,
            firestoreSynced: false,
            serverSynced: true,
            quotaExceeded: true,
            warning: firestoreRes.error,
            collection: col,
            docId,
            action: 'upsert',
          });
        }
        return sendJson(res, 502, {
          ok: false,
          firestoreSynced: false,
          serverSynced: true,
          error: firestoreRes.error || 'Falha ao gravar publicação na base de dados global.',
        });
      }

      return sendJson(res, 200, {
        ok: true,
        firestoreSynced: true,
        serverSynced: true,
        collection: col,
        docId,
        action: 'upsert',
      });
    }

    return sendJson(res, 400, { ok: false, error: 'Payload editorial ausente.' });
  }

  return sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
}
