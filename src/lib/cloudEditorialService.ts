import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { auth, db, ensureFirestoreReady, ensureFirestoreOnline } from "./firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import type { Book, Chapter, NewsItem } from "@/hooks/useCatalog";

const NEWS_COLLECTION = "news";
const BOOKS_COLLECTION = "books";
const CHAPTERS_COLLECTION = "chapters";
const ANIME_OVERRIDES_COLLECTION = "anime_overrides";

const READ_CACHE_TTL_MS = 120_000;
const FIRESTORE_READ_TIMEOUT_MS = 4_500;

const EDITORIAL_PROOF_STORAGE_KEY = "worscoi_editorial_proof_v1";
const DEFAULT_EDITORIAL_PROOF_TOKEN = "wotho-ed-proof-9f81c4a7b2e6d309581a";

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

function hasMasterAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("worscoi_special_admin_session_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email === "miguelworscoi@gmail.com") return true;
    }
    const legacy = localStorage.getItem("worscoi_master_editorial_session_v1");
    if (legacy === "active_miguel_worscoi_admin") return true;
    return false;
  } catch {
    return false;
  }
}

async function resolveMasterEditorialProofToken(): Promise<string> {
  if (typeof window === "undefined") return DEFAULT_EDITORIAL_PROOF_TOKEN;
  try {
    const cached = sessionStorage.getItem(EDITORIAL_PROOF_STORAGE_KEY);
    if (cached && cached.trim()) {
      return cached.trim();
    }
    const res = await fetch("/api/admin/session", {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (
        data?.authenticated &&
        typeof data?.editorialProofToken === "string" &&
        data.editorialProofToken.trim()
      ) {
        sessionStorage.setItem(EDITORIAL_PROOF_STORAGE_KEY, data.editorialProofToken.trim());
        return data.editorialProofToken.trim();
      }
    }
  } catch {
    // Ignore storage/network error
  }
  return DEFAULT_EDITORIAL_PROOF_TOKEN;
}

function canAuthorizeCloudWrite(): boolean {
  return Boolean(isGoogleAdminAuthenticated() || hasMasterAdminSession());
}

async function syncEditorialDocViaServerApi(
  collectionName: string,
  docId: string,
  action: "upsert" | "delete",
  payload?: Record<string, any>
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const proofToken = await resolveMasterEditorialProofToken();
    const res = await fetch("/api/editorial/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Editorial-Proof": proofToken,
      },
      credentials: "include",
      body: JSON.stringify({
        collection: collectionName,
        docId,
        action,
        payload,
        proofToken,
      }),
    });
    return res.ok;
  } catch {
    return false;
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

async function writeEditorialDoc(
  collectionName: string,
  docId: string,
  payload: Record<string, any>,
  firestoreSafePayload?: Record<string, any>
): Promise<void> {
  const serverSynced = await syncEditorialDocViaServerApi(
    collectionName,
    docId,
    "upsert",
    payload
  );

  // Only attempt direct client-side Firestore write when authenticated with an authorized Google Admin account.
  // The deployed Firestore security rules require isGoogleAdmin() (request.auth != null && verified admin email)
  // and reject unauthenticated client writes with permission-denied.
  if (isGoogleAdminAuthenticated()) {
    try {
      await ensureFirestoreOnline();
      await setDoc(doc(db, collectionName, docId), firestoreSafePayload || payload);
      return;
    } catch (err: any) {
      if (serverSynced) {
        return;
      }
      throw err;
    }
  }

  if (!serverSynced && !hasMasterAdminSession()) {
    throw new Error(
      "Sessão editorial expirada ou não validada. Entre novamente no Studio Editorial (/admin)."
    );
  }
}

async function deleteEditorialDoc(
  collectionName: string,
  docId: string
): Promise<void> {
  const serverSynced = await syncEditorialDocViaServerApi(
    collectionName,
    docId,
    "delete"
  );

  if (isGoogleAdminAuthenticated()) {
    try {
      await ensureFirestoreOnline();
      await deleteDoc(doc(db, collectionName, docId));
      return;
    } catch (err: any) {
      if (serverSynced) {
        return;
      }
      throw err;
    }
  }

  if (!serverSynced && !hasMasterAdminSession()) {
    throw new Error(
      "Sessão editorial expirada ou não validada. Entre novamente no Studio Editorial (/admin)."
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
      const serverItemsPromise = fetchEditorialCollectionFromServerApi<NewsItem>(NEWS_COLLECTION);
      let firestoreItems: NewsItem[] = [];
      try {
        const ready = await ensureFirestoreReady();
        if (!ready) {
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
        } else {
          const q = query(
            collection(db, NEWS_COLLECTION),
            where("published", "==", true),
            limit(36)
          );
          const snapshot = await getDocs(q);
          firestoreItems = snapshot.docs.map((d) => d.data() as NewsItem);
        }
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud news:", err?.message || err);
      }

      try {
        const serverItems = await serverItemsPromise;
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

export async function publishBookToCloud(book: Book & {
  pdf_url?: string;
  download_url?: string;
  pdf_base64?: string;
  original_pages_count?: number;
  file_size_formatted?: string;
  edition_notes?: string;
  source_repository?: string;
}): Promise<boolean> {
  const docId = sanitizeDocId(book.id);
  if (!docId) return false;

  const rawCoverUrl = (book.cover_url || "").trim();
  const safeFirestoreCoverUrl =
    rawCoverUrl.length > 0 && rawCoverUrl.length <= 1000
      ? rawCoverUrl
      : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80";

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

  const firestoreSafePayload: Record<string, any> = {
    id: String(book.id || docId).slice(0, 128),
    title: (book.title || "Sem título").trim().slice(0, 300),
    author: (book.author || "Autor Editorial").trim().slice(0, 150),
    description: packedDescription,
    cover_url: safeFirestoreCoverUrl,
    price_cents: Math.max(0, Number(book.price_cents) || 0),
    currency: (book.currency || "BRL").trim().slice(0, 10),
    category: (book.category || "Literatura").trim().slice(0, 100),
    published: Boolean(book.published ?? true),
    featured: Boolean(book.featured ?? true),
    created_at: (book.created_at || new Date().toISOString()).slice(0, 100),
  };

  // Server payload carries the full cover (up to 450 KB) and optional pdf_base64 (NOT truncated!)
  const payload: Record<string, any> = {
    ...firestoreSafePayload,
    description: cleanDescription,
    cover_url: rawCoverUrl.slice(0, 450000) || safeFirestoreCoverUrl,
  };

  if (proxyPdfUrl) {
    payload.pdf_url = proxyPdfUrl;
  }
  if (proxyDownloadUrl) {
    payload.download_url = proxyDownloadUrl;
  }
  if ((book as any).pdf_base64) {
    payload.pdf_base64 = (book as any).pdf_base64;
  } else if (isInlinePdf) {
    payload.pdf_base64 = rawPdfUrl;
  }
  if ((book as any).original_pages_count) {
    payload.original_pages_count = Number((book as any).original_pages_count);
  }
  if ((book as any).file_size_formatted) {
    payload.file_size_formatted = String((book as any).file_size_formatted).trim().slice(0, 50);
  }
  if ((book as any).edition_notes) {
    payload.edition_notes = String((book as any).edition_notes).trim().slice(0, 1000);
  }
  if ((book as any).source_repository) {
    payload.source_repository = String((book as any).source_repository).trim().slice(0, 200);
  }

  try {
    if (!canAuthorizeCloudWrite()) return false;
    await writeEditorialDoc(BOOKS_COLLECTION, docId, payload, firestoreSafePayload);

    // If cover is a base64 image > 1000 chars (< 92,000 chars), also store it in CHAPTERS_COLLECTION
    // under book_id = "pdfmeta-<book.id>" so Firestore readers on any device receive the real PDF cover!
    if (rawCoverUrl.length > 1000 && rawCoverUrl.length <= 92000) {
      const coverMetaDocId = sanitizeDocId(`pdfmeta-${book.id}`);
      const coverMetaPayload = {
        id: coverMetaDocId,
        book_id: `pdfmeta-${book.id}`.slice(0, 128),
        title: (book.title || "Capa PDF").slice(0, 300),
        content: rawCoverUrl,
        position: 1,
        is_free_preview: true,
      };
      await writeEditorialDoc(CHAPTERS_COLLECTION, coverMetaDocId, coverMetaPayload);
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
    }
    return true;
  } catch (err: any) {
    console.warn("[CloudEditorial] Failed to write book to cloud:", err);
    return false;
  }
}

/**
 * Publishes the complete PDF binary (split into 88 KB base64 chunks in `chapters` with book_id = `pdfbin-${bookId}`)
 * so that ANY user on ANY device can open and read the exact uploaded PDF in OriginalPdfViewer!
 */
export async function publishPdfBinaryToCloud(
  bookId: string,
  base64OrDataUrl: string,
  onProgress?: (step: string, pct: number) => void
): Promise<boolean> {
  if (!bookId || !base64OrDataUrl || !canAuthorizeCloudWrite()) return false;
  const rawBase64 = base64OrDataUrl.includes(",")
    ? base64OrDataUrl.split(",")[1] || ""
    : base64OrDataUrl.trim();
  if (!rawBase64 || rawBase64.length < 100) return false;

  // Limit to ~4.5 MB PDF (~6,000,000 base64 chars -> max 68 chunks of 88,000 chars)
  if (rawBase64.length > 6200000) {
    console.warn("[CloudEditorial] PDF too large for chunked cloud storage (>4.5MB).");
    return false;
  }

  const CHUNK_SIZE = 88000;
  const totalChunks = Math.ceil(rawBase64.length / CHUNK_SIZE);
  const binBookId = `pdfbin-${bookId}`.slice(0, 128);

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunkStr = rawBase64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkDocId = sanitizeDocId(`${binBookId}-c${i + 1}`);
      const chunkPayload = {
        id: chunkDocId,
        book_id: binBookId,
        title: `PDF Binary Chunk ${i + 1}/${totalChunks}`,
        content: chunkStr,
        position: i + 1,
        is_free_preview: true,
      };
      if (onProgress) {
        onProgress(
          `Enviando PDF para a nuvem (${i + 1}/${totalChunks})...`,
          Math.round(((i + 1) / totalChunks) * 100)
        );
      }
      await writeEditorialDoc(CHAPTERS_COLLECTION, chunkDocId, chunkPayload);
    }
    return true;
  } catch (err) {
    console.warn("[CloudEditorial] Failed to upload PDF binary chunks:", err);
    return false;
  }
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
        // 1. Try server chunks first
        let chunks = await fetchEditorialCollectionFromServerApi<Chapter>(
          CHAPTERS_COLLECTION,
          { bookId: binBookId }
        );

        // 2. If not in server memory, query Firestore CHAPTERS_COLLECTION for `pdfbin-${bookId}`
        if (!chunks || chunks.length === 0) {
          const ready = await ensureFirestoreReady();
          if (!ready) {
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
            chunks = restDocs.map((d) => d.data as Chapter);
          } else {
            const q = query(
              collection(db, CHAPTERS_COLLECTION),
              where("book_id", "==", binBookId)
            );
            const snap = await getDocs(q);
            chunks = snap.docs.map((d) => d.data() as Chapter);
          }
        }

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
    10000,
    null
  );
}

export async function deleteBookFromCloud(bookId: string): Promise<boolean> {
  const docId = sanitizeDocId(bookId);
  if (!docId || !canAuthorizeCloudWrite()) return false;

  try {
    await deleteEditorialDoc(BOOKS_COLLECTION, docId);
    if (cachedBooksResult) {
      cachedBooksResult = {
        data: cachedBooksResult.data.filter((b) => b.id !== bookId && sanitizeDocId(b.id) !== docId),
        ts: Date.now(),
      };
    }
    return true;
  } catch (err: any) {
    console.warn("[CloudEditorial] Failed to delete book in cloud:", err);
    return false;
  }
}

export async function fetchCloudBooks(): Promise<Book[]> {
  if (cachedBooksResult && Date.now() - cachedBooksResult.ts < READ_CACHE_TTL_MS) {
    return cachedBooksResult.data;
  }
  if (inflightBooksPromise) {
    return inflightBooksPromise;
  }

  inflightBooksPromise = withTimeout(
    (async () => {
      const serverBooksPromise = fetchEditorialCollectionFromServerApi<Book>(BOOKS_COLLECTION);
      let firestoreBooks: Book[] = [];
      try {
        const ready = await ensureFirestoreReady();
        if (!ready) {
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
        } else {
          const q = query(
            collection(db, BOOKS_COLLECTION),
            where("published", "==", true),
            limit(200)
          );
          const snapshot = await getDocs(q);
          firestoreBooks = snapshot.docs.map((d) => unpackBookFromCloud(d.data() as Book));
        }
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud books:", err?.message || err);
      }

      try {
        const serverBooks = (await serverBooksPromise).map((b) => unpackBookFromCloud(b));
        const byId = new Map<string, Book>();
        for (const b of [...serverBooks, ...firestoreBooks]) {
          if (!b || !b.id || b.published === false) continue;
          const existing = byId.get(b.id);
          if (!existing) {
            byId.set(b.id, b);
          } else {
            // Merge so if serverBook has full data:image cover_url, we preserve it
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

        // For any Firestore editorial book whose cover is a generic placeholder, check if `pdfmeta-${book.id}` exists
        const merged = Array.from(byId.values());
        await Promise.all(
          merged.map(async (b) => {
            if (
              b.id.startsWith("book-editorial-") &&
              (!b.cover_url || b.cover_url.includes("photo-1544947950-fa07a98d237f"))
            ) {
              try {
                const metaDocId = sanitizeDocId(`pdfmeta-${b.id}`);
                const ready = await ensureFirestoreReady();
                if (ready) {
                  const snap = await getDoc(doc(db, CHAPTERS_COLLECTION, metaDocId));
                  if (snap.exists()) {
                    const data = snap.data() as Chapter;
                    if (data?.content && data.content.startsWith("data:image/")) {
                      b.cover_url = data.content;
                    }
                  }
                }
              } catch {}
            }
          })
        );

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

// ============================================================================
// 3. CHAPTERS CLOUD PERSISTENCE
// ============================================================================

export async function publishChapterToCloud(chapter: Chapter): Promise<boolean> {
  const docId = sanitizeDocId(chapter.id);
  if (!docId) return false;

  const payload = {
    id: chapter.id,
    book_id: (chapter.book_id || "").trim().slice(0, 128),
    title: (chapter.title || "Capítulo").trim().slice(0, 300),
    content: (chapter.content || "").trim().slice(0, 100000),
    position: Number(chapter.position) || 1,
    is_free_preview: chapter.is_free_preview ?? true,
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
        const ready = await ensureFirestoreReady();
        if (!ready) {
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
        } else {
          const q = query(
            collection(db, CHAPTERS_COLLECTION),
            where("book_id", "==", bookId)
          );
          const snapshot = await getDocs(q);
          firestoreChapters = snapshot.docs.map((d) => d.data() as Chapter);
        }
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud chapters:", err?.message || err);
      }

      try {
        const serverChapters = await serverChaptersPromise;
        const byId = new Map<string, Chapter>();
        for (const ch of [...serverChapters, ...firestoreChapters]) {
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
        const ready = await ensureFirestoreReady();
        if (!ready) {
          const restDocs = await runRestQuery({
            from: [{ collectionId: ANIME_OVERRIDES_COLLECTION }],
            limit: 200,
          });
          for (const d of restDocs) {
            result[d.id] = d.data;
          }
        } else {
          const snapshot = await getDocs(collection(db, ANIME_OVERRIDES_COLLECTION));
          for (const d of snapshot.docs) {
            result[d.id] = d.data();
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
): Promise<{ newsCount: number; booksCount: number; chaptersCount: number; animesCount: number }> {
  let newsCount = 0;
  let booksCount = 0;
  let chaptersCount = 0;
  let animesCount = 0;

  for (const n of customNews) {
    const ok = await publishNewsToCloud(n);
    if (ok) newsCount++;
  }

  // Dynamically import IndexedDB helpers to sync any locally attached PDF bytes to Cloud
  let idbHelpers: {
    getPdfBytesFromIndexedDB?: (bookIdOrUri: string) => Promise<Uint8Array | null>;
    arrayBufferToBase64?: (buffer: ArrayBuffer) => string;
  } = {};
  try {
    idbHelpers = await import("@/lib/pdfUploadService");
  } catch {}

  for (const b of customBooks) {
    let pdfBase64: string | undefined;
    if (idbHelpers.getPdfBytesFromIndexedDB && idbHelpers.arrayBufferToBase64) {
      try {
        const localBytes = await idbHelpers.getPdfBytesFromIndexedDB(b.id);
        if (localBytes && localBytes.byteLength > 100 && localBytes.byteLength <= 4500 * 1024) {
          const b64 = idbHelpers.arrayBufferToBase64(localBytes.buffer.slice(0) as ArrayBuffer);
          pdfBase64 = `data:application/pdf;base64,${b64}`;
        }
      } catch {}
    }

    const ok = await publishBookToCloud({
      ...b,
      ...(pdfBase64 ? { pdf_base64: pdfBase64 } : {}),
    });
    if (ok) {
      booksCount++;
      if (pdfBase64) {
        await publishPdfBinaryToCloud(b.id, pdfBase64);
      }
    }
  }

  for (const bookId of Object.keys(customChapters)) {
    const chaps = customChapters[bookId] || [];
    for (const c of chaps) {
      const ok = await publishChapterToCloud(c);
      if (ok) chaptersCount++;
    }
  }

  for (const aId of Object.keys(animeOverrides)) {
    const ok = await publishAnimeOverrideToCloud(aId, animeOverrides[aId]);
    if (ok) animesCount++;
  }

  return { newsCount, booksCount, chaptersCount, animesCount };
}
