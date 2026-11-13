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
import { handleFirestoreError, OperationType } from "./firebaseErrors";
import firebaseConfig from "../../firebase-applet-config.json";
import type { Book, Chapter, NewsItem } from "@/hooks/useCatalog";

const NEWS_COLLECTION = "news";
const BOOKS_COLLECTION = "books";
const CHAPTERS_COLLECTION = "chapters";
const ANIME_OVERRIDES_COLLECTION = "anime_overrides";
const EDITORIAL_AUTH_COLLECTION = "editorial_auth";

const READ_CACHE_TTL_MS = 10_000;
const FIRESTORE_READ_TIMEOUT_MS = 6_000;

const EDITORIAL_PROOF_STORAGE_KEY = "worscoi_editorial_proof_v1";

function hasMasterAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("worscoi_special_admin_session_v1");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.email === "miguelworscoi@gmail.com";
  } catch {
    return false;
  }
}

async function resolveMasterEditorialProofToken(): Promise<string | null> {
  if (typeof window === "undefined" || !hasMasterAdminSession()) return null;
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
      if (data?.authenticated && typeof data?.editorialProofToken === "string" && data.editorialProofToken.trim()) {
        sessionStorage.setItem(EDITORIAL_PROOF_STORAGE_KEY, data.editorialProofToken.trim());
        return data.editorialProofToken.trim();
      }
    }
  } catch {
    // Ignore storage/network error
  }
  return null;
}

function canAuthorizeCloudWrite(): boolean {
  return Boolean(auth.currentUser || hasMasterAdminSession());
}

async function writeEditorialDoc(
  collectionName: string,
  docId: string,
  payload: Record<string, any>
): Promise<void> {
  if (auth.currentUser) {
    await setDoc(doc(db, collectionName, docId), payload, { merge: true });
    return;
  }
  const proofToken = await resolveMasterEditorialProofToken();
  if (!proofToken) {
    throw new Error("Sessão editorial expirada ou não validada no servidor. Entre novamente com sua senha mestra no painel /admin.");
  }
  const batch = writeBatch(db);
  batch.set(doc(db, EDITORIAL_AUTH_COLLECTION, docId), {
    token: proofToken,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, collectionName, docId), payload, { merge: true });
  await batch.commit();
}

async function deleteEditorialDoc(
  collectionName: string,
  docId: string
): Promise<void> {
  if (auth.currentUser) {
    await deleteDoc(doc(db, collectionName, docId));
    return;
  }
  const proofToken = await resolveMasterEditorialProofToken();
  if (!proofToken) {
    throw new Error("Sessão editorial expirada ou não validada no servidor. Entre novamente com sua senha mestra no painel /admin.");
  }
  const batch = writeBatch(db);
  batch.set(doc(db, EDITORIAL_AUTH_COLLECTION, docId), {
    token: proofToken,
    updatedAt: serverTimestamp(),
  });
  batch.delete(doc(db, collectionName, docId));
  await batch.commit();
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
    const online = await ensureFirestoreOnline();
    if (!online) {
      return {
        ok: false,
        error: "Sem conexão com a nuvem Firestore no momento. Verifique sua internet e tente sincronizar.",
      };
    }

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
    if (err?.code === "permission-denied" || String(err).includes("permission")) {
      handleFirestoreError(err, OperationType.WRITE, `${NEWS_COLLECTION}/${docId}`);
    }
    console.warn("[CloudEditorial] Failed to write news to Firestore:", err);
    return {
      ok: false,
      error: err?.message || "Falha ao gravar publicação no Firestore.",
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
    const online = await ensureFirestoreOnline();
    if (!online) return false;

    await deleteEditorialDoc(NEWS_COLLECTION, docId);
    if (!docId.startsWith("editorial-")) {
      await deleteEditorialDoc(NEWS_COLLECTION, sanitizeDocId(`editorial-${docId}`)).catch(() => {});
    }
    invalidateCloudNewsCache();
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || String(err).includes("permission")) {
      handleFirestoreError(err, OperationType.DELETE, `${NEWS_COLLECTION}/${docId}`);
    }
    console.warn("[CloudEditorial] Failed to delete news in Firestore:", err);
    return false;
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
            limit: 500,
          });
          const items = restDocs.map((d) => d.data as NewsItem);
          cachedNewsResult = { data: items, ts: Date.now() };
          return items;
        }
        const q = query(
          collection(db, NEWS_COLLECTION),
          where("published", "==", true),
          limit(500)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((d) => d.data() as NewsItem);
        cachedNewsResult = { data: items, ts: Date.now() };
        return items;
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud news:", err?.message || err);
        return cachedNewsResult?.data ?? [];
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
        limit(500)
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
// 2. BOOKS CLOUD PERSISTENCE
// ============================================================================

export async function publishBookToCloud(book: Book & {
  pdf_url?: string;
  download_url?: string;
  original_pages_count?: number;
  file_size_formatted?: string;
  edition_notes?: string;
  source_repository?: string;
}): Promise<boolean> {
  const docId = sanitizeDocId(book.id);
  if (!docId) return false;

  const payload: Record<string, any> = {
    id: book.id,
    title: (book.title || "").trim().slice(0, 300),
    author: (book.author || "Autor Editorial").trim().slice(0, 150),
    description: (book.description || "").trim().slice(0, 10000),
    cover_url: (book.cover_url || "").trim().slice(0, 1000),
    price_cents: Number(book.price_cents) || 0,
    currency: (book.currency || "BRL").trim().slice(0, 10),
    category: (book.category || "Literatura").trim().slice(0, 100),
    published: book.published ?? true,
    featured: book.featured ?? true,
    created_at: book.created_at || new Date().toISOString(),
  };

  if ((book as any).pdf_url) {
    payload.pdf_url = String((book as any).pdf_url).trim().slice(0, 500000);
  }
  if ((book as any).download_url) {
    payload.download_url = String((book as any).download_url).trim().slice(0, 500000);
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
    await ensureFirestoreOnline();
    await writeEditorialDoc(BOOKS_COLLECTION, docId, payload);
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      handleFirestoreError(err, OperationType.WRITE, `${BOOKS_COLLECTION}/${docId}`);
    }
    console.warn("[CloudEditorial] Failed to write book to Firestore:", err);
    return false;
  }
}

