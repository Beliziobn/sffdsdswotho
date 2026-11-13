import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, ensureFirestoreOnline } from "./firebase";
import { handleFirestoreError, OperationType } from "./firebaseErrors";
import {
  CINEMA_CATALOG,
  getCinemaById,
  getCinemaProgressMap,
  getCinemaWatchlist,
  getCinemaLanguagePreference,
  setCinemaLanguagePreference,
} from "./cinema";
import {
  ANIMES_DATA,
  getAnimeWatchlist,
  getMangaProgress,
} from "./animes";
import { BASE_CURATED_WEBTOONS } from "./webtoons";
import type { Book } from "@/hooks/useCatalog";
import type { UserReview } from "./reviewsStore";

export type HistoryMediaType = "book" | "cinema" | "anime" | "manga" | "webtoon" | "news";

export interface UserHistoryEntry {
  id: string;
  userId: string;
  itemId: string;
  type: HistoryMediaType;
  title: string;
  subtitle?: string;
  cover?: string;
  href: string;
  progressPercent?: number;
  detailLabel?: string;
  timestamp: string;
}

export interface UserProfileData {
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  preferredLanguage: "pt" | "en";
  preferredReaderTheme: "light" | "sepia" | "dark" | "oled";
  favoriteGenres: string;
  updatedAt: string;
}

export interface SavedCatalogEntry {
  id: string;
  itemId: string;
  type: "cinema" | "anime" | "book" | "webtoon";
  title: string;
  subtitle: string;
  cover: string;
  href: string;
  badge: string;
}

const PROFILE_STORAGE_KEY = "worscoi_user_profile_v1";
const HISTORY_STORAGE_KEY = "worscoi_user_history_v1";
const REVIEWS_STORAGE_KEY = "worscoi_community_reviews_v1";
const USER_ADORES_MAP_KEY = "worscoi_user_adores_map_v1";

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota
  }
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_\-.]/g, "-").slice(0, 120) || "entry";
}

// ============================================================================
// 1. USER PROFILE PREFERENCES & METADATA
// ============================================================================

export function getLocalUserProfile(authUser?: {
  id?: string;
  email?: string;
  user_metadata?: { display_name?: string; avatar_url?: string; role?: string };
} | null): UserProfileData {
  const stored = safeReadJson<Partial<UserProfileData>>(PROFILE_STORAGE_KEY, {});
  const defaultName =
    authUser?.user_metadata?.display_name ||
    (authUser?.email ? authUser.email.split("@")[0] : "Leitor Wotho");
  const defaultBio =
    authUser?.user_metadata?.role === "Editor-Chefe & Administrador Mestre"
      ? "Editor-Chefe e curador literário, cinematográfico e cultural da Wotho."
      : "Explorador de livros clássicos, cinema em alta definição, animes, webtoons e grandes ideias na Wotho.";

  const preferredLang =
    stored.preferredLanguage || getCinemaLanguagePreference() || "pt";
  const preferredTheme =
    stored.preferredReaderTheme ||
    ((typeof window !== "undefined"
      ? localStorage.getItem("worscoi_reader_theme")
      : "sepia") as "light" | "sepia" | "dark" | "oled") ||
    "sepia";

  return {
    userId: authUser?.id || stored.userId || "local-reader",
    displayName: (stored.displayName || defaultName).slice(0, 100),
    bio: (stored.bio || defaultBio).slice(0, 600),
    avatarUrl: (stored.avatarUrl || authUser?.user_metadata?.avatar_url || "").slice(0, 1000),
    preferredLanguage: preferredLang === "en" ? "en" : "pt",
    preferredReaderTheme: ["light", "sepia", "dark", "oled"].includes(preferredTheme)
      ? preferredTheme
      : "sepia",
    favoriteGenres: (stored.favoriteGenres || "Filosofia · Ficção Científica · Seinen · Cinema").slice(0, 500),
    updatedAt: stored.updatedAt || new Date().toISOString(),
  };
}

