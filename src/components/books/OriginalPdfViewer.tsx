import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
  ExternalLink,
  BookOpen,
  LayoutList,
  Columns,
  RefreshCw,
  FileText,
  AlertCircle,
  Expand,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { getPdfBytesFromIndexedDB } from "@/lib/pdfUploadService";
import { executeTrackedDownload } from "@/lib/downloadsStore";
import { toast } from "sonner";

// Configure worker with local asset URL and fallback to CDN
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker ||
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

interface OriginalPdfViewerProps {
  pdfUrl: string;
  downloadUrl: string;
  originalPdfUrl?: string;
  itemId?: string;
  cover?: string;
  category?: string;
  description?: string;
  pdfBytes?: Uint8Array;
  title: string;
  author: string;
  pagesCount?: number;
  fileSizeFormatted?: string;
  year?: number;
  sourceRepository?: string;
  editionNotes?: string;
  onSwitchToText?: () => void;
  hasTextMode?: boolean;
}

export const OriginalPdfViewer: React.FC<OriginalPdfViewerProps> = ({
  pdfUrl,
  downloadUrl,
  originalPdfUrl,
  itemId,
  cover,
  category,
  description,
  pdfBytes,
  title,
  author,
  pagesCount,
  fileSizeFormatted,
  year,
  sourceRepository,
  editionNotes,
  onSwitchToText,
  hasTextMode = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const singleCanvasRef = useRef<HTMLCanvasElement>(null);
  const continuousContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(pagesCount || 0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"single" | "continuous">("single");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>("1");
  const [renderedContinuousPages, setRenderedContinuousPages] = useState<Set<number>>(new Set());

  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleTrackedPdfDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await executeTrackedDownload({
        itemId:
          itemId ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        type: "pdf",
        title,
        author,
        category,
        description,
        cover,
        sourceUrl: originalPdfUrl || downloadUrl || pdfUrl,
        openHref: itemId ? `/ler/${itemId}?mode=pdf` : undefined,
        fileName: `${title}-${author}.pdf`,
        expectedFileSizeFormatted: fileSizeFormatted,
      });
      toast.success("Download concluído! Disponível em Meu Perfil → Downloads.");
    } catch {
      toast.error("Não foi possível transferir o PDF no momento.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Load PDF Document
  const loadPdf = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingProgress(10);

    try {
      const targetRef =
        pdfUrl.startsWith("idb://")
          ? pdfUrl
          : originalPdfUrl?.startsWith("idb://")
          ? originalPdfUrl
          : pdfUrl;

      let loadingTask: any;
      if (pdfBytes && pdfBytes.byteLength > 0) {
        loadingTask = pdfjsLib.getDocument({
          data: pdfBytes.slice(),
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });
      } else if (targetRef.startsWith("idb://")) {
        const idbBytes = await getPdfBytesFromIndexedDB(targetRef);
        if (!idbBytes) {
          throw new Error("Arquivo PDF local não encontrado no dispositivo.");
        }
        loadingTask = pdfjsLib.getDocument({
          data: idbBytes,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });
      } else if (targetRef.startsWith("data:application/pdf;base64,")) {
        const b64 = targetRef.replace(/^data:application\/pdf;base64,/, "");
        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        loadingTask = pdfjsLib.getDocument({
          data: bytes,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });
      } else {
        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
          withCredentials: false,
        });
      }

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (progressData.total > 0) {
          const pct = Math.round((progressData.loaded / progressData.total) * 100);
          setLoadingProgress(Math.min(95, pct));
        }
      };

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      setPageInput("1");
      setLoadingProgress(100);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Erro ao carregar PDF via PDF.js:", err);
      // If proxied URL had an issue and original url is provided, attempt fallback
      if (originalPdfUrl && pdfUrl !== originalPdfUrl && !originalPdfUrl.startsWith("idb://")) {
        try {
          const fallbackTask = pdfjsLib.getDocument({
            url: originalPdfUrl,
            withCredentials: false,
          });
          const doc = await fallbackTask.promise;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setIsLoading(false);
          return;
        } catch (fallbackErr) {
          console.error("Falha também no fallback direto:", fallbackErr);
        }
      }
      setErrorMessage(
        "Não foi possível renderizar a edição física do PDF no momento. Você pode baixar o arquivo diretamente ou ler a versão textual."
      );
      setIsLoading(false);
    }
  }, [pdfUrl, originalPdfUrl, pdfBytes]);

  useEffect(() => {
    loadPdf();
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [loadPdf]);

  // Render Single Page on Canvas
  const renderSinglePage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || !singleCanvasRef.current || viewMode !== "single") return;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }

      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = singleCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale, rotation });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Erro na renderização da página:", err);
        }
      }
    },
    [pdfDoc, scale, rotation, viewMode]
  );

  useEffect(() => {
    if (viewMode === "single" && pdfDoc) {
      renderSinglePage(currentPage);
    }
  }, [viewMode, pdfDoc, currentPage, scale, rotation, renderSinglePage]);

  // Handle Page Changes
  const goToPage = (page: number) => {
    if (!pdfDoc) return;
    const target = Math.max(1, Math.min(numPages, page));
    setCurrentPage(target);
    setPageInput(target.toString());

    if (viewMode === "continuous" && continuousContainerRef.current) {
      const pageEl = continuousContainerRef.current.querySelector(
        `[data-page-number="${target}"]`
      );
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      goToPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // Zoom controls
  const zoomIn = () => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)));
  const zoomOut = () => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)));
  const resetZoom = () => setScale(1.2);
  const fitToWidth = () => {
    if (!containerRef.current) return;
    const availableWidth = containerRef.current.clientWidth - 48;
    // Standard PDF page width is ~595pt at scale 1.0
    const calculatedScale = +(availableWidth / 620).toFixed(2);
    setScale(Math.max(0.6, Math.min(2.2, calculatedScale)));
  };

  // Rotate
  const rotateClockwise = () => {
    setRotation((r) => (r + 90) % 360);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, numPages]);

  // Lazy render for continuous mode
  const renderContinuousPage = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement) => {
      if (!pdfDoc || !canvas) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale, rotation });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        await page.render({ canvasContext: ctx, viewport }).promise;
        setRenderedContinuousPages((prev) => new Set(prev).add(pageNum));
      } catch (err) {
        console.error(`Erro ao renderizar página contínua ${pageNum}:`, err);
      }
    },
    [pdfDoc, scale, rotation]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "min-h-[82vh]"
      }`}
    >
      {/* Top Header & Physical Book Details */}
      <div className="border-b border-border bg-card/95 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            {year && year > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground hidden md:inline">
                  Ano {year}
                </span>
              </div>
            )}
            <h2 className="text-sm sm:text-base font-semibold truncate tracking-tight">
              {title} <span className="text-muted-foreground font-normal">— {author}</span>
            </h2>
            {editionNotes && (
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                {editionNotes} {sourceRepository ? `(${sourceRepository})` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {hasTextMode && onSwitchToText && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToText}
              className="text-xs h-8 gap-1 rounded-full border-border hover:bg-accent"
              title="Alternar para visualização de texto adaptado"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Texto Adaptado</span>
            </Button>
          )}

          <button
            type="button"
            onClick={handleTrackedPdfDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-medium shadow-sm transition-colors"
            title="Baixar arquivo físico original em formato .pdf e salvar no seu histórico de Downloads"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isDownloading ? "Baixando..." : "Baixar .pdf"}</span>
          </button>

          {originalPdfUrl && (
            <a
              href={originalPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Abrir no Repositório Digital (Archive.org)"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Reading Tool & Navigation Bar */}
      <div className="border-b border-border bg-accent/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowThumbnails((v) => !v)}
            className={`h-7 px-2 text-xs gap-1 rounded-md ${
              showThumbnails ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
            }`}
            title="Alternar painel de páginas"
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Páginas</span>
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={handlePrevPage}
            className="h-7 w-7 p-0 rounded-md"
            title="Página anterior (Seta esquerda)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 font-mono text-xs">
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = parseInt(pageInput, 10);
                  if (!isNaN(val)) goToPage(val);
                }
              }}
              className="w-11 h-7 text-center rounded border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <span className="text-muted-foreground">de {numPages || 1}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= numPages || isLoading}
            onClick={handleNextPage}
            className="h-7 w-7 p-0 rounded-md"
            title="Próxima página (Seta direita)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: Zoom and Mode Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            disabled={scale <= 0.6 || isLoading}
            onClick={zoomOut}
            className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-foreground"
            title="Diminuir zoom (-)"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>

          <span
            onClick={resetZoom}
            className="cursor-pointer select-none font-mono text-[11px] px-1.5 py-0.5 rounded bg-background border border-border hover:bg-accent"
            title="Clique para redefinir zoom"
          >
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            disabled={scale >= 2.5 || isLoading}
            onClick={zoomIn}
            className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-foreground"
            title="Aumentar zoom (+)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fitToWidth}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md hidden sm:inline-flex gap-1"
            title="Ajustar à largura da tela"
          >
            <Expand className="h-3 w-3" />
            <span>Ajustar</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={rotateClockwise}
            className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-foreground"
            title="Girar 90° no sentido horário"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: Layout Mode (Single vs Continuous) */}
        <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setViewMode("single")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === "single"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Exibir uma página por vez"
          >
            Página Única
          </button>
          <button
            type="button"
            onClick={() => setViewMode("continuous")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === "continuous"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Rolagem vertical contínua de todas as páginas"
          >
            Rolagem
          </button>
        </div>
      </div>

      {/* Main Reading Area */}
      <div className="relative flex-1 flex overflow-hidden bg-zinc-900/95 dark:bg-black/90">
        {/* Thumbnails Sidebar */}
        {showThumbnails && numPages > 0 && (
          <aside className="w-48 sm:w-56 shrink-0 border-r border-white/10 bg-zinc-950/90 overflow-y-auto p-3 space-y-2 z-10 transition-all">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 px-1 mb-2">
              Índice de Páginas ({numPages})
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`p-2 rounded-lg text-center text-xs border transition-all ${
                    p === currentPage
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold"
                      : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/30"
                  }`}
                >
                  <FileText className="h-4 w-4 mx-auto mb-1 opacity-60" />
                  Pág. {p}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Canvas Display Viewport */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-4 sm:p-8 scroll-smooth">
          {isLoading && (
            <div className="my-auto py-16 text-center space-y-4 max-w-sm px-4">
              <div className="relative mx-auto w-12 h-12">
                <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin opacity-80" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-white">Carregando livro físico original...</h3>
                <p className="text-xs text-zinc-400">
                  Descompactando páginas de alta resolução preservadas do acervo
                </p>
              </div>
              {loadingProgress > 0 && (
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {errorMessage && !isLoading && (
            <div className="my-auto py-12 px-6 max-w-md text-center bg-zinc-950/80 rounded-2xl border border-red-500/20 space-y-4">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
              <div>
                <h3 className="text-base font-semibold text-white">Aviso de Leitura do PDF</h3>
                <p className="text-xs text-zinc-400 mt-1">{errorMessage}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPdf}
                  className="w-full sm:w-auto text-xs rounded-full gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tentar Novamente
                </Button>
                <button
                  type="button"
                  onClick={handleTrackedPdfDownload}
                  disabled={isDownloading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-medium transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isDownloading ? "Transferindo PDF..." : "Baixar Arquivo PDF"}
                </button>
              </div>
            </div>
          )}

          {!isLoading && !errorMessage && (
            <>
              {/* Single Page View */}
              {viewMode === "single" && (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white">
                    <canvas
                      ref={singleCanvasRef}
                      className="block mx-auto max-w-full transition-transform"
                    />
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">
                    Página {currentPage} de {numPages}
                  </div>
                </div>
              )}

              {/* Continuous Scroll View */}
              {viewMode === "continuous" && (
                <div
                  ref={continuousContainerRef}
                  className="flex flex-col items-center space-y-8 w-full max-w-4xl"
                >
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <ContinuousPdfPage
                      key={pageNum}
                      pageNum={pageNum}
                      pdfDoc={pdfDoc}
                      scale={scale}
                      rotation={rotation}
                      onVisible={(p) => {
                        setCurrentPage(p);
                        setPageInput(p.toString());
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Subcomponent for each page in Continuous Mode (Lazy renders with IntersectionObserver)
interface ContinuousPdfPageProps {
  pageNum: number;
  pdfDoc: any;
  scale: number;
  rotation: number;
  onVisible: (pageNum: number) => void;
}

const ContinuousPdfPage: React.FC<ContinuousPdfPageProps> = ({
  pageNum,
  pdfDoc,
  scale,
  rotation,
  onVisible,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 850,
  });

  // Calculate default viewport dimensions early so scroll height is correct
  useEffect(() => {
    let active = true;
    if (pdfDoc) {
      pdfDoc.getPage(pageNum).then((page: any) => {
        if (!active) return;
        const vp = page.getViewport({ scale, rotation });
        setPageDimensions({ width: vp.width, height: vp.height });
      });
    }
    return () => {
      active = false;
    };
  }, [pdfDoc, scale, rotation, pageNum]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          onVisible(pageNum);
          if (!isRendered && pdfDoc && canvasRef.current) {
            renderPage();
          }
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pdfDoc, isRendered, pageNum, scale, rotation]);

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const viewport = page.getViewport({ scale, rotation });
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      await page.render({ canvasContext: ctx, viewport }).promise;
      setIsRendered(true);
    } catch (err) {
      console.error(`Erro ao renderizar página ${pageNum}:`, err);
    }
  };

  // Re-render when zoom/rotation changes if already visible
  useEffect(() => {
    if (isRendered) {
      renderPage();
    }
  }, [scale, rotation]);

  return (
    <div
      ref={containerRef}
      data-page-number={pageNum}
      className="flex flex-col items-center space-y-2"
    >
      <div
        className="relative bg-white shadow-2xl rounded-sm overflow-hidden"
        style={{
          minWidth: `${Math.floor(pageDimensions.width)}px`,
          minHeight: `${Math.floor(pageDimensions.height)}px`,
        }}
      >
        <canvas ref={canvasRef} className="block mx-auto" />
      </div>
      <span className="text-[11px] text-zinc-400 font-mono">Página {pageNum}</span>
    </div>
  );
};

export default OriginalPdfViewer;
