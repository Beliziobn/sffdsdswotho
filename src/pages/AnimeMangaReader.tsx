import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Tv,
  BookOpen,
  Sparkles,
  Loader2,
  RefreshCw,
  Zap,
  Globe,
} from "lucide-react";
import {
  ANIMES_DATA,
  Anime,
  MangaChapter,
  saveMangaProgress,
  getMangaProgress,
} from "@/lib/animes";
import {
  fetchMangaDexChapters,
  fetchMangaDexChapterPages,
  fetchAnimeMangaChapters,
  fetchAnimeMangaPages,
  MangaDexChapter,
} from "@/lib/mangadex";
import { useContentProtection } from "@/hooks/useContentProtection";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { WorscoiIntroPlayer } from "@/components/WorscoiIntroPlayer";

interface UnifiedChapter {
  id: string;
  number: string | number;
  numericNumber: number;
  title: string;
  pagesCount: number;
  pages?: string[];
  chapterUrl?: string;
  mangadexChapterId?: string;
  source: "local" | "manga" | "webtoon" | "mangadex";
  language?: string;
  group?: string;
}

export const AnimeMangaReader = () => {
  useContentProtection();
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
  const navigate = useNavigate();

  const anime: Anime | undefined = useMemo(() => {
    return ANIMES_DATA.find((a) => a.id === id || a.slug === id);
  }, [id]);

  // Online manga chapters loaded dynamically
  const [onlineChapters, setOnlineChapters] = useState<MangaDexChapter[]>([]);
  const [isFetchingChapterList, setIsFetchingChapterList] = useState(false);

  // Reader state
  const [readingMode, setReadingMode] = useState<"vertical" | "single">("vertical");
  const [imageQuality, setImageQuality] = useState<"data" | "dataSaver">("data");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolvedPages, setResolvedPages] = useState<string[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);

  const [mangaLanguage, setMangaLanguage] = useState<"pt" | "en" | "ja">(() => {
    return (localStorage.getItem("worscoi_manga_language") as "pt" | "en" | "ja") || "pt";
  });

  const handleSetLanguage = (lang: "pt" | "en" | "ja") => {
    setMangaLanguage(lang);
    localStorage.setItem("worscoi_manga_language", lang);
    toast.success(
      lang === "pt"
        ? "Idioma do Mangá: Português (PT-BR) — Recarregando páginas..."
        : lang === "en"
        ? "Manga Language: English (EN) — Loading English pages..."
        : "マンガ言語: 日本語 (Japonês / Original) — Carregando edição japonesa..."
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch full chapter list from multi-source manga engine
  useEffect(() => {
    if (!anime) return;
    let isMounted = true;
    setIsFetchingChapterList(true);

    fetchAnimeMangaChapters(anime.id)
      .then((list) => {
        if (!isMounted) return;
        if (list.length > 0) {
          setOnlineChapters(list);
        } else if (anime.manga?.mangadexId) {
          fetchMangaDexChapters(anime.manga.mangadexId, "all").then((fallbackList) => {
            if (isMounted) setOnlineChapters(fallbackList);
          }).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("Could not load online chapter list:", err);
      })
      .finally(() => {
        if (isMounted) setIsFetchingChapterList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anime]);

  // Unified list of chapters combining pre-seeded local and online chapters
  const allChapters: UnifiedChapter[] = useMemo(() => {
    const list: UnifiedChapter[] = [];
    const seenNumbers = new Set<number>();

    // 1. Add local chapters first if present
    if (anime?.manga?.chapters) {
      for (const ch of anime.manga.chapters) {
        list.push({
          id: ch.id,
          number: ch.number,
          numericNumber: ch.number,
          title: ch.title,
          pagesCount: ch.pagesCount,
          pages: ch.pages && ch.pages.length > 0 ? ch.pages : undefined,
          chapterUrl: (ch as any).chapterUrl,
          mangadexChapterId: ch.mangadexChapterId,
          source: ch.pages && ch.pages.length > 0 ? "local" : "manga",
          language: mangaLanguage === "pt" ? "PT-BR" : mangaLanguage === "en" ? "EN" : "JA",
        });
        seenNumbers.add(ch.number);
      }
    }

    // 2. Add or merge online chapters
    for (const och of onlineChapters) {
      const existing = list.find((c) => c.numericNumber === och.numericNumber);
      if (existing) {
        if (!existing.chapterUrl && och.chapterUrl) existing.chapterUrl = och.chapterUrl;
        if (!existing.mangadexChapterId && och.id) existing.mangadexChapterId = och.id;
        if (och.id) existing.id = och.id;
      } else {
        list.push({
          id: och.id,
          number: och.number,
          numericNumber: och.numericNumber,
          title: och.title,
          pagesCount: och.pagesCount,
          chapterUrl: och.chapterUrl,
          mangadexChapterId: och.id,
          source: och.chapterUrl ? "manga" : "mangadex",
          language: mangaLanguage === "pt" ? "PT-BR" : mangaLanguage === "en" ? "EN" : "JA",
          group: och.scanlationGroup,
        });
        seenNumbers.add(och.numericNumber);
      }
    }

    // Sort ascending by chapter number
    return list.sort((a, b) => a.numericNumber - b.numericNumber);
  }, [anime, onlineChapters, mangaLanguage]);

  // Current active chapter
  const currentChapter: UnifiedChapter | undefined = useMemo(() => {
    if (!allChapters.length) {
      const fallbackLocal = anime?.manga?.chapters?.[0];
      if (fallbackLocal) {
        return {
          id: fallbackLocal.id,
          number: fallbackLocal.number,
          numericNumber: fallbackLocal.number,
          title: fallbackLocal.title,
          pagesCount: fallbackLocal.pagesCount,
          pages: fallbackLocal.pages,
          chapterUrl: (fallbackLocal as any).chapterUrl,
          mangadexChapterId: fallbackLocal.mangadexChapterId,
          source: fallbackLocal.pages && fallbackLocal.pages.length > 0 ? "local" : "manga",
        };
      }
      return undefined;
    }

    if (chapterId) {
      const cleanId = decodeURIComponent(chapterId).trim();
      return (
        allChapters.find(
          (c) =>
            c.id === cleanId ||
            String(c.number) === cleanId ||
            c.chapterUrl === cleanId ||
            c.chapterUrl === `/chapters/${cleanId}` ||
            c.mangadexChapterId === cleanId ||
            (c.chapterUrl && c.chapterUrl.includes(cleanId)) ||
            (c.id && c.id.includes(cleanId)) ||
            (cleanId.includes("chapter-") && String(c.numericNumber) === cleanId.split("chapter-")[1])
        ) || allChapters[0]
      );
    }

    return allChapters[0];
  }, [allChapters, chapterId, anime]);

  const chapterIndex = useMemo(() => {
    if (!currentChapter) return 0;
    return allChapters.findIndex((c) => c.id === currentChapter.id || c.numericNumber === currentChapter.numericNumber);
  }, [allChapters, currentChapter]);

  const prevChapter = chapterIndex > 0 ? allChapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < allChapters.length - 1 ? allChapters[chapterIndex + 1] : null;

  // Resolve pages for the active chapter and selected language (PT-BR, EN, JA)
  useEffect(() => {
    if (!anime || !currentChapter) return;
    let isMounted = true;
    setIsLoadingPages(true);
    setPageError(null);
    setCurrentPageIndex(0);

    const targetIdentifier = currentChapter.chapterUrl || currentChapter.id || currentChapter.mangadexChapterId || "";
    fetchAnimeMangaPages(
      anime.id,
      targetIdentifier,
      currentChapter.numericNumber,
      mangaLanguage,
      imageQuality
    )
      .then((res) => {
        if (!isMounted) return;
        if (!res.pages || res.pages.length === 0) {
          throw new Error("Nenhuma página retornada");
        }
        setResolvedPages(res.pages);
      })
      .catch(async (err) => {
        if (!isMounted) return;
        console.warn("Primary manga pages fetch failed, trying direct chapter fetch:", err);
        try {
          // Direct fallback 1: fetch directly via /api/manga/pages with animeId and chapter number
          const directRes = await fetch(`/api/manga/pages?animeId=${encodeURIComponent(anime.id)}&chapterNumber=${currentChapter.numericNumber}`);
          if (directRes.ok) {
            const directData = await directRes.json();
            if (directData?.success && directData?.pages?.length > 0) {
              if (isMounted) setResolvedPages(directData.pages);
              return;
            }
          }
        } catch {}

        try {
          const fallbackRes = await fetchMangaDexChapterPages(
            currentChapter.mangadexChapterId || currentChapter.id,
            imageQuality,
            mangaLanguage
          );
          if (!isMounted) return;
          if (fallbackRes.pages && fallbackRes.pages.length > 0) {
            setResolvedPages(fallbackRes.pages);
            return;
          }
        } catch {}

        if (!isMounted) return;
        if (currentChapter.pages && currentChapter.pages.length > 0) {
          setResolvedPages(currentChapter.pages);
        } else {
          setResolvedPages([]);
          setPageError("Não foi possível carregar as páginas deste capítulo no momento.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingPages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anime, currentChapter, imageQuality, mangaLanguage]);

  // Load saved progress
  useEffect(() => {
    if (anime && currentChapter) {
      const saved = getMangaProgress(anime.id);
      if (saved && saved.chapterNumber === Number(currentChapter.number)) {
        setCurrentPageIndex(saved.pageIndex);
      }
    }
  }, [anime, currentChapter]);

  // Save progress on page or chapter change
  useEffect(() => {
    if (anime && currentChapter) {
      saveMangaProgress(anime.id, Number(currentChapter.number) || 1, currentPageIndex);
    }
  }, [anime, currentChapter, currentPageIndex]);

  // Keyboard navigation for single page mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentChapter || !resolvedPages.length) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        if (currentPageIndex < resolvedPages.length - 1) {
          setCurrentPageIndex((p) => p + 1);
        } else if (nextChapter) {
          navigate(`/animes/${anime?.id}/manga/${nextChapter.id}`);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentPageIndex > 0) {
          setCurrentPageIndex((p) => p - 1);
        } else if (prevChapter) {
          navigate(`/animes/${anime?.id}/manga/${prevChapter.id}`);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPageIndex, currentChapter, nextChapter, prevChapter, anime, navigate, resolvedPages]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!anime) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-light mb-2">Anime não encontrado</h2>
        <button
          onClick={() => navigate("/animes")}
          className="px-6 py-2.5 rounded-full bg-primary text-white text-xs uppercase tracking-wider font-medium"
        >
          Voltar para Animes
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0a0c0f] text-white flex flex-col justify-between selection:bg-primary selection:text-white"
    >
      {/* Sticky Reader Header */}
      <header className="sticky top-0 z-50 bg-[#101318]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/animes/${anime.id}`}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Voltar aos detalhes do anime"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 truncate font-light hidden md:inline">
                  {anime.title}
                </span>
              </div>
              <h1 className="text-sm font-medium text-white truncate">
                {currentChapter ? currentChapter.title : "Carregando..."}
              </h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* 3-Way Manga Language Selector (Português, Inglês, Japonês) */}
            <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/15">
              <button
                type="button"
                onClick={() => handleSetLanguage("pt")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                  mangaLanguage === "pt"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
                title="Ler em Português (PT-BR)"
              >
                🇧🇷 PT
              </button>
              <button
                type="button"
                onClick={() => handleSetLanguage("en")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                  mangaLanguage === "en"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
                title="Read in English (EN)"
              >
                🇺🇸 EN
              </button>
              <button
                type="button"
                onClick={() => handleSetLanguage("ja")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                  mangaLanguage === "ja"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
                title="日本語で読む (Japonês / Original)"
              >
                🇯🇵 JA
              </button>
            </div>

            {/* Chapter Selector Dropdown */}
            {allChapters.length > 0 && currentChapter && (
              <select
                value={currentChapter.id}
                onChange={(e) => navigate(`/animes/${anime.id}/manga/${e.target.value}`)}
                className="bg-white/10 border border-white/20 text-white text-xs rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[140px] md:max-w-[200px] truncate"
              >
                {allChapters.map((c) => (
                  <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                    Cap. {c.number} — {c.title} {c.language ? `[${c.language}]` : ""}
                  </option>
                ))}
              </select>
            )}

            {/* Quality Toggle (HD / DataSaver) */}
            <button
              type="button"
              onClick={() => {
                const nextQ = imageQuality === "data" ? "dataSaver" : "data";
                setImageQuality(nextQ);
                toast.info(`Qualidade alterada para ${nextQ === "data" ? "HD Original" : "Econômico (Rápido)"}`);
              }}
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-white/80 transition-colors"
              title="Alternar qualidade das páginas"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              <span>{imageQuality === "data" ? "HD" : "Eco"}</span>
            </button>

            {/* Reading Mode Switcher */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-full p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setReadingMode("vertical")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  readingMode === "vertical"
                    ? "bg-primary text-white font-medium"
                    : "text-white/60 hover:text-white"
                }`}
                title="Modo cascata vertical contínua"
              >
                Cascata
              </button>
              <button
                type="button"
                onClick={() => setReadingMode("single")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  readingMode === "single"
                    ? "bg-primary text-white font-medium"
                    : "text-white/60 hover:text-white"
                }`}
                title="Modo página por página"
              >
                Página
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {showIntro && (
        <WorscoiIntroPlayer
          title={`${anime.title} • Cap. ${currentChapter?.number || ""}`}
          subtitle="Abertura Oficial Worscoi"
          onComplete={() => setShowIntro(false)}
        />
      )}

      {/* Reader Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:py-8 max-w-4xl mx-auto w-full">
        {/* Localized Multi-Language Chapter Header Card */}
        {currentChapter && (
          <div className="w-full max-w-2xl mx-auto mb-6 px-4 py-5 rounded-2xl border border-white/10 bg-white/[0.03] text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-xs font-semibold text-white mb-2">
              <span>
                {mangaLanguage === "pt"
                  ? "🇧🇷 Edição Oficial em Português (PT-BR)"
                  : mangaLanguage === "en"
                  ? "🇺🇸 Official English Edition (EN)"
                  : "🇯🇵 日本語オリジナル版 (Japonês Original)"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-white">
              {mangaLanguage === "en"
                ? `Chapter ${currentChapter.number} — ${anime.title} (English Edition)`
                : mangaLanguage === "ja"
                ? `第${currentChapter.number}話 — ${anime.japaneseTitle || anime.title} (日本語原版)`
                : currentChapter.title || `Capítulo ${currentChapter.number}`}
            </h2>
            <p className="text-xs text-white/60 mt-1.5 max-w-lg mx-auto">
              {mangaLanguage === "en"
                ? `Reading ${anime.title} Chapter ${currentChapter.number} in English (EN). High-resolution pages synchronized.`
                : mangaLanguage === "ja"
                ? `${anime.japaneseTitle || anime.title} 第${currentChapter.number}話の公式日本語版ページを表示しています。`
                : `Lendo ${anime.title} — Capítulo ${currentChapter.number} em Português (PT-BR).`}
            </p>
          </div>
        )}

        {isLoadingPages ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="text-base font-light text-white mb-1">
              {mangaLanguage === "pt"
                ? "Carregando páginas em Português (PT-BR)..."
                : mangaLanguage === "en"
                ? "Loading official English (EN) pages..."
                : "日本語 (JA) の公式ページを読み込み中..."}
            </h3>
            <p className="text-xs text-white/50 max-w-sm">
              Conectando aos servidores MangaDex & Tomato para entregar a resolução máxima no idioma selecionado.
            </p>
          </div>
        ) : pageError ? (
          <div className="py-20 text-center max-w-md mx-auto p-6 rounded-2xl border border-white/10 bg-white/5">
            <p className="text-sm text-red-400 mb-4">{pageError}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setImageQuality("dataSaver");
                  setIsLoadingPages(true);
                  setPageError(null);
                }}
                className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar em Modo Econômico
              </button>
              <Link
                to={`/animes/${anime.id}`}
                className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 text-white text-xs"
              >
                Voltar aos Capítulos
              </Link>
            </div>
          </div>
        ) : resolvedPages.length === 0 ? (
          <div className="w-full max-w-3xl mx-auto px-4 py-8">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-zinc-900/90 to-[#12131a] p-6 sm:p-10 shadow-2xl">
              <div
                className="absolute inset-0 opacity-15 blur-3xl pointer-events-none bg-cover bg-center"
                style={{ backgroundImage: `url(${anime.cover})` }}
              />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-44 sm:w-52 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                  <img
                    src={anime.manga?.cover || anime.cover}
                    alt={anime.manga?.title || anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-md text-black font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    Obra Oficial
                  </div>
                </div>

                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Registro Oficial de Publicação</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    {currentChapter?.title || `Capítulo ${currentChapter?.number || 1}`}
                  </h2>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs text-white/60">
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white/80">
                      {anime.manga?.publisher || "Editora Oficial"}
                    </span>
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white/80">
                      {anime.manga?.serialization || "Publicação Oficial"}
                    </span>
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white/80">
                      {anime.manga?.author} & {anime.manga?.artist}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-sm text-white/70 leading-relaxed font-light text-left">
                    <p className="font-medium text-xs uppercase tracking-wider text-emerald-400 mb-1">
                      Sinopse Oficial do Capítulo:
                    </p>
                    {currentChapter?.title ? `Informações canônicas e publicação oficial do ${currentChapter.title} de ${anime.title}.` : anime.synopsis}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    {anime.id.includes("solo-leveling") && (
                      <Link
                        to={`/webtoon/solo-leveling/ep/${currentChapter?.numericNumber || 1}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Abrir no Leitor Webtoon Completo</span>
                      </Link>
                    )}

                    <Link
                      to={`/animes/${anime.id}`}
                      className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors border border-white/10"
                    >
                      Ver Todos os Capítulos
                    </Link>

                    {nextChapter && (
                      <button
                        onClick={() => navigate(`/animes/${anime.id}/manga/${nextChapter.id}`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors border border-white/10"
                      >
                        <span>Próximo Capítulo ({nextChapter.number})</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Notice regarding authentic scans */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-white/40 font-light max-w-xl mx-auto">
                  Apenas scans 100% autênticos e originais são reproduzidos. Capítulos sem espelhamento local exibem metadados canônicos oficiais sem qualquer conteúdo sintético ou gerado artificialmente.
                </p>
              </div>
            </div>
          </div>
        ) : readingMode === "vertical" ? (
          /* Cascading Continuous Vertical Scroll Mode */
          <div className="w-full space-y-3 md:space-y-4">
            {resolvedPages.map((pageUrl, idx) => (
              <div
                key={`${mangaLanguage}-${idx}`}
                className="relative bg-black rounded-lg overflow-hidden shadow-2xl border border-white/5 mx-auto max-w-2xl"
              >
                <img
                  src={pageUrl}
                  alt={`Página ${idx + 1} de ${currentChapter?.title || 'Mangá'}`}
                  className="w-full h-auto object-contain block select-none bg-zinc-950"
                  loading={idx < 3 ? "eager" : "lazy"}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.retried) {
                      target.dataset.retried = "true";
                      if (!pageUrl.includes("/api/proxy/")) {
                        target.src = `/api/proxy/manga-image?url=${encodeURIComponent(pageUrl)}`;
                      } else {
                        // Retry proxy request once with cache-buster
                        const sep = pageUrl.includes("?") ? "&" : "?";
                        target.src = `${pageUrl}${sep}_t=${Date.now()}`;
                      }
                    }
                  }}
                />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white/70 font-mono">
                  {mangaLanguage.toUpperCase()} • {idx + 1} / {resolvedPages.length}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Single Page / Paginated Mode */
          <div className="w-full flex flex-col items-center">
            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 max-w-2xl w-full aspect-[2/3] flex items-center justify-center group">
              <img
                src={resolvedPages[currentPageIndex]}
                alt={`Página ${currentPageIndex + 1}`}
                className="w-full h-full object-contain select-none cursor-pointer bg-zinc-950"
                onError={(e) => {
                  const target = e.currentTarget;
                  const currentSrc = resolvedPages[currentPageIndex];
                  if (!target.dataset.retried && currentSrc) {
                    target.dataset.retried = "true";
                    if (!currentSrc.includes("/api/proxy/")) {
                      target.src = `/api/proxy/manga-image?url=${encodeURIComponent(currentSrc)}`;
                    } else {
                      const sep = currentSrc.includes("?") ? "&" : "?";
                      target.src = `${currentSrc}${sep}_t=${Date.now()}`;
                    }
                  }
                }}
                onClick={() => {
                  if (currentPageIndex < resolvedPages.length - 1) {
                    setCurrentPageIndex((p) => p + 1);
                  }
                }}
              />

              {/* Side click hotspots */}
              <button
                type="button"
                onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                disabled={currentPageIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-20 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentPageIndex((p) => Math.min(resolvedPages.length - 1, p + 1))
                }
                disabled={currentPageIndex === resolvedPages.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white disabled:opacity-20 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-xs text-white/90 font-mono">
                Página {currentPageIndex + 1} de {resolvedPages.length}
              </div>
            </div>

            {/* Page Slider / Buttons */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                disabled={currentPageIndex === 0}
                className="px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-xs text-white disabled:opacity-30 transition-colors"
              >
                ← Anterior
              </button>

              <span className="text-xs text-white/70 font-mono">
                {currentPageIndex + 1} / {resolvedPages.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPageIndex((p) => Math.min(resolvedPages.length - 1, p + 1))
                }
                disabled={currentPageIndex === resolvedPages.length - 1}
                className="px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-xs text-white disabled:opacity-30 transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}

        {/* Chapter Bottom Navigation Bar */}
        {currentChapter && (
          <div className="w-full max-w-2xl mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {prevChapter ? (
              <Link
                to={`/animes/${anime.id}/manga/${prevChapter.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-white/20 hover:bg-white/10 text-xs font-medium text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Capítulo Anterior ({prevChapter.number})</span>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="text-center">
              <span className="text-[11px] text-white/50 block mb-1">
                Você está lendo:
              </span>
              <span className="text-xs font-medium text-white">
                Capítulo {currentChapter.number} de {allChapters.length}
              </span>
            </div>

            {nextChapter ? (
              <Link
                to={`/animes/${anime.id}/manga/${nextChapter.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-xs font-medium text-white transition-colors shadow-lg"
              >
                <span>Próximo Capítulo ({nextChapter.number})</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to={`/animes/${anime.id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-medium text-white transition-colors"
              >
                <span>Voltar aos Detalhes</span>
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Footer bar with quick action to watch anime episode */}
      <footer className="bg-[#101318]/95 border-t border-white/10 py-4 px-6 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              Curtiu a história? Assista à animação oficial com áudio e legendas.
            </span>
          </div>

          <Link
            to={`/animes/${anime.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Assistir Anime</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default AnimeMangaReader;
