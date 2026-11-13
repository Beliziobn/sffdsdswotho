import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  executeTrackedDownload,
  readResponseWithProgress,
  TrackedDownloadProgressInfo,
  UserDownloadEntry,
} from "./downloadsStore";
import { getOriginalPdfForBook } from "./originalPdfRegistry";
import { fetchCinemaResolveCached, CinemaItem, CinemaLanguage } from "./cinema";
import { Anime, AnimeEpisode, AnimeSeason } from "./animes";
import { fetchAnimeMangaPages, fetchMangaDexChapterPages } from "./mangadex";
import { fetchOfficialChapterPanels, getProxiedWebtoonImageUrl } from "./webtoonOfficialSync";

export const ANIME_TMDB_MAP: Record<string, number> = {
  "solo-leveling": 127532,
  "frieren-beyond-journeys-end": 209867,
  "orb-movements-of-the-earth": 204635,
  dandadan: 240411,
  "attack-on-titan": 1429,
  "vinland-saga": 88803,
  "demon-slayer-infinity-castle": 85937,
  "jujutsu-kaisen-culling-game": 95479,
  "bleach-tybw": 30984,
  monster: 30981,
  "apothecary-diaries": 220542,
  "re-zero": 65942,
  "kaiju-no-8": 207468,
  "chainsaw-man": 114410,
  "oshi-no-ko": 203737,
  "blue-lock": 131041,
  "cyberpunk-edgerunners": 105248,
  "dungeon-meshi": 207784,
  "spy-x-family": 120089,
  "tower-of-god": 97860,
  "black-clover": 73223,
  "jojos-bizarre-adventure": 45790,
  "steel-ball-run": 45790,
  "dragon-ball": 12971,
  naruto: 46260,
  boruto: 70881,
  "one-piece": 37854,
  "hunter-x-hunter": 46298,
  "my-hero-academia": 65930,
  "death-note": 13916,
  "fullmetal-alchemist-brotherhood": 31911,
  "sakamoto-days": 240411,
  "dr-stone": 86031,
  "mob-psycho-100": 67075,
  "shangri-la-frontier": 205908,
  mashle: 205366,
  "wind-breaker": 223500,
  jigokuraku: 117465,
  "classroom-of-the-elite": 72517,
};

function sanitizePdfWinAnsi(raw: string): string {
  return String(raw || "")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "*")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, "  ")
    .replace(/\r/g, "")
    // Strip characters unsupported by StandardFonts WinAnsi encoding
    .replace(/[^\x20-\x7E\xA1-\xFF\n]/g, "");
}

function cleanFileBaseName(raw: string): string {
  return String(raw || "obra-wotho")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function wrapTextToLines(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const safe = sanitizePdfWinAnsi(text);
  const paragraphs = safe.split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      let width = 0;
      try {
        width = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        width = candidate.length * fontSize * 0.55;
      }

      if (width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        // Break overly long single words
        let wordPart = word;
        try {
          if (font.widthOfTextAtSize(wordPart, fontSize) > maxWidth) {
            let chunk = "";
            for (const ch of wordPart) {
              if (font.widthOfTextAtSize(chunk + ch, fontSize) > maxWidth && chunk) {
                lines.push(chunk);
                chunk = ch;
              } else {
                chunk += ch;
              }
            }
            current = chunk;
          } else {
            current = wordPart;
          }
        } catch {
          current = wordPart;
        }
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

async function fetchImageAsJpegBytes(
  rawUrl: string,
  proxyEndpoint: "/api/proxy/manga-image" | "/api/proxy/webtoon-image" = "/api/proxy/manga-image"
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  if (!rawUrl || rawUrl.includes("placeholder.svg")) return null;

  const fetchUrl =
    rawUrl.startsWith("/") || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")
      ? rawUrl
      : `${proxyEndpoint}?url=${encodeURIComponent(rawUrl)}`;

  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob || blob.size < 200) return null;

    const objectUrl = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = "anonymous";
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image decode failed"));
        el.src = objectUrl;
      });

      const width = img.naturalWidth || img.width || 800;
      const height = img.naturalHeight || img.height || 1200;

      // Downscale ultra-wide strips slightly only if exceeding 1800px wide to keep PDF fast & crisp
      const maxDim = 1800;
      const scale = width > maxDim ? maxDim / width : 1;
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const jpegBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
      );
      if (!jpegBlob) return null;
      const buf = await jpegBlob.arrayBuffer();
      return { bytes: new Uint8Array(buf), width: targetW, height: targetH };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

export interface BookChapterInput {
  id?: string;
  position?: number;
  title: string;
  content: string;
}

