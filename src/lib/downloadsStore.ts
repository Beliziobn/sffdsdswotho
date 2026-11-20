import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db, ensureFirestoreOnline } from "./firebase";
import { handleFirestoreError, OperationType } from "./firebaseErrors";
import { getPdfBytesFromIndexedDB } from "./pdfUploadService";

export type DownloadMediaType =
  | "book"
  | "pdf"
  | "article"
  | "cinema"
  | "anime"
  | "manga"
  | "webtoon"
  | "document";

export type DownloadStatus = "completed" | "in_progress" | "failed";

export type DownloadFolderKind =
  | "serie"
  | "anime"
  | "filme"
  | "manga"
  | "webtoon"
  | "livro";

export interface DownloadFolderMetadata {
  folderKey: string;
  folderTitle: string;
  folderKind: DownloadFolderKind;
  kindLabel: string;
  seasonNumber: number | null;
  episodeNumber: number | null;
  episodeTitle?: string;
  languageLabel?: string;
}

export interface DownloadSeasonGroup {
  seasonNumber: number;
  label: string;
  entries: UserDownloadEntry[];
  totalBytes: number;
  completedCount: number;
  offlineCount: number;
}

export interface DownloadFolderGroup {
  folderKey: string;
  folderTitle: string;
  folderKind: DownloadFolderKind;
  kindLabel: string;
  cover?: string;
  author?: string;
  openHref?: string;
  entries: UserDownloadEntry[];
  seasons: DownloadSeasonGroup[];
  looseEntries: UserDownloadEntry[];
  latestDownloadedAt: string;
  totalBytes: number;
  totalBytesFormatted: string;
  completedCount: number;
  inProgressCount: number;
  failedCount: number;
  offlineCount: number;
}

export interface UserDownloadEntry {
  id: string;
  userId: string;
  itemId: string;
  type: DownloadMediaType;
  title: string;
  author?: string;
  category?: string;
  cover?: string;
  fileName: string;
  mimeType?: string;
  fileSizeBytes?: number;
  fileSizeFormatted?: string;
  downloadUrl?: string;
  openHref?: string;
  status: DownloadStatus;
  downloadedAt: string;
  lastOpenedAt?: string;
  openCount?: number;
  // Local folder/hierarchy metadata (derived automatically on cloud sync)
  seriesId?: string;
  seriesTitle?: string;
  mediaKind?: DownloadFolderKind;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  folderKey?: string;
  // Client-side transfer progress metadata (not persisted to Firestore)
  progressPercent?: number;
  loadedBytes?: number;
  totalBytes?: number;
  progressStage?: "connecting" | "downloading" | "saving" | "completed" | "failed";
}

export interface TrackedDownloadProgressInfo {
  progressPercent: number;
  loadedBytes: number;
  totalBytes?: number;
  progressStage?: NonNullable<UserDownloadEntry["progressStage"]>;
}

export interface CustomDownloadResult {
  buffer?: ArrayBuffer;
  chunks?: Uint8Array[];
  totalBytes?: number;
  mimeType: string;
  resolvedDownloadUrl?: string;
  fileName?: string;
  directHttpUrl?: string;
}

export interface TrackedDownloadOptions {
  itemId: string;
  type?: DownloadMediaType;
  title: string;
  author?: string;
  category?: string;
  description?: string;
  cover?: string;
  sourceUrl?: string;
  openHref?: string;
  fileName?: string;
  mimeType?: string;
  expectedFileSizeFormatted?: string;
  seriesId?: string;
  seriesTitle?: string;
  mediaKind?: DownloadFolderKind;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  customDownloader?: (
    onProgress: (info: TrackedDownloadProgressInfo) => void
  ) => Promise<CustomDownloadResult>;
}

const DOWNLOADS_STORAGE_KEY = "worscoi_user_downloads_v1";
const DOWNLOAD_IDB_NAME = "wotho_downloaded_files_db";
const DOWNLOAD_IDB_STORE = "files";

interface StoredFileRecord {
  blob?: Blob;
  bytes?: ArrayBuffer;
  mimeType: string;
  cachedAt: string;
}

const MAX_IDB_CACHE_BYTES = 1024 * 1024 * 1024; // 1 GB Blob cache limit in IndexedDB
const MAX_HOT_CACHE_ENTRIES = 10;
const MAX_HOT_CACHE_BYTES = 650 * 1024 * 1024;

interface HotMediaEntry {
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
}

const hotMediaCache = new Map<string, HotMediaEntry>();
let downloadsDbPromise: Promise<IDBDatabase> | null = null;

function rememberHotMedia(downloadId: string, blob: Blob, mimeType: string): void {
  if (!downloadId || !blob || blob.size <= 0) return;
  if (blob.size > MAX_HOT_CACHE_BYTES) return;

  if (hotMediaCache.has(downloadId)) {
    hotMediaCache.delete(downloadId);
  }
  hotMediaCache.set(downloadId, { blob, mimeType, sizeBytes: blob.size });

  let totalBytes = 0;
  for (const item of hotMediaCache.values()) {
    totalBytes += item.sizeBytes;
  }

  while (
    hotMediaCache.size > MAX_HOT_CACHE_ENTRIES ||
    (totalBytes > MAX_HOT_CACHE_BYTES && hotMediaCache.size > 1)
  ) {
    const oldestKey = hotMediaCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    const evicted = hotMediaCache.get(oldestKey);
    hotMediaCache.delete(oldestKey);
    if (evicted) totalBytes -= evicted.sizeBytes;
  }
}

export function getHotCachedDownloadMedia(
  downloadId: string
): { blob: Blob; mimeType: string } | null {
  const hit = hotMediaCache.get(downloadId);
  if (!hit || hit.blob.size <= 0) return null;
  // Refresh LRU order
  hotMediaCache.delete(downloadId);
  hotMediaCache.set(downloadId, hit);
  return { blob: hit.blob, mimeType: hit.mimeType };
}

const liveProgressMap = new Map<
  string,
  {
    progressPercent: number;
    loadedBytes: number;
    totalBytes?: number;
    progressStage: NonNullable<UserDownloadEntry["progressStage"]>;
  }