export async function saveUserProfile(
  patch: Partial<UserProfileData>,
  authUser?: { id?: string; email?: string; user_metadata?: { display_name?: string; avatar_url?: string } } | null
): Promise<UserProfileData> {
  const current = getLocalUserProfile(authUser);
  const next: UserProfileData = {
    userId: (authUser?.id || current.userId || "local-reader").slice(0, 128),
    displayName: (patch.displayName ?? current.displayName ?? "Leitor Wotho").trim().slice(0, 100) || "Leitor Wotho",
    bio: (patch.bio ?? current.bio ?? "").trim().slice(0, 600),
    avatarUrl: (patch.avatarUrl ?? current.avatarUrl ?? "").trim().slice(0, 1000),
    preferredLanguage: patch.preferredLanguage ?? current.preferredLanguage ?? "pt",
    preferredReaderTheme: patch.preferredReaderTheme ?? current.preferredReaderTheme ?? "sepia",
    favoriteGenres: (patch.favoriteGenres ?? current.favoriteGenres ?? "").trim().slice(0, 500),
    updatedAt: new Date().toISOString(),
  };

  safeWriteJson(PROFILE_STORAGE_KEY, next);

  if (typeof window !== "undefined") {
    setCinemaLanguagePreference(next.preferredLanguage);
    localStorage.setItem("worscoi_reader_theme", next.preferredReaderTheme);
    window.dispatchEvent(new Event("worscoi_profile_updated"));
  }

  // Sync to Firestore if user is authenticated with Firebase Auth
  const fbUser = auth.currentUser;
  if (fbUser && !fbUser.isAnonymous) {
    const uid = sanitizeId(fbUser.uid);
    const path = `user_profiles/${uid}`;
    const payload = {
      userId: uid,
      displayName: next.displayName,
      bio: next.bio,
      avatarUrl: next.avatarUrl,
      preferredLanguage: next.preferredLanguage,
      preferredReaderTheme: next.preferredReaderTheme,
      favoriteGenres: next.favoriteGenres,
      updatedAt: next.updatedAt,
    };
    try {
      const online = await ensureFirestoreOnline();
      if (online) {
        await setDoc(doc(db, "user_profiles", uid), payload);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  }

  return next;
}

export async function syncProfileFromCloud(): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser || fbUser.isAnonymous) return;
  const uid = sanitizeId(fbUser.uid);
  const profilePath = `user_profiles/${uid}`;
  const online = await ensureFirestoreOnline();
  if (!online) return;
  try {
    const snap = await getDoc(doc(db, "user_profiles", uid));
    if (snap.exists()) {
      const data = snap.data() as Partial<UserProfileData>;
      const local = getLocalUserProfile({ id: uid, email: fbUser.email || undefined });
      const merged: UserProfileData = {
        ...local,
        ...data,
        userId: uid,
      };
      safeWriteJson(PROFILE_STORAGE_KEY, merged);
      window.dispatchEvent(new Event("worscoi_profile_updated"));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      handleFirestoreError(error, OperationType.GET, profilePath);
    }
  }

  const historyPath = `user_profiles/${uid}/history`;
  try {
    const q = query(collection(db, "user_profiles", uid, "history"), where("userId", "==", uid));
    const snaps = await getDocs(q);
    if (!snaps.empty) {
      const localEntries = safeReadJson<UserHistoryEntry[]>(HISTORY_STORAGE_KEY, []);
      const byId = new Map<string, UserHistoryEntry>();
      for (const e of localEntries) byId.set(e.id, e);
      snaps.forEach((docSnap) => {
        const d = docSnap.data() as UserHistoryEntry;
        const existing = byId.get(d.id);
        if (!existing || new Date(d.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
          byId.set(d.id, d);
        }
      });
      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      safeWriteJson(HISTORY_STORAGE_KEY, merged.slice(0, 120));
      window.dispatchEvent(new Event("worscoi_history_updated"));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      handleFirestoreError(error, OperationType.LIST, historyPath);
    }
  }

  try {
    const { syncDownloadsFromCloud } = await import("./downloadsStore");
    await syncDownloadsFromCloud();
  } catch {
    // Non-fatal
  }
}

// ============================================================================
// 2. UNIFIED ACTIVITY & HISTORY ENGINE
// ============================================================================

export function recordUserHistory(input: {
  itemId: string;
  type: HistoryMediaType;
  title: string;
  subtitle?: string;
  cover?: string;
  href: string;
  progressPercent?: number;
  detailLabel?: string;
}): UserHistoryEntry {
  const entryId = sanitizeId(`${input.type}-${input.itemId}`);
  const fbUser = auth.currentUser;
  const uid = fbUser && !fbUser.isAnonymous ? sanitizeId(fbUser.uid) : "local-reader";

  const entry: UserHistoryEntry = {
    id: entryId,
    userId: uid,
    itemId: String(input.itemId).slice(0, 128),
    type: input.type,
    title: (input.title || "Obra Wotho").slice(0, 300),
    subtitle: (input.subtitle || "").slice(0, 300),
    cover: (input.cover || "").slice(0, 1000),
    href: (input.href || "/").slice(0, 500),
    progressPercent:
      typeof input.progressPercent === "number"
        ? Math.max(0, Math.min(100, Math.round(input.progressPercent)))
        : undefined,
    detailLabel: (input.detailLabel || "").slice(0, 200),
    timestamp: new Date().toISOString(),
  };

  const list = safeReadJson<UserHistoryEntry[]>(HISTORY_STORAGE_KEY, []);
  const filtered = list.filter((item) => item.id !== entryId);
  const updated = [entry, ...filtered].slice(0, 120);
  safeWriteJson(HISTORY_STORAGE_KEY, updated);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("worscoi_history_updated"));
  }

  if (fbUser && !fbUser.isAnonymous) {
    const path = `user_profiles/${uid}/history/${entryId}`;
    const firestorePayload: Record<string, unknown> = {
      id: entry.id,
      userId: uid,
      itemId: entry.itemId,
      type: entry.type,
      title: entry.title,
      href: entry.href,
      timestamp: entry.timestamp,
    };
    if (entry.subtitle) firestorePayload.subtitle = entry.subtitle;
    if (entry.cover) firestorePayload.cover = entry.cover;
    if (typeof entry.progressPercent === "number") firestorePayload.progressPercent = entry.progressPercent;
    if (entry.detailLabel) firestorePayload.detailLabel = entry.detailLabel;

    void ensureFirestoreOnline().then((online) => {
      if (!online) return;
      return setDoc(doc(db, "user_profiles", uid, "history", entryId), firestorePayload).catch((error) => {
        if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      });
    });
  }

  return entry;
}