export async function deleteBookFromCloud(bookId: string): Promise<boolean> {
  const docId = sanitizeDocId(bookId);
  if (!docId || !canAuthorizeCloudWrite()) return false;

  try {
    await ensureFirestoreOnline();
    await deleteEditorialDoc(BOOKS_COLLECTION, docId);
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      handleFirestoreError(err, OperationType.DELETE, `${BOOKS_COLLECTION}/${docId}`);
    }
    console.warn("[CloudEditorial] Failed to delete book in Firestore:", err);
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
          const items = restDocs.map((d) => d.data as Book);
          cachedBooksResult = { data: items, ts: Date.now() };
          return items;
        }
        const q = query(
          collection(db, BOOKS_COLLECTION),
          where("published", "==", true),
          limit(200)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((d) => d.data() as Book);
        cachedBooksResult = { data: items, ts: Date.now() };
        return items;
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud books:", err?.message || err);
        return cachedBooksResult?.data ?? [];
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
    await ensureFirestoreOnline();
    await writeEditorialDoc(CHAPTERS_COLLECTION, docId, payload);
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      handleFirestoreError(err, OperationType.WRITE, `${CHAPTERS_COLLECTION}/${docId}`);
    }
    console.warn("[CloudEditorial] Failed to write chapter to Firestore:", err);
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
          const list = restDocs.map((d) => d.data as Chapter);
          list.sort((a, b) => (a.position || 0) - (b.position || 0));
          cachedChaptersMap.set(bookId, { data: list, ts: Date.now() });
          return list;
        }
        const q = query(
          collection(db, CHAPTERS_COLLECTION),
          where("book_id", "==", bookId)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => d.data() as Chapter);
        list.sort((a, b) => (a.position || 0) - (b.position || 0));
        cachedChaptersMap.set(bookId, { data: list, ts: Date.now() });
        return list;
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud chapters:", err?.message || err);
        return cached?.data ?? [];
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

  const payload = {
    id: docId,
    ...(patch.title ? { title: String(patch.title).slice(0, 300) } : {}),
    ...(patch.synopsis ? { synopsis: String(patch.synopsis).slice(0, 5000) } : {}),
    ...(patch.cover ? { cover: String(patch.cover).slice(0, 1000) } : {}),
    ...(patch.banner ? { banner: String(patch.banner).slice(0, 1000) } : {}),
    ...(patch.trailerYoutubeId ? { trailerYoutubeId: String(patch.trailerYoutubeId).slice(0, 100) } : {}),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (!canAuthorizeCloudWrite()) return false;
    await ensureFirestoreOnline();
    await writeEditorialDoc(ANIME_OVERRIDES_COLLECTION, docId, payload);
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      handleFirestoreError(err, OperationType.WRITE, `${ANIME_OVERRIDES_COLLECTION}/${docId}`);
    }
    console.warn("[CloudEditorial] Failed to write anime override to Firestore:", err);
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
      try {
        const ready = await ensureFirestoreReady();
        if (!ready) {
          const restDocs = await runRestQuery({
            from: [{ collectionId: ANIME_OVERRIDES_COLLECTION }],
            limit: 200,
          });
          const result: Record<string, Record<string, any>> = {};
          for (const d of restDocs) {
            result[d.id] = d.data;
          }
          cachedAnimeResult = { data: result, ts: Date.now() };
          return result;
        }
        const snapshot = await getDocs(collection(db, ANIME_OVERRIDES_COLLECTION));
        const result: Record<string, Record<string, any>> = {};
        for (const d of snapshot.docs) {
          result[d.id] = d.data();
        }
        cachedAnimeResult = { data: result, ts: Date.now() };
        return result;
      } catch (err: any) {
        console.warn("[CloudEditorial] Could not list cloud anime overrides:", err?.message || err);
        return cachedAnimeResult?.data ?? {};
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
// 5. BULK SYNC (Synchronizes any local storage items to Firestore)
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

  for (const b of customBooks) {
    const ok = await publishBookToCloud(b);
    if (ok) booksCount++;
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