async function resolveBookChaptersForDownload(bookId: string): Promise<BookChapterInput[]> {
  try {
    const { getCustomBookChapters } = await import("./editorialStore");
    const localCustom = getCustomBookChapters(bookId);
    if (localCustom.length > 0) return localCustom;
    if (bookId.startsWith("book-editorial-")) {
      const { fetchCloudChapters } = await import("./cloudEditorialService");
      const cloud = await fetchCloudChapters(bookId);
      if (cloud.length > 0) return cloud;
    }
  } catch {}

  if (bookId.startsWith("sci-")) {
    try {
      const { SCIENTIFIC_ARTICLES } = await import("@/data/scientificArticles");
      const found = SCIENTIFIC_ARTICLES.find((s) => s.id === bookId);
      if (found?.chapters?.length) return found.chapters;
    } catch {}
  }

  if (bookId.startsWith("curr-")) {
    try {
      const { CURRICULAR_BOOKS } = await import("@/data/curricularBooks");
      const found = CURRICULAR_BOOKS.find((c) => c.id === bookId);
      if (found?.chapters?.length) return found.chapters;
    } catch {}
  }

  if (bookId.startsWith("auto-")) {
    try {
      const { getAutoImportedBooks } = await import("./bookAutomation");
      const list = await getAutoImportedBooks();
      const found = list.find((b: any) => b.id === bookId);
      if (found?.chapters?.length) return found.chapters;
    } catch {}
  }

  if (bookId.startsWith("mod-")) {
    try {
      const { MODERN_BOOKS } = await import("./modernBooks");
      const found = MODERN_BOOKS.find((b) => b.id === bookId);
      if (found?.chapters?.length) return found.chapters;
    } catch {}
  }

  if (/^(?:guten-)?\d+$/.test(bookId)) {
    try {
      const { fetchGutenbergChapters } = await import("./gutenbergBooks");
      const chaps = await fetchGutenbergChapters(bookId);
      if (chaps?.length) return chaps;
    } catch {}
  }

  try {
    const { fetchCloudChapters } = await import("./cloudEditorialService");
    const cloud = await fetchCloudChapters(bookId);
    if (cloud.length > 0) return cloud;
  } catch {}

  return [];
}

async function buildFullBookPdfBytes(
  book: {
    id: string;
    title: string;
    author?: string;
    category?: string;
    description?: string;
    cover_url?: string | null;
  },
  chapters: BookChapterInput[],
  onProgress: (info: TrackedDownloadProgressInfo) => void
): Promise<ArrayBuffer> {
  onProgress({ progressPercent: 12, loadedBytes: 0, progressStage: "downloading" });

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(sanitizePdfWinAnsi(book.title));
  pdfDoc.setAuthor(sanitizePdfWinAnsi(book.author || "Acervo Wotho"));
  pdfDoc.setCreator("Wotho Biblioteca Digital");

  const serifRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const sansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 pt
  const pageHeight = 841.89;
  const marginX = 56;
  const marginTop = 64;
  const marginBottom = 56;
  const contentWidth = pageWidth - marginX * 2;

  // 1. Cover / Frontispiece Page
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.985, 0.982, 0.972),
  });
  coverPage.drawRectangle({
    x: 0,
    y: pageHeight - 10,
    width: pageWidth,
    height: 10,
    color: rgb(0.08, 0.08, 0.1),
  });

  let cursorY = pageHeight - 72;
  const catLabel = sanitizePdfWinAnsi((book.category || "Acervo Editorial Wotho").toUpperCase());
  coverPage.drawText(catLabel, {
    x: marginX,
    y: cursorY,
    size: 9,
    font: sansBold,
    color: rgb(0.45, 0.45, 0.5),
  });
  cursorY -= 32;

  const titleLines = wrapTextToLines(book.title, serifBold, 26, contentWidth);
  for (const line of titleLines.slice(0, 4)) {
    coverPage.drawText(line, {
      x: marginX,
      y: cursorY,
      size: 26,
      font: serifBold,
      color: rgb(0.09, 0.09, 0.11),
    });
    cursorY -= 32;
  }

  cursorY -= 6;
  coverPage.drawText(sanitizePdfWinAnsi(`Por ${book.author || "Autor Editorial"}`), {
    x: marginX,
    y: cursorY,
    size: 13,
    font: serifRegular,
    color: rgb(0.32, 0.32, 0.36),
  });
  cursorY -= 24;

  // Optional embedded cover artwork
  if (book.cover_url) {
    const coverImgData = await fetchImageAsJpegBytes(book.cover_url);
    if (coverImgData) {
      try {
        const embedded = await pdfDoc.embedJpg(coverImgData.bytes);
        const maxCoverH = 260;
        const maxCoverW = 190;
        const ratio = Math.min(maxCoverW / coverImgData.width, maxCoverH / coverImgData.height);
        const drawW = coverImgData.width * ratio;
        const drawH = coverImgData.height * ratio;
        coverPage.drawImage(embedded, {
          x: marginX,
          y: cursorY - drawH,
          width: drawW,
          height: drawH,
        });
        cursorY -= drawH + 26;
      } catch {}
    }
  }

  if (book.description) {
    coverPage.drawText("SOBRE A OBRA", {
      x: marginX,
      y: cursorY,
      size: 9,
      font: sansBold,
      color: rgb(0.45, 0.45, 0.5),
    });
    cursorY -= 18;
    const descLines = wrapTextToLines(book.description, serifRegular, 11.5, contentWidth);
    for (const dLine of descLines) {
      if (cursorY < marginBottom + 40) break;
      if (dLine) {
        coverPage.drawText(dLine, {
          x: marginX,
          y: cursorY,
          size: 11.5,
          font: serifRegular,
          color: rgb(0.22, 0.22, 0.25),
        });
      }
      cursorY -= 16;
    }
  }

  coverPage.drawText(
    sanitizePdfWinAnsi(`Edicao Digital Integral · ${chapters.length} capitulos`),
    {
      x: marginX,
      y: 32,
      size: 9,
      font: sansRegular,
      color: rgb(0.5, 0.5, 0.55),
    }
  );

  // 2. Table of Contents Page (if chapters exist)
  if (chapters.length > 0) {
    let tocPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let tocY = pageHeight - marginTop;
    tocPage.drawText("SUMARIO DE CAPITULOS", {
      x: marginX,
      y: tocY,
      size: 13,
      font: sansBold,
      color: rgb(0.09, 0.09, 0.11),
    });
    tocY -= 28;

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      const pos = ch.position ?? i + 1;
      const entryLabel = `${pos}. ${ch.title}`;
      const wrapped = wrapTextToLines(entryLabel, sansRegular, 10.5, contentWidth);
      for (const line of wrapped) {
        if (tocY < marginBottom + 20) {
          tocPage = pdfDoc.addPage([pageWidth, pageHeight]);
          tocY = pageHeight - marginTop;
        }
        tocPage.drawText(line, {
          x: marginX,
          y: tocY,
          size: 10.5,
          font: sansRegular,
          color: rgb(0.2, 0.2, 0.24),
        });
        tocY -= 16;
      }
      tocY -= 3;
    }
  }

  // 3. Render Every Real Chapter in Full
  const totalChaps = Math.max(1, chapters.length);
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - marginTop;

    const chapHeader = sanitizePdfWinAnsi(
      `${book.title} · Cap. ${ch.position ?? i + 1}`
    );
    page.drawText(chapHeader.slice(0, 85), {
      x: marginX,
      y: pageHeight - 34,
      size: 8.5,
      font: sansRegular,
      color: rgb(0.52, 0.52, 0.58),
    });

    const titleWrapped = wrapTextToLines(
      ch.title || `Capitulo ${ch.position ?? i + 1}`,
      serifBold,
      17,
      contentWidth
    );
    for (const tLine of titleWrapped) {
      if (y < marginBottom + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - marginTop;
      }
      page.drawText(tLine, {
        x: marginX,
        y,
        size: 17,
        font: serifBold,
        color: rgb(0.08, 0.08, 0.1),
      });
      y -= 23;
    }

    page.drawLine({
      start: { x: marginX, y: y + 8 },
      end: { x: marginX + 120, y: y + 8 },
      thickness: 1,
      color: rgb(0.78, 0.78, 0.82),
    });
    y -= 16;

    // Strip lightweight markdown formatting cleanly for pure typographic PDF rendering
    const cleanBody = (ch.content || "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");

    const bodyLines = wrapTextToLines(cleanBody, serifRegular, 11.5, contentWidth);
    for (const bLine of bodyLines) {
      if (y < marginBottom) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - marginTop;
        page.drawText(chapHeader.slice(0, 85), {
          x: marginX,
          y: pageHeight - 34,
          size: 8.5,
          font: sansRegular,
          color: rgb(0.52, 0.52, 0.58),
        });
      }
      if (bLine) {
        page.drawText(bLine, {
          x: marginX,
          y,
          size: 11.5,
          font: serifRegular,
          color: rgb(0.14, 0.14, 0.16),
        });
        y -= 17;
      } else {
        y -= 10;
      }
    }

    const pct = 18 + Math.round(((i + 1) / totalChaps) * 70);
    onProgress({
      progressPercent: pct,
      loadedBytes: Math.round((i + 1) * 18000),
      totalBytes: totalChaps * 18000,
      progressStage: "downloading",
    });
  }

  // Stamp page numbers across all pages
  const allPages = pdfDoc.getPages();
  const totalPages = allPages.length;
  for (let p = 0; p < totalPages; p++) {
    allPages[p].drawText(`${p + 1} / ${totalPages}`, {
      x: pageWidth - marginX - 36,
      y: 26,
      size: 8.5,
      font: sansRegular,
      color: rgb(0.52, 0.52, 0.58),
    });
  }

  onProgress({ progressPercent: 92, loadedBytes: totalPages * 12000, progressStage: "saving" });
  const bytes = await pdfDoc.save();
  return bytes.slice().buffer;
}

