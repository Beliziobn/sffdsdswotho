import { useCallback, useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import pRetry, { AbortError } from "p-retry";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useLibraryStore } from "@/store/useLibraryStore";

const DEBOUNCE_MS = 1500;

/**
 * Resilient reading-progress writer.
 * - debounced (1500ms) so scrolling doesn't hammer the API
 * - AbortController cancels in-flight writes when a newer one starts
 * - exponential backoff + jitter through p-retry
 * - optimistic store update with rollback on a real failure (never on abort)
 */
export const useDebouncedProgress = (contentId?: string, episodeId?: string | null) => {
  const { user } = useAuth();
  const controllerRef = useRef<AbortController | null>(null);
  const updateProgressOptimistic = useLibraryStore((s) => s.updateProgressOptimistic);
  const rollbackProgress = useLibraryStore((s) => s.rollbackProgress);

  const persist = useCallback(
    async (percentage: number) => {
      if (!user || !contentId) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const previous = updateProgressOptimistic(contentId, percentage);

      try {
        await pRetry(
          async () => {
            const { error } = await supabase
              .from("user_progress")
              .upsert(
                {
                  user_id: user.id,
                  content_id: contentId,
                  episode_id: episodeId ?? null,
                  progress_percentage: Math.max(0, Math.min(100, Math.round(percentage))),
                  last_read_at: new Date().toISOString(),
                },
                { onConflict: "user_id,content_id" },
              )
              .abortSignal(controller.signal);

            if (error) {
              // A cancelled request must not be retried nor rolled back.
              if (controller.signal.aborted) throw new AbortError(error.message);
              throw new Error(error.message);
            }
          },
          { retries: 3, factor: 2, minTimeout: 400, maxTimeout: 4000, randomize: true },
        );
      } catch (err) {
        if (controller.signal.aborted) return; // superseded by a newer write
        rollbackProgress(contentId, previous);
        toast.error("Não foi possível guardar o seu progresso");
        console.error("progress persist failed", err);
      }
    },
    [user, contentId, episodeId, updateProgressOptimistic, rollbackProgress],
  );

  const debounced = useMemo(() => debounce(persist, DEBOUNCE_MS, { maxWait: 8000 }), [persist]);

  useEffect(
    () => () => {
      debounced.cancel();
      controllerRef.current?.abort();
    },
    [debounced],
  );

  /** Immediately flushes any pending write (e.g. when leaving the reader). */
  const flush = useCallback(() => debounced.flush(), [debounced]);

  return { saveProgress: debounced, flush };
};
