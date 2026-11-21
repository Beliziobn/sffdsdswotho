import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { auth, db, ensureFirestoreReady, ensureFirestoreOnline } from "./firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import type { Book, Chapter, NewsItem } from "@/hooks/useCatalog";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw error instanceof Error ? error : new Error(JSON.stringify(errInfo));
}

const NEWS_COLLECTION = "news";
const BOOKS_COLLECTION = "books";
const CHAPTERS_COLLECTION = "chapters";
const ANIME_OVERRIDES_COLLECTION = "anime_overrides";

const READ_CACHE_TTL_MS = 120_000;
const FIRESTORE_READ_TIMEOUT_MS = 9_000;

const ADMIN_BEARER_STORAGE_KEY = "worscoi_admin_bearer_v1";

const GOOGLE_ADMIN_EMAILS = new Set([
  "miguelworscoi@gmail.com",
  "mongedoun327@gmail.com",
  "socienciadaeduca2018@gmail.com",
  "fubnn10@gmail.com",
]);

function isGoogleAdminAuthenticated(): boolean {
  const user = auth.currentUser;
  if (!user || user.isAnonymous || !user.email || !user.emailVerified) {
    return false;
  }
  return GOOGLE_ADMIN_EMAILS.has(user.email.trim().toLowerCase());
}

function getStoredMasterBearerToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const s = sessionStorage.getItem(ADMIN_BEARER_STORAGE_KEY);
    if (s && s.includes(".")) return s.trim();
    const l = localStorage.getItem(ADMIN_BEARER_STORAGE_KEY);
    if (l && l.includes(".")) {
      sessionStorage.setItem(ADMIN_BEARER_STORAGE_KEY, l.trim());
      return l.trim();
    }
  } catch {}
  return "";
}

function hasMasterAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (getStoredMasterBearerToken()) return true;
    const raw = localStorage.getItem("worscoi_special_admin_session_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email === "miguelworscoi@gmail.com") return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function resolveMasterSessionBearerToken(): Promise<string> {
  if (typeof window === "undefined") return "";
  const stored = getStoredMasterBearerToken();
  if (stored) return stored;
  try {
    const res = await fetch("/api/admin/session", {
      method: "GET",
      headers: { "X-Requested-With": "WothoStudio" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.authenticated && typeof data?.sessionToken === "string" && data.sessionToken.includes(".")) {
        sessionStorage.setItem(ADMIN_BEARER_STORAGE_KEY, data.sessionToken.trim());
        localStorage.setItem(ADMIN_BEARER_STORAGE_KEY, data.sessionToken.trim());
        return data.sessionToken.trim();
      }
    }
  } catch {
    // Ignore storage/network error
  }
  return "";
}

function canAuthorizeCloudWrite(): boolean {
  return Boolean(isGoogleAdminAuthenticated() || hasMasterAdminSession());
}

async function syncEditorialDocViaServerApi(
  collectionName: string,
  docId: string,
  action: "upsert" | "delete",
  payload?: Record<string, any>
): Promise<{ ok: boolean; status: number; firestoreSynced: boolean; quotaExceeded?: boolean; warning?: string; error?: string }> {
  if (typeof window === "undefined") return { ok: false, status: 0, firestoreSynced: false };
  try {
    const bearer = await resolveMasterSessionBearerToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Requested-With": "WothoStudio",
    };
    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }
    const res = await fetch("/api/editorial/sync", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        collection: collectionName,
        docId,
        action,
        payload,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok) {
      return {
        ok: true,
        status: res.status,
        firestoreSynced: Boolean(data?.firestoreSynced),
        quotaExceeded: Boolean(data?.quotaExceeded),
        warning: typeof data?.warning === "string" ? data.warning : undefined,
      };
    }
    return {
      ok: false,
      status: res.status,
      firestoreSynced: false,
      quotaExceeded: Boolean(data?.quotaExceeded || res.status === 429),
      error: data?.error || `Erro HTTP ${res.status} ao sincronizar com o servidor.`,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      firestoreSynced: false,
      error: "Falha de rede ao comunicar com o servidor editorial.",
    };
  }
}

// 2.4 MB raw binary slices (exact multiple of 3 bytes so base64 segments concatenate without mid-stream padding,
// and comfortably below Vercel's 4.5 MB serverless HTTP body limit for PDFs up to 25 MB!)
const PDF_UPLOAD_SLICE_BYTES = 2_400_000;

export async function uploadPdfBinaryToServer(
  bookId: string,
  pdfBytes: ArrayBuffer | Uint8Array,
  onProgress?: (step: string, pct: number) => void
): Promise<{ ok: boolean; status: number; firestoreSynced: boolean; quotaExceeded?: boolean; error?: string }> {
  if (typeof window === "undefined" || !bookId) {
    return { ok: false, status: 0, firestoreSynced: false };
  }
  try {
    const bearer = await resolveMasterSessionBearerToken();
    const bytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
    const totalChunks = Math.max(1, Math.ceil(bytes.byteLength / PDF_UPLOAD_SLICE_BYTES));
    let nextPosition = 1;
    let allFirestoreSynced = true;
    let anyQuotaExceeded = false;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * PDF_UPLOAD_SLICE_BYTES;
      const end = Math.min(bytes.byteLength, start + PDF_UPLOAD_SLICE_BYTES);
      const slice = bytes.subarray(start, end);

      if (onProgress) {
        const pct = Math.round(((chunkIndex + 0.25) / totalChunks) * 90);
        onProgress(
          totalChunks > 1
            ? `Publicando PDF na nuvem global (parte ${chunkIndex + 1}/${totalChunks})...`
            : "Publicando PDF original na nuvem global...",
          pct
        );
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/pdf",
        "X-Requested-With": "WothoStudio",
      };
      if (bearer) {
        headers.Authorization = `Bearer ${bearer}`;
      }

      const params = new URLSearchParams({
        id: bookId,
        chunkIndex: String(chunkIndex),
        totalChunks: String(totalChunks),
        startPosition: String(nextPosition),
      });

      const res = await fetch(`/api/editorial/pdf-upload?${params.toString()}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: new Blob([new Uint8Array(slice)], { type: "application/pdf" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        return {
          ok: false,
          status: res.status,
          firestoreSynced: false,
          quotaExceeded: Boolean(data?.quotaExceeded || res.status === 429),
          error: data?.error || `Falha ao enviar parte ${chunkIndex + 1}/${totalChunks} do PDF (HTTP ${res.status}).`,
        };
      }

      if (!data?.firestoreSynced) allFirestoreSynced = false;
      if (data?.quotaExceeded) anyQuotaExceeded = true;

      if (typeof data?.nextPosition === "number" && data.nextPosition > nextPosition) {
        nextPosition = data.nextPosition;
      } else {
        nextPosition += Math.max(1, Number(data?.chunksWritten) || 1);
      }
    }

    onProgress?.(
      allFirestoreSynced
        ? "PDF original publicado na nuvem para todos os leitores!"
        : "PDF salvo no servidor editorial!",
      100
    );
    return {
      ok: true,
      status: 200,
      firestoreSynced: allFirestoreSynced,
      quotaExceeded: anyQuotaExceeded,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      firestoreSynced: false,
      error: "Falha de rede ao enviar o arquivo PDF.",
    };
  }
}

async function fetchEditorialCollectionFromServerApi<T = any>(
  collectionName: string,
  extraParams: Record<string, string> = {}
): Promise<T[]> {
  if (typeof window === "undefined") return [];
  try {
    const params = new URLSearchParams({ collection: collectionName, ...extraParams });
    const res = await fetch(`/api/editorial/sync?${params.toString()}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data?.items) ? (data.items as T[]) : [];
  } catch {
    return [];
  }
}