export async function downloadRealBook(params: {
  book: {
    id: string;
    title: string;
    author?: string;
    category?: string;
    description?: string;
    cover_url?: string | null;
    pdf_url?: string;
    download_url?: string;
  };
  chapters?: BookChapterInput[];
}): Promise<UserDownloadEntry> {
  const { book } = params;
  const originalPdf = getOriginalPdfForBook(book.id);
  const explicitSourceUrl =
    originalPdf?.pdfUrl || book.pdf_url || book.download_url || undefined;

  const baseFileName = cleanFileBaseName(
    `${originalPdf?.title || book.title}${originalPdf?.author || book.author ? ` - ${originalPdf?.author || book.author}` : ""}`
  );

  // If book has an authentic physical/original PDF file, download that exact PDF
  if (explicitSourceUrl) {
    return executeTrackedDownload({
      itemId: String(book.id),
      type: originalPdf ? "pdf" : "book",
      title: originalPdf?.title || book.title,
      author: originalPdf?.author || book.author,
      category: book.category,
      description: book.description,
      cover: book.cover_url || originalPdf?.coverUrl || undefined,
      sourceUrl: explicitSourceUrl,
      openHref: originalPdf ? `/ler/${book.id}?mode=pdf` : `/ler/${book.id}`,
      fileName: `${baseFileName}.pdf`,
      mimeType: "application/pdf",
      expectedFileSizeFormatted: originalPdf?.fileSizeFormatted,
    });
  }

  // Otherwise compile all genuine chapters of the book into an authentic full-text PDF
  return executeTrackedDownload({
    itemId: String(book.id),
    type: "book",
    title: book.title,
    author: book.author,
    category: book.category,
    description: book.description,
    cover: book.cover_url || undefined,
    openHref: `/ler/${book.id}?mode=text`,
    fileName: `${baseFileName}.pdf`,
    mimeType: "application/pdf",
    customDownloader: async (onProgress) => {
      onProgress({ progressPercent: 8, loadedBytes: 0, progressStage: "connecting" });
      let chapters = params.chapters && params.chapters.length > 0
        ? params.chapters
        : await resolveBookChaptersForDownload(book.id);

      if (!chapters || chapters.length === 0) {
        chapters = [
          {
            position: 1,
            title: book.title,
            content: book.description || "Edicao digital Wotho.",
          },
        ];
      }

      const buffer = await buildFullBookPdfBytes(book, chapters, onProgress);
      return {
        buffer,
        mimeType: "application/pdf",
      };
    },
  });
}

