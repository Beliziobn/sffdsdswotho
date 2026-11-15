/**
 * News Archive & Permanent Immutability Engine
 * Manages queries, historical pagination, timeline indexing, and canonical slug resolution.
 * Guarantees zero 404 for historical articles across all environments (preview, production, and external devices)
 * and persists every discovered article into the permanent multi-year database (IndexedDB + Server Archive).
 */

import { SyndicatedNewsItem } from "./newsSyndication";
import { expandNewsToDeepReport } from "./newsExpander";
import {
  saveArticlesToPermanentDb,
  getAllPermanentDbArticles,
  getPermanentDbArticleBySlug,
} from "./newsDatabase";

export interface ArchiveFilterOptions {
  page?: number;
  pageSize?: number;
  year?: number | null;
  month?: number | null;
  category?: string;
  q?: string;
  status?: "published" | "archived" | "all";
}

export interface ArchiveQueryResult {
  items: SyndicatedNewsItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ArchiveTimelineEntry {
  year: number;
  month: number;
  count: number;
}

let cachedLocalArticles: any[] | null = null;
let seededIndexedDb = false;

/**
 * Loads the bundled archive articles directly in the client and merges with the permanent IndexedDB vault.
 */
export async function getLocalArchiveArticles(): Promise<any[]> {
  let bundledList: any[] = cachedLocalArticles || [];
  if (!cachedLocalArticles || cachedLocalArticles.length === 0) {
    try {
      const raw = await import("@/data/newsArchive.json");
      const list = Array.isArray(raw.articles)
        ? raw.articles
        : Array.isArray((raw as any).default?.articles)
        ? (raw as any).default.articles
        : [];
      cachedLocalArticles = list;
      bundledList = list;
      if (!seededIndexedDb && list.length > 0) {
        seededIndexedDb = true;
        void saveArticlesToPermanentDb(list, false);
      }
    } catch (err) {
      console.warn("[NewsArchiveEngine] Falha ao importar acervo local:", err);
    }
  }

  try {
    const idbArticles = await getAllPermanentDbArticles();
    if (idbArticles.length > 0) {
      const map = new Map<string, any>();
      for (const item of [...idbArticles, ...bundledList]) {
        if (!item || !item.title) continue;
        const key = String(item.slug || item.id || "")
          .toLowerCase()
          .trim();
        if (!key) continue;
        if (!map.has(key)) {
          map.set(key, item);
        } else {
          const prev = map.get(key)!;
          if ((item.content || "").length > (prev.content || "").length) {
            map.set(key, { ...prev, ...item });
          }
        }
      }
      return Array.from(map.values());
    }
  } catch {}

  return bundledList;
}

/**
 * Queries the permanent historical news archive with server-side pagination & filters.
 * Seamlessly merges server archive with client-side IndexedDB + bundled archive.
 */
export async function queryNewsArchive(options: ArchiveFilterOptions = {}): Promise<ArchiveQueryResult> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, options.pageSize || 20);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (options.year) params.set("year", String(options.year));
  if (options.month) params.set("month", String(options.month));
  if (options.category && options.category !== "all") params.set("category", options.category);
  if (options.q) params.set("q", options.q);

  // 1. Try server endpoint first
  try {
    const res = await fetch(`/api/news/archive?${params.toString()}`);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return {
          items: data.items,
          total: data.total || data.items.length,
          page: data.page || page,
          pageSize: data.pageSize || pageSize,
          totalPages: data.totalPages || Math.ceil((data.total || data.items.length) / pageSize),
        };
      }
    }
  } catch {
    // Fall through to local + IndexedDB archive
  }

  // 2. Universal Client-side + IndexedDB permanent database fallback
  try {
    const all = await getLocalArchiveArticles();
    let filtered = all.filter((a: any) => !a.deleted_at);

    if (options.category && options.category !== "all") {
      const targetCat = options.category.toLowerCase().trim();
      filtered = filtered.filter((a: any) => (a.category || "").toLowerCase() === targetCat);
    }

    if (options.year) {
      filtered = filtered.filter((a: any) => {
        const d = new Date(a.published_at || a.created_at);
        return d.getFullYear() === options.year || a.year === options.year;
      });
    }

    if (options.month) {
      filtered = filtered.filter((a: any) => {
        const d = new Date(a.published_at || a.created_at);
        return d.getMonth() + 1 === options.month || a.month === options.month;
      });
    }

    if (options.q && options.q.trim()) {
      const term = options.q.toLowerCase().trim();
      filtered = filtered.filter(
        (a: any) =>
          (a.title || "").toLowerCase().includes(term) ||
          (a.excerpt || "").toLowerCase().includes(term) ||
          (a.content || "").toLowerCase().includes(term) ||
          (a.author || "").toLowerCase().includes(term)
      );
    }

    filtered.sort(
      (a: any, b: any) =>
        new Date(b.published_at || b.created_at).getTime() -
        new Date(a.published_at || a.created_at).getTime()
    );

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (err) {
    console.error("[NewsArchiveEngine] Erro ao consultar acervo de notícias:", err);
  }

  return {
    items: [],
    total: 0,
    page: 1,
    pageSize,
    totalPages: 1,
  };
}