async function fetchEditorialOverridesFromServerApi(): Promise<Record<string, Record<string, any>>> {
  if (typeof window === "undefined") return {};
  try {
    const res = await fetch("/api/editorial/sync?collection=anime_overrides", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return {};
    const data = await res.json().catch(() => ({}));
    return data?.overrides && typeof data.overrides === "object" ? data.overrides : {};
  } catch {
    return {};
  }
}

function isFirestorePermissionDenied(err: any): boolean {
  const code = String(err?.code || "").toLowerCase();
  const msg = String(err?.message || err || "").toLowerCase();
  return code === "permission-denied" || msg.includes("insufficient permissions") || msg.includes("permission_denied");
}

function attachSyncMeta(err: unknown, serverSynced: boolean): Error {
  const wrapped = err instanceof Error ? err : new Error(String(err || "Falha ao gravar no Firestore."));
  (wrapped as any).serverSynced = serverSynced;
  (wrapped as any).permissionDenied = isFirestorePermissionDenied(err);
  return wrapped;
}

async function writeEditorialDoc(
  collectionName: string,
  docId: string,
  payload: Record<string, any>,
  firestoreSafePayload?: Record<string, any>
): Promise<{ firestoreSynced: boolean; serverSynced: boolean; quotaExceeded?: boolean; warning?: string }> {
  const serverRes = await syncEditorialDocViaServerApi(
    collectionName,
    docId,
    "upsert",
    payload
  );
  const serverSynced = serverRes.ok;

  // Primary Master Admin global cloud path: server wrote atomically to Firestore — ZERO Google login required!
  if (serverSynced && serverRes.firestoreSynced) {
    return { firestoreSynced: true, serverSynced: true };
  }

  // If Firestore free daily quota was reached (HTTP 429), do NOT block Master Admin publishing:
  // the book is already saved on the editorial server and can be synced to Firestore when quota resets/upgrades.
  if (serverSynced && serverRes.quotaExceeded) {
    return {
      firestoreSynced: false,
      serverSynced: true,
      quotaExceeded: true,
      warning: serverRes.warning,
    };
  }

  const fsData = firestoreSafePayload || payload;
  const targetPath = `${collectionName}/${docId}`;

  // Fallback direct client Firestore SDK write when Google Admin is authenticated
  if (isGoogleAdminAuthenticated()) {
    const online = await ensureFirestoreOnline();
    if (online) {
      try {
        await setDoc(doc(db, collectionName, docId), fsData);
        return { firestoreSynced: true, serverSynced };
      } catch (err: any) {
        if (serverSynced) {
          console.warn(`[CloudEditorial] Fallback Firestore write warning (${targetPath}):`, err?.message || err);
          return { firestoreSynced: false, serverSynced: true };
        }
        try {
          handleFirestoreError(err, OperationType.WRITE, targetPath);
        } catch (wrapped) {
          throw attachSyncMeta(wrapped, serverSynced);
        }
      }
    }
  }

  // If server saved cleanly even without Firestore confirmation, never block publishing
  if (serverSynced) {
    return { firestoreSynced: false, serverSynced: true };
  }

  if (serverRes.status === 401) {
    throw new Error(
      "Sessão de administrador mestre expirada. Saia e entre novamente com seu e-mail e senha mestra em /admin."
    );
  }

  throw new Error(
    serverRes.error ||
      "Não foi possível confirmar a gravação na base de dados global (Firestore). Verifique sua conexão e tente novamente."
  );
}

async function deleteEditorialDoc(
  collectionName: string,
  docId: string
): Promise<void> {
  const serverRes = await syncEditorialDocViaServerApi(
    collectionName,
    docId,
    "delete"
  );
  const serverSynced = serverRes.ok;

  if (serverSynced && serverRes.firestoreSynced) {
    return;
  }

  if (isGoogleAdminAuthenticated()) {
    const online = await ensureFirestoreOnline();
    if (online) {
      try {
        await deleteDoc(doc(db, collectionName, docId));
        return;
      } catch (err: any) {
        if (serverSynced) return;
        handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
      }
    }
  }

  if (!serverSynced || !serverRes.firestoreSynced) {
    throw new Error(
      serverRes.error ||
        "Falha ao remover publicação na base de dados global. Entre novamente no Studio Editorial (/admin)."
    );
  }
}

function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== "object") return val;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return Boolean(val.booleanValue);
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue" in val) {
    return Array.isArray(val.arrayValue?.values)
      ? val.arrayValue.values.map(decodeFirestoreValue)
      : [];
  }
  if ("mapValue" in val) {
    const out: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const k of Object.keys(fields)) {
      out[k] = decodeFirestoreValue(fields[k]);
    }
    return out;
  }
  return undefined;
}

function decodeFirestoreDoc(docObj: any): { id: string; data: Record<string, any> } | null {
  if (!docObj?.name) return null;
  const parts = String(docObj.name).split("/");
  const id = parts[parts.length - 1] || "";
  const out: Record<string, any> = {};
  const fields = docObj.fields || {};
  for (const k of Object.keys(fields)) {
    out[k] = decodeFirestoreValue(fields[k]);
  }
  return { id, data: out };
}