async function compileImagesToPdfBytes(params: {
  title: string;
  subtitle: string;
  author?: string;
  badgeText: string;
  coverUrl?: string;
  imageUrls: string[];
  proxyEndpoint: "/api/proxy/manga-image" | "/api/proxy/webtoon-image";
  onProgress: (info: TrackedDownloadProgressInfo) => void;
}): Promise<ArrayBuffer> {
  const { title, subtitle, author, badgeText, coverUrl, imageUrls, proxyEndpoint, onProgress } = params;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(sanitizePdfWinAnsi(`${title} - ${subtitle}`));
  pdfDoc.setAuthor(sanitizePdfWinAnsi(author || "Acervo Wotho"));
  pdfDoc.setCreator("Wotho Reader Engine");

  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Download all real scan/panel images in small batches (concurrency 3)
  const totalImages = imageUrls.length;
  const loadedImages: Array<{ bytes: Uint8Array; width: number; height: number } | null> =
    new Array(totalImages).fill(null);

  let completedCount = 0;
  let totalImageBytes = 0;
  const concurrency = 3;

  for (let start = 0; start < totalImages; start += concurrency) {
    const batch = imageUrls.slice(start, start + concurrency);
    await Promise.all(
      batch.map(async (url, offset) => {
        const idx = start + offset;
        const imgData = await fetchImageAsJpegBytes(url, proxyEndpoint);
        loadedImages[idx] = imgData;
        completedCount += 1;
        if (imgData) totalImageBytes += imgData.bytes.byteLength;
        onProgress({
          progressPercent: 12 + Math.round((completedCount / totalImages) * 74),
          loadedBytes: totalImageBytes,
          totalBytes: Math.round((totalImageBytes / Math.max(1, completedCount)) * totalImages),
          progressStage: "downloading",
        });
      })
    );
  }

  const validImages = loadedImages.filter(
    (img): img is { bytes: Uint8Array; width: number; height: number } => Boolean(img)
  );

  if (validImages.length === 0) {
    throw new Error("Nenhuma página de imagem real pôde ser transferida neste momento.");
  }

  // Front Cover / Title Card
  const coverPage = pdfDoc.addPage([595.28, 841.89]);
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
    color: rgb(0.07, 0.08, 0.1),
  });
  coverPage.drawText(sanitizePdfWinAnsi(badgeText.toUpperCase()), {
    x: 56,
    y: 775,
    size: 10,
    font: sansBold,
    color: rgb(0.25, 0.82, 0.62),
  });

  let y = 740;
  for (const line of wrapTextToLines(title, sansBold, 24, 480).slice(0, 3)) {
    coverPage.drawText(line, {
      x: 56,
      y,
      size: 24,
      font: sansBold,
      color: rgb(0.98, 0.98, 0.99),
    });
    y -= 30;
  }

  for (const line of wrapTextToLines(subtitle, sansRegular, 14, 480).slice(0, 2)) {
    coverPage.drawText(line, {
      x: 56,
      y,
      size: 14,
      font: sansRegular,
      color: rgb(0.75, 0.77, 0.82),
    });
    y -= 20;
  }

  if (coverUrl) {
    const coverImg = await fetchImageAsJpegBytes(coverUrl, proxyEndpoint);
    if (coverImg) {
      try {
        const embedded = await pdfDoc.embedJpg(coverImg.bytes);
        const ratio = Math.min(340 / coverImg.width, 460 / coverImg.height);
        const w = coverImg.width * ratio;
        const h = coverImg.height * ratio;
        coverPage.drawImage(embedded, {
          x: 56,
          y: Math.max(96, y - h - 20),
          width: w,
          height: h,
        });
      } catch {}
    }
  }

  coverPage.drawText(
    sanitizePdfWinAnsi(`${validImages.length} paginas originais em alta definicao`),
    {
      x: 56,
      y: 42,
      size: 10,
      font: sansRegular,
      color: rgb(0.6, 0.62, 0.68),
    }
  );

  // Embed every real scan / webtoon panel at exact natural aspect ratio
  onProgress({
    progressPercent: 90,
    loadedBytes: totalImageBytes,
    totalBytes: totalImageBytes,
    progressStage: "saving",
  });

  for (const imgData of validImages) {
    try {
      const embedded = await pdfDoc.embedJpg(imgData.bytes);
      const targetWidth = 720;
      const scale = targetWidth / Math.max(1, imgData.width);
      const pageHeight = Math.max(200, Math.round(imgData.height * scale));
      const page = pdfDoc.addPage([targetWidth, pageHeight]);
      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: targetWidth,
        height: pageHeight,
      });
    } catch {}
  }

  const finalBytes = await pdfDoc.save();
  return finalBytes.slice().buffer;
}

