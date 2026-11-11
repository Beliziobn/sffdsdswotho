import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_SELECT, Content, ContentType } from "./useContents";
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
      if (error) throw error;
      const items = filterExcludedItems(data ?? []);
      return {
        items,
        nextCursor: items.length === PAGE_SIZE ? cursorOf(items[items.length - 1], sort) : null,
      };
    },
    getNextPageParam: (last) => last.nextCursor,
  });
};
