import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NewsItem } from "./useCatalog";
import {
  syncDailyNews,
  getCachedNews,
  fetchTopicRssNews,
  upsertPermanentClientVault,
} from "@/lib/newsSyndication";
import { queryNewsArchive } from "@/lib/newsArchiveEngine";
import { applyNewsEditorialOverrides, mergeCloudNewsIntoStore } from "@/lib/editorialStore";
import { filterExcludedItems } from "@/lib/excludedItems";
import { fetchCloudNews, persistSyndicatedNewsBatchToCloud } from "@/lib/cloudEditorialService";
import { FALLBACK_NEWS } from "@/lib/news";

const PAGE_SIZE = 16;

export interface NewsFilters {
  category?: string;
  q?: string;
  order?: "recent" | "oldest";
  year?: string;
  month?: string;
}

function isAuthenticPublisherCover(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    (url.startsWith("http") || url.startsWith("data:") || url.startsWith("/covers/")) &&
    !url.includes("images.unsplash.com") &&
    !url.includes("placeholder.svg")
  );
}

/** Infinite news feed combining real-time syndicated RSS, Cloud Firestore DB, Supabase DB and Permanent Historical Archive */
export const useNewsFeed = (filters: NewsFilters) =>
  useInfiniteQuery({
    queryKey: ["news-feed", filters],
    initialPageParam: 0 as number,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam = 0 }) => {
      // 1. Read cached syndicated news immediately and fetch fresh if needed
      let syndicated: NewsItem[] = [];
      try {
        syndicated = getCachedNews() as unknown as NewsItem[];
        if (syndicated.length <= 20) {
          syndicated = (await syncDailyNews()) as unknown as NewsItem[];
        }
      } catch {
        syndicated = [];
      }

      // 1b. If a specific category is selected, also fetch live RSS for that topic
      let topicLive: NewsItem[] = [];
      if (filters.category && filters.category !== "all" && pageParam === 0) {
        try {
          const normTopic = filters.category
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          topicLive = (await fetchTopicRssNews(normTopic, 40)) as unknown as NewsItem[];
        } catch {}
      }

      // 2. Fetch from Permanent Archive Engine
      let archiveItems: NewsItem[] = [];
      try {
        const res = await queryNewsArchive({
          category: filters.category && filters.category !== "all" ? filters.category : undefined,
          q: filters.q,
          year: filters.year && filters.year !== "all" ? parseInt(filters.year) : undefined,
          month: filters.month && filters.month !== "all" ? parseInt(filters.month) : undefined,
          pageSize: 800,
        });
        archiveItems = res.items as unknown as NewsItem[];
      } catch {
        // Fallback gracefully
      }

      // 3. Fetch Supabase news
      let dbNews: NewsItem[] = [];
      try {
        const { data, error } = await supabase
          .from("news")
          .select("id,title,slug,excerpt,content,cover_url,category,published,published_at,created_at")
          .eq("published", true);
        if (!error && data) {
          dbNews = filterExcludedItems(data as NewsItem[]);
        }
      } catch {
        // Fallback gracefully
      }

      // 3b. Fetch Firestore Cloud news (permanent database storage)
      let cloudNews: NewsItem[] = [];
      try {
        cloudNews = await fetchCloudNews();
        if (cloudNews.length > 0) {
          mergeCloudNewsIntoStore(cloudNews);
        }
      } catch {}

      // 4. Merge & Deduplicate (preserving the version with authentic cover & fullest original content)
      const byKey = new Map<string, NewsItem>();

      const combinedSourceList = [
        ...topicLive,
        ...syndicated,
        ...cloudNews,
        ...archiveItems,
        ...(FALLBACK_NEWS as unknown as NewsItem[]),
        ...dbNews,
      ];

      for (const rawItem of combinedSourceList) {
        if (!rawItem || !(rawItem.title || "").trim()) continue;
        const key = (rawItem.slug || rawItem.title || "").toLowerCase().trim();
        if (!key) continue;

        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, rawItem);
        } else {
          const newHasRealCover = isAuthenticPublisherCover(rawItem.cover_url);
          const oldHasRealCover = isAuthenticPublisherCover(existing.cover_url);
          const newLen = (rawItem.content || "").length;
          const oldLen = (existing.content || "").length;

          byKey.set(key, {
            ...existing,
            ...rawItem,
            cover_url: newHasRealCover
              ? rawItem.cover_url
              : oldHasRealCover
              ? existing.cover_url
              : rawItem.cover_url || existing.cover_url,
            content: newLen >= oldLen ? rawItem.content : existing.content,
            excerpt:
              (rawItem.excerpt || "").length >= (existing.excerpt || "").length
                ? rawItem.excerpt
                : existing.excerpt,
            source_url: (rawItem as any).source_url || (existing as any).source_url,
            source_name:
              (rawItem as any).source_name ||
              (existing as any).source_name ||
              (rawItem as any).author ||
              (existing as any).author,
            author:
              (rawItem as any).author ||
              (existing as any).author ||
              (rawItem as any).source_name ||
              (existing as any).source_name,
          });
        }
      }

      let all: NewsItem[] = Array.from(byKey.values());

      // Persist newly discovered items into permanent client vault and Cloud Firestore DB
      if (pageParam === 0 && (topicLive.length > 0 || syndicated.length > 0)) {
        try {
          upsertPermanentClientVault(all.slice(0, 120) as any);
          void persistSyndicatedNewsBatchToCloud(all.slice(0, 25));
        } catch {}
      }

      // 4b. Apply Editorial Studio overrides & custom publications
      all = filterExcludedItems(applyNewsEditorialOverrides(all));

      // 5. Apply Category Filter
      if (filters.category && filters.category !== "all") {
        const cat = filters.category.toLowerCase();
        all = all.filter((i) => {
          const itemCat = (i.category || "").toLowerCase();
          if (cat === "geopolítica" || cat === "geopolitica") {
            return (
              itemCat === "geopolítica" ||
              itemCat === "geopolitica" ||
              itemCat === "política" ||
              itemCat === "politica"
            );
          }
          if (cat === "política" || cat === "politica") {
            return (
              itemCat === "política" ||
              itemCat === "politica" ||
              itemCat === "geopolítica" ||
              itemCat === "geopolitica"
            );
          }
          return itemCat === cat;
        });
      }

      // 6. Apply Search Query Filter
      if (filters.q?.trim()) {
        const term = filters.q.trim().toLowerCase();
        all = all.filter(
          (i: any) =>
            i.title?.toLowerCase().includes(term) ||
            i.excerpt?.toLowerCase().includes(term) ||
            i.content?.toLowerCase().includes(term) ||
            i.category?.toLowerCase().includes(term) ||
            i.author?.toLowerCase().includes(term) ||
            i.source_name?.toLowerCase().includes(term)
        );
      }

      // 7. Apply Historical Year & Month Filters
      if (filters.year && filters.year !== "all") {
        all = all.filter((i) => {
          const d = new Date(i.published_at);
          return !isNaN(d.getTime()) && String(d.getFullYear()) === filters.year;
        });
      }
      if (filters.month && filters.month !== "all") {
        all = all.filter((i) => {
          const d = new Date(i.published_at);
          return !isNaN(d.getTime()) && String(d.getMonth() + 1).padStart(2, "0") === filters.month;
        });
      }

      // 8. Sort deterministically (prioritizing recent items with authentic covers and full content)
      const ascending = filters.order === "oldest";
      all.sort((a, b) => {
        const diff = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        if (diff !== 0) return ascending ? -diff : diff;
        return (a.id || "").localeCompare(b.id || "");
      });

      // 9. Paginate
      const start = pageParam * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageItems = all.slice(start, end);
      const hasNext = end < all.length;

      return {
        items: pageItems,
        nextPage: hasNext ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (last) => last.nextPage,
  });
