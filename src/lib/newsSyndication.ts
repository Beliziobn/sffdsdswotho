import { NewsItem, FALLBACK_NEWS } from "./news";
import { expandNewsToDeepReport } from "./newsExpander";
import { fetchLiveNewsFromAllChannels } from "./liveNewsFetcher";
import { persistSyndicatedNewsBatchToCloud } from "./cloudEditorialService";
import { saveArticlesToPermanentDb } from "./newsDatabase";

export interface SyndicatedNewsItem extends NewsItem {
  source_name: string;
  source_url?: string;
  read_time: number;
  is_syndicated?: boolean;
  key_takeaways?: string[];
  word_count?: number;
}

const STORAGE_KEY = "worscoi_syndicated_news_v17";
const PERMANENT_VAULT_KEY = "worscoi_permanent_news_vault_v2";
const LAST_SYNC_KEY = "worscoi_news_last_sync_v17";

let legacyCacheCleared = false;
let memoryCachedNews: SyndicatedNewsItem[] | null = null;
let memoryVaultCache: SyndicatedNewsItem[] | null = null;

function clearLegacyCache() {
  if (legacyCacheCleared) return;
  legacyCacheCleared = true;
  try {
    for (let i = 1; i <= 16; i++) {
      localStorage.removeItem(`worscoi_syndicated_news_v${i}`);
      localStorage.removeItem(`worscoi_news_last_sync_v${i}`);
    }
    localStorage.removeItem("worscoi_permanent_news_vault_v1");
  } catch {}
}

function readPermanentClientVault(): SyndicatedNewsItem[] {
  if (memoryVaultCache) return memoryVaultCache;
  try {
    const raw = localStorage.getItem(PERMANENT_VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryVaultCache = parsed;
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function upsertPermanentClientVault(items: SyndicatedNewsItem[]): SyndicatedNewsItem[] {
  try {
    void saveArticlesToPermanentDb(items, true);
    const existing = readPermanentClientVault();
    const map = new Map<string, SyndicatedNewsItem>();

    for (const item of existing) {
      const key = (item.slug || item.id || "").toLowerCase().trim();
      if (key) map.set(key, item);
    }

    for (const item of items) {
      const key = (item.slug || item.id || "").toLowerCase().trim();
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, item);
      } else {
        const prev = map.get(key)!;
        const hasBetterContent = (item.content || "").length > (prev.content || "").length;
        const hasBetterCover =
          item.cover_url &&
          !item.cover_url.includes("images.unsplash.com") &&
          (!prev.cover_url || prev.cover_url.includes("images.unsplash.com"));
        if (hasBetterContent || hasBetterCover) {
          map.set(key, {
            ...prev,
            ...item,
            content: hasBetterContent ? item.content : prev.content,
            cover_url: hasBetterCover ? item.cover_url : prev.cover_url || item.cover_url,
          });
        }
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    const capped = merged.slice(0, 150);
    memoryVaultCache = capped;
    memoryCachedNews = capped;
    localStorage.setItem(PERMANENT_VAULT_KEY, JSON.stringify(capped));
    return capped;
  } catch {
    return items;
  }
}

export function getCachedNews(): SyndicatedNewsItem[] {
  if (memoryCachedNews && memoryCachedNews.length > 0) {
    return memoryCachedNews;
  }

  clearLegacyCache();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const vault = readPermanentClientVault();
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length >= 10) {
        const best = vault.length > parsed.length ? vault : parsed;
        memoryCachedNews = best;
        return best;
      }
    }
    if (vault.length >= 10) {
      memoryCachedNews = vault;
      return vault;
    }
  } catch (err) {
    console.warn("Erro ao carregar cache de notícias:", err);
  }

  const baselineFallbacks: SyndicatedNewsItem[] = FALLBACK_NEWS.map((item) => ({
    ...(item as any),
    created_at: item.published_at,
    author: item.source_name || item.author || "Redação Worscoi",
    source_name: item.source_name || item.author || "Redação Worscoi",
    source_url: item.source_url,
    read_time: item.read_time || 5,
    is_syndicated: true,
  }));
  memoryCachedNews = baselineFallbacks;
  return baselineFallbacks;
}

export async function getSyndicatedNews(): Promise<SyndicatedNewsItem[]> {
  return getCachedNews();
}

