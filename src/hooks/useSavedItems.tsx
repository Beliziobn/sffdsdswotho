import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { CONTENT_SELECT, Content } from "./useContents";
import { useLibraryStore } from "@/store/useLibraryStore";

/** Loads the user's saved items into the Zustand store. */
export const useSavedItems = () => {
  const { user } = useAuth();
  const hydrateSaved = useLibraryStore((s) => s.hydrateSaved);
  const reset = useLibraryStore((s) => s.reset);

  const query = useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("user_saved")
          .select(`content_id, created_at, contents!inner(${CONTENT_SELECT})`)
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });
        if (!error && data) {
          return ((data ?? []) as unknown as Array<{ contents: Content }>).map((r) => r.contents);
        }
      } catch {}
      return [] as Content[];
    },
  });

  useEffect(() => {
    if (!user) reset();
    else if (query.data) hydrateSaved(query.data);
  }, [user, query.data, hydrateSaved, reset]);

  return query;
};

/** Optimistic save/unsave with rollback on failure. */
export const useToggleSave = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toggleSaveOptimistic = useLibraryStore((s) => s.toggleSaveOptimistic);

  return async (item: Content) => {
    if (!user) {
      toast.error("Entre na sua conta para salvar itens");
      return;
    }
    const wasSaved = !!useLibraryStore.getState().savedIds[item.id];
    const rollback = toggleSaveOptimistic(item);

    try {
      if (wasSaved) {
        const { error } = await supabase
          .from("user_saved")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_saved")
          .upsert({ user_id: user.id, content_id: item.id }, { onConflict: "user_id,content_id" });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["saved", user.id] });
    } catch (err) {
      rollback();
      toast.error(wasSaved ? "Não foi possível remover" : "Não foi possível salvar");
      console.error("toggleSave failed", err);
    }
  };
};