>();

function safeReadDownloads(): UserDownloadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DOWNLOADS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserDownloadEntry[]) : [];
  } catch {
    return [];
  }
}

function safeWriteDownloads(entries: UserDownloadEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(entries.slice(0, 150)));
  } catch {
    // Ignore storage quota warnings
  }
}

function emitDownloadsUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("worscoi_downloads_updated"));
  }
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_\-.]/g, "-").slice(0, 120) || "download";
}

function sanitizeFileName(rawName: string, defaultExt = ".pdf"): string {
  const extMatch = String(rawName || "").trim().match(/\.(pdf|mp4|ts|webm|mkv|m4v|epub)$/i);
  const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : defaultExt;
  const withoutExt = extMatch
    ? String(rawName).trim().slice(0, -extMatch[0].length)
    : String(rawName || "").trim();

  const cleanedBase = withoutExt
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .replace(/^[.\s-]+|[.\s-]+$/g, "")
    .slice(0, 110)
    .replace(/^[.\s-]+|[.\s-]+$/g, "");

  if (!cleanedBase) return `obra-wotho${ext}`;
  return `${cleanedBase}${ext}`;
}

export function formatDownloadBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function normalizeFolderSlug(raw: string): string {
  return String(raw || "obra")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "obra";
}

function extractLanguageBadge(entry: Pick<UserDownloadEntry, "category" | "fileName" | "itemId">): string | undefined {
  const catParts = String(entry.category || "")
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean);
  if (catParts.length > 1) {
    return catParts[catParts.length - 1];
  }
  const fileMatch = String(entry.fileName || "").match(/\((DUB PT-BR|LEG PT-BR|PT-BR|PT|EN|JA|KO)\)/i);
  if (fileMatch) return fileMatch[1].toUpperCase();
  if (/-en$/i.test(entry.itemId || "")) return "EN";
  if (/-pt$/i.test(entry.itemId || "")) return "PT-BR";
  return undefined;
}

export function resolveDownloadFolderMetadata(
  entry: Pick<
    UserDownloadEntry,
    | "itemId"
    | "type"
    | "title"
    | "category"
    | "fileName"
    | "seriesId"
    | "seriesTitle"
    | "mediaKind"
    | "seasonNumber"
    | "episodeNumber"
    | "episodeTitle"
  >
): DownloadFolderMetadata {
  const rawTitle = String(entry.title || "Obra Wotho").trim();
  const rawCategory = String(entry.category || "").trim();
  const rawItemId = String(entry.itemId || "").trim();

  let folderKind: DownloadFolderKind = entry.mediaKind || "livro";
  if (!entry.mediaKind) {
    if (entry.type === "anime") {
      folderKind = "anime";
    } else if (entry.type === "manga") {
      folderKind = "manga";
    } else if (entry.type === "webtoon") {
      folderKind = "webtoon";
    } else if (entry.type === "cinema") {
      const looksLikeSerie =
        /^s[eé]rie\b/i.test(rawCategory) ||
        /-s\d+e\d+-(?:pt|en)$/i.test(rawItemId) ||
        /[—-]\s*T\d{1,3}E\d{1,4}\b/i.test(rawTitle);
      folderKind = looksLikeSerie ? "serie" : "filme";
    } else {
      folderKind = "livro";
    }
  }

  let seasonNumber: number | null =
    typeof entry.seasonNumber === "number" && Number.isFinite(entry.seasonNumber)
      ? entry.seasonNumber
      : null;
  let episodeNumber: number | null =
    typeof entry.episodeNumber === "number" && Number.isFinite(entry.episodeNumber)
      ? entry.episodeNumber
      : null;
  let episodeTitle: string | undefined = entry.episodeTitle;

  if (folderKind === "serie" || folderKind === "anime") {
    if (seasonNumber === null || episodeNumber === null) {
      const itemSeMatch = rawItemId.match(/-s(\d+)e(\d+)(?:-|$)/i);
      if (itemSeMatch) {
        if (seasonNumber === null) seasonNumber = parseInt(itemSeMatch[1], 10);
        if (episodeNumber === null) episodeNumber = parseInt(itemSeMatch[2], 10);
      }
    }
    if (seasonNumber === null || episodeNumber === null) {
      const titleSeMatch =
        rawTitle.match(/[—-]\s*T(\d{1,3})\s*[:.]?\s*(?:E|Ep\.?)(\d{1,4})/i) ||
        rawTitle.match(/\bT(\d{1,3})E(\d{1,4})\b/i);
      if (titleSeMatch) {
        if (seasonNumber === null) seasonNumber = parseInt(titleSeMatch[1], 10);
        if (episodeNumber === null) episodeNumber = parseInt(titleSeMatch[2], 10);
      }
    }
    if (seasonNumber === null) seasonNumber = 1;
    if (episodeNumber === null) episodeNumber = 1;
  } else if (folderKind === "manga" || folderKind === "webtoon") {
    if (episodeNumber === null) {
      const chapMatch =
        rawItemId.match(/-(?:cap|ep)-(\d+)(?:-|$)/i) ||
        rawTitle.match(/[—-]\s*(?:Cap\.?|Ep\.?)\s*(\d+)/i);
      if (chapMatch) {
        episodeNumber = parseInt(chapMatch[1], 10);
      }
    }
  }

  let folderTitle = (entry.seriesTitle || "").trim();
  if (!folderTitle) {
    if (folderKind === "serie" || folderKind === "anime") {
      folderTitle = rawTitle
        .replace(/\s*[—-]\s*T\d{1,3}\s*[:.]?\s*(?:E|Ep\.?)\d{1,4}.*$/i, "")
        .trim();
    } else if (folderKind === "filme") {
      folderTitle = rawTitle
        .replace(/\s*\(\d{4}\)\s*$/, "")
        .replace(/\s*\((?:PT-BR|PT|EN)\)\s*$/i, "")
        .trim();
    } else if (folderKind === "manga" || folderKind === "webtoon") {
      folderTitle = rawTitle
        .replace(/\s*[—-]\s*(?:Cap\.?|Ep\.?)\s*\d+.*$/i, "")
        .trim();
    } else {
      folderTitle = rawTitle;
    }
  }
  if (!folderTitle) folderTitle = rawTitle;

  if (!episodeTitle && (folderKind === "serie" || folderKind === "anime")) {
    const epTitleMatch = rawTitle.match(
      /[—-]\s*T\d{1,3}\s*[:.]?\s*(?:E|Ep\.?)\d{1,4}\s*\(([^)]+)\)\s*$/i
    );
    if (epTitleMatch?.[1]) {
      episodeTitle = epTitleMatch[1].trim();
    }
  }

  const kindLabelMap: Record<DownloadFolderKind, string> = {
    serie: "Série",
    anime: "Anime",
    filme: "Filme",
    manga: "Mangá",
    webtoon: "Webtoon",
    livro: entry.type === "pdf" ? "PDF Original" : entry.type === "article" ? "Artigo" : "Livro",
  };

  // Same name + same media type => exact same folder
  const folderKey = `${folderKind}--${normalizeFolderSlug(folderTitle)}`;

  return {
    folderKey,
    folderTitle,
    folderKind,
    kindLabel: kindLabelMap[folderKind],
    seasonNumber,
    episodeNumber,
    episodeTitle,
    languageLabel: extractLanguageBadge(entry),
  };
}

