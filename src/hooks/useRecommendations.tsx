import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Content, ContentType } from "./useContents";
import { filterExcludedItems } from "@/lib/excludedItems";

type RecAction = "similar" | "for-you" | "continue-reading" | "because-you-read";

const fetchRecommendations = async (params: {
  action: RecAction;
  itemId?: string;
  limit?: number;
  type?: ContentType | "all";
}): Promise<Content[]> => {
  const search = new URLSearchParams({ action: params.action });
  if (params.itemId) search.set("itemId", params.itemId);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.type && params.type !== "all") search.set("type", params.type);

  try {
    const { data, error } = await supabase.functions.invoke(`recommendations?${search.toString()}`, {
      method: "GET",
    });
    if (!error && data?.items && data.items.length > 0) {
      return filterExcludedItems(data.items as Content[]);
    }
  } catch (err) {
    // Edge function unavailable; graceful fallback below
  }

  try {
    const { MODERN_BOOKS } = await import("@/lib/modernBooks");
    const count = params.limit ?? 4;
    return MODERN_BOOKS.slice(0, count).map((b, idx) => ({
      id: b.id,
      type: "book" as ContentType,
      title: b.title,
      subtitle: b.subtitle,
      description: b.description,
      author: b.author,
      tags: ["Recomendado", b.category],
      category: b.category,
      slug: b.id,
      cover: b.cover_url,
      rating: b.rating,
      rating_count: b.rating_count,
      formats: b.formats,
      language: "pt",
      year: b.year,
      size: "Guia Completo",
      views: b.downloads * 2,
      read_time: b.read_time,
      episode_count: b.chapters.length,
      price_cents: b.price_cents,
      currency: b.currency,
      published: true,
      featured: true,
      collection: "Recomendações",
      created_at: b.created_at,
      similarity: Math.round((0.95 - idx * 0.04) * 100) / 100,
      reason: "Baseado nas leituras em alta e catálogo em destaque",
    }));
  } catch {
    return [];
  }
};

/** GET /api/recommendations/similar/:itemId */
export const useSimilar = (itemId?: string, limit = 8, type?: ContentType | "all") =>
  useQuery({
    queryKey: ["recommendations", "similar", itemId, limit, type],
    enabled: !!itemId,
    queryFn: () => fetchRecommendations({ action: "similar", itemId, limit, type }),
  });

/** GET /api/recommendations/because-you-read/:itemId */
export const useBecauseYouRead = (itemId?: string, limit = 8) =>
  useQuery({
    queryKey: ["recommendations", "because-you-read", itemId, limit],
    enabled: !!itemId,
    queryFn: () => fetchRecommendations({ action: "because-you-read", itemId, limit }),
  });

/** GET /api/recommendations/for-you */
export const useForYou = (limit = 8, type: ContentType | "all" = "all") =>
  useQuery({
    queryKey: ["recommendations", "for-you", limit, type],
    queryFn: () => fetchRecommendations({ action: "for-you", limit, type }),
  });

/** GET /api/recommendations/continue-reading */
export const useContinueReading = (limit = 8) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recommendations", "continue-reading", user?.id, limit],
    enabled: !!user,
    queryFn: () => fetchRecommendations({ action: "continue-reading", limit }),
  });
};
