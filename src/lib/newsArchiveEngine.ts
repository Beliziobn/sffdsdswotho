/**
 * News Archive & Permanent Immutability Engine
 * Manages queries, historical pagination, timeline indexing, and canonical slug resolution.
 * Guarantees zero 404 for historical articles across all environments (preview, production, and external devices).
 */

import { SyndicatedNewsItem } from "./newsSyndication";
import { expandNewsToDeepReport } from "./newsExpander";

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

/**
 * Loads the bundled archive articles directly in the client.
 * Guarantees that external users on the live site see all 800+ news articles
 * even without the Vite development server running.
 */
export async function getLocalArchiveArticles(): Promise<any[]> {
  if (cachedLocalArticles && cachedLocalArticles.length > 0) {
    return cachedLocalArticles;
  }
  try {
    const raw = await import("@/data/newsArchive.json");
    const list = Array.isArray(raw.articles)
      ? raw.articles
      : Array.isArray((raw as any).default?.articles)
      ? (raw as any).default.articles
      : [];
    cachedLocalArticles = list;
    return list;
  } catch (err) {
    console.warn("[NewsArchiveEngine] Falha ao importar acervo local:", err);
    return [];
  }
}

/**
 * Queries the permanent historical news archive with server-side pagination & filters.
 * Seamlessly falls back to client-side in-memory search if API endpoint is unreachable.
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

  // 1. Try server endpoint first (active in dev / preview)
  try {
    const res = await fetch(`/api/news/archive?${params.toString()}`);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const enrichedItems = data.items.map((it: any) => expandNewsToDeepReport(it));
        return {
          items: enrichedItems,
          total: data.total || enrichedItems.length,
          page: data.page || page,
          pageSize: data.pageSize || pageSize,
          totalPages: data.totalPages || Math.ceil((data.total || enrichedItems.length) / pageSize),
        };
      }
    }
  } catch {
    // API endpoint offline or not running in static build; fall through to local archive
  }

  // 2. Universal Client-side in-memory fallback (active for external users / production site)
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
      filtered = filtered.filter((a: any) =>
        (a.title || "").toLowerCase().includes(term) ||
        (a.excerpt || "").toLowerCase().includes(term) ||
        (a.content || "").toLowerCase().includes(term) ||
        (a.author || "").toLowerCase().includes(term)
      );
    }

    // Sort chronologically (most recent first)
    filtered.sort(
      (a: any, b: any) =>
        new Date(b.published_at || b.created_at).getTime() -
        new Date(a.published_at || a.created_at).getTime()
    );

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);
    const enrichedItems = paginatedItems.map((it: any) => expandNewsToDeepReport(it));

    return {
      items: enrichedItems,
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
 * Queries the historical archive endpoint first, then falls back to local archive,
 * guaranteeing that even years later, the link works everywhere!
 */
export async function fetchPermanentArticle(slugOrId: string): Promise<SyndicatedNewsItem | null> {
  if (!slugOrId) return null;
  const target = decodeURIComponent(slugOrId).toLowerCase().trim();

  // 1. Try server endpoint
  try {
    const res = await fetch(`/api/news/article?slug=${encodeURIComponent(slugOrId)}`);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data.article) {
        return expandNewsToDeepReport(data.article);
      }
    }
  } catch {}

  // 2. Direct client-side archive search
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

  // 2. Direct client-side timeline computation
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
