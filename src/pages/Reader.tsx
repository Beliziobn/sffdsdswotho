import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Type,
  Palette,
  Bookmark,
  Check,
  BookOpen,
  Sparkles,
  Download,
  Share2,
  Search,
  X,
  FileText,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBook, useChapters } from "@/hooks/useCatalog";
import { toast } from "sonner";
import {
  getOriginalPdfForBook,
  getProxiedPdfUrl,
  getDownloadPdfUrl,
} from "@/lib/originalPdfRegistry";
import OriginalPdfViewer from "@/components/books/OriginalPdfViewer";
import { executeTrackedDownload } from "@/lib/downloadsStore";
import { isExcludedItem } from "@/lib/excludedItems";

type ThemeMode = "light" | "sepia" | "dark" | "oled";
type FontSizeMode = "sm" | "md" | "lg" | "xl";
type FontFamilyMode = "serif" | "sans";

const THEMES: Record<
  ThemeMode,
  { label: string; bg: string; text: string; card: string; border: string; accent: string }
> = {
  light: {
    label: "Claro",
    bg: "bg-white",
    text: "text-zinc-900",
    card: "bg-zinc-50",
    border: "border-zinc-200",
    accent: "text-emerald-700",
  },
  sepia: {
    label: "Sépia",
    bg: "bg-[#fbf0d9]",
    text: "text-[#3f3123]",
    card: "bg-[#f2e4c8]",
    border: "border-[#e5d4b3]",
    accent: "text-[#8c501c]",
  },
  dark: {
    label: "Escuro",
    bg: "bg-[#18181b]",
    text: "text-zinc-100",
    card: "bg-[#27272a]",
    border: "border-zinc-800",
    accent: "text-emerald-400",
  },
  oled: {
    label: "Noturno",
    bg: "bg-black",
    text: "text-zinc-300",
    card: "bg-zinc-900",
    border: "border-zinc-900",
    accent: "text-zinc-100",
  },
};

const FONT_SIZES: Record<FontSizeMode, { label: string; textClass: string; leadingClass: string }> = {
  sm: { label: "Pequeno", textClass: "text-base", leadingClass: "leading-relaxed" },
  md: { label: "Médio", textClass: "text-lg", leadingClass: "leading-loose" },
  lg: { label: "Grande", textClass: "text-xl", leadingClass: "leading-loose" },
  xl: { label: "Extra", textClass: "text-2xl", leadingClass: "leading-loose" },
};