export async function syncAutomatedNews(force = false): Promise<SyndicatedNewsItem[]> {
  const now = Date.now();
  const lastSync = Number(localStorage.getItem(LAST_SYNC_KEY) || "0");
  const currentNews = getCachedNews();

  if (!force && now - lastSync < 10 * 60 * 1000 && currentNews.length > 20) {
    return currentNews;
  }

  try {
    const liveArticles = await fetchLiveNewsFromAllChannels();
    if (liveArticles.length > 0) {
      const combinedMap = new Map<string, SyndicatedNewsItem>();

      for (const item of liveArticles) {
        const key = (item.slug || item.id).toLowerCase();
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      }

      // Preserve all previously stored articles in the permanent vault so nothing ever disappears
      for (const oldItem of readPermanentClientVault()) {
        const key = (oldItem.slug || oldItem.id).toLowerCase();
        if (!combinedMap.has(key)) {
          combinedMap.set(key, oldItem);
        }
      }

      for (const item of FALLBACK_NEWS) {
        const enriched: SyndicatedNewsItem = {
          ...expandNewsToDeepReport(item as any),
          created_at: item.published_at,
          author: item.source_name || item.author || "Redação Worscoi",
          source_url: item.source_url,
          is_syndicated: true,
        };
        const key = (enriched.slug || enriched.id).toLowerCase();
        if (!combinedMap.has(key)) {
          combinedMap.set(key, enriched);
        }
      }

      const merged = upsertPermanentClientVault(Array.from(combinedMap.values()));

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 350)));
        localStorage.setItem(LAST_SYNC_KEY, String(now));
      } catch {
        // Ignore quota exceeded
      }

      void persistSyndicatedNewsBatchToCloud(liveArticles as any);
      return merged;
    }
  } catch (err) {
    console.warn("Falha ao sincronizar feeds ao vivo:", err);
  }

  return currentNews;
}

export async function syncDailyNews(force = false): Promise<SyndicatedNewsItem[]> {
  return syncAutomatedNews(force);
}

export async function fetchTopicRssNews(topic: string, limit = 50): Promise<SyndicatedNewsItem[]> {
  try {
    const res = await fetch(`/api/news/feed?topic=${encodeURIComponent(topic)}&limit=${limit}`);
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) return [];
    const data = await res.json();
    if (Array.isArray(data.items) && data.items.length > 0) {
      const items: SyndicatedNewsItem[] = data.items.map((it: any) => ({
        ...expandNewsToDeepReport(it),
        created_at: it.published_at,
        author: it.source_name || it.author || "Redação Worscoi",
        source_url: it.source_url,
        is_syndicated: true,
      }));
      upsertPermanentClientVault(items);
      void persistSyndicatedNewsBatchToCloud(items as any);
      return items;
    }
  } catch (err) {
    console.warn(`Erro ao buscar feed RSS ao vivo para ${topic}:`, err);
  }
  return [];
}

export function deleteSyndicatedArticle(idOrSlug: string): SyndicatedNewsItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: SyndicatedNewsItem[] = JSON.parse(stored);
    const filtered = parsed.filter((n) => n.id !== idOrSlug && n.slug !== idOrSlug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

export function saveEditorialNewsItem(item: Partial<SyndicatedNewsItem> & { title: string; content: string }): SyndicatedNewsItem {
  const slug =
    item.slug ||
    item.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const newItem: SyndicatedNewsItem = {
    id: item.id || `ed-${Date.now()}`,
    title: item.title,
    slug,
    excerpt: item.excerpt || item.content.slice(0, 180) + "...",
    content: item.content,
    cover_url:
      item.cover_url ||
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80",
    category: item.category || "Animes",
    published: item.published ?? true,
    published_at: item.published_at || new Date().toISOString(),
    created_at: item.created_at || new Date().toISOString(),
    author: item.author || "Editoria Worscoi",
    source_name: item.source_name || "Redação Oficial Worscoi",
    read_time: item.read_time || Math.max(1, Math.round(item.content.split(/\s+/).length / 180)),
    is_syndicated: false,
  };

  try {
    upsertPermanentClientVault([newItem]);
    const stored = localStorage.getItem(STORAGE_KEY);
    const current: SyndicatedNewsItem[] = stored ? JSON.parse(stored) : [];
    const updated = [newItem, ...current.filter((n) => n.id !== newItem.id && n.slug !== newItem.slug)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return newItem;
}
