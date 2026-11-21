import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_SELECT, Content, ContentType, mapEditorialBookToContent } from "./useContents";
import { filterExcludedItems } from "@/lib/excludedItems";

export type SortKey = "recent" | "popular" | "rating" | "price-low" | "price-high";

export interface ContentFilters {
  type?: ContentType | "all";
  sort?: SortKey;
  category?: string;
  tags?: string[];
  language?: string;
  format?: string;
  minRating?: number;
  year?: number;
  maxPriceCents?: number;
  maxReadTime?: number;
  free?: boolean;
  q?: string;
}

export const PAGE_SIZE = 12;

type Cursor = { value: string | number; id: string } | null;

const SORT_COLUMN: Record<SortKey, { column: string; ascending: boolean }> = {
  recent: { column: "created_at", ascending: false },
  popular: { column: "views", ascending: false },
  rating: { column: "rating", ascending: false },
  "price-low": { column: "price_cents", ascending: true },
  "price-high": { column: "price_cents", ascending: false },
};

/** Keeps supabase-js from parsing the select string at the type level. */
const sel = (s: string): string => s;

const cursorOf = (row: Content, sort: SortKey): Cursor => {
  const { column } = SORT_COLUMN[sort];
  const value = (row as unknown as Record<string, string | number>)[column];
  return { value, id: row.id };
};

/**
 * Cursor-based (keyset) infinite feed — no OFFSET, backed by the composite
 * indexes on (published, <sort column>, id).
 */
export const useContentFeed = (filters: ContentFilters) => {
  const sort: SortKey = filters.sort ?? "recent";

  return useInfiniteQuery({
    queryKey: ["content-feed", filters],
    initialPageParam: null as Cursor,
    queryFn: async ({ pageParam }) => {
      const { column, ascending } = SORT_COLUMN[sort];

      let cloudPage1Items: Content[] = [];
      if (!pageParam && (!filters.type || filters.type === "all" || filters.type === "book")) {
        try {
          const [{ fetchCloudBooks }, editorialMod] = await Promise.all([
            import("@/lib/cloudEditorialService"),
            import("@/lib/editorialStore"),
          ]);
          const cloudBooks = await fetchCloudBooks().catch(() => []);
          if (cloudBooks.length > 0) {
            editorialMod.mergeCloudBooksIntoStore(cloudBooks, true);
          }
          const deletedSet = new Set(editorialMod.getDeletedBookIds());
          const overrides = editorialMod.getBookOverrides();
          const searchQ = (filters.q || "").trim().toLowerCase();

          const byId = new Map<string, any>();
          for (const cb of [...cloudBooks, ...editorialMod.getCustomBooks()]) {
            if (!cb || !cb.id || deletedSet.has(cb.id)) continue;
            const merged = overrides[cb.id] ? { ...(byId.get(cb.id) || {}), ...cb, ...overrides[cb.id] } : cb;
            if (merged.published !== false) byId.set(cb.id, merged);
          }

          cloudPage1Items = Array.from(byId.values())
            .map((b) => mapEditorialBookToContent(b))
            .filter((item) => {
              if (filters.type === "book" && item.type !== "book") return false;
              if (filters.category && filters.category !== "all" && item.category !== filters.category) return false;
              if (filters.language && filters.language !== "all" && item.language !== filters.language) return false;
              if (filters.format && filters.format !== "all" && !item.formats.includes(filters.format)) return false;
              if (filters.free && item.price_cents > 0) return false;
              if (typeof filters.maxPriceCents === "number" && item.price_cents > filters.maxPriceCents) return false;
              if (searchQ) {
                const hay = `${item.title} ${item.author} ${item.description} ${item.category}`.toLowerCase();
                if (!hay.includes(searchQ)) return false;
              }
              return true;
            });
        } catch {}
      }

      let dbItems: Content[] = [];
      try {
        let q = supabase.from("contents").select(sel(CONTENT_SELECT)).eq("published", true);

        if (filters.type && filters.type !== "all") q = q.eq("type", filters.type);
        if (filters.category && filters.category !== "all") q = q.eq("category", filters.category);
        if (filters.language && filters.language !== "all") q = q.eq("language", filters.language);
        if (filters.tags?.length) q = q.overlaps("tags", filters.tags);
        if (filters.format && filters.format !== "all") q = q.contains("formats", [filters.format]);
        if (typeof filters.minRating === "number" && filters.minRating > 0) q = q.gte("rating", filters.minRating);
        if (filters.year) q = q.eq("year", filters.year);
        if (typeof filters.maxPriceCents === "number") q = q.lte("price_cents", filters.maxPriceCents);
        if (filters.free) q = q.eq("price_cents", 0);
        if (typeof filters.maxReadTime === "number") q = q.lte("read_time", filters.maxReadTime);
        if (filters.q?.trim()) {
          const term = filters.q.trim().replace(/[,()]/g, " ");
          q = q.or(`title.ilike.%${term}%,author.ilike.%${term}%,description.ilike.%${term}%`);
        }

        if (pageParam) {
          const op = ascending ? "gt" : "lt";
          const v = typeof pageParam.value === "string" ? pageParam.value : String(pageParam.value);
          q = q.or(`${column}.${op}.${v},and(${column}.eq.${v},id.${op}.${pageParam.id})`);
        }

        q = q
          .order(column, { ascending })
          .order("id", { ascending })
          .limit(PAGE_SIZE);

        const { data, error } = await q.returns<Content[]>();
        if (!error && data) {
          dbItems = filterExcludedItems(data ?? []);
        }
      } catch {}

      const seenIds = new Set<string>();
      const items: Content[] = [];
      for (const it of [...cloudPage1Items, ...dbItems]) {
        if (!it || !it.id || seenIds.has(it.id)) continue;
        seenIds.add(it.id);
        items.push(it);
      }

      return {
        items: filterExcludedItems(items),
        nextCursor: dbItems.length === PAGE_SIZE ? cursorOf(dbItems[dbItems.length - 1], sort) : null,
      };
    },
    getNextPageParam: (last) => last.nextCursor,
  });
};