export function groupDownloadsIntoFolders(
  entries: UserDownloadEntry[],
  cachedIds: Set<string> = new Set()
): DownloadFolderGroup[] {
  const folderMap = new Map<
    string,
    {
      meta: DownloadFolderMetadata;
      entries: UserDownloadEntry[];
    }
  >();

  for (const entry of entries) {
    const meta = resolveDownloadFolderMetadata(entry);
    const existing = folderMap.get(meta.folderKey);
    if (existing) {
      existing.entries.push(entry);
    } else {
      folderMap.set(meta.folderKey, { meta, entries: [entry] });
    }
  }

  const folders: DownloadFolderGroup[] = [];

  for (const [folderKey, bucket] of folderMap.entries()) {
    const { meta, entries: folderEntries } = bucket;
    const sortedByDate = [...folderEntries].sort(
      (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
    );
    const representative = sortedByDate.find((e) => e.cover) || sortedByDate[0];

    const hasSeasons = meta.folderKind === "serie" || meta.folderKind === "anime";
    const seasonsMap = new Map<number, UserDownloadEntry[]>();
    const looseEntries: UserDownloadEntry[] = [];

    if (hasSeasons) {
      for (const e of folderEntries) {
        const eMeta = resolveDownloadFolderMetadata(e);
        const sNum = eMeta.seasonNumber ?? 1;
        const list = seasonsMap.get(sNum) || [];
        list.push(e);
        seasonsMap.set(sNum, list);
      }
    } else {
      looseEntries.push(...folderEntries);
      looseEntries.sort((a, b) => {
        const ma = resolveDownloadFolderMetadata(a);
        const mb = resolveDownloadFolderMetadata(b);
        if (ma.episodeNumber !== null && mb.episodeNumber !== null && ma.episodeNumber !== mb.episodeNumber) {
          return ma.episodeNumber - mb.episodeNumber;
        }
        return new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime();
      });
    }

    const seasons: DownloadSeasonGroup[] = Array.from(seasonsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([seasonNumber, seasonEntries]) => {
        const sortedEps = [...seasonEntries].sort((a, b) => {
          const ma = resolveDownloadFolderMetadata(a);
          const mb = resolveDownloadFolderMetadata(b);
          const ea = ma.episodeNumber ?? 0;
          const eb = mb.episodeNumber ?? 0;
          if (ea !== eb) return ea - eb;
          return new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime();
        });
        const totalBytes = sortedEps.reduce(
          (acc, e) => acc + (e.status === "completed" ? e.fileSizeBytes || 0 : 0),
          0
        );
        return {
          seasonNumber,
          label: `Temporada ${seasonNumber}`,
          entries: sortedEps,
          totalBytes,
          completedCount: sortedEps.filter((e) => e.status === "completed").length,
          offlineCount: sortedEps.filter((e) => cachedIds.has(e.id)).length,
        };
      });

    const totalBytes = folderEntries.reduce(
      (acc, e) => acc + (e.status === "completed" ? e.fileSizeBytes || 0 : 0),
      0
    );

    folders.push({
      folderKey,
      folderTitle: meta.folderTitle,
      folderKind: meta.folderKind,
      kindLabel: meta.kindLabel,
      cover: representative?.cover,
      author: representative?.author,
      openHref: representative?.openHref,
      entries: hasSeasons ? seasons.flatMap((s) => s.entries) : looseEntries,
      seasons,
      looseEntries,
      latestDownloadedAt: sortedByDate[0]?.downloadedAt || new Date().toISOString(),
      totalBytes,
      totalBytesFormatted: totalBytes > 0 ? formatDownloadBytes(totalBytes) : "—",
      completedCount: folderEntries.filter((e) => e.status === "completed").length,
      inProgressCount: folderEntries.filter((e) => e.status === "in_progress").length,
      failedCount: folderEntries.filter((e) => e.status === "failed").length,
      offlineCount: folderEntries.filter((e) => cachedIds.has(e.id)).length,
    });
  }

  return folders.sort((a, b) => {
    if (a.inProgressCount > 0 && b.inProgressCount === 0) return -1;
    if (b.inProgressCount > 0 && a.inProgressCount === 0) return 1;
    return new Date(b.latestDownloadedAt).getTime() - new Date(a.latestDownloadedAt).getTime();
  });
}

function openDownloadsIdb(): Promise<IDBDatabase> {
  if (downloadsDbPromise) return downloadsDbPromise;

  downloadsDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      downloadsDbPromise = null;
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const req = indexedDB.open(DOWNLOAD_IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains(DOWNLOAD_IDB_STORE)) {
        database.createObjectStore(DOWNLOAD_IDB_STORE);
      }
    };
    req.onsuccess = () => {
      const database = req.result;
      database.onclose = () => {
        downloadsDbPromise = null;
      };
      database.onversionchange = () => {
        try {
          database.close();
        } catch {}
        downloadsDbPromise = null;
      };
      resolve(database);
    };
    req.onerror = () => {
      downloadsDbPromise = null;
      reject(req.error);
    };
  });

  return downloadsDbPromise;
}