async function runRestQuery(structuredQuery: Record<string, any>): Promise<Array<{ id: string; data: Record<string, any> }>> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return [];
  if (
    typeof navigator !== "undefined" &&
    /googlebot|google-inspectiontool|storebot-google|adsbot-google|apis-google|mediapartners-google|googleother|bingbot|bingpreview|msnbot|adidxbot|duckduckbot|baiduspider|yandexbot|slurp|applebot|facebookexternalhit|twitterbot|linkedinbot|oai-searchbot|chatgpt-user|gptbot|claudebot|perplexitybot|lighthouse|chrome-lighthouse|pagespeed|gtmetrix|ptst|headlesschrome/i.test(
      navigator.userAgent || ""
    )
  ) {
    return [];
  }
  if (typeof fetch !== "function") return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const dbPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
    const url = `https://firestore.googleapis.com/v1/${dbPath}/documents:runQuery?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ structuredQuery }),
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    const docs: Array<{ id: string; data: Record<string, any> }> = [];
    for (const row of rows) {
      if (row?.document) {
        const decoded = decodeFirestoreDoc(row.document);
        if (decoded) docs.push(decoded);
      }
    }
    return docs;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

let cachedNewsResult: { data: NewsItem[]; ts: number } | null = null;
let inflightNewsPromise: Promise<NewsItem[]> | null = null;

let cachedBooksResult: { data: Book[]; ts: number } | null = null;
let inflightBooksPromise: Promise<Book[]> | null = null;

const cachedChaptersMap = new Map<string, { data: Chapter[]; ts: number }>();
const inflightChaptersMap = new Map<string, Promise<Chapter[]>>();

let cachedAnimeResult: { data: Record<string, Record<string, any>>; ts: number } | null = null;
let inflightAnimePromise: Promise<Record<string, Record<string, any>>> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, ms);
    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      });
  });
}

// Sanitize string keys to ensure valid Firestore document IDs
export function sanitizeDocId(rawId: string): string {
  const cleaned = rawId
    .trim()
    .replace(/[^a-zA-Z0-9_\-\.]/g, "-")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 120);
  if (!cleaned || cleaned === "." || cleaned === "..") {
    return `doc-${Date.now()}`;
  }
  return cleaned;
}

export function invalidateCloudNewsCache(): void {
  cachedNewsResult = null;
  inflightNewsPromise = null;
}

export function invalidateCloudBooksCache(): void {
  cachedBooksResult = null;
  inflightBooksPromise = null;
}

// ============================================================================
// 1. NEWS CLOUD PERSISTENCE
// ============================================================================

export async function publishNewsToCloudDetailed(
  item: NewsItem
): Promise<{ ok: boolean; error?: string }> {
  const docId = sanitizeDocId(item.id || item.slug);
  if (!docId) {
    return { ok: false, error: "Identificador de publicação inválido." };
  }

  if (!canAuthorizeCloudWrite()) {
    return {
      ok: false,
      error: "Faça login administrativo no painel para publicar na nuvem para todos os usuários.",
    };
  }

  const coverUrl = (item.cover_url || "").trim();
  if (coverUrl.length > 500000) {
    return {
      ok: false,
      error: "A imagem de capa otimizada excedeu o limite de tamanho da nuvem (500KB).",
    };
  }

  const nowIso = new Date().toISOString();
  const payload = {
    id: (item.id || docId).trim().slice(0, 128),
    title: (item.title || "").trim().slice(0, 300),
    slug: (item.slug || docId).trim().slice(0, 150),
    excerpt: (item.excerpt || "").trim().slice(0, 2000),
    content: (item.content || "").trim().slice(0, 50000),
    cover_url: coverUrl,
    category: (item.category || "Geral").trim().slice(0, 100),
    published: item.published ?? true,
    published_at: item.published_at || nowIso,
    created_at: (item as any).created_at || nowIso,
    updated_at: (item as any).updated_at || nowIso,
    author: ((item as any).author || "Miguel Worscoi (Redação Editorial)").trim().slice(0, 150),
    source_name: ((item as any).source_name || "Worscoi Editorial").trim().slice(0, 150),
    source_url: ((item as any).source_url || "").trim().slice(0, 1000),
  };

  try {
    await writeEditorialDoc(NEWS_COLLECTION, docId, payload);

    // Immediately update in-memory cache so reads see the fresh doc
    if (cachedNewsResult) {
      const rest = cachedNewsResult.data.filter(
        (n) => n.id !== payload.id && n.slug !== payload.slug
      );
      cachedNewsResult = {
        data: payload.published ? [payload as NewsItem, ...rest] : rest,
        ts: Date.now(),
      };
    } else {
      cachedNewsResult = null;
    }

    return { ok: true };
  } catch (err: any) {
    console.warn("[CloudEditorial] Failed to write news to cloud:", err);
    return {
      ok: false,
      error: err?.message || "Falha ao gravar publicação na nuvem.",
    };
  }
}

export async function publishNewsToCloud(item: NewsItem): Promise<boolean> {
  const res = await publishNewsToCloudDetailed(item);
  return res.ok;
}

export async function deleteNewsFromCloud(idOrSlug: string): Promise<boolean> {
  const docId = sanitizeDocId(idOrSlug);
  if (!docId || !canAuthorizeCloudWrite()) return false;

  try {
    await deleteEditorialDoc(NEWS_COLLECTION, docId);
    if (!docId.startsWith("editorial-")) {
      await deleteEditorialDoc(NEWS_COLLECTION, sanitizeDocId(`editorial-${docId}`)).catch(() => {});
    }
    invalidateCloudNewsCache();
    return true;
  } catch (err: any) {
    console.warn("[CloudEditorial] Failed to delete news in cloud:", err);
    return false;
  }
}

const PERSISTED_DOC_IDS_SESSION = new Set<string>();
let hasPersistedBatchThisSession = false;

/**
 * Persists syndicated news articles into the editorial cloud store when authorized.
 */
export async function persistSyndicatedNewsBatchToCloud(items: NewsItem[]): Promise<void> {
  if (hasPersistedBatchThisSession) return;
  if (!Array.isArray(items) || items.length === 0) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  if (!isGoogleAdminAuthenticated()) return;

  const candidates = items
    .filter((it) => {
      if (!it || !it.title || !it.content || it.content.length < 250) return false;
      const docId = sanitizeDocId(it.slug || it.id);
      if (!docId || PERSISTED_DOC_IDS_SESSION.has(docId)) return false;
      return true;
    })
    .slice(0, 6);

  if (candidates.length === 0) return;
  hasPersistedBatchThisSession = true;

  for (const item of candidates) {
    const docId = sanitizeDocId(item.slug || item.id);
    PERSISTED_DOC_IDS_SESSION.add(docId);
    await publishNewsToCloud(item).catch(() => {});
  }
}

export async function fetchCloudNews(forceFresh = false): Promise<NewsItem[]> {
  if (!forceFresh && cachedNewsResult && Date.now() - cachedNewsResult.ts < READ_CACHE_TTL_MS) {
    return cachedNewsResult.data;
  }
  if (!forceFresh && inflightNewsPromise) {
    return inflightNewsPromise;
  }

  inflightNewsPromise = withTimeout(
    (async () => {
      try {
        // Server-cache-first read (shares 1 Firestore query across all visitors every 5 minutes, saving >95% daily read quota!)
        const serverItems = await fetchEditorialCollectionFromServerApi<NewsItem>(NEWS_COLLECTION);
        let firestoreItems: NewsItem[] = [];
        if (serverItems.length === 0) {
          try {
            const restDocs = await runRestQuery({
              from: [{ collectionId: NEWS_COLLECTION }],
              where: {
                fieldFilter: {
                  field: { fieldPath: "published" },
                  op: "EQUAL",
                  value: { booleanValue: true },
                },
              },
              limit: 36,
            });
            firestoreItems = restDocs.map((d) => d.data as NewsItem);
          } catch (err: any) {
            console.warn("[CloudEditorial] Could not list cloud news:", err?.message || err);
          }
        }

        const byKey = new Map<string, NewsItem>();
        for (const item of [...serverItems, ...firestoreItems]) {
          if (!item || item.published === false) continue;
          const key = (item.slug || item.id || "").toLowerCase();
          if (key && !byKey.has(key)) {
            byKey.set(key, item);
          }
        }
        const merged = Array.from(byKey.values());
        cachedNewsResult = { data: merged, ts: Date.now() };
        return merged;
      } finally {
        inflightNewsPromise = null;
      }
    })(),
    FIRESTORE_READ_TIMEOUT_MS,
    cachedNewsResult?.data ?? []
  );

  return inflightNewsPromise;
}

export async function fetchCloudNewsBySlug(slugOrId: string): Promise<NewsItem | null> {
  const clean = (slugOrId || "").trim();
  if (!clean) return null;

  // Check recent in-memory cache first
  if (cachedNewsResult && Date.now() - cachedNewsResult.ts < READ_CACHE_TTL_MS) {
    const cachedMatch = cachedNewsResult.data.find(
      (n) =>
        n.slug?.toLowerCase() === clean.toLowerCase() ||
        n.id?.toLowerCase() === clean.toLowerCase()
    );
    if (cachedMatch) return cachedMatch;
  }

  return withTimeout(
    (async () => {
      try {
        const serverItems = await fetchEditorialCollectionFromServerApi<NewsItem>(NEWS_COLLECTION);
        const serverMatch = serverItems.find(
          (n) =>
            n &&
            n.published !== false &&
            (n.slug?.toLowerCase() === clean.toLowerCase() ||
              n.id?.toLowerCase() === clean.toLowerCase())
        );
        if (serverMatch) return serverMatch;

        const ready = await ensureFirestoreReady();
        if (!ready) {
          const restDocs = await runRestQuery({
            from: [{ collectionId: NEWS_COLLECTION }],
            where: {
              fieldFilter: {
                field: { fieldPath: "slug" },
                op: "EQUAL",
                value: { stringValue: clean },
              },
            },
            limit: 1,
          });
          const docData = restDocs[0]?.data as NewsItem | undefined;
          if (docData && docData.published !== false) return docData;
          return null;
        }

        // 1. Try query by slug
        const bySlugQ = query(
          collection(db, NEWS_COLLECTION),
          where("slug", "==", clean),
          limit(1)
        );
        const snap = await getDocs(bySlugQ);
        if (!snap.empty) {
          const data = snap.docs[0].data() as NewsItem;
          if (data.published !== false) return data;
        }

        // 2. Fallback direct document lookup by sanitized ID or editorial-slug ID
        const candidates = [sanitizeDocId(clean)];
        if (!clean.startsWith("editorial-")) {
          candidates.push(sanitizeDocId(`editorial-${clean}`));
        }
        for (const candidateId of candidates) {
          const dSnap = await getDoc(doc(db, NEWS_COLLECTION, candidateId));
          if (dSnap.exists()) {
            const data = dSnap.data() as NewsItem;
            if (data.published !== false) return data;
          }
        }
        return null;
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not fetch cloud news by slug:", err?.message || err);
        return null;
      }
    })(),
    FIRESTORE_READ_TIMEOUT_MS,
    null
  );
}

export function subscribeToCloudNews(
  onUpdate: (items: NewsItem[]) => void
): () => void {
  let active = true;
  let unsubscribeSnapshot: (() => void) | null = null;

  void ensureFirestoreReady().then((ready) => {
    if (!active || !ready) return;
    try {
      const q = query(
        collection(db, NEWS_COLLECTION),
        where("published", "==", true),
        limit(36)
      );
      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((d) => d.data() as NewsItem);
          cachedNewsResult = { data: items, ts: Date.now() };
          onUpdate(items);
        },
        (error) => {
          console.warn("[CloudEditorial] News realtime listener notice:", error?.message || error);
        }
      );
    } catch (err: any) {
      console.warn("[CloudEditorial] Could not attach realtime news listener:", err?.message || err);
    }
  });

  return () => {
    active = false;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  };
}

// ============================================================================
// 2. BOOKS CLOUD PERSISTENCE + CHUNKED PDF BINARY CLOUD SYNC
// ============================================================================

const PDF_META_PREFIX = "\n\n<!--WOTHO_PDF_META:";
const PDF_META_SUFFIX = "-->";

function packDescriptionWithPdfMeta(
  cleanDescription: string,
  meta: {
    pdf_url?: string;
    download_url?: string;
    original_pages_count?: number;
    file_size_formatted?: string;
    edition_notes?: string;
    source_repository?: string;
    has_cloud_pdf_binary?: boolean;
  }
): string {
  const baseDesc = (cleanDescription || "")
    .replace(/\n*<!--WOTHO_PDF_META:[\s\S]*?-->/g, "")
    .trim()
    .slice(0, 8800);
  const compactMeta: Record<string, any> = {};
  if (meta.pdf_url && !meta.pdf_url.startsWith("data:")) {
    compactMeta.pdf_url = meta.pdf_url.slice(0, 300);
  }
  if (meta.download_url && !meta.download_url.startsWith("data:")) {
    compactMeta.download_url = meta.download_url.slice(0, 300);
  }
  if (meta.original_pages_count) {
    compactMeta.original_pages_count = Number(meta.original_pages_count);
  }
  if (meta.file_size_formatted) {
    compactMeta.file_size_formatted = String(meta.file_size_formatted).slice(0, 50);
  }
  if (meta.edition_notes) {
    compactMeta.edition_notes = String(meta.edition_notes).slice(0, 350);
  }
  if (meta.source_repository) {
    compactMeta.source_repository = String(meta.source_repository).slice(0, 120);
  }
  if (meta.has_cloud_pdf_binary) {
    compactMeta.has_cloud_pdf_binary = true;
  }

  if (Object.keys(compactMeta).length === 0) {
    return baseDesc;
  }
  return `${baseDesc}${PDF_META_PREFIX}${JSON.stringify(compactMeta)}${PDF_META_SUFFIX}`.slice(0, 10000);
}

function unpackBookFromCloud(rawBook: Book): Book {
  if (!rawBook) return rawBook;
  const copy: any = { ...rawBook };
  if (typeof copy.description === "string" && copy.description.includes("<!--WOTHO_PDF_META:")) {
    const match = copy.description.match(/<!--WOTHO_PDF_META:([\s\S]*?)-->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed)) {
            if (copy[k] === undefined || copy[k] === "") {
              copy[k] = v;
            }
          }
        }
      } catch {}
    }
    copy.description = copy.description.replace(/\n*<!--WOTHO_PDF_META:[\s\S]*?-->/g, "").trim();
  }
  return copy as Book;
}

export async function publishBookToCloudDetailed(book: Book & {
  pdf_url?: string;
  download_url?: string;
  pdf_base64?: string;
  original_pages_count?: number;
  file_size_formatted?: string;
  edition_notes?: string;
  source_repository?: string;
}): Promise<{
  ok: boolean;
  firestoreSynced: boolean;
  serverSynced: boolean;
  permissionDenied?: boolean;
  error?: string;
}> {
  const docId = sanitizeDocId(book.id);
  if (!docId) return { ok: false, firestoreSynced: false, serverSynced: false, error: "Identificador de livro inválido." };

  const defaultCover =
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80";
  const rawCoverUrl = (book.cover_url || "").trim();
  const safeFirestoreCoverUrl =
    rawCoverUrl.length > 0 && rawCoverUrl.length <= 450000
      ? rawCoverUrl
      : defaultCover;

  const rawPdfUrl = String((book as any).pdf_url || "").trim();
  const rawDownloadUrl = String((book as any).download_url || "").trim();
  const isInlinePdf = rawPdfUrl.startsWith("data:application/pdf");
  const isLocalIdbPdf = rawPdfUrl.startsWith("idb://");

  const proxyPdfUrl =
    isInlinePdf || isLocalIdbPdf || (book as any).pdf_base64
      ? `/api/books/pdf-proxy?id=${encodeURIComponent(book.id)}`
      : rawPdfUrl;
  const proxyDownloadUrl =
    isInlinePdf || isLocalIdbPdf || (book as any).pdf_base64 || rawDownloadUrl.startsWith("data:application/pdf")
      ? `/api/books/pdf-proxy?id=${encodeURIComponent(book.id)}&download=true`
      : rawDownloadUrl || (proxyPdfUrl ? `${proxyPdfUrl}${proxyPdfUrl.includes("?") ? "&" : "?"}download=true` : "");

  const cleanDescription = (book.description || "")
    .replace(/\n*<!--WOTHO_PDF_META:[\s\S]*?-->/g, "")
    .trim();

  const packedDescription = packDescriptionWithPdfMeta(cleanDescription, {
    pdf_url: proxyPdfUrl,
    download_url: proxyDownloadUrl,
    original_pages_count: (book as any).original_pages_count,
    file_size_formatted: (book as any).file_size_formatted,
    edition_notes: (book as any).edition_notes,
    source_repository: (book as any).source_repository,
    has_cloud_pdf_binary: Boolean(isInlinePdf || isLocalIdbPdf || (book as any).pdf_base64),
  });

  const safeTitle = (book.title || "Sem título").trim().slice(0, 300) || "Sem título";
  const safeAuthor = (book.author || "Autor Editorial").trim().slice(0, 150) || "Autor Editorial";
  const safePagesCount = Number((book as any).original_pages_count);

  // Strictly 11 canonical fields accepted by the deployed Firestore books/{bookId} security rules.
  // Extended PDF metadata (pdf_url, download_url, pages, file size, edition notes, source)
  // is safely packed inside `description` via packDescriptionWithPdfMeta and restored on read!
  const firestoreSafePayload: Record<string, any> = {
    id: String(book.id || docId).slice(0, 128),
    title: safeTitle,
    author: safeAuthor,
    description: packedDescription,
    cover_url: safeFirestoreCoverUrl,
    price_cents: Math.max(0, Number(book.price_cents) || 0),
    currency: (book.currency || "BRL").trim().slice(0, 10) || "BRL",
    category: (book.category || "Literatura").trim().slice(0, 100) || "Literatura",
    published: Boolean(book.published ?? true),
    featured: Boolean(book.featured ?? true),
    created_at: (book.created_at || new Date().toISOString()).slice(0, 100),
  };

  // Server payload carries the clean description, full PDF metadata fields, and optional pdf_base64
  const payload: Record<string, any> = {
    ...firestoreSafePayload,
    description: cleanDescription,
    cover_url: safeFirestoreCoverUrl,
    ...(proxyPdfUrl && !proxyPdfUrl.startsWith("data:")
      ? { pdf_url: proxyPdfUrl.slice(0, 2000) }
      : {}),
    ...(proxyDownloadUrl && !proxyDownloadUrl.startsWith("data:")
      ? { download_url: proxyDownloadUrl.slice(0, 2000) }
      : {}),
    ...(Number.isFinite(safePagesCount) && safePagesCount >= 0
      ? { original_pages_count: Math.round(safePagesCount) }
      : {}),
    ...((book as any).file_size_formatted
      ? { file_size_formatted: String((book as any).file_size_formatted).trim().slice(0, 50) }
      : {}),
    ...((book as any).edition_notes
      ? { edition_notes: String((book as any).edition_notes).trim().slice(0, 1000) }
      : {}),
    ...((book as any).source_repository
      ? { source_repository: String((book as any).source_repository).trim().slice(0, 200) }
      : {}),
    ...(isInlinePdf || isLocalIdbPdf || (book as any).pdf_base64 || (book as any).has_cloud_pdf_binary
      ? { has_cloud_pdf_binary: true }
      : {}),
  };

  if ((book as any).pdf_base64) {
    payload.pdf_base64 = (book as any).pdf_base64;
  } else if (isInlinePdf) {
    payload.pdf_base64 = rawPdfUrl;
  }

  try {
    if (!canAuthorizeCloudWrite()) {
      return {
        ok: false,
        firestoreSynced: false,
        serverSynced: false,
        error: "Faça login administrativo no painel para publicar na nuvem para todos os usuários.",
      };
    }

    let writeRes: { firestoreSynced: boolean; serverSynced: boolean };
    try {
      writeRes = await writeEditorialDoc(BOOKS_COLLECTION, docId, payload, firestoreSafePayload);
    } catch (firstErr: any) {
      // Self-healing fallback: if live Firestore rules cap `books.cover_url` at 1000 chars for data:image covers,
      // store the book with the short placeholder cover and persist the full cover in `chapters/pdfmeta-${docId}`.
      if (
        isGoogleAdminAuthenticated() &&
        isFirestorePermissionDenied(firstErr) &&
        safeFirestoreCoverUrl.length > 950
      ) {
        const shortCoverFirestorePayload = {
          ...firestoreSafePayload,
          cover_url: defaultCover,
        };
        writeRes = await writeEditorialDoc(
          BOOKS_COLLECTION,
          docId,
          payload,
          shortCoverFirestorePayload
        );
        if (writeRes.firestoreSynced && safeFirestoreCoverUrl.startsWith("data:image/")) {
          const metaDocId = sanitizeDocId(`pdfmeta-${book.id || docId}`);
          const metaPayload = {
            id: metaDocId,
            book_id: `pdfmeta-${book.id || docId}`.slice(0, 128),
            title: "Cover Metadata",
            content: safeFirestoreCoverUrl.slice(0, 99000),
            position: 0,
            is_free_preview: true,
          };
          await writeEditorialDoc(CHAPTERS_COLLECTION, metaDocId, metaPayload, metaPayload).catch(() => {});
        }
      } else {
        throw firstErr;
      }
    }

    const cleanCachedBook: any = {
      ...payload,
      pdf_url: proxyPdfUrl || payload.pdf_url,
      download_url: proxyDownloadUrl || payload.download_url,
    };
    delete cleanCachedBook.pdf_base64;

    if (cachedBooksResult) {
      const rest = cachedBooksResult.data.filter((b) => b.id !== cleanCachedBook.id);
      cachedBooksResult = {
        data: cleanCachedBook.published ? [cleanCachedBook as Book, ...rest] : rest,
        ts: Date.now(),
      };
    } else {
      cachedBooksResult = null;
    }
    return {
      ok: Boolean(writeRes.firestoreSynced || writeRes.serverSynced),
      firestoreSynced: writeRes.firestoreSynced,
      serverSynced: writeRes.serverSynced,
      error: (writeRes as any).warning,
    };
  } catch (err: any) {
    const permissionDenied = Boolean(err?.permissionDenied || isFirestorePermissionDenied(err));
    const serverSynced = Boolean(err?.serverSynced);
    console.warn("[CloudEditorial] Failed to write book to cloud:", err);
    return {
      ok: serverSynced,
      firestoreSynced: false,
      serverSynced,
      permissionDenied: serverSynced ? false : permissionDenied,
      error: serverSynced
        ? undefined
        : err?.message || "Falha ao gravar publicação no servidor editorial.",
    };
  }
}

export async function publishBookToCloud(book: Book & {
  pdf_url?: string;
  download_url?: string;
  pdf_base64?: string;
  original_pages_count?: number;
  file_size_formatted?: string;
  edition_notes?: string;
  source_repository?: string;
}): Promise<boolean> {
  const res = await publishBookToCloudDetailed(book);
  return res.ok;
}

/**
 * Publishes the complete PDF binary (up to 25 MB via direct binary upload to `/api/editorial/pdf-upload`,
 * plus optional Firestore chunk mirroring when Google Admin is connected and size <= 4.5 MB)
 * so that ANY user on ANY device can open and read the exact uploaded PDF in OriginalPdfViewer!
 */
export async function publishPdfBinaryToCloud(
  bookId: string,
  pdfInput: ArrayBuffer | Uint8Array | string,
  onProgress?: (step: string, pct: number) => void
): Promise<boolean> {
  if (!bookId || !pdfInput || !canAuthorizeCloudWrite()) return false;

  let binaryBytes: Uint8Array | null = null;
  let rawBase64 = "";

  if (typeof pdfInput === "string") {
    rawBase64 = pdfInput.includes(",") ? pdfInput.split(",")[1] || "" : pdfInput.trim();
    if (!rawBase64 || rawBase64.length < 100) return false;
    try {
      const binStr = atob(rawBase64);
      const out = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) out[i] = binStr.charCodeAt(i);
      binaryBytes = out;
    } catch {
      return false;
    }
  } else if (pdfInput instanceof Uint8Array) {
    binaryBytes = pdfInput;
  } else {
    binaryBytes = new Uint8Array(pdfInput);
  }

  if (!binaryBytes || binaryBytes.byteLength <= 100) return false;

  // 1. Primary global cloud path: chunked binary upload to /api/editorial/pdf-upload (up to 25 MB,
  // persisted directly to global Firestore across all Vercel instances — ZERO Google login required!)
  onProgress?.("Enviando arquivo PDF original para a nuvem global...", 15);
  const uploadRes = await uploadPdfBinaryToServer(bookId, binaryBytes, onProgress);
  let serverUploaded = Boolean(uploadRes.ok);

  if (serverUploaded) {
    cachedPdfBinaryMap.set(bookId, binaryBytes.slice());
    onProgress?.(
      uploadRes.firestoreSynced
        ? "PDF original publicado na nuvem para todos os leitores!"
        : "PDF original salvo no servidor editorial!",
      100
    );
    return true;
  }

  // 2. Fallback direct Firestore SDK chunk upload if Google Admin is signed in and server upload failed
  if (isGoogleAdminAuthenticated() && binaryBytes.byteLength <= 12 * 1024 * 1024) {
    try {
      if (!rawBase64) {
        let bin = "";
        const step = 0x8000;
        for (let i = 0; i < binaryBytes.length; i += step) {
          bin += String.fromCharCode(...binaryBytes.subarray(i, i + step));
        }
        rawBase64 = btoa(bin);
      }

      const CHUNK_SIZE = 600_000;
      const totalChunks = Math.ceil(rawBase64.length / CHUNK_SIZE);
      const binBookId = `pdfbin-${bookId}`.slice(0, 128);
      const online = await ensureFirestoreOnline();

      if (online) {
        for (let start = 0; start < totalChunks; start += 4) {
          const batch = writeBatch(db);
          const end = Math.min(totalChunks, start + 4);
          for (let i = start; i < end; i++) {
            const chunkStr = rawBase64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const chunkSuffix = `-c${i + 1}`;
            const safeBase = sanitizeDocId(binBookId).slice(0, 120 - chunkSuffix.length);
            const chunkDocId = sanitizeDocId(`${safeBase}${chunkSuffix}`);
            batch.set(doc(db, CHAPTERS_COLLECTION, chunkDocId), {
              id: chunkDocId,
              book_id: binBookId,
              title: `PDF Binary Segment ${i + 1}/${totalChunks}`,
              content: chunkStr,
              position: i + 1,
              is_free_preview: true,
            });
          }
          await batch.commit();
          if (onProgress) {
            onProgress(
              `Publicando PDF na nuvem (${end}/${totalChunks})...`,
              Math.round((end / totalChunks) * 100)
            );
          }
        }
        cachedPdfBinaryMap.set(bookId, binaryBytes.slice());
        serverUploaded = true;
      }
    } catch (err) {
      console.warn("[CloudEditorial] Fallback Firestore PDF upload error:", err);
    }
  }

  if (serverUploaded) {
    onProgress?.("PDF publicado com sucesso!", 100);
  }
  return serverUploaded;
}

const cachedPdfBinaryMap = new Map<string, Uint8Array>();

/**
 * Downloads and reassembles a published PDF binary for `bookId` from Cloud (Server or Firestore chunks).
 */
export async function fetchCloudPdfBinary(bookId: string): Promise<Uint8Array | null> {
  if (!bookId) return null;
  const cached = cachedPdfBinaryMap.get(bookId);
  if (cached) return cached;

  const binBookId = `pdfbin-${bookId}`.slice(0, 128);

  return withTimeout(
    (async () => {
      try {
        // 1. Try Firestore CHAPTERS_COLLECTION for `pdfbin-${bookId}` and server API in parallel
        const serverPromise = fetchEditorialCollectionFromServerApi<Chapter>(
          CHAPTERS_COLLECTION,
          { bookId: binBookId }
        );

        let firestoreChunks: Chapter[] = [];
        try {
          const restDocs = await runRestQuery({
            from: [{ collectionId: CHAPTERS_COLLECTION }],
            where: {
              fieldFilter: {
                field: { fieldPath: "book_id" },
                op: "EQUAL",
                value: { stringValue: binBookId },
              },
            },
          });
          firestoreChunks = restDocs.map((d) => d.data as Chapter);
          if (firestoreChunks.length === 0) {
            const ready = await ensureFirestoreReady();
            if (ready) {
              const q = query(
                collection(db, CHAPTERS_COLLECTION),
                where("book_id", "==", binBookId)
              );
              const snap = await getDocs(q);
              firestoreChunks = snap.docs.map((d) => d.data() as Chapter);
            }
          }
        } catch (err) {
          console.warn("[CloudEditorial] Firestore PDF binary query warning:", err);
        }

        const serverChunks = await serverPromise;
        const chunks = firestoreChunks.length > 0 ? firestoreChunks : serverChunks;

        if (chunks && chunks.length > 0) {
          const sorted = [...chunks].sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));
          const fullBase64 = sorted.map((c) => (c.content || "").trim()).join("");
          if (fullBase64.length > 100) {
            const binary = atob(fullBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            // Verify %PDF- header
            if (
              bytes.length > 100 &&
              bytes[0] === 0x25 &&
              bytes[1] === 0x50 &&
              bytes[2] === 0x44 &&
              bytes[3] === 0x46
            ) {
              cachedPdfBinaryMap.set(bookId, bytes);
              return bytes;
            }
          }
        }
      } catch (err) {
        console.warn("[CloudEditorial] Could not fetch cloud PDF binary chunks:", err);
      }
      return null;
    })(),
    25000,
    null
  );
}

export async function deleteBookFromCloud(bookId: string): Promise<boolean> {
  const docId = sanitizeDocId(bookId);
  if (!docId || !canAuthorizeCloudWrite()) return false;

  try {
    await deleteEditorialDoc(BOOKS_COLLECTION, docId);
    invalidateCloudBooksCache();
    return true;
  } catch (err: any) {
    console.warn("[CloudEditorial] Failed to delete book in cloud:", err);
    return false;
  }
}

export async function fetchCloudBooks(forceFresh = false): Promise<Book[]> {
  if (!forceFresh && cachedBooksResult && Date.now() - cachedBooksResult.ts < READ_CACHE_TTL_MS) {
    return cachedBooksResult.data;
  }
  if (!forceFresh && inflightBooksPromise) {
    return inflightBooksPromise;
  }

  inflightBooksPromise = withTimeout(
    (async () => {
      try {
        // Server-cache-first read (shares 1 Firestore query across all visitors every 5 minutes, saving >95% daily read quota!)
        const rawServerBooks = await fetchEditorialCollectionFromServerApi<Book>(BOOKS_COLLECTION);
        const serverBooks = rawServerBooks.map((b) => unpackBookFromCloud(b));
        let firestoreBooks: Book[] = [];

        if (serverBooks.length === 0) {
          try {
            const restDocs = await runRestQuery({
              from: [{ collectionId: BOOKS_COLLECTION }],
              where: {
                fieldFilter: {
                  field: { fieldPath: "published" },
                  op: "EQUAL",
                  value: { booleanValue: true },
                },
              },
              limit: 200,
            });
            firestoreBooks = restDocs.map((d) => unpackBookFromCloud(d.data as Book));
          } catch (err: any) {
            console.warn("[CloudEditorial] Could not list cloud books:", err?.message || err);
          }
        }

        const byId = new Map<string, Book>();
        for (const b of [...serverBooks, ...firestoreBooks]) {
          if (!b || !b.id || b.published === false) continue;
          const existing = byId.get(b.id);
          if (!existing) {
            byId.set(b.id, b);
          } else {
            byId.set(b.id, {
              ...b,
              ...existing,
              cover_url:
                existing.cover_url && existing.cover_url.startsWith("data:image/")
                  ? existing.cover_url
                  : b.cover_url || existing.cover_url,
            });
          }
        }

        const merged = Array.from(byId.values()).sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
        });

        cachedBooksResult = { data: merged, ts: Date.now() };
        return merged;
      } finally {
        inflightBooksPromise = null;
      }
    })(),
    FIRESTORE_READ_TIMEOUT_MS,
    cachedBooksResult?.data ?? []
  );

  return inflightBooksPromise;
}

export async function fetchCloudBookById(bookId: string): Promise<Book | null> {
  const clean = (bookId || "").trim();
  if (!clean) return null;

  if (cachedBooksResult && Date.now() - cachedBooksResult.ts < READ_CACHE_TTL_MS) {
    const match = cachedBooksResult.data.find((b) => b.id === clean);
    if (match) return match;
  }

  return withTimeout(
    (async () => {
      try {
        // Query same-origin editorial server first (instant <15ms) in parallel with Firestore REST
        const [serverDirect, restDocs] = await Promise.all([
          (async (): Promise<Book | null> => {
            try {
              const res = await fetch(
                `/api/editorial/sync?collection=${BOOKS_COLLECTION}&docId=${encodeURIComponent(clean)}`,
                { method: "GET", credentials: "include" }
              );
              if (res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data?.item && data.item.published !== false) {
                  return unpackBookFromCloud(data.item as Book);
                }
              }
            } catch {}
            return null;
          })(),
          runRestQuery({
            from: [{ collectionId: BOOKS_COLLECTION }],
            where: {
              fieldFilter: {
                field: { fieldPath: "id" },
                op: "EQUAL",
                value: { stringValue: clean },
              },
            },
            limit: 1,
          }).catch(() => []),
        ]);

        let foundBook: Book | null = serverDirect;
        if (!foundBook && restDocs[0]?.data) {
          const unpacked = unpackBookFromCloud(restDocs[0].data as Book);
          if (unpacked.published !== false) foundBook = unpacked;
        }

        if (!foundBook) {
          const docId = sanitizeDocId(clean);
          const ready = await ensureFirestoreReady();
          if (ready) {
            const snap = await getDoc(doc(db, BOOKS_COLLECTION, docId));
            if (snap.exists()) {
              const unpacked = unpackBookFromCloud(snap.data() as Book);
              if (unpacked.published !== false) foundBook = unpacked;
            }
          }
        }

        if (
          foundBook &&
          (!foundBook.cover_url || foundBook.cover_url.includes("photo-1544947950-fa07a98d237f"))
        ) {
          try {
            const restMeta = await runRestQuery({
              from: [{ collectionId: CHAPTERS_COLLECTION }],
              where: {
                fieldFilter: {
                  field: { fieldPath: "book_id" },
                  op: "EQUAL",
                  value: { stringValue: `pdfmeta-${foundBook.id}`.slice(0, 128) },
                },
              },
              limit: 1,
            });
            const metaContent = restMeta[0]?.data?.content;
            if (typeof metaContent === "string" && metaContent.startsWith("data:image/")) {
              foundBook.cover_url = metaContent;
            }
          } catch {}
        }

        return foundBook;
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not fetch cloud book by id:", err?.message || err);
        return null;
      }
    })(),
    FIRESTORE_READ_TIMEOUT_MS,
    null
  );
}

export function subscribeToCloudBooks(
  onUpdate: (books: Book[]) => void
): () => void {
  let active = true;
  let unsubscribeSnapshot: (() => void) | null = null;

  void ensureFirestoreReady().then((ready) => {
    if (!active || !ready) return;
    try {
      const q = query(
        collection(db, BOOKS_COLLECTION),
        where("published", "==", true),
        limit(200)
      );
      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs
            .map((d) => unpackBookFromCloud(d.data() as Book))
            .filter((b) => b && b.id && b.published !== false)
            .sort((a, b) => {
              const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
              const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
              return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
            });
          cachedBooksResult = { data: items, ts: Date.now() };
          onUpdate(items);
        },
        (error) => {
          console.warn("[CloudEditorial] Books realtime listener notice:", error?.message || error);
        }
      );
    } catch (err: any) {
      console.warn("[CloudEditorial] Could not attach realtime books listener:", err?.message || err);
    }
  });

  return () => {
    active = false;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  };
}

// ============================================================================
// 3. CHAPTERS CLOUD PERSISTENCE
// ============================================================================

export async function publishChapterToCloud(chapter: Chapter): Promise<boolean> {
  const docId = sanitizeDocId(chapter.id);
  if (!docId) return false;

  const safePos = Number(chapter.position);
  const payload = {
    id: String(chapter.id || docId).slice(0, 128),
    book_id: (chapter.book_id || "").trim().slice(0, 128),
    title: ((chapter.title || "").trim() || "Capítulo").slice(0, 300),
    content: (chapter.content || "").trim().slice(0, 99000),
    position: Number.isFinite(safePos) ? safePos : 1,
    is_free_preview: Boolean(chapter.is_free_preview ?? true),
  };

  try {
    if (!canAuthorizeCloudWrite()) return false;
    await writeEditorialDoc(CHAPTERS_COLLECTION, docId, payload);
    cachedChaptersMap.delete(payload.book_id);
    return true;
  } catch (err: any) {
    console.warn("[CloudEditorial] Failed to write chapter to cloud:", err);
    return false;
  }
}

export async function fetchCloudChapters(bookId: string): Promise<Chapter[]> {
  const cached = cachedChaptersMap.get(bookId);
  if (cached && Date.now() - cached.ts < READ_CACHE_TTL_MS) {
    return cached.data;
  }
  const existing = inflightChaptersMap.get(bookId);
  if (existing) {
    return existing;
  }

  const req = withTimeout(
    (async () => {
      const serverChaptersPromise = fetchEditorialCollectionFromServerApi<Chapter>(
        CHAPTERS_COLLECTION,
        { bookId }
      );
      let firestoreChapters: Chapter[] = [];
      try {
        const restDocs = await runRestQuery({
          from: [{ collectionId: CHAPTERS_COLLECTION }],
          where: {
            fieldFilter: {
              field: { fieldPath: "book_id" },
              op: "EQUAL",
              value: { stringValue: bookId },
            },
          },
        });
        firestoreChapters = restDocs.map((d) => d.data as Chapter);
        if (firestoreChapters.length === 0) {
          const ready = await ensureFirestoreReady();
          if (ready) {
            const q = query(
              collection(db, CHAPTERS_COLLECTION),
              where("book_id", "==", bookId)
            );
            const snapshot = await getDocs(q);
            firestoreChapters = snapshot.docs.map((d) => d.data() as Chapter);
          }
        }
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud chapters:", err?.message || err);
      }

      try {
        const serverChapters = await serverChaptersPromise;
        const byId = new Map<string, Chapter>();
        for (const ch of [...firestoreChapters, ...serverChapters]) {
          if (!ch || !ch.id || (ch.position !== undefined && Number(ch.position) <= 0)) continue;
          if (!byId.has(ch.id)) {
            byId.set(ch.id, ch);
          }
        }
        const list = Array.from(byId.values());
        list.sort((a, b) => (a.position || 0) - (b.position || 0));
        cachedChaptersMap.set(bookId, { data: list, ts: Date.now() });
        return list;
      } finally {
        inflightChaptersMap.delete(bookId);
      }
    })(),
    FIRESTORE_READ_TIMEOUT_MS,
    cached?.data ?? []
  );

  inflightChaptersMap.set(bookId, req);
  return req;
}

// ============================================================================
// 4. ANIME OVERRIDES CLOUD PERSISTENCE
// ============================================================================

export async function publishAnimeOverrideToCloud(animeId: string, patch: Record<string, any>): Promise<boolean> {
  const docId = sanitizeDocId(animeId);
  if (!docId) return false;

  const firestoreSafePayload: Record<string, any> = {
    id: docId,
    ...(patch.title ? { title: String(patch.title).slice(0, 300) } : {}),
    ...(patch.synopsis ? { synopsis: String(patch.synopsis).slice(0, 5000) } : {}),
    ...(patch.cover && String(patch.cover).length <= 1000 ? { cover: String(patch.cover).slice(0, 1000) } : {}),
    ...(patch.banner && String(patch.banner).length <= 1000 ? { banner: String(patch.banner).slice(0, 1000) } : {}),
    ...(patch.trailerYoutubeId ? { trailerYoutubeId: String(patch.trailerYoutubeId).slice(0, 100) } : {}),
    updatedAt: new Date().toISOString(),
  };

  const payload: Record<string, any> = {
    ...firestoreSafePayload,
    ...(patch.cover ? { cover: String(patch.cover).slice(0, 500000) } : {}),
    ...(patch.banner ? { banner: String(patch.banner).slice(0, 500000) } : {}),
  };

  try {
    if (!canAuthorizeCloudWrite()) return false;
    await writeEditorialDoc(ANIME_OVERRIDES_COLLECTION, docId, payload, firestoreSafePayload);
    return true;
  } catch (err: any) {
    console.warn("[CloudEditorial] Failed to write anime override to cloud:", err);
    return false;
  }
}

export async function fetchCloudAnimeOverrides(): Promise<Record<string, Record<string, any>>> {
  if (cachedAnimeResult && Date.now() - cachedAnimeResult.ts < READ_CACHE_TTL_MS) {
    return cachedAnimeResult.data;
  }
  if (inflightAnimePromise) {
    return inflightAnimePromise;
  }

  inflightAnimePromise = withTimeout(
    (async () => {
      const serverOverridesPromise = fetchEditorialOverridesFromServerApi();
      const result: Record<string, Record<string, any>> = {};
      try {
        const restDocs = await runRestQuery({
          from: [{ collectionId: ANIME_OVERRIDES_COLLECTION }],
          limit: 200,
        });
        for (const d of restDocs) {
          result[d.id] = d.data;
        }
        if (Object.keys(result).length === 0) {
          const ready = await ensureFirestoreReady();
          if (ready) {
            const snapshot = await getDocs(collection(db, ANIME_OVERRIDES_COLLECTION));
            for (const d of snapshot.docs) {
              result[d.id] = d.data();
            }
          }
        }
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud anime overrides:", err?.message || err);
      }

      try {
        const serverOverrides = await serverOverridesPromise;
        for (const [k, v] of Object.entries(serverOverrides)) {
          result[k] = { ...(result[k] || {}), ...v };
        }
        cachedAnimeResult = { data: result, ts: Date.now() };
        return result;
      } finally {
        inflightAnimePromise = null;
      }
    })(),
    FIRESTORE_READ_TIMEOUT_MS,
    cachedAnimeResult?.data ?? {}
  );

  return inflightAnimePromise;
}

// ============================================================================
// 5. BULK SYNC (Synchronizes any local storage items & IndexedDB PDFs to Cloud)
// ============================================================================

export async function syncLocalEditorialToCloud(
  customNews: NewsItem[],
  customBooks: Book[],
  customChapters: Record<string, Chapter[]>,
  animeOverrides: Record<string, Record<string, any>>
): Promise<{
  newsCount: number;
  booksCount: number;
  chaptersCount: number;
  animesCount: number;
  permissionDenied?: boolean;
}> {
  let newsCount = 0;
  let booksCount = 0;
  let chaptersCount = 0;
  let animesCount = 0;
  let permissionDenied = false;

  for (const n of customNews) {
    const res = await publishNewsToCloudDetailed(n);
    if (res.ok) newsCount++;
    else if (res.error && isFirestorePermissionDenied(res.error)) permissionDenied = true;
  }

  // Merge any server-cached editorial books so linking Google pushes all prior Master Password books too
  const booksById = new Map<string, Book>();
  for (const b of customBooks) {
    if (b?.id) booksById.set(b.id, b);
  }
  try {
    const serverBooks = await fetchEditorialCollectionFromServerApi<Book>(BOOKS_COLLECTION);
    for (const sb of serverBooks) {
      if (sb?.id && !booksById.has(sb.id)) {
        booksById.set(sb.id, unpackBookFromCloud(sb));
      }
    }
  } catch {}
  const allBooksToSync = Array.from(booksById.values());

  // Dynamically import IndexedDB helpers to sync any locally attached PDF bytes to Cloud
  let idbHelpers: {
    getPdfBytesFromIndexedDB?: (bookIdOrUri: string) => Promise<Uint8Array | null>;
    arrayBufferToBase64?: (buffer: ArrayBuffer) => string;
  } = {};
  try {
    idbHelpers = await import("@/lib/pdfUploadService");
  } catch {}

  for (const b of allBooksToSync) {
    let localPdfBytes: Uint8Array | null = null;
    if (idbHelpers.getPdfBytesFromIndexedDB) {
      try {
        const bytes = await idbHelpers.getPdfBytesFromIndexedDB(b.id);
        if (bytes && bytes.byteLength > 100 && bytes.byteLength <= 25 * 1024 * 1024) {
          localPdfBytes = bytes;
        }
      } catch {}
    }

    const res = await publishBookToCloudDetailed(b);
    if (res.ok) {
      booksCount++;
      if (localPdfBytes) {
        await publishPdfBinaryToCloud(b.id, localPdfBytes);
      }
    } else if (res.permissionDenied) {
      permissionDenied = true;
    }
  }

  const allChapterBookIds = new Set<string>([
    ...Object.keys(customChapters),
    ...allBooksToSync.map((b) => b.id),
  ]);
  for (const bookId of allChapterBookIds) {
    let chaps = customChapters[bookId] || [];
    if (chaps.length === 0) {
      try {
        chaps = await fetchEditorialCollectionFromServerApi<Chapter>(CHAPTERS_COLLECTION, { bookId });
      } catch {}
    }
    for (const c of chaps) {
      const ok = await publishChapterToCloud(c);
      if (ok) chaptersCount++;
    }
  }

  for (const aId of Object.keys(animeOverrides)) {
    const ok = await publishAnimeOverrideToCloud(aId, animeOverrides[aId]);
    if (ok) animesCount++;
  }

  invalidateCloudBooksCache();
  return { newsCount, booksCount, chaptersCount, animesCount, permissionDenied };
}