export async function downloadRealMangaChapter(params: {
  anime: Anime;
  chapter: {
    id: string;
    number: string | number;
    numericNumber?: number;
    title: string;
    chapterUrl?: string;
    mangadexChapterId?: string;
    pages?: string[];
  };
  language?: "pt" | "en" | "ja";
  preloadedPages?: string[];
}): Promise<UserDownloadEntry> {
  const { anime, chapter } = params;
  const language = params.language || "pt";
  const chapterNum = chapter.numericNumber ?? (Number(chapter.number) || 1);
  const langLabel = language === "pt" ? "PT-BR" : language === "en" ? "EN" : "JA";
  const baseTitle = anime.manga?.title || anime.title;
  const fileName = `${cleanFileBaseName(`${baseTitle} - Cap ${chapterNum} (${langLabel})`)}.pdf`;

  return executeTrackedDownload({
    itemId: `${anime.id}-cap-${chapterNum}-${language}`,
    type: "manga",
    title: `${baseTitle} — Cap. ${chapterNum}`,
    author: anime.manga?.author || anime.studio,
    category: `Mangá · ${langLabel}`,
    cover: anime.manga?.cover || anime.cover,
    openHref: `/animes/${anime.id}/manga/${chapter.id}`,
    fileName,
    mimeType: "application/pdf",
    customDownloader: async (onProgress) => {
      onProgress({ progressPercent: 6, loadedBytes: 0, progressStage: "connecting" });

      let pages = params.preloadedPages && params.preloadedPages.length > 0
        ? params.preloadedPages
        : [];

      if (pages.length === 0) {
        const targetId = chapter.chapterUrl || chapter.id || chapter.mangadexChapterId || "";
        try {
          const res = await fetchAnimeMangaPages(
            anime.id,
            targetId,
            chapterNum,
            language,
            "data"
          );
          if (res?.pages?.length) pages = res.pages;
        } catch {}
      }

      if (pages.length === 0) {
        try {
          const directRes = await fetch(
            `/api/manga/pages?animeId=${encodeURIComponent(anime.id)}&chapterNumber=${chapterNum}`
          );
          if (directRes.ok) {
            const directData = await directRes.json();
            if (directData?.success && Array.isArray(directData.pages) && directData.pages.length > 0) {
              pages = directData.pages;
            }
          }
        } catch {}
      }

      if (pages.length === 0 && (chapter.mangadexChapterId || chapter.id)) {
        try {
          const mdRes = await fetchMangaDexChapterPages(
            chapter.mangadexChapterId || chapter.id,
            "data",
            language
          );
          if (mdRes?.pages?.length) pages = mdRes.pages;
        } catch {}
      }

      if (pages.length === 0 && chapter.pages?.length) {
        pages = chapter.pages;
      }

      const cleanPages = pages.filter((u) => Boolean(u) && !u.includes("placeholder.svg"));
      if (cleanPages.length === 0) {
        throw new Error("Não há páginas disponíveis para download deste capítulo.");
      }

      const buffer = await compileImagesToPdfBytes({
        title: baseTitle,
        subtitle: chapter.title || `Capítulo ${chapterNum}`,
        author: anime.manga?.author || anime.studio,
        badgeText: `Manga Oficial · ${langLabel}`,
        coverUrl: anime.manga?.cover || anime.cover,
        imageUrls: cleanPages,
        proxyEndpoint: "/api/proxy/manga-image",
        onProgress,
      });

      return { buffer, mimeType: "application/pdf" };
    },
  });
}

export async function downloadRealWebtoonEpisode(params: {
  webtoonId: string;
  webtoonTitle: string;
  author?: string;
  category?: string;
  coverUrl?: string;
  episode: {
    id: string;
    number: number;
    title: string;
    body?: string;
    images?: string[];
    viewer_url?: string;
  };
  language?: "pt" | "en" | "ko";
  preloadedPanels?: string[];
}): Promise<UserDownloadEntry> {
  const { webtoonId, webtoonTitle, author, category, coverUrl, episode } = params;
  const language = params.language || "pt";
  const langLabel = language === "pt" ? "PT-BR" : language === "en" ? "EN" : "KO";
  const fileName = `${cleanFileBaseName(`${webtoonTitle} - Cap ${episode.number} (${langLabel})`)}.pdf`;

  return executeTrackedDownload({
    itemId: `${webtoonId}-ep-${episode.number}-${language}`,
    type: "webtoon",
    title: `${webtoonTitle} — Cap. ${episode.number}`,
    author: author || "Webtoon Oficial",
    category: category ? `Webtoon · ${category}` : `Webtoon · ${langLabel}`,
    cover: coverUrl || episode.images?.[0],
    openHref: `/webtoon/${webtoonId}/ep/${episode.id}`,
    fileName,
    mimeType: "application/pdf",
    customDownloader: async (onProgress) => {
      onProgress({ progressPercent: 6, loadedBytes: 0, progressStage: "connecting" });

      let panels = params.preloadedPanels && params.preloadedPanels.length > 0
        ? params.preloadedPanels
        : [];

      // Treat pure duplicate cover placeholder as empty so we still try live sync
      const isOnlyCoverFallback =
        panels.length > 0 &&
        coverUrl &&
        panels.every((p) => p === coverUrl || p.includes("placeholder.svg"));

      if (panels.length === 0 || isOnlyCoverFallback) {
        try {
          const synced = await fetchOfficialChapterPanels(episode.viewer_url, {
            webtoonId,
            episodeNumber: episode.number,
            episodeTitle: episode.title,
            coverUrl,
            webtoonTitle,
            language,
          });
          const realSynced = (synced || []).filter(
            (p) => Boolean(p) && !p.includes("placeholder.svg")
          );
          if (
            realSynced.length > 0 &&
            !(coverUrl && realSynced.length <= 2 && realSynced.every((p) => p === coverUrl))
          ) {
            panels = realSynced;
          }
        } catch {}
      }

      if (panels.length === 0 && episode.images && episode.images.length > 0) {
        panels = episode.images.map((p) =>
          p.startsWith("http") ? getProxiedWebtoonImageUrl(p) : p
        );
      }

      const cleanPanels = panels.filter((u) => Boolean(u) && !u.includes("placeholder.svg"));
      if (cleanPanels.length === 0) {
        throw new Error("Não há painéis disponíveis para download deste capítulo.");
      }

      const buffer = await compileImagesToPdfBytes({
        title: webtoonTitle,
        subtitle: episode.title || `Capítulo ${episode.number}`,
        author: author || "Webtoon Oficial",
        badgeText: `Webtoon · ${langLabel}`,
        coverUrl: coverUrl || episode.images?.[0],
        imageUrls: cleanPanels,
        proxyEndpoint: "/api/proxy/webtoon-image",
        onProgress,
      });

      return { buffer, mimeType: "application/pdf" };
    },
  });
}

