import type { NewsItem } from "@/hooks/useCatalog";
import { expandNewsToDeepReport } from "./newsExpander";
import { getSmartNewsCover, isValidCoverUrl } from "./newsImageResolver";
import { fetchCloudNews } from "./cloudEditorialService";
import { getLocalArchiveArticles } from "./newsArchiveEngine";

export interface SyndicatedNewsItem extends NewsItem {
  source_name?: string;
  source_url?: string;
  read_time?: number;
  is_syndicated?: boolean;
  word_count?: number;
  key_takeaways?: string[];
}

const STORAGE_KEY = "worscoi_syndicated_news_v14";
const LAST_SYNC_KEY = "worscoi_news_last_sync_v14";
const SYNC_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes cache TTL for fresh continuous updates

let inflightSyncPromise: Promise<SyndicatedNewsItem[]> | null = null;

/** Clear legacy versions from localStorage */
const clearLegacyCache = () => {
  if (typeof window === "undefined") return;
  try {
    for (let i = 1; i <= 13; i++) {
      localStorage.removeItem(`worscoi_syndicated_news_v${i}`);
      localStorage.removeItem(`worscoi_news_last_sync_v${i}`);
    }
    localStorage.removeItem("worscoi_news_last_sync");
  } catch {}
};

/** Get cached news from localStorage */
export const getCachedNews = (): SyndicatedNewsItem[] => {
  if (typeof window === "undefined") return [];
  clearLegacyCache();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => {
        const enriched = expandNewsToDeepReport(item);
        if (!isValidCoverUrl(enriched.cover_url)) {
          enriched.cover_url = getSmartNewsCover(enriched.title, enriched.category);
        }
        return enriched;
      });
    }
    return [];
  } catch {
    return [];
  }
};

/** Save news to localStorage */
export const setCachedNews = (items: SyndicatedNewsItem[]) => {
  if (typeof window === "undefined") return;
  try {
    const cleaned = items.map((it) => expandNewsToDeepReport(it));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch {
    // Ignore storage quota
  }
};

export const getLastSyncTime = (): Date | null => {
  if (typeof window === "undefined") return null;
  const time = localStorage.getItem(LAST_SYNC_KEY);
  return time ? new Date(parseInt(time, 10)) : null;
};

/**
 * Fetch automatic daily news with authentic matching covers and multi-paragraph content.
 * Uses an in-flight singleton lock to prevent duplicate parallel network requests.
 */
export async function syncDailyNews(force = false): Promise<SyndicatedNewsItem[]> {
  const lastSync = getLastSyncTime();
  const cached = getCachedNews();

  // Return cached if still fresh and not forcing refresh
  if (!force && cached.length > 0 && lastSync && Date.now() - lastSync.getTime() < SYNC_INTERVAL_MS) {
    return cached;
  }

  if (inflightSyncPromise) {
    return inflightSyncPromise;
  }

  inflightSyncPromise = (async () => {
    try {
      const allItems: SyndicatedNewsItem[] = [];
      const seen = new Set<string>();

      // 1. Try single unified /api/news/feed?topic=all endpoint with short timeout (avoids 15x serverless cold-start flood)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`/api/news/feed?topic=all&limit=45`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const batch = (Array.isArray(data.items) ? data.items : []) as SyndicatedNewsItem[];
        for (const item of batch) {
          const key = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          if (!seen.has(key) && key.length > 5) {
            seen.add(key);
            if (!isValidCoverUrl(item.cover_url)) {
              item.cover_url = getSmartNewsCover(item.title, item.category);
            }
            allItems.push(item);
          }
        }
      }
    }
  } catch {
    // Fallback cleanly to local archive when API times out or is unavailable
  }

  // 2. Only invoke direct client RSS proxy fetches on explicit manual refresh (avoids blocking Googlebot initial render)
  if (force && allItems.length < 15) {
    try {
      const { fetchLiveNewsDirectFromRss } = await import("./liveNewsFetcher");
      const liveRssItems = await fetchLiveNewsDirectFromRss(8);
      for (const liveItem of liveRssItems) {
        const key = (liveItem.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!seen.has(key) && key.length > 5) {
          seen.add(key);
          if (!isValidCoverUrl(liveItem.cover_url)) {
            liveItem.cover_url = getSmartNewsCover(liveItem.title, liveItem.category);
          }
          allItems.push(liveItem as SyndicatedNewsItem);
        }
      }
    } catch (err) {
      console.warn("[NewsSyndication] Direct live RSS fetch fallback encountered:", err);
    }
  }

  // 3. Also merge any manual news publications from Firestore Cloud
  try {
    const cloudItems = await fetchCloudNews();
    if (cloudItems.length > 0) {
      for (const c of cloudItems) {
        const key = (c.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!allItems.some((it) => (it.title || "").toLowerCase().replace(/[^a-z0-9]/g, "") === key)) {
          allItems.unshift(c as SyndicatedNewsItem);
        }
      }
    }
  } catch (err) {
    // Ignore if offline
  }

  if (allItems.length > 0) {
    // Sort most recent first
    allItems.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    setCachedNews(allItems);
    return allItems;
  }

  // 4. Ultimate fallback: static archive
  try {
    const local = await getLocalArchiveArticles();
    if (Array.isArray(local) && local.length > 0) {
      const fallbackFeed = local.slice(0, 150).map((it) => expandNewsToDeepReport(it));
      setCachedNews(fallbackFeed);
      return fallbackFeed;
    }
  } catch {}

  return cached;
} finally {
  inflightSyncPromise = null;
}
})();

return inflightSyncPromise;
}
