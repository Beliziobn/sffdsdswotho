import { create } from "zustand";
import type { Content } from "@/hooks/useContents";

export interface LibraryState {
  /** Items the user saved, most recent first. */
  savedItems: Content[];
  /** Fast lookup set of saved content ids. */
  savedIds: Record<string, true>;
  /** contentId -> progress percentage (0-100). */
  progressMap: Record<string, number>;
  /** Items with progress, ordered by last read. */
  continueReading: Content[];

  hydrateSaved: (items: Content[]) => void;
  hydrateProgress: (entries: Array<{ content_id: string; progress_percentage: number }>) => void;
  setContinueReading: (items: Content[]) => void;

  /** Optimistically flips the saved state. Returns a rollback function. */
  toggleSaveOptimistic: (item: Content) => () => void;
  /** Optimistically writes progress. Returns the previous value for rollback. */
  updateProgressOptimistic: (contentId: string, percentage: number) => number | undefined;
  rollbackProgress: (contentId: string, previous: number | undefined) => void;

  reset: () => void;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const useLibraryStore = create<LibraryState>((set, get) => ({
  savedItems: [],
  savedIds: {},
  progressMap: {},
  continueReading: [],

  hydrateSaved: (items) =>
    set({
      savedItems: items,
      savedIds: items.reduce<Record<string, true>>((acc, i) => {
        acc[i.id] = true;
        return acc;
      }, {}),
    }),

  hydrateProgress: (entries) =>
    set((state) => ({
      progressMap: entries.reduce<Record<string, number>>(
        (acc, e) => {
          acc[e.content_id] = clamp(e.progress_percentage);
          return acc;
        },
        { ...state.progressMap },
      ),
    })),

  setContinueReading: (items) => set({ continueReading: items }),

  toggleSaveOptimistic: (item) => {
    const previousItems = get().savedItems;
    const previousIds = get().savedIds;
    const isSaved = !!previousIds[item.id];

    if (isSaved) {
      const nextIds = { ...previousIds };
      delete nextIds[item.id];
      set({ savedItems: previousItems.filter((i) => i.id !== item.id), savedIds: nextIds });
    } else {
      set({ savedItems: [item, ...previousItems], savedIds: { ...previousIds, [item.id]: true } });
    }

    return () => set({ savedItems: previousItems, savedIds: previousIds });
  },

  updateProgressOptimistic: (contentId, percentage) => {
    const previous = get().progressMap[contentId];
    set((state) => ({ progressMap: { ...state.progressMap, [contentId]: clamp(percentage) } }));
    return previous;
  },

  rollbackProgress: (contentId, previous) =>
    set((state) => {
      const next = { ...state.progressMap };
      if (previous === undefined) delete next[contentId];
      else next[contentId] = previous;
      return { progressMap: next };
    }),

  reset: () => set({ savedItems: [], savedIds: {}, progressMap: {}, continueReading: [] }),
}));