function resolveHlsUrl(maybeRelative: string, baseUrl: string): string {
  if (maybeRelative.startsWith("/api/cinema/hls-proxy")) {
    return maybeRelative;
  }
  if (maybeRelative.startsWith("http://") || maybeRelative.startsWith("https://")) {
    return `/api/cinema/hls-proxy?url=${encodeURIComponent(maybeRelative)}`;
  }
  try {
    const abs = new URL(maybeRelative, baseUrl).toString();
    return `/api/cinema/hls-proxy?url=${encodeURIComponent(abs)}`;
  } catch {
    return maybeRelative;
  }
}

async function downloadHlsStreamAsBinary(
  hlsUrl: string,
  onProgress: (info: TrackedDownloadProgressInfo) => void
): Promise<{ buffer: ArrayBuffer; mimeType: string; ext: ".mp4" | ".ts" }> {
  const initialProxy = hlsUrl.startsWith("/api/cinema/hls-proxy")
    ? hlsUrl
    : `/api/cinema/hls-proxy?url=${encodeURIComponent(hlsUrl)}`;

  const playlistRes = await fetch(initialProxy);
  if (!playlistRes.ok) {
    throw new Error(`HTTP ${playlistRes.status} ao carregar playlist HLS`);
  }
  let playlistText = await playlistRes.text();
  let activeBaseUrl = hlsUrl;

  if (!playlistText.trim().startsWith("#EXTM3U")) {
    throw new Error("Playlist HLS inválida retornada pelo servidor");
  }

  // If master playlist, pick highest-bandwidth variant stream
  if (playlistText.includes("#EXT-X-STREAM-INF")) {
    const lines = playlistText.split("\n").map((l) => l.trim());
    let bestBandwidth = -1;
    let bestUri = "";
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXT-X-STREAM-INF")) {
        const bwMatch = lines[i].match(/BANDWIDTH=(\d+)/i);
        const bw = bwMatch ? parseInt(bwMatch[1], 10) : 0;
        const nextLine = lines[i + 1] || "";
        if (nextLine && !nextLine.startsWith("#") && bw >= bestBandwidth) {
          bestBandwidth = bw;
          bestUri = nextLine;
        }
      }
    }
    if (bestUri) {
      const variantProxy = resolveHlsUrl(bestUri, activeBaseUrl);
      if (bestUri.startsWith("http")) activeBaseUrl = bestUri;
      const vRes = await fetch(variantProxy);
      if (!vRes.ok) throw new Error(`HTTP ${vRes.status} ao carregar stream HLS`);
      playlistText = await vRes.text();
    }
  }

  const lines = playlistText.split("\n").map((l) => l.trim());
  let initMapUri: string | null = null;
  const segmentUrls: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#EXT-X-MAP")) {
      const uriMatch = line.match(/URI="([^"]+)"/i);
      if (uriMatch?.[1]) {
        initMapUri = resolveHlsUrl(uriMatch[1], activeBaseUrl);
      }
      continue;
    }
    if (line.startsWith("#")) continue;
    segmentUrls.push(resolveHlsUrl(line, activeBaseUrl));
  }

  if (segmentUrls.length === 0) {
    throw new Error("Nenhum segmento de vídeo encontrado na playlist HLS");
  }

  const allUrls = initMapUri ? [initMapUri, ...segmentUrls] : segmentUrls;
  const buffers: Uint8Array[] = new Array(allUrls.length);
  let loadedBytes = 0;
  let completed = 0;
  const concurrency = 4;

  for (let start = 0; start < allUrls.length; start += concurrency) {
    const batch = allUrls.slice(start, start + concurrency);
    await Promise.all(
      batch.map(async (segUrl, offset) => {
        const idx = start + offset;
        const r = await fetch(segUrl);
        if (!r.ok) throw new Error(`Segmento HLS falhou (HTTP ${r.status})`);
        const ab = await r.arrayBuffer();
        const bytes = new Uint8Array(ab);
        buffers[idx] = bytes;
        loadedBytes += bytes.byteLength;
        completed += 1;
        const avgSegSize = loadedBytes / Math.max(1, completed);
        onProgress({
          progressPercent: 10 + Math.round((completed / allUrls.length) * 82),
          loadedBytes,
          totalBytes: Math.round(avgSegSize * allUrls.length),
          progressStage: "downloading",
        });
      })
    );
  }

  const merged = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const b of buffers) {
    if (b) {
      merged.set(b, offset);
      offset += b.byteLength;
    }
  }

  if (merged.byteLength < 16384) {
    throw new Error("O fluxo de vídeo baixado está vazio.");
  }

  return {
    buffer: merged.buffer,
    mimeType: initMapUri ? "video/mp4" : "video/mp2t",
    ext: initMapUri ? ".mp4" : ".ts",
  };
}

interface VideoStreamCandidate {
  url: string;
  type: "mp4" | "hls";
  quality?: string;
  audioMode?: string;
}

