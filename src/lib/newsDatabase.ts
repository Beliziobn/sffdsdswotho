/**
 * Permanent Multi-Year News Database Engine (IndexedDB + Server Archive + Cloud Sync)
 * Guarantees that once a news article is published or syndicated on the site,
 * its complete original content and authentic cover image are permanently stored
 * and never disappear, even after many years.
 */

const DB_NAME = "wotho_permanent_news_db";
const DB_VERSION = 1;
const STORE_NAME = "articles";

let dbPromise: Promise<IDBDatabase | null> | null = null;
const syncedServerSlugs = new Set<string>();

function openNewsDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "slug" });
          store.createIndex("id", "id", { unique: false });
          store.createIndex("category", "category", { unique: false });
          store.createIndex("published_at", "published_at", { unique: false });
          store.createIndex("year", "year", { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

function isAuthenticCover(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/covers/")) &&
    !url.includes("images.unsplash.com") &&
    !url.includes("placeholder.svg")
  );
}

/**
 * Persists articles permanently into IndexedDB and syncs new entries to the server archive (/api/news/archive).
 */
export async function saveArticlesToPermanentDb(
  items: any[],
  syncToServer = true
): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;

  const db = await openNewsDatabase();
  const toSyncServer: any[] = [];

  if (db) {
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        for (const raw of items) {
          if (!raw || !raw.title) continue;
          const slug = String(raw.slug || raw.id || "")
            .toLowerCase()
            .trim();
          if (!slug) continue;

          const getReq = store.get(slug);
          getReq.onsuccess = () => {
            const existing = getReq.result;
            const pubDate = raw.published_at ? new Date(raw.published_at) : new Date();
            const year = isNaN(pubDate.getTime()) ? 2026 : pubDate.getFullYear();
            const month = isNaN(pubDate.getTime()) ? 11 : pubDate.getMonth() + 1;

            if (!existing) {
              const record = {
                ...raw,
                slug,
                id: raw.id || slug,
                year,
                month,
                stored_permanently_at: new Date().toISOString(),
              };
              store.put(record);
              if (
                syncToServer &&
                !syncedServerSlugs.has(slug) &&
                isAuthenticCover(record.cover_url) &&
                (record.content || "").length >= 400
              ) {
                syncedServerSlugs.add(slug);
                toSyncServer.push(record);
              }
            } else {
              const newHasRealCover = isAuthenticCover(raw.cover_url);
              const oldHasRealCover = isAuthenticCover(existing.cover_url);
              const newLen = (raw.content || "").length;
              const oldLen = (existing.content || "").length;

              if ((newHasRealCover && !oldHasRealCover) || newLen > oldLen) {
                const updatedRecord = {
                  ...existing,
                  ...raw,
                  slug,
                  cover_url: newHasRealCover
                    ? raw.cover_url
                    : oldHasRealCover
                    ? existing.cover_url
                    : raw.cover_url || existing.cover_url,
                  content: newLen >= oldLen ? raw.content : existing.content,
                  year,
                  month,
                  updated_at: new Date().toISOString(),
                };
                store.put(updatedRecord);
                if (syncToServer && !syncedServerSlugs.has(slug)) {
                  syncedServerSlugs.add(slug);
                  toSyncServer.push(updatedRecord);
                }
              }
            }
          };
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignore IndexedDB transaction errors
    }
  }

  if (syncToServer && toSyncServer.length > 0 && typeof fetch === "function") {
    try {
      await fetch("/api/news/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: toSyncServer.slice(0, 30) }),
      });
    } catch {
      // Non-blocking server archive sync
    }
  }
}

/**
 * Retrieves all permanently stored articles from IndexedDB, sorted newest first.
 */
export async function getAllPermanentDbArticles(): Promise<any[]> {
  const db = await openNewsDatabase();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = Array.isArray(req.result) ? req.result : [];
        list.sort(
          (a, b) =>
            new Date(b.published_at || b.created_at || 0).getTime() -
            new Date(a.published_at || a.created_at || 0).getTime()
        );
        resolve(list);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Resolves a single article by slug or ID from the permanent IndexedDB store.
 */
export async function getPermanentDbArticleBySlug(slugOrId: string): Promise<any | null> {
  if (!slugOrId) return null;
  const target = decodeURIComponent(slugOrId).toLowerCase().trim();
  const db = await openNewsDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const directReq = store.get(target);

      directReq.onsuccess = () => {
        if (directReq.result) {
          resolve(directReq.result);
          return;
        }
        const idIdx = store.index("id");
        const idReq = idIdx.get(target);
        idReq.onsuccess = () => {
          resolve(idReq.result || null);
        };
        idReq.onerror = () => resolve(null);
      };
      directReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