export function getUnifiedUserHistory(booksCatalog: Book[] = []): UserHistoryEntry[] {
  if (typeof window === "undefined") return [];

  const explicitList = safeReadJson<UserHistoryEntry[]>(HISTORY_STORAGE_KEY, []);
  const byId = new Map<string, UserHistoryEntry>();

  for (const item of explicitList) {
    byId.set(item.id, item);
  }

  // 1. Discover existing Cinema progress from worsco_cinema_progress
  const cinemaProgress = getCinemaProgressMap();
  for (const [cinemaId, prog] of Object.entries(cinemaProgress)) {
    const entryId = sanitizeId(`cinema-${cinemaId}`);
    const cinemaItem = getCinemaById(cinemaId);
    if (!cinemaItem) continue;

    const detailLabel =
      cinemaItem.type === "serie" && prog.seasonNumber && prog.episodeNumber
        ? `Temporada ${prog.seasonNumber} · Episódio ${prog.episodeNumber}`
        : cinemaItem.type === "filme"
        ? `Filme (${cinemaItem.year}) · Dublado PT-BR`
        : `Série (${cinemaItem.year}) · Dublado PT-BR`;

    const existing = byId.get(entryId);
    if (!existing || new Date(prog.updatedAt).getTime() > new Date(existing.timestamp).getTime()) {
      byId.set(entryId, {
        id: entryId,
        userId: "local-reader",
        itemId: cinemaItem.id,
        type: "cinema",
        title: cinemaItem.title,
        subtitle: `${cinemaItem.type === "filme" ? "Filme" : "Série"} · ${cinemaItem.director}`,
        cover: cinemaItem.posterUrl || cinemaItem.backdropUrl,
        href: `/cinema/${cinemaItem.id}`,
        progressPercent: Math.max(5, Math.min(100, Math.round(prog.progressPercent || 15))),
        detailLabel,
        timestamp: prog.updatedAt || new Date().toISOString(),
      });
    }
  }

  // 2. Discover existing Book reading progress from worscoi_reading_pos_{bookId}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("worscoi_reading_pos_")) continue;
      const bookId = key.replace("worscoi_reading_pos_", "");
      const rawIdx = localStorage.getItem(key);
      const chapterIdx = rawIdx ? parseInt(rawIdx, 10) : 0;
      if (isNaN(chapterIdx)) continue;

      const entryId = sanitizeId(`book-${bookId}`);
      if (byId.has(entryId)) continue;

      const book = booksCatalog.find((b) => String(b.id) === String(bookId));
      if (book) {
        byId.set(entryId, {
          id: entryId,
          userId: "local-reader",
          itemId: String(book.id),
          type: "book",
          title: book.title,
          subtitle: book.author,
          cover: book.cover_url || undefined,
          href: `/ler/${book.id}?cap=${chapterIdx}`,
          progressPercent: Math.min(100, Math.max(12, (chapterIdx + 1) * 20)),
          detailLabel: `Capítulo ${chapterIdx + 1}`,
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        });
      }
    }
  } catch {
    // Ignore storage iteration issues
  }

  // 3. Discover existing Manga progress from worscoi_manga_progress
  for (const anime of ANIMES_DATA) {
    const mangaProg = getMangaProgress(anime.id);
    if (!mangaProg) continue;
    const entryId = sanitizeId(`manga-${anime.id}`);
    const existing = byId.get(entryId);
    if (!existing || new Date(mangaProg.updatedAt).getTime() > new Date(existing.timestamp).getTime()) {
      byId.set(entryId, {
        id: entryId,
        userId: "local-reader",
        itemId: anime.id,
        type: "manga",
        title: anime.manga?.title || anime.title,
        subtitle: anime.manga?.author || anime.studio,
        cover: anime.manga?.cover || anime.cover,
        href: `/animes/${anime.id}/manga`,
        progressPercent: Math.min(100, Math.max(15, Math.round((mangaProg.pageIndex + 1) * 8))),
        detailLabel: `Capítulo ${mangaProg.chapterNumber} · Pág. ${mangaProg.pageIndex + 1}`,
        timestamp: mangaProg.updatedAt,
      });
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function removeHistoryEntry(entryId: string): Promise<void> {
  const list = safeReadJson<UserHistoryEntry[]>(HISTORY_STORAGE_KEY, []);
  const target = list.find((item) => item.id === entryId);
  const next = list.filter((item) => item.id !== entryId);
  safeWriteJson(HISTORY_STORAGE_KEY, next);

  // Also clear underlying local progress key if applicable
  if (typeof window !== "undefined") {
    if (entryId.startsWith("book-")) {
      const bookId = target?.itemId || entryId.replace(/^book-/, "");
      localStorage.removeItem(`worscoi_reading_pos_${bookId}`);
    } else if (entryId.startsWith("cinema-")) {
      const cinemaId = target?.itemId || entryId.replace(/^cinema-/, "");
      const map = getCinemaProgressMap();
      delete map[cinemaId];
      localStorage.setItem("worsco_cinema_progress", JSON.stringify(map));
    } else if (entryId.startsWith("manga-")) {
      const animeId = target?.itemId || entryId.replace(/^manga-/, "");
      try {
        const raw = localStorage.getItem("worscoi_manga_progress");
        const map = raw ? JSON.parse(raw) : {};
        delete map[animeId];
        localStorage.setItem("worscoi_manga_progress", JSON.stringify(map));
      } catch {}
    }
    window.dispatchEvent(new Event("worscoi_history_updated"));
  }

  const fbUser = auth.currentUser;
  if (fbUser && !fbUser.isAnonymous) {
    const uid = sanitizeId(fbUser.uid);
    const cleanEntryId = sanitizeId(entryId);
    const path = `user_profiles/${uid}/history/${cleanEntryId}`;
    try {
      const online = await ensureFirestoreOnline();
      if (online) {
        await deleteDoc(doc(db, "user_profiles", uid, "history", cleanEntryId));
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  }
}

export function clearUserHistory(typeFilter?: HistoryMediaType | "all"): void {
  if (typeof window === "undefined") return;
  if (!typeFilter || typeFilter === "all") {
    safeWriteJson(HISTORY_STORAGE_KEY, []);
    localStorage.removeItem("worsco_cinema_progress");
    localStorage.removeItem("worscoi_manga_progress");
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("worscoi_reading_pos_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } else {
    const list = safeReadJson<UserHistoryEntry[]>(HISTORY_STORAGE_KEY, []);
    safeWriteJson(
      HISTORY_STORAGE_KEY,
      list.filter((item) => item.type !== typeFilter)
    );
    if (typeFilter === "cinema") {
      localStorage.removeItem("worsco_cinema_progress");
    } else if (typeFilter === "manga") {
      localStorage.removeItem("worscoi_manga_progress");
    } else if (typeFilter === "book") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("worscoi_reading_pos_")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  }
  window.dispatchEvent(new Event("worscoi_history_updated"));
}

// ============================================================================
// 3. SAVED WATCHLIST, FAVORITES & REVIEWS AGGREGATION
// ============================================================================

export function getUserSavedCatalog(
  userId?: string,
  booksCatalog: Book[] = []
): SavedCatalogEntry[] {
  const results: SavedCatalogEntry[] = [];
  const seen = new Set<string>();

  // 1. Cinema Watchlist
  const cinemaIds = getCinemaWatchlist();
  for (const cId of cinemaIds) {
    const item = getCinemaById(cId) || CINEMA_CATALOG.find((c) => c.id === cId);
    if (item && !seen.has(`cinema-${item.id}`)) {
      seen.add(`cinema-${item.id}`);
      results.push({
        id: `cinema-${item.id}`,
        itemId: item.id,
        type: "cinema",
        title: item.title,
        subtitle: `${item.type === "filme" ? "Filme" : "Série"} · ${item.year}`,
        cover: item.posterUrl || item.backdropUrl,
        href: `/cinema/${item.id}`,
        badge: item.type === "filme" ? "Filme" : "Série",
      });
    }
  }

  // 2. Anime Watchlist
  const animeIds = getAnimeWatchlist();
  for (const aId of animeIds) {
    const anime = ANIMES_DATA.find((a) => a.id === aId || a.slug === aId);
    if (anime && !seen.has(`anime-${anime.id}`)) {
      seen.add(`anime-${anime.id}`);
      results.push({
        id: `anime-${anime.id}`,
        itemId: anime.id,
        type: "anime",
        title: anime.title,
        subtitle: `${anime.studio} · ${anime.year}`,
        cover: anime.cover,
        href: `/animes/${anime.id}`,
        badge: "Anime",
      });
    }
  }

  // 3. Adored Works (Livros, Webtoons, Animes)
  const userAdoresMap = safeReadJson<Record<string, string[]>>(USER_ADORES_MAP_KEY, {});
  for (const [itemId, userIds] of Object.entries(userAdoresMap)) {
    const isAdoredByCurrent = userId
      ? userIds.includes(userId) || userIds.length > 0
      : userIds.length > 0;
    if (!isAdoredByCurrent) continue;

    const book = booksCatalog.find((b) => String(b.id).toLowerCase() === itemId.toLowerCase());
    if (book && !seen.has(`book-${book.id}`)) {
      seen.add(`book-${book.id}`);
      results.push({
        id: `book-${book.id}`,
        itemId: String(book.id),
        type: "book",
        title: book.title,
        subtitle: book.author,
        cover: book.cover_url || "",
        href: `/livros/${book.id}`,
        badge: "Livro",
      });
      continue;
    }

    const webtoon = BASE_CURATED_WEBTOONS.find((w) => w.id.toLowerCase() === itemId.toLowerCase());
    if (webtoon && !seen.has(`webtoon-${webtoon.id}`)) {
      seen.add(`webtoon-${webtoon.id}`);
      results.push({
        id: `webtoon-${webtoon.id}`,
        itemId: webtoon.id,
        type: "webtoon",
        title: webtoon.title,
        subtitle: webtoon.author,
        cover: webtoon.cover,
        href: `/webtoon/${webtoon.id}`,
        badge: "Webtoon",
      });
      continue;
    }

    const anime = ANIMES_DATA.find((a) => a.id.toLowerCase() === itemId.toLowerCase());
    if (anime && !seen.has(`anime-${anime.id}`)) {
      seen.add(`anime-${anime.id}`);
      results.push({
        id: `anime-${anime.id}`,
        itemId: anime.id,
        type: "anime",
        title: anime.title,
        subtitle: `${anime.studio} · ${anime.year}`,
        cover: anime.cover,
        href: `/animes/${anime.id}`,
        badge: "Anime",
      });
    }
  }

  return results;
}

export function getUserReviewsList(userId?: string, userName?: string): UserReview[] {
  const all = safeReadJson<UserReview[]>(REVIEWS_STORAGE_KEY, []);
  if (!userId && !userName) {
    return all.filter((r) => !r.id.startsWith("seed-"));
  }
  const own = all.filter(
    (r) =>
      (userId && r.userId === userId) ||
      (userName && r.userName.toLowerCase() === userName.toLowerCase()) ||
      !r.id.startsWith("seed-")
  );
  return own;
}
