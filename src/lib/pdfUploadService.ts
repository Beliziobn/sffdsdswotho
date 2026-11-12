import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import type { OriginalPdfBook } from "./originalPdfRegistry";

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker ||
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const IDB_NAME = "wotho_uploaded_pdfs_db";
const IDB_STORE = "pdf_files";
const CUSTOM_PDF_REGISTRY_KEY = "wotho_custom_pdf_registry_v1";

const memoryBlobUrls = new Map<string, string>();

function openPdfIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePdfBytesToIndexedDB(bookId: string, bytes: ArrayBuffer): Promise<string> {
  try {
    const db = await openPdfIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put(bytes, bookId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const blob = new Blob([bytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    memoryBlobUrls.set(bookId, blobUrl);
    return `idb://${bookId}`;
  } catch {
    return "";
  }
}

export async function getPdfBytesFromIndexedDB(bookId: string): Promise<Uint8Array | null> {
  const cleanId = bookId.replace(/^idb:\/\//, "");
  try {
    const db = await openPdfIdb();
    const result = await new Promise<ArrayBuffer | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const getReq = store.get(cleanId);
      getReq.onsuccess = () => resolve(getReq.result as ArrayBuffer | undefined);
      getReq.onerror = () => reject(getReq.error);
    });
    if (!result) return null;
    return new Uint8Array(result);
  } catch {
    return null;
  }
}

export async function getPdfBlobUrlFromIndexedDB(bookId: string): Promise<string | null> {
  const cleanId = bookId.replace(/^idb:\/\//, "");
  if (memoryBlobUrls.has(cleanId)) {
    return memoryBlobUrls.get(cleanId)!;
  }
  const bytes = await getPdfBytesFromIndexedDB(cleanId);
  if (!bytes) return null;
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  memoryBlobUrls.set(cleanId, blobUrl);
  return blobUrl;
}

export function getCustomUploadedPdfMap(): Record<string, OriginalPdfBook> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOM_PDF_REGISTRY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OriginalPdfBook>) : {};
  } catch {
    return {};
  }
}

export function saveCustomUploadedPdfEntry(entry: OriginalPdfBook): void {
  if (typeof window === "undefined") return;
  try {
    const map = getCustomUploadedPdfMap();
    map[entry.id] = entry;
    localStorage.setItem(CUSTOM_PDF_REGISTRY_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event("worscoi_editorial_updated"));
  } catch {
    // Ignore storage quota warnings
  }
}

export function deleteCustomUploadedPdfEntry(bookId: string): void {
  if (typeof window === "undefined") return;
  try {
    const map = getCustomUploadedPdfMap();
    if (map[bookId]) {
      delete map[bookId];
      localStorage.setItem(CUSTOM_PDF_REGISTRY_KEY, JSON.stringify(map));
      window.dispatchEvent(new Event("worscoi_editorial_updated"));
    }
  } catch {}
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "1.0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = Math.max(1, Math.round(bytes / 1024));
  return `${kb} KB`;
}

export interface ExtractedPdfBookData {
  suggestedTitle: string;
  suggestedAuthor: string;
  suggestedDescription: string;
  coverDataUrl: string;
  pagesCount: number;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  inlineDataUrl?: string;
  extractedChapters: Array<{
    title: string;
    content: string;
    position: number;
  }>;
  arrayBuffer: ArrayBuffer;
}

