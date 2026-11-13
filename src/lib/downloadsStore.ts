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
  | "webtoon"
  | "document";

export type DownloadStatus = "completed" | "in_progress" | "failed";

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
  // Client-side transfer progress metadata (not persisted to Firestore)
  progressPercent?: number;
  loadedBytes?: number;
  totalBytes?: number;
  progressStage?: "connecting" | "downloading" | "saving" | "completed" | "failed";
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
  expectedFileSizeFormatted?: string;
}

const DOWNLOADS_STORAGE_KEY = "worscoi_user_downloads_v1";
const DOWNLOAD_IDB_NAME = "wotho_downloaded_files_db";
const DOWNLOAD_IDB_STORE = "files";

interface StoredFileRecord {
  bytes: ArrayBuffer;
  mimeType: string;
  cachedAt: string;
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

function sanitizeFileName(rawName: string): string {
  const cleaned = rawName
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
  if (!cleaned) return "obra-wotho.pdf";
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

export function formatDownloadBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function openDownloadsIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
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
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDownloadedFileToIdb(
  downloadId: string,
  bytes: ArrayBuffer,
  mimeType = "application/pdf"
): Promise<void> {
  try {
    const database = await openDownloadsIdb();
    const record: StoredFileRecord = {
      bytes,
      mimeType,
      cachedAt: new Date().toISOString(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(DOWNLOAD_IDB_STORE, "readwrite");
      tx.objectStore(DOWNLOAD_IDB_STORE).put(record, downloadId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore IDB quota/availability errors
  }
}

export async function getDownloadedFileFromIdb(
  downloadId: string
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  try {
    const database = await openDownloadsIdb();
    const result = await new Promise<StoredFileRecord | ArrayBuffer | undefined>((resolve, reject) => {
      const tx = database.transaction(DOWNLOAD_IDB_STORE, "readonly");
      const req = tx.objectStore(DOWNLOAD_IDB_STORE).get(downloadId);
      req.onsuccess = () => resolve(req.result as StoredFileRecord | ArrayBuffer | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!result) return null;
    if (result instanceof ArrayBuffer) {
      return { bytes: new Uint8Array(result), mimeType: "application/pdf" };
    }
    if (result.bytes) {
      return {
        bytes: new Uint8Array(result.bytes),
        mimeType: result.mimeType || "application/pdf",
      };
    }
    return null;
  } catch {
    return null;
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
    return new Set(keys.map((k) => String(k)));
  } catch {
    return new Set();
  }
}

async function deleteDownloadedFileFromIdb(downloadId: string): Promise<void> {
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

function triggerBrowserFileDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

async function readResponseWithProgress(
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
  },
  onProgress?: (info: {
    progressPercent: number;
    loadedBytes: number;
    totalBytes?: number;
  }) => void
): Promise<{ buffer: ArrayBuffer; mimeType: string; resolvedDownloadUrl: string }> {
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
      return {
        buffer,
        mimeType: res.headers.get("content-type") || "application/pdf",
        resolvedDownloadUrl: src.startsWith("blob:") ? "" : src.slice(0, 2000),
      };
    }
  }

  const proxyUrl = buildProxyPdfFetchUrl(options);
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao transferir arquivo`);
  }
  const buffer = await readResponseWithProgress(res, onProgress);
  const mimeType = res.headers.get("content-type") || "application/pdf";
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
  const fileName = sanitizeFileName(
    options.fileName ||
      (options.author ? `${options.title} - ${options.author}.pdf` : `${options.title}.pdf`)
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
    mimeType: "application/pdf",
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
    progressPercent: 8,
    loadedBytes: 0,
    progressStage: "connecting",
  };

  safeWriteDownloads([pendingEntry, ...existingList.filter((e) => e.id !== downloadId)]);
  emitDownloadsUpdated();

  try {
    const { buffer, mimeType, resolvedDownloadUrl } = await resolveDownloadBytes(
      {
        sourceUrl: options.sourceUrl,
        title: pendingEntry.title,
        author: pendingEntry.author,
        category: pendingEntry.category,
        description: options.description,
        fileName,
        itemId: options.itemId,
      },
      ({ progressPercent, loadedBytes, totalBytes }) => {
        liveProgressMap.set(downloadId, {
          progressPercent,
          loadedBytes,
          totalBytes,
          progressStage: "downloading",
        });
        emitDownloadsUpdated();
      }
    );

    liveProgressMap.set(downloadId, {
      progressPercent: 96,
      loadedBytes: buffer.byteLength,
      totalBytes: buffer.byteLength,
      progressStage: "saving",
    });
    emitDownloadsUpdated();

    await saveDownloadedFileToIdb(downloadId, buffer, mimeType);
    const blob = new Blob([buffer], { type: mimeType });
    triggerBrowserFileDownload(blob, fileName);

    liveProgressMap.delete(downloadId);

    const completedEntry: UserDownloadEntry = {
      ...pendingEntry,
      mimeType,
      fileSizeBytes: buffer.byteLength,
      fileSizeFormatted: formatDownloadBytes(buffer.byteLength),
      downloadUrl: resolvedDownloadUrl.slice(0, 2000) || pendingEntry.downloadUrl,
      status: "completed",
      downloadedAt: new Date().toISOString(),
      progressPercent: 100,
      loadedBytes: buffer.byteLength,
      totalBytes: buffer.byteLength,
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

export async function getOrFetchDownloadBytes(
  entry: UserDownloadEntry
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const cached = await getDownloadedFileFromIdb(entry.id);
  if (cached && cached.bytes.byteLength > 0) {
    return cached;
  }

  const { buffer, mimeType } = await resolveDownloadBytes({
    sourceUrl: entry.downloadUrl,
    title: entry.title,
    author: entry.author,
    category: entry.category,
    fileName: entry.fileName,
    itemId: entry.itemId,
  });

  await saveDownloadedFileToIdb(entry.id, buffer, mimeType);
  emitDownloadsUpdated();
  return { bytes: new Uint8Array(buffer), mimeType };
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