export async function saveDownloadedBlobToIdb(
  downloadId: string,
  blob: Blob,
  mimeType = "application/pdf"
): Promise<boolean> {
  if (!blob || blob.size <= 0 || blob.size > MAX_IDB_CACHE_BYTES) return false;
  rememberHotMedia(downloadId, blob, mimeType);
  try {
    const database = await openDownloadsIdb();
    const record: StoredFileRecord = {
      blob,
      mimeType,
      cachedAt: new Date().toISOString(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(DOWNLOAD_IDB_STORE, "readwrite");
      tx.objectStore(DOWNLOAD_IDB_STORE).put(record, downloadId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

export async function saveDownloadedFileToIdb(
  downloadId: string,
  bytes: ArrayBuffer,
  mimeType = "application/pdf"
): Promise<void> {
  const blob = new Blob([bytes], { type: mimeType });
  await saveDownloadedBlobToIdb(downloadId, blob, mimeType);
}

export async function getDownloadedBlobFromIdb(
  downloadId: string
): Promise<{ blob: Blob; mimeType: string } | null> {
  const hot = getHotCachedDownloadMedia(downloadId);
  if (hot) return hot;

  try {
    const database = await openDownloadsIdb();
    const result = await new Promise<StoredFileRecord | ArrayBuffer | Blob | undefined>(
      (resolve, reject) => {
        const tx = database.transaction(DOWNLOAD_IDB_STORE, "readonly");
        const req = tx.objectStore(DOWNLOAD_IDB_STORE).get(downloadId);
        req.onsuccess = () =>
          resolve(req.result as StoredFileRecord | ArrayBuffer | Blob | undefined);
        req.onerror = () => reject(req.error);
      }
    );
    if (!result) return null;

    if (result instanceof Blob) {
      const mimeType = result.type || "application/pdf";
      rememberHotMedia(downloadId, result, mimeType);
      return { blob: result, mimeType };
    }
    if (result instanceof ArrayBuffer) {
      const mimeType = "application/pdf";
      const blob = new Blob([result], { type: mimeType });
      rememberHotMedia(downloadId, blob, mimeType);
      return { blob, mimeType };
    }
    if (result.blob instanceof Blob) {
      const mimeType = result.mimeType || result.blob.type || "application/pdf";
      rememberHotMedia(downloadId, result.blob, mimeType);
      return { blob: result.blob, mimeType };
    }
    if (result.bytes) {
      const mimeType = result.mimeType || "application/pdf";
      const blob = new Blob([result.bytes], { type: mimeType });
      rememberHotMedia(downloadId, blob, mimeType);
      return { blob, mimeType };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getDownloadedFileFromIdb(
  downloadId: string
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const cached = await getDownloadedBlobFromIdb(downloadId);
  if (!cached) return null;
  const buf = await cached.blob.arrayBuffer();
  return {
    bytes: new Uint8Array(buf),
    mimeType: cached.mimeType,
  };
}

export function preloadDownloadIntoMemory(downloadId: string): void {
  if (!downloadId || hotMediaCache.has(downloadId)) return;
  void getDownloadedBlobFromIdb(downloadId);
}

export function prewarmDownloadFolder(entries: UserDownloadEntry[], limit = 2): void {
  let count = 0;
  for (const entry of entries) {
    if (entry.status !== "completed") continue;
    if (!hotMediaCache.has(entry.id)) {
      void getDownloadedBlobFromIdb(entry.id);
    }
    count++;
    if (count >= limit) break;
  }
}

export async function getAllCachedDownloadIds(): Promise<Set<string>> {
  try {
    const database = await openDownloadsIdb();
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const tx = database.transaction(DOWNLOAD_IDB_STORE, "readonly");
      const req = tx.objectStore(DOWNLOAD_IDB_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    const set = new Set(keys.map((k) => String(k)));
    for (const k of hotMediaCache.keys()) set.add(k);
    return set;
  } catch {
    return new Set(hotMediaCache.keys());
  }
}

async function deleteDownloadedFileFromIdb(downloadId: string): Promise<void> {
  hotMediaCache.delete(downloadId);
  try {
    const database = await openDownloadsIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(DOWNLOAD_IDB_STORE, "readwrite");
      tx.objectStore(DOWNLOAD_IDB_STORE).delete(downloadId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

async function clearAllDownloadedFilesFromIdb(): Promise<void> {
  hotMediaCache.clear();
  try {
    const database = await openDownloadsIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(DOWNLOAD_IDB_STORE, "readwrite");
      tx.objectStore(DOWNLOAD_IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

function buildFirestorePayload(uid: string, entry: UserDownloadEntry): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: sanitizeId(entry.id),
    userId: uid,
    itemId: String(entry.itemId).slice(0, 128),
    type: String(entry.type).slice(0, 30),
    title: String(entry.title || "Obra Wotho").slice(0, 300),
    fileName: String(entry.fileName || "obra-wotho.pdf").slice(0, 250),
    status: entry.status,
    downloadedAt: entry.downloadedAt,
  };

  if (entry.author) payload.author = entry.author.slice(0, 150);
  if (entry.category) payload.category = entry.category.slice(0, 100);
  if (entry.cover && !entry.cover.startsWith("data:") && entry.cover.length <= 1000) {
    payload.cover = entry.cover;
  }
  if (entry.mimeType) payload.mimeType = entry.mimeType.slice(0, 100);
  if (typeof entry.fileSizeBytes === "number" && entry.fileSizeBytes >= 0) {
    payload.fileSizeBytes = Math.round(entry.fileSizeBytes);
  }
  if (entry.fileSizeFormatted) payload.fileSizeFormatted = entry.fileSizeFormatted.slice(0, 50);
  if (entry.downloadUrl && !entry.downloadUrl.startsWith("data:") && entry.downloadUrl.length <= 2000) {
    payload.downloadUrl = entry.downloadUrl;
  }
  if (entry.openHref) payload.openHref = entry.openHref.slice(0, 500);
  if (entry.lastOpenedAt) payload.lastOpenedAt = entry.lastOpenedAt.slice(0, 100);
  if (typeof entry.openCount === "number" && entry.openCount >= 0) {
    payload.openCount = Math.round(entry.openCount);
  }

  return payload;
}

async function syncDownloadToCloud(entry: UserDownloadEntry): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser || fbUser.isAnonymous) return;

  const uid = sanitizeId(fbUser.uid);
  const cleanId = sanitizeId(entry.id);
  const path = `user_profiles/${uid}/downloads/${cleanId}`;

  try {
    const online = await ensureFirestoreOnline();
    if (!online) return;
    await setDoc(doc(db, "user_profiles", uid, "downloads", cleanId), buildFirestorePayload(uid, entry));
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export function getUserDownloads(): UserDownloadEntry[] {
  return safeReadDownloads()
    .map((entry) => {
      const live = liveProgressMap.get(entry.id);
      if (live && entry.status === "in_progress") {
        return {
          ...entry,
          progressPercent: live.progressPercent,
          loadedBytes: live.loadedBytes,
          totalBytes: live.totalBytes ?? entry.totalBytes,
          progressStage: live.progressStage,
        };
      }
      if (entry.status === "completed") {
        return {
          ...entry,
          progressPercent: 100,
          progressStage: "completed" as const,
        };
      }
      if (entry.status === "failed") {
        return {
          ...entry,
          progressPercent: entry.progressPercent ?? 0,
          progressStage: "failed" as const,
        };
      }
      return {
        ...entry,
        progressPercent: entry.progressPercent ?? 12,
        progressStage: entry.progressStage ?? "downloading",
      };
    })
    .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());
}

export async function syncDownloadsFromCloud(): Promise<UserDownloadEntry[]> {
  const fbUser = auth.currentUser;
  if (!fbUser || fbUser.isAnonymous) return getUserDownloads();

  const uid = sanitizeId(fbUser.uid);
  const path = `user_profiles/${uid}/downloads`;

  try {
    const online = await ensureFirestoreOnline();
    if (!online) return getUserDownloads();

    const q = query(collection(db, "user_profiles", uid, "downloads"), where("userId", "==", uid));
    const snaps = await getDocs(q);
    if (!snaps.empty) {
      const localEntries = safeReadDownloads();
      const byId = new Map<string, UserDownloadEntry>();
      for (const e of localEntries) byId.set(e.id, e);

      snaps.forEach((docSnap) => {
        const d = docSnap.data() as UserDownloadEntry;
        const existing = byId.get(d.id);
        if (existing?.status === "in_progress" && liveProgressMap.has(d.id)) {
          return;
        }
        if (
          !existing ||
          new Date(d.downloadedAt).getTime() >= new Date(existing.downloadedAt).getTime()
        ) {
          byId.set(d.id, d);
        }
      });

      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
      );
      safeWriteDownloads(merged);
      emitDownloadsUpdated();
      return merged;
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  return getUserDownloads();
}

export function buildProxyPdfFetchUrl(options: {
  sourceUrl?: string;
  title: string;
  author?: string;
  category?: string;
  description?: string;
  fileName: string;
  itemId?: string;
}): string {
  const raw = options.sourceUrl || "";
  if (raw.startsWith("/api/books/pdf-proxy")) {
    try {
      const parsed = new URL(raw, window.location.origin);
      if (!parsed.searchParams.get("title")) parsed.searchParams.set("title", options.title);
      if (!parsed.searchParams.get("author") && options.author) {
        parsed.searchParams.set("author", options.author);
      }
      if (!parsed.searchParams.get("category") && options.category) {
        parsed.searchParams.set("category", options.category);
      }
      if (!parsed.searchParams.get("description") && options.description) {
        parsed.searchParams.set("description", options.description.slice(0, 1200));
      }
      if (!parsed.searchParams.get("filename")) parsed.searchParams.set("filename", options.fileName);
      parsed.searchParams.set("download", "true");
      return `${parsed.pathname}?${parsed.searchParams.toString()}`;
    } catch {
      return raw;
    }
  }

  const params = new URLSearchParams();
  if (raw.startsWith("http")) params.set("url", raw);
  if (options.itemId) params.set("id", options.itemId);
  params.set("filename", options.fileName);
  params.set("title", options.title);
  if (options.author) params.set("author", options.author);
  if (options.category) params.set("category", options.category);
  if (options.description) params.set("description", options.description.slice(0, 1200));
  params.set("download", "true");
  return `/api/books/pdf-proxy?${params.toString()}`;
}

function normalizeMimeType(raw?: string, fallback = "application/octet-stream"): string {
  const clean = (raw || "").split(";")[0].trim().toLowerCase();
  if (!clean || clean === "text/plain" || clean === "text/html") return fallback;
  return clean;
}

function triggerBrowserFileDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Keep blob URL alive for 10 minutes so slow/large disk writes & mobile DownloadManagers are never interrupted mid-transfer
  const cleanup = () => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {}
  };
  window.setTimeout(cleanup, 10 * 60 * 1000);
  window.addEventListener("pagehide", cleanup, { once: true });
}

function triggerDirectHttpDownload(url: string, fileName: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function readResponseWithProgress(
  res: Response,
  onProgress?: (info: {
    progressPercent: number;
    loadedBytes: number;
    totalBytes?: number;
  }) => void
): Promise<ArrayBuffer> {
  const lengthHeader = res.headers.get("content-length");
  const parsedTotal = lengthHeader ? parseInt(lengthHeader, 10) : NaN;
  const totalBytes = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : undefined;

  if (!res.body || typeof res.body.getReader !== "function") {
    const buffer = await res.arrayBuffer();
    onProgress?.({
      progressPercent: 92,
      loadedBytes: buffer.byteLength,
      totalBytes: totalBytes ?? buffer.byteLength,
    });
    return buffer;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;
  let lastEmitAt = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.byteLength > 0) {
      chunks.push(value);
      loadedBytes += value.byteLength;

      const now = Date.now();
      if (now - lastEmitAt >= 50) {
        lastEmitAt = now;
        const percent = totalBytes
          ? Math.min(92, Math.max(10, Math.round((loadedBytes / totalBytes) * 90)))
          : Math.min(88, Math.round(16 + 72 * (1 - Math.exp(-loadedBytes / 180000))));
        onProgress?.({
          progressPercent: percent,
          loadedBytes,
          totalBytes,
        });
      }
    }
  }

  const merged = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  onProgress?.({
    progressPercent: 92,
    loadedBytes,
    totalBytes: totalBytes ?? loadedBytes,
  });

  return merged.buffer;
}

async function resolveDownloadBytes(
  options: {
    sourceUrl?: string;
    title: string;
    author?: string;
    category?: string;
    description?: string;
    fileName: string;
    itemId?: string;
    mimeType?: string;
  },
  onProgress?: (info: {
    progressPercent: number;
    loadedBytes: number;
    totalBytes?: number;
  }) => void
): Promise<CustomDownloadResult> {
  const src = options.sourceUrl || "";
  onProgress?.({ progressPercent: 8, loadedBytes: 0 });

  if (src.startsWith("idb://")) {
    onProgress?.({ progressPercent: 45, loadedBytes: 0 });
    const idbBytes = await getPdfBytesFromIndexedDB(src);
    if (idbBytes && idbBytes.byteLength > 0) {
      onProgress?.({
        progressPercent: 92,
        loadedBytes: idbBytes.byteLength,
        totalBytes: idbBytes.byteLength,
      });
      return {
        buffer: idbBytes.slice().buffer,
        mimeType: "application/pdf",
        resolvedDownloadUrl: src,
      };
    }
  }

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    const res = await fetch(src);
    if (res.ok) {
      const buffer = await readResponseWithProgress(res, onProgress);
      if (buffer.byteLength > 0) {
        return {
          buffer,
          mimeType: normalizeMimeType(
            res.headers.get("content-type") || undefined,
            options.mimeType || "application/pdf"
          ),
          resolvedDownloadUrl: src.startsWith("blob:") ? "" : src.slice(0, 2000),
        };
      }
    }
  }

  const isHlsUrl =
    /\.m3u8(\?|$)/i.test(src) ||
    src.includes("/api/cinema/hls-proxy") ||
    src.includes("/backend/servers/atlas/edge");

  if (isHlsUrl && src) {
    const { downloadHlsStreamAsBinary } = await import("./mediaDownloaders");
    const hlsRes = await downloadHlsStreamAsBinary(src, (p) => onProgress?.(p));
    return {
      chunks: hlsRes.chunks,
      totalBytes: hlsRes.totalBytes,
      mimeType: hlsRes.mimeType,
      resolvedDownloadUrl: src.slice(0, 2000),
    };
  }

  const looksLikeVideo =
    Boolean(options.mimeType?.startsWith("video/")) ||
    /\.(mp4|webm|ts|mkv|m4v)(\?|$)/i.test(options.fileName) ||
    src.includes("/api/cinema/mp4-proxy");

  if (looksLikeVideo && src) {
    const videoFetchUrl = src.startsWith("/")
      ? src
      : `/api/cinema/mp4-proxy?url=${encodeURIComponent(src)}`;
    const { fetchMp4ChunksWithResume } = await import("./mediaDownloaders");
    const mp4Res = await fetchMp4ChunksWithResume(videoFetchUrl, (p) => onProgress?.(p));
    return {
      chunks: mp4Res.chunks,
      totalBytes: mp4Res.totalBytes,
      mimeType: normalizeMimeType(mp4Res.mimeType, options.mimeType || "video/mp4"),
      resolvedDownloadUrl: videoFetchUrl,
    };
  }

  if (looksLikeVideo && !src) {
    throw new Error("O link de vídeo original não está disponível para retransferência.");
  }

  const proxyUrl = buildProxyPdfFetchUrl(options);
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao transferir arquivo`);
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("text/html")) {
    throw new Error("O servidor retornou uma página inválida em vez do documento.");
  }
  const buffer = await readResponseWithProgress(res, onProgress);
  if (buffer.byteLength < 100) {
    throw new Error("O arquivo retornado está vazio ou corrompido.");
  }
  const mimeType = normalizeMimeType(ct, options.mimeType || "application/pdf");
  return {
    buffer,
    mimeType,
    resolvedDownloadUrl: proxyUrl,
  };
}

export async function executeTrackedDownload(
  options: TrackedDownloadOptions
): Promise<UserDownloadEntry> {
  const mediaType: DownloadMediaType = options.type || "pdf";
  const downloadId = sanitizeId(`${mediaType}-${options.itemId}`);
  const defaultExt = options.mimeType?.startsWith("video/") ? ".mp4" : ".pdf";
  let fileName = sanitizeFileName(
    options.fileName ||
      (options.author ? `${options.title} - ${options.author}${defaultExt}` : `${options.title}${defaultExt}`),
    defaultExt
  );

  const fbUser = auth.currentUser;
  const uid = fbUser && !fbUser.isAnonymous ? sanitizeId(fbUser.uid) : "local-reader";
  const existingList = safeReadDownloads();
  const prev = existingList.find((e) => e.id === downloadId);

  liveProgressMap.set(downloadId, {
    progressPercent: 8,
    loadedBytes: 0,
    progressStage: "connecting",
  });

  const preResolvedMeta = resolveDownloadFolderMetadata({
    itemId: String(options.itemId).slice(0, 128),
    type: mediaType,
    title: (options.title || "Obra Wotho").slice(0, 300),
    category: (options.category || "").slice(0, 100) || undefined,
    fileName,
    seriesId: options.seriesId,
    seriesTitle: options.seriesTitle,
    mediaKind: options.mediaKind,
    seasonNumber: options.seasonNumber,
    episodeNumber: options.episodeNumber,
    episodeTitle: options.episodeTitle,
  });

  const pendingEntry: UserDownloadEntry = {
    id: downloadId,
    userId: uid,
    itemId: String(options.itemId).slice(0, 128),
    type: mediaType,
    title: (options.title || "Obra Wotho").slice(0, 300),
    author: (options.author || "").slice(0, 150) || undefined,
    category: (options.category || "").slice(0, 100) || undefined,
    cover: (options.cover || "").slice(0, 1000) || undefined,
    fileName,
    mimeType: options.mimeType || "application/pdf",
    fileSizeFormatted: options.expectedFileSizeFormatted || prev?.fileSizeFormatted,
    downloadUrl:
      options.sourceUrl && !options.sourceUrl.startsWith("data:")
        ? options.sourceUrl.slice(0, 2000)
        : prev?.downloadUrl,
    openHref: (options.openHref || `/livros/${options.itemId}`).slice(0, 500),
    status: "in_progress",
    downloadedAt: new Date().toISOString(),
    lastOpenedAt: prev?.lastOpenedAt,
    openCount: prev?.openCount || 0,
    seriesId: options.seriesId || prev?.seriesId,
    seriesTitle: preResolvedMeta.folderTitle,
    mediaKind: preResolvedMeta.folderKind,
    seasonNumber: preResolvedMeta.seasonNumber ?? undefined,
    episodeNumber: preResolvedMeta.episodeNumber ?? undefined,
    episodeTitle: preResolvedMeta.episodeTitle,
    folderKey: preResolvedMeta.folderKey,
    progressPercent: 8,
    loadedBytes: 0,
    progressStage: "connecting",
  };

  safeWriteDownloads([pendingEntry, ...existingList.filter((e) => e.id !== downloadId)]);
  emitDownloadsUpdated();

  try {
    const progressHandler = ({
      progressPercent,
      loadedBytes,
      totalBytes,
      progressStage,
    }: TrackedDownloadProgressInfo) => {
      liveProgressMap.set(downloadId, {
        progressPercent: Math.max(4, Math.min(95, Math.round(progressPercent))),
        loadedBytes,
        totalBytes,
        progressStage: progressStage || "downloading",
      });
      emitDownloadsUpdated();
    };

    const resolvedResult = options.customDownloader
      ? await options.customDownloader(progressHandler)
      : await resolveDownloadBytes(
          {
            sourceUrl: options.sourceUrl,
            title: pendingEntry.title,
            author: pendingEntry.author,
            category: pendingEntry.category,
            description: options.description,
            fileName,
            itemId: options.itemId,
            mimeType: options.mimeType,
          },
          progressHandler
        );

    const resolvedDownloadUrl = resolvedResult.resolvedDownloadUrl || "";
    const mimeType = normalizeMimeType(resolvedResult.mimeType, options.mimeType || "application/pdf");
    if (resolvedResult && "fileName" in resolvedResult && resolvedResult.fileName) {
      fileName = sanitizeFileName(
        resolvedResult.fileName,
        mimeType === "video/mp2t" ? ".ts" : mimeType.startsWith("video/") ? ".mp4" : ".pdf"
      );
    }

    const totalByteLength =
      resolvedResult.totalBytes ??
      (resolvedResult.buffer
        ? resolvedResult.buffer.byteLength
        : (resolvedResult.chunks || []).reduce((acc, c) => acc + c.byteLength, 0));

    if (totalByteLength <= 0 && !resolvedResult.directHttpUrl) {
      throw new Error("O arquivo baixado está vazio.");
    }

    liveProgressMap.set(downloadId, {
      progressPercent: 96,
      loadedBytes: totalByteLength,
      totalBytes: totalByteLength,
      progressStage: "saving",
    });
    emitDownloadsUpdated();

    if (resolvedResult.directHttpUrl) {
      triggerDirectHttpDownload(resolvedResult.directHttpUrl, fileName);
      if (totalByteLength > 0 && totalByteLength <= MAX_IDB_CACHE_BYTES) {
        const blobParts: BlobPart[] = resolvedResult.chunks?.length
          ? resolvedResult.chunks.map((c) => c as unknown as BlobPart)
          : resolvedResult.buffer
          ? [resolvedResult.buffer]
          : [];
        if (blobParts.length > 0) {
          const blob = new Blob(blobParts, { type: mimeType });
          await saveDownloadedBlobToIdb(downloadId, blob, mimeType);
        }
      }
    } else {
      const blobParts: BlobPart[] = resolvedResult.chunks?.length
        ? resolvedResult.chunks.map((c) => c as unknown as BlobPart)
        : resolvedResult.buffer
        ? [resolvedResult.buffer]
        : [];
      const blob = new Blob(blobParts, { type: mimeType });
      triggerBrowserFileDownload(blob, fileName);
      if (blob.size > 0 && blob.size <= MAX_IDB_CACHE_BYTES) {
        await saveDownloadedBlobToIdb(downloadId, blob, mimeType);
      }
    }

    liveProgressMap.delete(downloadId);

    const completedEntry: UserDownloadEntry = {
      ...pendingEntry,
      fileName,
      mimeType,
      fileSizeBytes: totalByteLength,
      fileSizeFormatted: totalByteLength > 0 ? formatDownloadBytes(totalByteLength) : pendingEntry.fileSizeFormatted,
      downloadUrl: resolvedDownloadUrl.slice(0, 2000) || pendingEntry.downloadUrl,
      status: "completed",
      downloadedAt: new Date().toISOString(),
      progressPercent: 100,
      loadedBytes: totalByteLength,
      totalBytes: totalByteLength,
      progressStage: "completed",
    };

    const current = safeReadDownloads();
    safeWriteDownloads([completedEntry, ...current.filter((e) => e.id !== downloadId)]);
    emitDownloadsUpdated();
    void syncDownloadToCloud(completedEntry);
    return completedEntry;
  } catch (err) {
    const lastProgress = liveProgressMap.get(downloadId);
    liveProgressMap.delete(downloadId);
    const failedEntry: UserDownloadEntry = {
      ...pendingEntry,
      status: "failed",
      progressPercent: lastProgress?.progressPercent ?? 0,
      loadedBytes: lastProgress?.loadedBytes ?? 0,
      totalBytes: lastProgress?.totalBytes,
      progressStage: "failed",
    };
    const current = safeReadDownloads();
    safeWriteDownloads([failedEntry, ...current.filter((e) => e.id !== downloadId)]);
    emitDownloadsUpdated();
    void syncDownloadToCloud(failedEntry);
    throw err;
  }
}

export interface FastDownloadMediaResult {
  blob: Blob | null;
  streamUrl?: string;
  isHlsStream?: boolean;
  mimeType: string;
  fromCache: boolean;
}

export async function getOrFetchDownloadMedia(
  entry: UserDownloadEntry
): Promise<FastDownloadMediaResult> {
  const cached = await getDownloadedBlobFromIdb(entry.id);
  if (cached && cached.blob.size > 0) {
    return {
      blob: cached.blob,
      mimeType: cached.mimeType,
      fromCache: true,
    };
  }

  // If video is not yet in local IDB, stream directly instead of re-downloading the entire file upfront
  const src = entry.downloadUrl || "";
  const isVideoEntry =
    Boolean(entry.mimeType?.startsWith("video/")) ||
    /\.(mp4|webm|ts|mkv|m4v)(\?|$)/i.test(entry.fileName || "");
  const isHlsSource =
    /\.m3u8(\?|$)/i.test(src) ||
    src.includes("/api/cinema/hls-proxy") ||
    src.includes("/backend/servers/atlas/edge");

  if (
    isVideoEntry &&
    src &&
    !src.startsWith("idb://") &&
    !src.startsWith("blob:") &&
    !src.startsWith("data:")
  ) {
    if (isHlsSource) {
      const hlsStreamUrl = src.startsWith("/")
        ? src
        : `/api/cinema/hls-proxy?url=${encodeURIComponent(src)}`;
      return {
        blob: null,
        streamUrl: hlsStreamUrl,
        isHlsStream: true,
        mimeType: "application/vnd.apple.mpegurl",
        fromCache: false,
      };
    }

    const directStreamUrl = src.startsWith("/")
      ? src
      : `/api/cinema/mp4-proxy?url=${encodeURIComponent(src)}`;
    return {
      blob: null,
      streamUrl: directStreamUrl,
      isHlsStream: false,
      mimeType: entry.mimeType || "video/mp4",
      fromCache: false,
    };
  }

  const resolved = await resolveDownloadBytes({
    sourceUrl: entry.downloadUrl,
    title: entry.title,
    author: entry.author,
    category: entry.category,
    fileName: entry.fileName,
    itemId: entry.itemId,
    mimeType: entry.mimeType,
  });

  const blobParts: BlobPart[] = resolved.chunks?.length
    ? resolved.chunks.map((c) => c as unknown as BlobPart)
    : resolved.buffer
    ? [resolved.buffer]
    : [];

  if (blobParts.length === 0) {
    throw new Error("Arquivo indisponível offline.");
  }

  const blob = new Blob(blobParts, { type: resolved.mimeType });
  rememberHotMedia(entry.id, blob, resolved.mimeType);
  if (blob.size <= MAX_IDB_CACHE_BYTES) {
    void saveDownloadedBlobToIdb(entry.id, blob, resolved.mimeType);
  }
  return {
    blob,
    mimeType: resolved.mimeType,
    fromCache: false,
  };
}

export async function getOrFetchDownloadBytes(
  entry: UserDownloadEntry
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const media = await getOrFetchDownloadMedia(entry);
  if (media.blob) {
    const buf = await media.blob.arrayBuffer();
    return { bytes: new Uint8Array(buf), mimeType: media.mimeType };
  }
  if (media.streamUrl) {
    const res = await fetch(media.streamUrl);
    if (!res.ok) throw new Error("Arquivo indisponível offline.");
    const buf = await res.arrayBuffer();
    return { bytes: new Uint8Array(buf), mimeType: media.mimeType };
  }
  throw new Error("Arquivo indisponível offline.");
}

export function markDownloadOpened(downloadId: string): UserDownloadEntry | null {
  const list = safeReadDownloads();
  const target = list.find((e) => e.id === downloadId);
  if (!target) return null;

  const updatedEntry: UserDownloadEntry = {
    ...target,
    lastOpenedAt: new Date().toISOString(),
    openCount: (target.openCount || 0) + 1,
  };

  safeWriteDownloads(list.map((e) => (e.id === downloadId ? updatedEntry : e)));
  emitDownloadsUpdated();
  void syncDownloadToCloud(updatedEntry);
  return updatedEntry;
}

export async function removeDownloadEntry(downloadId: string): Promise<void> {
  const list = safeReadDownloads();
  safeWriteDownloads(list.filter((e) => e.id !== downloadId));
  await deleteDownloadedFileFromIdb(downloadId);
  emitDownloadsUpdated();

  const fbUser = auth.currentUser;
  if (fbUser && !fbUser.isAnonymous) {
    const uid = sanitizeId(fbUser.uid);
    const cleanId = sanitizeId(downloadId);
    const path = `user_profiles/${uid}/downloads/${cleanId}`;
    try {
      const online = await ensureFirestoreOnline();
      if (online) {
        await deleteDoc(doc(db, "user_profiles", uid, "downloads", cleanId));
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  }
}

export async function clearDownloadsHistory(): Promise<void> {
  const existing = safeReadDownloads();
  safeWriteDownloads([]);
  await clearAllDownloadedFilesFromIdb();
  emitDownloadsUpdated();

  const fbUser = auth.currentUser;
  if (fbUser && !fbUser.isAnonymous && existing.length > 0) {
    const uid = sanitizeId(fbUser.uid);
    try {
      const online = await ensureFirestoreOnline();
      if (!online) return;
      await Promise.all(
        existing.map((entry) => {
          const cleanId = sanitizeId(entry.id);
          return deleteDoc(doc(db, "user_profiles", uid, "downloads", cleanId)).catch((error) => {
            if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
              handleFirestoreError(error, OperationType.DELETE, `user_profiles/${uid}/downloads/${cleanId}`);
            }
          });
        })
      );
    } catch {
      // Handled per-item
    }
  }
}