export async function processUploadedPdfFile(
  file: File,
  onProgress?: (step: string, percent: number) => void
): Promise<ExtractedPdfBookData> {
  onProgress?.("Lendo arquivo PDF do dispositivo...", 10);
  const arrayBuffer = await file.arrayBuffer();
  const fileSizeBytes = file.size;
  const fileSizeFormatted = formatBytes(fileSizeBytes);

  // If file is <= 700 KB, also create a base64 data URL so it can be persisted directly
  let inlineDataUrl: string | undefined;
  if (fileSizeBytes <= 700 * 1024) {
    try {
      const bytes = new Uint8Array(arrayBuffer.slice(0));
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      inlineDataUrl = `data:application/pdf;base64,${btoa(binary)}`;
    } catch {}
  }

  onProgress?.("Analisando páginas e estrutura do PDF...", 25);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer.slice(0)),
    cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pagesCount = pdfDoc.numPages;

  // Clean filename fallback for title
  const rawFileName = file.name
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let suggestedTitle = rawFileName;
  let suggestedAuthor = "";
  let suggestedDescription = "";

  try {
    const meta = await pdfDoc.getMetadata();
    const info = (meta?.info || {}) as Record<string, any>;
    if (info.Title && String(info.Title).trim().length > 2 && !/untitled|microsoft word/i.test(String(info.Title))) {
      suggestedTitle = String(info.Title).trim();
    }
    if (info.Author && String(info.Author).trim().length > 1) {
      suggestedAuthor = String(info.Author).trim();
    }
    if (info.Subject && String(info.Subject).trim().length > 10) {
      suggestedDescription = String(info.Subject).trim();
    }
  } catch {}

  // Render Page 1 as high-definition Cover Image
  let coverDataUrl = "";
  try {
    onProgress?.("Gerando capa em alta definição a partir da 1ª página...", 40);
    const firstPage = await pdfDoc.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const targetScale = Math.min(2.0, Math.max(1.0, 900 / Math.max(1, baseViewport.width)));
    const viewport = firstPage.getViewport({ scale: targetScale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await firstPage.render({ canvasContext: ctx, viewport }).promise;
      coverDataUrl = canvas.toDataURL("image/jpeg", 0.84);
    }
  } catch {}

  // Extract text from pages to create structured chapters for online reading & cloud sync
  const PAGES_PER_CHAPTER = pagesCount <= 30 ? 5 : pagesCount <= 120 ? 10 : 15;
  const maxPagesToExtract = Math.min(pagesCount, 250);
  const pageTexts: string[] = [];

  for (let p = 1; p <= maxPagesToExtract; p++) {
    if (p % 5 === 1 || p === maxPagesToExtract) {
      const pct = 45 + Math.round((p / maxPagesToExtract) * 45);
      onProgress?.(`Extraindo texto da página ${p} de ${pagesCount}...`, pct);
    }
    try {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const items = (textContent.items || []) as Array<{ str?: string; hasEOL?: boolean }>;
      let pageStr = "";
      for (const item of items) {
        const s = item.str || "";
        pageStr += s + (item.hasEOL ? "\n" : " ");
      }
      const cleaned = pageStr
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (cleaned) {
        pageTexts.push(cleaned);
      }
    } catch {}
  }

  const extractedChapters: Array<{ title: string; content: string; position: number }> = [];
  if (pageTexts.length > 0) {
    let chapterIdx = 1;
    for (let i = 0; i < pageTexts.length; i += PAGES_PER_CHAPTER) {
      const slice = pageTexts.slice(i, i + PAGES_PER_CHAPTER);
      const startPage = i + 1;
      const endPage = Math.min(i + slice.length, pagesCount);
      const combinedText = slice
        .map((txt, idx) => `### Página ${startPage + idx}\n\n${txt}`)
        .join("\n\n");

      extractedChapters.push({
        title:
          pageTexts.length <= PAGES_PER_CHAPTER
            ? `Texto Integral — ${suggestedTitle}`
            : `Parte ${chapterIdx} (Páginas ${startPage} a ${endPage})`,
        content: combinedText,
        position: chapterIdx,
      });
      chapterIdx++;
    }
  } else {
    extractedChapters.push({
      title: `Edição Digitalizada em PDF (${pagesCount} páginas)`,
      content: `Esta obra foi publicada a partir do arquivo PDF original (${fileSizeFormatted}, ${pagesCount} páginas). Utilize a aba "PDF Original" no leitor para visualizar todas as páginas diagramadas da edição completa.`,
      position: 1,
    });
  }

  if (!suggestedDescription) {
    const firstSample = (pageTexts[0] || "")
      .replace(/^###.*\n+/gm, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 320);
    suggestedDescription = firstSample
      ? `${firstSample}...\n\nEdição completa em PDF (${pagesCount} páginas · ${fileSizeFormatted}).`
      : `Obra digital completa em formato PDF com ${pagesCount} páginas (${fileSizeFormatted}), publicada no acervo editorial da Wotho.`;
  }

  onProgress?.("PDF processado e pronto para publicação!", 100);

  return {
    suggestedTitle,
    suggestedAuthor,
    suggestedDescription,
    coverDataUrl,
    pagesCount,
    fileSizeBytes,
    fileSizeFormatted,
    inlineDataUrl,
    extractedChapters,
    arrayBuffer,
  };
}