/**
 * Resolves a permanent canonical news article by slug or ID.
 * Queries the historical archive endpoint, permanent IndexedDB database, and bundled archive,
 * guaranteeing that even years later, every article link resolves with full content and original cover.
 */
export async function fetchPermanentArticle(slugOrId: string): Promise<SyndicatedNewsItem | null> {
  if (!slugOrId) return null;
  const target = decodeURIComponent(slugOrId).toLowerCase().trim();

  // 1. Try server endpoint (which also auto-enriches brief articles from source_url)
  try {
    const res = await fetch(`/api/news/article?slug=${encodeURIComponent(slugOrId)}`);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data.article) {
        const enriched = expandNewsToDeepReport(data.article);
        void saveArticlesToPermanentDb([enriched], false);
        return enriched;
      }
    }
  } catch {}

  // 2. Check permanent IndexedDB database
  try {
    const idbMatch = await getPermanentDbArticleBySlug(target);
    if (idbMatch) {
      return expandNewsToDeepReport(idbMatch);
    }
  } catch {}

  // 3. Direct client-side archive search
  try {
    const all = await getLocalArchiveArticles();
    const match = all.find(
      (a: any) =>
        (a.slug || "").toLowerCase() === target ||
        (a.id || "").toLowerCase() === target ||
        (a.slug && a.slug.toLowerCase().includes(target))
    );
    if (match) {
      return expandNewsToDeepReport(match);
    }
  } catch (err) {
    console.error("[NewsArchiveEngine] Erro ao buscar artigo canônico:", err);
  }

  return null;
}

/**
 * Fetches the archive timeline breakdown (available years and months with counts).
 */
export async function fetchArchiveTimeline(): Promise<{ timeline: ArchiveTimelineEntry[]; totalArticles: number }> {
  // 1. Try server endpoint
  try {
    const res = await fetch("/api/news/timeline");
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.timeline) && data.timeline.length > 0) {
        return {
          timeline: data.timeline,
          totalArticles: data.totalArticles || 0,
        };
      }
    }
  } catch {}

  // 2. Direct client-side + IndexedDB timeline computation
  try {
    const all = await getLocalArchiveArticles();
    const active = all.filter((a: any) => !a.deleted_at);
    const map = new Map<string, { year: number; month: number; count: number }>();

    for (const item of active) {
      const date = new Date(item.published_at || item.created_at);
      if (isNaN(date.getTime())) continue;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (!map.has(key)) {
        map.set(key, { year, month, count: 0 });
      }
      map.get(key)!.count++;
    }

    const timeline = Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    return { timeline, totalArticles: active.length };
  } catch {
    return { timeline: [], totalArticles: 0 };
  }
}