const Reader = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const capParam = searchParams.get("cap");
  const { data: book, isLoading: isBookLoading } = useBook(id);
  const { data: chapters = [], isLoading: isChaptersLoading } = useChapters(id);

  const originalPdf = useMemo(() => (id ? getOriginalPdfForBook(id) : undefined), [id]);
  const modeParam = searchParams.get("mode");
  const [readerView, setReaderView] = useState<"pdf" | "text">(() => {
    if (modeParam === "text") return "text";
    if (modeParam === "pdf") return "pdf";
    return originalPdf ? "pdf" : "text";
  });
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);
  const [isDownloadingFallback, setIsDownloadingFallback] = useState(false);

  const handleDownloadFallbackPdf = async () => {
    if (!book || isDownloadingFallback) return;
    setIsDownloadingFallback(true);
    try {
      await executeTrackedDownload({
        itemId: String(book.id),
        type: "book",
        title: book.title || "Livro Digital",
        author: book.author || "Autor Editorial",
        category: book.category,
        description: book.description,
        cover: book.cover_url || undefined,
        sourceUrl: (book as any)?.pdf_url || (book as any)?.download_url || undefined,
        openHref: `/ler/${book.id}`,
        fileName: `${book.title || "livro"}-${book.author || "autor"}.pdf`,
      });
      toast.success("Download concluído! Disponível em Meu Perfil → Downloads.");
    } catch {
      toast.error("Não foi possível transferir o PDF no momento.");
    } finally {
      setIsDownloadingFallback(false);
    }
  };

  const togglePdfFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsPdfFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsPdfFullscreen(false);
    }
  };

  const [index, setIndex] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("worscoi_reader_theme") as ThemeMode) || "light";
  });
  const [fontSize, setFontSize] = useState<FontSizeMode>(() => {
    return (localStorage.getItem("worscoi_reader_font_size") as FontSizeMode) || "md";
  });
  const [fontFamily, setFontFamily] = useState<FontFamilyMode>(() => {
    return (localStorage.getItem("worscoi_reader_font_family") as FontFamilyMode) || "serif";
  });

  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [modalChapterSearch, setModalChapterSearch] = useState("");
  const [modalRange, setModalRange] = useState<number | "all">("all");

  const filteredModalChapters = useMemo(() => {
    const list = chapters.map((ch, originalIdx) => ({ ...ch, originalIdx }));
    if (modalChapterSearch.trim()) {
      const q = modalChapterSearch.toLowerCase().trim();
      return list.filter(
        (ch) =>
          ch.title.toLowerCase().includes(q) ||
          String(ch.position) === q
      );
    }
    if (modalRange !== "all") {
      const start = (modalRange - 1) * 15 + 1;
      const end = modalRange * 15;
      return list.filter((ch) => ch.position >= start && ch.position <= end);
    }
    return list;
  }, [chapters, modalChapterSearch, modalRange]);

  const totalModalRanges = Math.ceil(chapters.length / 15);

  // Restore saved chapter position or prioritize ?cap parameter
  useEffect(() => {
    if (chapters.length > 0) {
      if (capParam !== null) {
        const parsedCap = parseInt(capParam, 10);
        if (!isNaN(parsedCap) && parsedCap >= 0 && parsedCap < chapters.length) {
          setIndex(parsedCap);
          return;
        }
      }
      if (id) {
        const savedIndex = localStorage.getItem(`worscoi_reading_pos_${id}`);
        if (savedIndex !== null) {
          const parsed = parseInt(savedIndex, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < chapters.length) {
            setIndex(parsed);
          }
        }
      }
    }
  }, [id, capParam, chapters.length]);

  // Save progress when index changes
  useEffect(() => {
    if (id && chapters.length > 0) {
      localStorage.setItem(`worscoi_reading_pos_${id}`, String(index));
    }
    if (id && book) {
      const pct = chapters.length <= 1 ? 100 : Math.round(((index + 1) / chapters.length) * 100);
      const chTitle = chapters[index]?.title || `Capítulo ${index + 1}`;
      import("@/lib/userProfileStore").then(({ recordUserHistory }) => {
        recordUserHistory({
          itemId: String(book.id),
          type: "book",
          title: book.title,
          subtitle: book.author,
          cover: book.cover_url || undefined,
          href: `/ler/${book.id}?cap=${index}`,
          progressPercent: pct,
          detailLabel: chTitle,
        });
      }).catch(() => {});
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index, id, chapters, book]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showChaptersModal || showSettingsModal) return;
      if (e.key === "ArrowLeft" || e.key === "j") {
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight" || e.key === "k") {
        setIndex((i) => Math.min(chapters.length - 1, i + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chapters.length, showChaptersModal, showSettingsModal]);

  const currentTheme = THEMES[theme];
  const currentSize = FONT_SIZES[fontSize];
  const chapter = chapters[index];

  const readingPercentage = useMemo(() => {
    if (chapters.length <= 1) return 100;
    return Math.round(((index + 1) / chapters.length) * 100);
  }, [index, chapters.length]);

  const changeTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem("worscoi_reader_theme", newTheme);
  };

  const changeFontSize = (newSize: FontSizeMode) => {
    setFontSize(newSize);
    localStorage.setItem("worscoi_reader_font_size", newSize);
  };

  const changeFontFamily = (newFont: FontFamilyMode) => {
    setFontFamily(newFont);
    localStorage.setItem("worscoi_reader_font_family", newFont);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${book?.title} - ${chapter?.title}`,
        url: window.location.href,
      }).catch(() => undefined);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do capítulo copiado para a área de transferência!");
    }
  };

  const cleanParagraphs = useMemo(() => {
    if (!chapter?.content) return [];
    return chapter.content
      .split(/\r?\n\r?\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [chapter?.content]);

  const chapterWords = useMemo(() => {
    if (!chapter?.content) return 0;
    return chapter.content.trim().split(/\s+/).filter(Boolean).length;
  }, [chapter?.content]);

  const chapterReadTime = useMemo(() => {
    return Math.max(1, Math.round(chapterWords / 160));
  }, [chapterWords]);

  const renderFormattedText = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(
          <strong key={key++} className="font-semibold text-foreground dark:text-zinc-100">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        parts.push(
          <em key={key++} className="italic opacity-90">
            {match[3]}
          </em>
        );
      } else if (match[4]) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 font-medium"
          >
            {match[4]}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  if (isExcludedItem({ id })) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${currentTheme.bg} ${currentTheme.text}`}>
        <p className="text-sm font-light mb-4 opacity-80">Livro não encontrado ou indisponível.</p>
        <Link to="/livros" className="text-xs uppercase tracking-wider text-primary underline">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const isPublicDomain = id?.startsWith("guten-") || id?.includes("gutenberg") || !book?.price_cents;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${currentTheme.bg} ${currentTheme.text}`}>
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-black/10">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${readingPercentage}%` }}
        />
      </div>

      {/* Reader Sticky Header */}
      <header
        className={`sticky top-0 z-40 border-b ${currentTheme.border} ${currentTheme.bg}/95 backdrop-blur px-4 sm:px-6 py-3 transition-colors duration-200`}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link
            to={`/livros/${id}`}
            className="flex items-center gap-2 text-xs sm:text-sm font-medium opacity-80 hover:opacity-100 transition-opacity truncate max-w-[200px] sm:max-w-xs"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate">{book?.title ?? "Voltar"}</span>
          </Link>

          {/* In Text mode: chapter selector & appearance */}
          {readerView === "text" && chapters.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Chapter selector button */}
              <button
                onClick={() => setShowChaptersModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${currentTheme.border} ${currentTheme.card} hover:opacity-90 transition-all`}
                title="Índice de Capítulos"
              >
                <List className="h-3.5 w-3.5" />
                <span>
                  Cap. {index + 1}/{chapters.length}
                </span>
              </button>

              {/* Reader Appearance Settings */}
              <button
                onClick={() => setShowSettingsModal(!showSettingsModal)}
                className={`p-2 rounded-full border ${currentTheme.border} ${currentTheme.card} hover:opacity-90 transition-all`}
                title="Configurações de Leitura (Fonte, Cor, Tamanho)"
              >
                <Type className="h-4 w-4" />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className={`hidden sm:flex p-2 rounded-full border ${currentTheme.border} ${currentTheme.card} hover:opacity-90 transition-all`}
                title="Compartilhar"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Floating Settings Dropdown */}
        {showSettingsModal && (
          <div
            className={`mt-3 p-4 mx-auto max-w-md rounded-2xl border shadow-xl ${currentTheme.card} ${currentTheme.border} transition-all`}
          >
            <div className="space-y-4">
              {/* Themes */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold opacity-70 block mb-2">
                  Tema de Leitura
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(THEMES) as ThemeMode[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => changeTheme(t)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-medium transition-all ${
                        theme === t ? "ring-2 ring-emerald-500 font-bold" : "opacity-80 hover:opacity-100"
                      } ${THEMES[t].bg} ${THEMES[t].text} ${THEMES[t].border}`}
                    >
                      <span>{THEMES[t].label}</span>
                      {theme === t && <Check className="h-3 w-3 mt-1 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold opacity-70 block mb-2">
                  Tamanho da Letra
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(FONT_SIZES) as FontSizeMode[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => changeFontSize(s)}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                        fontSize === s
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : `border ${currentTheme.border} ${currentTheme.bg} opacity-80 hover:opacity-100`
                      }`}
                    >
                      {FONT_SIZES[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="text-xs uppercase tracking-wider font-semibold opacity-70 block mb-2">
                  Tipografia
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => changeFontFamily("serif")}
                    className={`py-2 px-3 rounded-xl border font-serif text-sm transition-all ${
                      fontFamily === "serif"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : `border ${currentTheme.border} ${currentTheme.bg} opacity-80`
                    }`}
                  >
                    Serifada Clássica
                  </button>
                  <button
                    onClick={() => changeFontFamily("sans")}
                    className={`py-2 px-3 rounded-xl border font-sans text-sm transition-all ${
                      fontFamily === "sans"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : `border ${currentTheme.border} ${currentTheme.bg} opacity-80`
                    }`}
                  >
                    Sem Serifa Moderna
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Chapter Selection Modal */}
      {showChaptersModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            className={`w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${currentTheme.card} ${currentTheme.border}`}
          >
            <div className={`p-4 border-b ${currentTheme.border} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="font-semibold text-base leading-tight">Índice da Obra</h3>
                  <span className="text-[11px] opacity-70 font-light">
                    {chapters.length} capítulos disponíveis
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChaptersModal(false);
                  setModalChapterSearch("");
                }}
                className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border opacity-75 hover:opacity-100 transition-opacity"
              >
                Fechar
              </button>
            </div>

            {/* Fast Chapter Search */}
            <div className={`p-3 border-b ${currentTheme.border} ${currentTheme.bg}`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-50" />
                <input
                  type="text"
                  value={modalChapterSearch}
                  onChange={(e) => {
                    setModalChapterSearch(e.target.value);
                    if (e.target.value) setModalRange("all");
                  }}
                  placeholder="Filtrar por nome ou número..."
                  className={`w-full ${currentTheme.card} border ${currentTheme.border} rounded-lg pl-9 pr-9 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all`}
                  autoFocus
                />
                {modalChapterSearch && (
                  <button
                    onClick={() => setModalChapterSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Jump Range Switcher */}
              {!modalChapterSearch && totalModalRanges > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 scrollbar-none">
                  <span className="text-[10px] opacity-60 uppercase tracking-wider shrink-0 mr-1">
                    Saltos:
                  </span>
                  <button
                    onClick={() => setModalRange("all")}
                    className={`px-2.5 py-1 text-[11px] rounded-md transition-colors shrink-0 ${
                      modalRange === "all"
                        ? "bg-emerald-600 text-white font-medium"
                        : "opacity-70 hover:opacity-100 border border-transparent hover:border-black/10 dark:hover:border-white/10"
                    }`}
                  >
                    Todos
                  </button>
                  {Array.from({ length: totalModalRanges }, (_, i) => {
                    const blockNum = i + 1;
                    const start = i * 15 + 1;
                    const end = Math.min((i + 1) * 15, chapters.length);
                    return (
                      <button
                        key={blockNum}
                        onClick={() => setModalRange(blockNum)}
                        className={`px-2 py-0.5 text-[11px] rounded-md transition-colors shrink-0 ${
                          modalRange === blockNum
                            ? "bg-emerald-600 text-white font-medium"
                            : "opacity-70 hover:opacity-100 border border-transparent hover:border-black/10 dark:hover:border-white/10"
                        }`}
                      >
                        {start}–{end}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="overflow-y-auto p-3 space-y-1 divide-y divide-black/5 dark:divide-white/5">
              {filteredModalChapters.map((ch) => (
                <button
                  key={ch.id || ch.originalIdx}
                  onClick={() => {
                    setIndex(ch.originalIdx);
                    setShowChaptersModal(false);
                    setModalChapterSearch("");
                  }}
                  className={`w-full text-left p-3 rounded-xl text-sm flex items-center justify-between transition-all ${
                    ch.originalIdx === index
                      ? "bg-emerald-600 text-white font-medium"
                      : `hover:${currentTheme.bg} opacity-85 hover:opacity-100`
                  }`}
                >
                  <span className="truncate pr-4 flex items-center gap-2">
                    <span className="font-mono text-xs opacity-60 w-6 text-right shrink-0">
                      {ch.position}.
                    </span>
                    <span className="truncate">
                      {ch.title.replace(/^Cap[íi]tulo\s*\d+\s*:\s*/i, "")}
                    </span>
                  </span>
                  {ch.originalIdx === index && <Check className="h-4 w-4 shrink-0 text-white" />}
                </button>
              ))}
              {filteredModalChapters.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-xs opacity-60 mb-2">
                    Nenhum capítulo encontrado para "{modalChapterSearch}".
                  </p>
                  <button
                    onClick={() => setModalChapterSearch("")}
                    className="text-xs text-emerald-500 underline"
                  >
                    Limpar filtro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Canvas */}
      {originalPdf && readerView === "pdf" ? (
        <main className="w-full max-w-6xl mx-auto px-2 sm:px-6 py-4 sm:py-6">
          <OriginalPdfViewer
            pdfUrl={getProxiedPdfUrl(
              originalPdf.pdfUrl,
              `${originalPdf.title}-${originalPdf.author}.pdf`,
              originalPdf.id
            )}
            downloadUrl={getDownloadPdfUrl(
              originalPdf.pdfUrl,
              `${originalPdf.title}-${originalPdf.author}.pdf`,
              originalPdf.id
            )}
            originalPdfUrl={originalPdf.pdfUrl}
            itemId={id || book?.id || originalPdf.id}
            cover={book?.cover_url || originalPdf.coverUrl}
            category={book?.category || originalPdf.category}
            description={book?.description || originalPdf.description}
            title={originalPdf.title}
            author={originalPdf.author}
            pagesCount={originalPdf.originalPagesCount}
            fileSizeFormatted={originalPdf.fileSizeFormatted}
            year={originalPdf.year}
            sourceRepository={originalPdf.sourceRepository}
            editionNotes={originalPdf.editionNotes}
            onSwitchToText={() => setReaderView("text")}
            hasTextMode={chapters.length > 0}
          />
        </main>
      ) : (
        <main className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-16">
          {/* Notice when viewing text mode but authentic original PDF is also available */}
          {originalPdf && (
            <div className="mb-8 p-3 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <FileText className="h-4 w-4 shrink-0" />
                <span>Esta obra possui a edição física integral original em PDF ({originalPdf.fileSizeFormatted}).</span>
              </div>
              <button
                type="button"
                onClick={() => setReaderView("pdf")}
                className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs self-start sm:self-auto shrink-0 shadow-sm transition-colors"
              >
                Abrir PDF Original
              </button>
            </div>
          )}

          {isChaptersLoading || isBookLoading ? (
            <div className="py-24 text-center">
              <BookOpen className="mx-auto h-8 w-8 animate-pulse text-emerald-500 mb-4" />
              <h2 className="text-xl font-medium">Carregando obra completa...</h2>
              <p className="mt-2 text-xs opacity-60">
                Conectando aos arquivos de alta fidelidade do Projeto Gutenberg
              </p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <BookOpen className="mx-auto h-8 w-8 text-emerald-500 mb-4 animate-bounce" />
              <h1 className="text-2xl font-serif">{book?.title || "Obra Literária"}</h1>
              <p className="mt-2 text-xs text-muted-foreground font-light">
                Por {book?.author || "Autor Editorial"} · Categoria {book?.category || "Literatura"}
              </p>
              <div className="mt-6 p-4 rounded-xl border border-border/70 bg-card text-left text-sm leading-relaxed whitespace-pre-wrap">
                {book?.description || "Edição digital completa disponível para leitura."}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadFallbackPdf}
                  disabled={isDownloadingFallback}
                  className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-md"
                >
                  <Download className="h-3.5 w-3.5" />
                  {isDownloadingFallback ? "Transferindo..." : "Baixar Edição em PDF"}
                </button>
                <Button asChild variant="outline" className="rounded-full text-xs">
                  <Link to={`/livros/${id}`}>Voltar ao detalhe</Link>
                </Button>
              </div>
            </div>
          ) : (
            <article className={fontFamily === "serif" ? "font-serif" : "font-sans"}>
              {/* Chapter Header */}
              <header className="mb-12 pb-8 border-b border-black/10 dark:border-white/10 text-center">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <span className="text-[11px] uppercase tracking-widest opacity-60 font-medium">
                  {book?.title} · Capítulo {chapter.position} de {chapters.length}
                </span>
                <span className="text-[11px] opacity-40">·</span>
                <span className="text-[11px] font-mono opacity-60">
                  ~{chapterReadTime} min de leitura · {chapterWords.toLocaleString()} palavras
                </span>
              </div>

              <h1 className="mt-2 text-2xl sm:text-4xl font-normal tracking-tight">
                {chapter.title}
              </h1>
            </header>

            {/* Chapter Body with Rich Formatting */}
            <div className={`space-y-6 ${currentSize.textClass} ${currentSize.leadingClass} tracking-normal`}>
              {cleanParagraphs.map((paragraph, i) => {
                // Markdown Table detection
                if (paragraph.trim().startsWith("|") && paragraph.includes("\n|")) {
                  const rows = paragraph
                    .trim()
                    .split("\n")
                    .filter((r) => r.trim().startsWith("|"));
                  const headerRow = rows[0];
                  const dataRows = rows.slice(1).filter((r) => !r.includes("---"));
                  const headers = headerRow
                    .split("|")
                    .map((c) => c.trim())
                    .filter(Boolean);

                  return (
                    <div key={i} className="my-8 overflow-x-auto border rounded-xl shadow-sm">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="border-b bg-black/5 dark:bg-white/5 font-semibold">
                            {headers.map((h, hIdx) => (
                              <th key={hIdx} className="p-3 border-r last:border-r-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                          {dataRows.map((r, rIdx) => {
                            const cells = r
                              .split("|")
                              .map((c) => c.trim())
                              .filter(Boolean);
                            return (
                              <tr
                                key={rIdx}
                                className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                              >
                                {cells.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-3 border-r last:border-r-0 font-light">
                                    {renderFormattedText(cell)}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (paragraph.startsWith("### ")) {
                  return (
                    <h3
                      key={i}
                      className="text-xl sm:text-2xl font-semibold tracking-tight mt-10 mb-4 text-emerald-700 dark:text-emerald-400"
                    >
                      {renderFormattedText(paragraph.replace(/^###\s+/, ""))}
                    </h3>
                  );
                }
                if (paragraph.startsWith("#### ")) {
                  return (
                    <h4
                      key={i}
                      className="text-lg sm:text-xl font-medium tracking-tight mt-8 mb-3 opacity-90 text-foreground"
                    >
                      {renderFormattedText(paragraph.replace(/^####\s+/, ""))}
                    </h4>
                  );
                }
                if (paragraph.startsWith("> ")) {
                  return (
                    <blockquote
                      key={i}
                      className="my-6 pl-5 border-l-4 border-emerald-500 italic opacity-95 text-base sm:text-lg bg-emerald-500/5 py-4 rounded-r-xl"
                    >
                      {renderFormattedText(
                        paragraph.replace(/^>\s*"?/, "").replace(/"?\s*$/, "")
                      )}
                    </blockquote>
                  );
                }
                if (
                  paragraph.includes("\n* ") ||
                  paragraph.startsWith("* ") ||
                  paragraph.includes("\n- ") ||
                  paragraph.startsWith("- ")
                ) {
                  const items = paragraph
                    .split("\n")
                    .filter((l) => l.trim().startsWith("* ") || l.trim().startsWith("- "));
                  return (
                    <ul key={i} className="my-4 space-y-2 list-disc list-inside">
                      {items.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {renderFormattedText(item.replace(/^(\*|-)\s+/, ""))}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="text-justify indent-6">
                    {renderFormattedText(paragraph)}
                  </p>
                );
              })}
            </div>

            {/* Bottom Chapter Navigation */}
            <div className="mt-20 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium border ${currentTheme.border} ${currentTheme.card} ${
                  index === 0 ? "opacity-30 cursor-not-allowed" : "hover:opacity-100 opacity-80"
                }`}
              >
                <ChevronLeft className="h-4 w-4" /> Capítulo Anterior
              </button>

              <span className="text-xs opacity-60 font-mono">
                {index + 1} de {chapters.length} ({readingPercentage}%)
              </span>

              <button
                disabled={index >= chapters.length - 1}
                onClick={() => setIndex((i) => Math.min(chapters.length - 1, i + 1))}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition-all ${
                  index >= chapters.length - 1 ? "opacity-30 cursor-not-allowed" : ""
                }`}
              >
                Próximo Capítulo <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Floating chapter shortcuts note */}
            <div className="mt-8 text-center text-xs opacity-50">
              Dica: Você também pode usar as setas do teclado (← e →) para alternar entre os capítulos.
            </div>
          </article>
        )}
      </main>
    )}
  </div>
);
};

export default Reader;
