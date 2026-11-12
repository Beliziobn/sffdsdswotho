import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { handleFirestoreError, OperationType } from "./firebaseErrors";
import type { Book, Chapter, NewsItem } from "@/hooks/useCatalog";

const NEWS_COLLECTION = "news";
const BOOKS_COLLECTION = "books";
const CHAPTERS_COLLECTION = "chapters";
const ANIME_OVERRIDES_COLLECTION = "anime_overrides";

const READ_CACHE_TTL_MS = 60_000;
const FIRESTORE_READ_TIMEOUT_MS = 6_000;

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
  return rawId
    .trim()
    .replace(/[^a-zA-Z0-9_\-\.]/g, "-")
    .slice(0, 120);
}

// ============================================================================
// 1. NEWS CLOUD PERSISTENCE
// ============================================================================

export async function publishNewsToCloud(item: NewsItem): Promise<boolean> {
  const docId = sanitizeDocId(item.id || item.slug);
  if (!docId) return false;

  const payload = {
    id: item.id || docId,
    title: (item.title || "").trim().slice(0, 300),
    slug: (item.slug || docId).trim().slice(0, 150),
    excerpt: (item.excerpt || "").trim().slice(0, 2000),
    content: (item.content || "").trim().slice(0, 50000),
    cover_url: (item.cover_url || "").trim().slice(0, 1000),
    category: (item.category || "Geral").trim().slice(0, 100),
    published: item.published ?? true,
    published_at: item.published_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
    author: ((item as any).author || "Miguel Worscoi (Redação Editorial)").trim().slice(0, 150),
    source_name: ((item as any).source_name || "Worscoi Editorial").trim().slice(0, 150),
    source_url: ((item as any).source_url || "").trim().slice(0, 1000),
  };

  try {
    const docRef = doc(db, NEWS_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || String(err).includes("permission")) {
      handleFirestoreError(err, OperationType.WRITE, `${NEWS_COLLECTION}/${docId}`);
    }
    console.warn("[CloudEditorial] Failed to write news to Firestore:", err);
    return false;
  }
}

export async function deleteNewsFromCloud(idOrSlug: string): Promise<boolean> {
  const docId = sanitizeDocId(idOrSlug);
  if (!docId) return false;

  try {
    const docRef = doc(db, NEWS_COLLECTION, docId);
    // Mark as unpublished to avoid race conditions
    await setDoc(docRef, { published: false, updated_at: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === "permission-denied" || String(err).includes("permission")) {
      handleFirestoreError(err, OperationType.DELETE, `${NEWS_COLLECTION}/${docId}`);
    }
    console.warn("[CloudEditorial] Failed to mark news deleted in Firestore:", err);
    return false;
  }
}

export async function fetchCloudNews(): Promise<NewsItem[]> {
  if (cachedNewsResult && Date.now() - cachedNewsResult.ts < READ_CACHE_TTL_MS) {
    return cachedNewsResult.data;
  }
  if (inflightNewsPromise) {
    return inflightNewsPromise;
  }

  inflightNewsPromise = withTimeout(
    (async () => {
      try {
        const q = query(
          collection(db, NEWS_COLLECTION),
          where("published", "==", true),
          limit(200)
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
    const docRef = doc(db, BOOKS_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
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
  if (!docId) return false;

  try {
    const docRef = doc(db, BOOKS_COLLECTION, docId);
    await setDoc(docRef, { published: false, updated_at: new Date().toISOString() }, { merge: true });
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
    const docRef = doc(db, CHAPTERS_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
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
    const docRef = doc(db, ANIME_OVERRIDES_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
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
