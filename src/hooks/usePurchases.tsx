import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { CONTENT_SELECT, Content } from "./useContents";

export type ContentPurchase = {
  id: string;
  content_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

/** All content purchases of the signed-in user. */
export const useContentPurchases = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["content-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("content_purchases")
          .select("id,content_id,amount_cents,currency,status,created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });
        if (!error && data) return (data ?? []) as ContentPurchase[];
      } catch {}
      return [] as ContentPurchase[];
    },
  });
};

/** Server-verified ownership check (purchase row with status = paid). */
export const useOwnsContent = (contentId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owns-content", user?.id, contentId],
    enabled: !!user && !!contentId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("content_purchases")
          .select("id")
          .eq("user_id", user!.id)
          .eq("content_id", contentId!)
          .eq("status", "paid")
          .maybeSingle();
        if (!error && data) return !!data;
      } catch {}
      return false;
    },
  });
};

/** Owned items, resolved to full content rows (for the library page). */
export const useOwnedContents = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owned-contents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("content_purchases")
          .select(`content_id, contents!inner(${CONTENT_SELECT})`)
          .eq("user_id", user!.id)
          .eq("status", "paid");
        if (!error && data) {
          return ((data ?? []) as unknown as Array<{ contents: Content }>).map((r) => r.contents);
        }
      } catch {}
      return [] as Content[];
    },
  });
};