async function downloadFirstWorkingVideoCandidate(
  candidates: VideoStreamCandidate[],
  meta: {
    tmdbId?: string | number;
    imdbId?: string;
    type: "movie" | "tv";
    season?: number;
    episode?: number;
    title: string;
    year?: string | number;
    audioMode: string;
  },
  baseFileName: string,
  onProgress: (info: TrackedDownloadProgressInfo) => void
): Promise<{
  buffer: ArrayBuffer;
  mimeType: string;
  resolvedDownloadUrl: string;
  fileName: string;
}> {
  let lastError: unknown = null;

  for (const cand of candidates) {
    if (!cand?.url || cand.url.includes("youtube.com") || cand.url.includes("vimeo.com")) {
      continue;
    }

    const isHls = cand.type === "hls" || /\.m3u8(\?|$)/i.test(cand.url) || cand.url.includes("hls-proxy");

    try {
      if (!isHls) {
        const params = new URLSearchParams({
          url: cand.url,
          type: meta.type,
          title: meta.title,
          audioMode: cand.audioMode || meta.audioMode,
        });
        if (meta.tmdbId) params.set("tmdbId", String(meta.tmdbId));
        if (meta.imdbId) params.set("imdbId", meta.imdbId);
        if (meta.year) params.set("year", String(meta.year));
        if (meta.season) params.set("season", String(meta.season));
        if (meta.episode) params.set("episode", String(meta.episode));
        if (cand.quality) params.set("quality", cand.quality);

        const proxyUrl = cand.url.startsWith("/")
          ? cand.url
          : `/api/cinema/mp4-proxy?${params.toString()}`;

        const res = await fetch(proxyUrl);
        if (!res.ok && res.status !== 206) {
          throw new Error(`HTTP ${res.status}`);
        }
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("text/html") || ct.includes("application/json")) {
          throw new Error("Resposta HTML/JSON inválida em vez de vídeo");
        }

        const buffer = await readResponseWithProgress(res, (p) =>
          onProgress({ ...p, progressStage: "downloading" })
        );
        if (buffer.byteLength < 32768) {
          throw new Error("Arquivo de vídeo retornado é inválido ou muito pequeno");
        }

        return {
          buffer,
          mimeType: ct.startsWith("video/") ? ct : "video/mp4",
          resolvedDownloadUrl: proxyUrl,
          fileName: `${baseFileName}.mp4`,
        };
      } else {
        const hlsResult = await downloadHlsStreamAsBinary(cand.url, onProgress);
        return {
          buffer: hlsResult.buffer,
          mimeType: hlsResult.mimeType,
          resolvedDownloadUrl: cand.url.slice(0, 2000),
          fileName: `${baseFileName}${hlsResult.ext}`,
        };
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error("Nenhum servidor de vídeo direto disponível para download neste título.")
  );
}

export async function downloadRealCinemaVideo(params: {
  item: CinemaItem;
  language?: CinemaLanguage;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}): Promise<UserDownloadEntry> {
  const { item } = params;
  const language = params.language || "pt";
  const seasonNum = params.seasonNumber || 1;
  const episodeNum = params.episodeNumber || 1;
  const audioMode = language === "en" ? "original" : "dublado";
  const dubCode = language === "en" ? "en" : "ptbr";
  const dubType = "0";
  const langBadge = language === "en" ? "EN" : "PT-BR";

  const isSerie = item.type === "serie";
  const displayTitle =
    isSerie
      ? `${item.title} — T${String(seasonNum).padStart(2, "0")}E${String(episodeNum).padStart(2, "0")}${params.episodeTitle ? ` (${params.episodeTitle})` : ""}`
      : `${item.title} (${item.year})`;

  const baseFileName = cleanFileBaseName(
    isSerie
      ? `${item.title} - T${String(seasonNum).padStart(2, "0")}E${String(episodeNum).padStart(2, "0")} (${langBadge})`
      : `${item.title} (${item.year}) (${langBadge})`
  );

  return executeTrackedDownload({
    itemId: `${item.id}${isSerie ? `-s${seasonNum}e${episodeNum}` : ""}-${language}`,
    type: "cinema",
    title: displayTitle,
    author: item.director || (isSerie ? "Série Wotho" : "Cinema Wotho"),
    category: isSerie ? `Série · ${langBadge}` : `Filme · ${langBadge}`,
    cover: item.posterUrl || item.backdropUrl,
    openHref: `/cinema/${item.id}`,
    fileName: `${baseFileName}.mp4`,
    mimeType: "video/mp4",
    customDownloader: async (onProgress) => {
      onProgress({ progressPercent: 6, loadedBytes: 0, progressStage: "connecting" });

      const mediaType = isSerie ? "tv" : "movie";
      let resolved = await fetchCinemaResolveCached({
        tmdbId: item.tmdbId,
        imdbId: item.imdbId,
        type: mediaType,
        season: seasonNum,
        episode: episodeNum,
        title: item.originalTitle || item.title,
        year: item.year,
        audioMode,
        dubCode,
        dubType,
        server: "orion",
      }).catch(() => null);

      if (!resolved?.streams?.length) {
        resolved = await fetchCinemaResolveCached({
          tmdbId: item.tmdbId,
          imdbId: item.imdbId,
          type: mediaType,
          season: seasonNum,
          episode: episodeNum,
          title: item.originalTitle || item.title,
          year: item.year,
          audioMode,
          server: "atlas",
        }).catch(() => null);
      }

      const rawStreams: any[] = Array.isArray(resolved?.streams) ? resolved.streams : [];
      const sorted: VideoStreamCandidate[] = [
        ...rawStreams.filter((s) => s.type === "mp4"),
        ...rawStreams.filter((s) => s.type !== "mp4"),
      ].map((s) => ({
        url: s.url,
        type: s.type === "hls" ? "hls" : "mp4",
        quality: s.quality,
        audioMode: s.audioMode,
      }));

      if (sorted.length === 0) {
        throw new Error("Não foi possível resolver o fluxo de vídeo deste título para download.");
      }

      return downloadFirstWorkingVideoCandidate(
        sorted,
        {
          tmdbId: item.tmdbId,
          imdbId: resolved?.imdbId || item.imdbId,
          type: mediaType,
          season: isSerie ? seasonNum : undefined,
          episode: isSerie ? episodeNum : undefined,
          title: item.originalTitle || item.title,
          year: item.year,
          audioMode,
        },
        baseFileName,
        onProgress
      );
    },
  });
}

export async function downloadRealAnimeEpisode(params: {
  anime: Anime;
  season: AnimeSeason;
  episode: AnimeEpisode;
  dubId?: string;
}): Promise<UserDownloadEntry> {
  const { anime, season, episode } = params;
  const dubId = params.dubId || "ptbr:0";
  const [dubCode, dubType] = dubId.split(":");
  const langBadge =
    dubCode === "ptbr" || dubCode === "pt"
      ? dubType === "1"
        ? "LEG PT-BR"
        : "DUB PT-BR"
      : dubCode.toUpperCase();

  const isSteelBallRun = anime.id === "steel-ball-run";
  const tmdbId = ANIME_TMDB_MAP[anime.id];
  const effectiveTmdbSeason = isSteelBallRun ? 6 : season.seasonNumber || 1;
  const effectiveTmdbEpisode = isSteelBallRun
    ? (season.seasonNumber || 1) === 1
      ? 1
      : (episode.number || 1) + 1
    : episode.number || 1;

  const displayTitle = `${anime.title} — T${season.seasonNumber}:Ep.${episode.number} (${episode.title})`;
  const baseFileName = cleanFileBaseName(
    `${anime.title} - T${String(season.seasonNumber).padStart(2, "0")}E${String(episode.number).padStart(2, "0")} (${langBadge})`
  );

  return executeTrackedDownload({
    itemId: `${anime.id}-s${season.seasonNumber}e${episode.number}-${dubCode}-${dubType}`,
    type: "anime",
    title: displayTitle,
    author: anime.studio,
    category: `Anime · ${langBadge}`,
    cover: season.poster || anime.cover,
    openHref: `/animes/${anime.id}`,
    fileName: `${baseFileName}.mp4`,
    mimeType: "video/mp4",
    customDownloader: async (onProgress) => {
      onProgress({ progressPercent: 6, loadedBytes: 0, progressStage: "connecting" });

      const cleanStreamUrl = (episode.streamUrl || "").split("?")[0];
      const catalogDubUrl =
        episode.sources?.find((s) => s.id.includes("dub"))?.streamUrl?.split("?")[0] ||
        (episode.hlsStreamUrl || "").split("?")[0] ||
        cleanStreamUrl;
      const catalogSubUrl =
        episode.sources?.find((s) => s.id.includes("sub") || s.id.includes("legendado"))?.streamUrl?.split("?")[0] ||
        (episode.subHlsStreamUrl || "").split("?")[0] ||
        catalogDubUrl;

      const isCatalogDubExplicit =
        !isSteelBallRun && /-dublado|-dub\b|op-cn|dublado|-pt\.mp4/i.test(catalogDubUrl);

      const audioModeParam =
        dubCode.startsWith("pt") && dubType === "0"
          ? "dublado"
          : dubType === "1"
          ? "legendado"
          : "original";

      let orionStreams: any[] = [];
      if (tmdbId) {
        try {
          const resolved = await fetchCinemaResolveCached({
            tmdbId,
            type: "tv",
            season: effectiveTmdbSeason,
            episode: effectiveTmdbEpisode,
            title: isSteelBallRun ? "JoJo's Bizarre Adventure" : anime.title,
            year: isSteelBallRun ? 2012 : season.year || 2024,
            audioMode: audioModeParam,
            dubCode,
            dubType,
            server: "orion",
          });
          if (Array.isArray(resolved?.streams)) {
            orionStreams = resolved.streams;
          }
        } catch {}
      }

      const candidates: VideoStreamCandidate[] = [];
      const addCand = (url?: string, typeHint?: "mp4" | "hls", quality?: string, mode?: string) => {
        if (!url || !url.startsWith("http")) return;
        if (candidates.some((c) => c.url === url)) return;
        const detectedType: "mp4" | "hls" =
          typeHint || (/\.m3u8(\?|$)/i.test(url) ? "hls" : "mp4");
        candidates.push({ url, type: detectedType, quality, audioMode: mode || audioModeParam });
      };

      // Prioritize exact match based on user audio choice
      if ((dubId === "ptbr:0" || dubId === "pt:0") && isCatalogDubExplicit) {
        addCand(catalogDubUrl);
      }

      for (const s of orionStreams.filter((x) => x.type === "mp4")) {
        addCand(s.url, "mp4", s.quality, s.audioMode);
      }
      for (const s of orionStreams.filter((x) => x.type !== "mp4")) {
        addCand(s.url, "hls", s.quality, s.audioMode);
      }

      if (dubType === "1" || dubCode === "ja") {
        addCand(catalogSubUrl);
        addCand(catalogDubUrl);
      } else {
        addCand(catalogDubUrl);
        addCand(catalogSubUrl);
      }

      if (candidates.length === 0) {
        throw new Error("Nenhum fluxo de vídeo disponível para download deste episódio.");
      }

      return downloadFirstWorkingVideoCandidate(
        candidates,
        {
          tmdbId,
          type: "tv",
          season: effectiveTmdbSeason,
          episode: effectiveTmdbEpisode,
          title: isSteelBallRun ? "JoJo's Bizarre Adventure" : anime.title,
          year: isSteelBallRun ? 2012 : season.year || 2024,
          audioMode: audioModeParam,
        },
        baseFileName,
        onProgress
      );
    },
  });
}
