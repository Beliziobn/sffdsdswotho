import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  List,
  Sparkles,
  Heart,
  Flame,
  Laugh,
  Eye,
  Maximize2,
  Minimize2,
  ChevronUp,
  Share2,
  Play,
  Pause,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useContent, useEpisodes, useSaveProgress, useTrackInteraction } from "@/hooks/useContents";
import { useLibraryStore } from "@/store/useLibraryStore";
import { fetchOfficialChapterPanels, getProxiedWebtoonImageUrl } from "@/lib/webtoonOfficialSync";

export const WebtoonReader = () => {
  const { id, episodeId } = useParams<{ id: string; episodeId: string }>();
  const navigate = useNavigate();

  const { data: webtoon, isLoading: isWebtoonLoading } = useContent(id);
  const { data: episodes = [], isLoading: isEpisodesLoading } = useEpisodes(id);

  // Active episode
  const activeEpisode = useMemo(() => {
    if (!episodes.length) return null;
    if (!episodeId) return episodes[0];
    return episodes.find((e) => e.id === episodeId || String(e.number) === episodeId) ?? episodes[0];
  }, [episodes, episodeId]);

  const currentIndex = useMemo(() => {
    if (!activeEpisode) return -1;
    return episodes.findIndex((e) => e.id === activeEpisode.id);
  }, [episodes, activeEpisode]);

  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  // Reading UI settings
  const [containerWidth, setContainerWidth] = useState<"compact" | "normal" | "wide">("normal");
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(2);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Live official panels state
  const [livePanels, setLivePanels] = useState<string[]>([]);
  const [isFetchingPanels, setIsFetchingPanels] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

  const [webtoonLanguage, setWebtoonLanguage] = useState<"pt" | "en" | "ko">(() => {
    return (localStorage.getItem("worscoi_webtoon_language") as "pt" | "en" | "ko") || "pt";
  });

  const handleSetLanguage = (lang: "pt" | "en" | "ko") => {
    setWebtoonLanguage(lang);
    localStorage.setItem("worscoi_webtoon_language", lang);
    toast({
      title:
        lang === "pt"
          ? "Idioma: Português (PT-BR)"
          : lang === "en"
          ? "Language: English (EN)"
          : "언어: 한국어 (Coreano / Original)",
      description: "Carregando páginas oficiais no idioma selecionado...",
    });
  };

  const loadPanels = () => {
    if (!activeEpisode) return;

    // Only pre-seed local images on initial load if language is PT and no live panels loaded yet
    if (webtoonLanguage === "pt" && livePanels.length === 0 && activeEpisode.images && activeEpisode.images.length > 0) {
      setLivePanels(activeEpisode.images);
    }

    const viewerUrl = (activeEpisode as any).viewer_url;
    setIsFetchingPanels(true);
    setFetchFailed(false);

    fetchOfficialChapterPanels(viewerUrl, {
      webtoonId: id || (activeEpisode as any).content_id,
      episodeNumber: activeEpisode.number,
      episodeTitle: activeEpisode.title,
      coverUrl: webtoon?.cover,
      webtoonTitle: webtoon?.title,
      language: webtoonLanguage,
    })
      .then((pages) => {
        if (pages && pages.length > 0) {
          setLivePanels(pages);
          setFetchFailed(false);
        } else {
          setLivePanels(activeEpisode.images && activeEpisode.images.length > 0 ? activeEpisode.images : [webtoon?.cover || "/placeholder.svg"]);
          setFetchFailed(false);
        }
      })
      .catch(() => {
        setLivePanels(activeEpisode.images && activeEpisode.images.length > 0 ? activeEpisode.images : [webtoon?.cover || "/placeholder.svg"]);
        setFetchFailed(false);
      })
      .finally(() => {
        setIsFetchingPanels(false);
      });
  };

  useEffect(() => {
    loadPanels();
    if (webtoon && activeEpisode) {
      const pct = episodes.length > 0 ? Math.round(((currentIndex + 1) / episodes.length) * 100) : 30;
      import("@/lib/userProfileStore").then(({ recordUserHistory }) => {
        recordUserHistory({
          itemId: String(webtoon.id),
          type: "webtoon",
          title: webtoon.title,
          subtitle: webtoon.author || "Webtoon Oficial",
          cover: webtoon.cover,
          href: `/webtoon/${webtoon.id}/ep/${activeEpisode.id}`,
          progressPercent: pct,
          detailLabel: `Episódio ${activeEpisode.number}: ${activeEpisode.title}`,
        });
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEpisode?.id, (activeEpisode as any)?.viewer_url, activeEpisode?.number, id, webtoonLanguage]);

  const currentPanels = useMemo(() => {
    if (livePanels.length > 0) return livePanels;
    if (activeEpisode?.images && activeEpisode.images.length > 0) return activeEpisode.images;
    if (webtoon?.cover) return [webtoon.cover];
    return [];
  }, [livePanels, activeEpisode?.images, webtoon?.cover]);

  // Community reactions
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    fire: 1420,
    mindblown: 890,
    laugh: 450,
    cry: 210,
  });
  const [userReacted, setUserReacted] = useState<string | null>(null);
  const [superLiked, setSuperLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(3840);

  const saveProgress = useSaveProgress();
  const track = useTrackInteraction();
  const updateStoreProgress = useLibraryStore((s) => s.updateProgressOptimistic);

  // Track view
  useEffect(() => {
    if (id) track(id, "read");
  }, [id, episodeId, track]);

  // Scroll listener for header auto-hide and progress bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(100, Math.round((currentScrollY / scrollHeight) * 100)) : 0;

      setScrollProgress(progress);

      // Auto-hide header when scrolling down, show when scrolling up
      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY + 15) {
          setShowHeader(false);
        } else if (currentScrollY < lastScrollY - 15) {
          setShowHeader(true);
        }
      } else {
        setShowHeader(true);
      }

      setLastScrollY(currentScrollY);

      // Persist progress to store and server
      if (id && progress % 10 === 0) {
        updateStoreProgress(id, progress);
        saveProgress.mutate({
          contentId: id,
          percentage: progress,
          episodeId: activeEpisode?.id,
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, id, activeEpisode, updateStoreProgress, saveProgress]);

  // Auto-scroller engine
  useEffect(() => {
    if (!isAutoScrolling) return;
    const interval = setInterval(() => {
      window.scrollBy({ top: autoScrollSpeed, behavior: "auto" });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 20) {
        setIsAutoScrolling(false);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [isAutoScrolling, autoScrollSpeed]);

  const handleReact = (type: string) => {
    if (userReacted === type) return;
    setUserReacted(type);
    setReactions((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
    toast({
      title: "Reação enviada!",
      description: "Sua avaliação foi somada à comunidade deste episódio.",
    });
  };

  const handleSuperLike = () => {
    if (superLiked) return;
    setSuperLiked(true);
    setLikesCount((prev) => prev + 1);
    toast({
      title: "❤️ Super Like enviado!",
      description: "Obrigado por apoiar a produção e os criadores deste webtoon.",
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const widthClasses = {
    compact: "max-w-[640px]",
    normal: "max-w-[800px]",
    wide: "max-w-[1000px]",
  };

  if (isWebtoonLoading || isEpisodesLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-light text-zinc-400">Carregando painéis do webtoon...</p>
      </div>
    );
  }

  if (!webtoon || !activeEpisode) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-lg font-light text-zinc-300 mb-4">Episódio não encontrado ou indisponível.</p>
        <Button asChild variant="outline" className="text-white border-zinc-700 hover:bg-zinc-800">
          <Link to="/webtoons">Voltar para o catálogo de Webtoons</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Floating Top Header */}
      <AnimatePresence>
        {showHeader && (
          <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 right-0 z-50 bg-[#12131a]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4 min-w-0">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <Link to={`/webtoon/${webtoon.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              <div className="min-w-0">
                <p className="text-xs text-emerald-400 font-medium truncate flex items-center gap-1.5">
                  <span>{webtoon.title}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-400">Capítulo {activeEpisode.number}</span>
                  {currentPanels.length > 1 && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="text-emerald-500 font-mono text-[11px]">{currentPanels.length} págs</span>
                    </>
                  )}
                </p>
                <h2 className="text-sm font-medium text-white truncate max-w-md">{activeEpisode.title}</h2>
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetLanguage("pt")}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    webtoonLanguage === "pt"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Português (PT-BR) Oficial"
                >
                  🇧🇷 PT
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLanguage("en")}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    webtoonLanguage === "en"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Inglês (EN) Oficial"
                >
                  🇺🇸 EN
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLanguage("ko")}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    webtoonLanguage === "ko"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Coreano (KO) Original"
                >
                  🇰🇷 KO
                </button>
              </div>

              {/* Width toggle */}
              <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setContainerWidth("compact")}
                  className={`px-2 py-1 rounded text-[11px] transition-colors ${
                    containerWidth === "compact" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Formato Compacto / Celular"
                >
                  640px
                </button>
                <button
                  onClick={() => setContainerWidth("normal")}
                  className={`px-2 py-1 rounded text-[11px] transition-colors ${
                    containerWidth === "normal" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Formato Padrão"
                >
                  800px
                </button>
                <button
                  onClick={() => setContainerWidth("wide")}
                  className={`px-2 py-1 rounded text-[11px] transition-colors ${
                    containerWidth === "wide" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Formato Expandido"
                >
                  1000px
                </button>
              </div>

              {/* Auto Scroll Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`text-xs h-8 px-2.5 border-zinc-700 ${
                  isAutoScrolling
                    ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
                title={isAutoScrolling ? "Pausar rolagem automática" : "Iniciar rolagem contínua automática"}
              >
                {isAutoScrolling ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                <span className="hidden md:inline">{isAutoScrolling ? "Pausar" : "Auto-Rolagem"}</span>
              </Button>

              {/* Episodes Drawer Trigger */}
              <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-3 border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800"
                  >
                    <List className="h-3.5 w-3.5 mr-1.5" />
                    <span>Capítulos ({episodes.length})</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#12131a] border-zinc-800 text-zinc-100 w-[340px] sm:w-[400px]">
                  <SheetHeader className="pb-4 border-b border-zinc-800">
                    <SheetTitle className="text-white text-base font-medium flex items-center justify-between">
                      <span>Lista de Episódios</span>
                      <span className="text-xs text-emerald-400 font-normal">{webtoon.title}</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="py-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
                    {episodes.map((ep) => {
                      const isActive = ep.id === activeEpisode.id;
                      return (
                        <div
                          key={ep.id}
                          onClick={() => {
                            navigate(`/webtoon/${webtoon.id}/ler/${ep.id}`);
                            setIsDrawerOpen(false);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isActive
                              ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                              : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300"
                          }`}
                        >
                          <img
                            src={ep.images?.[0] || webtoon.cover}
                            alt={ep.title}
                            className="w-12 h-14 object-cover rounded-md flex-shrink-0 border border-zinc-800"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-emerald-400">Ep. {ep.number}</span>
                              {isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-black font-bold uppercase">
                                  Lendo
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-medium text-white truncate mt-0.5">{ep.title}</h4>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{ep.body}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Thin Reading Progress Indicator Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Main Continuous Canvas / Vertical Strip */}
      <main className="flex-1 pt-16 pb-24 flex flex-col items-center">
        {/* Episode Title Header Card */}
        <div className={`w-full ${widthClasses[containerWidth]} px-4 py-8 text-center border-b border-zinc-900/80`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-[11px] font-semibold mb-3">
            <span>
              {webtoonLanguage === "pt"
                ? "🇧🇷 Edição Oficial em Português (PT-BR)"
                : webtoonLanguage === "en"
                ? "🇺🇸 Official English Edition (EN)"
                : "🇰🇷 한국어 오리지널 에디션 (Coreano Original)"}
            </span>
          </div>
          <span className="block text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-2">
            {webtoon.title} ·{" "}
            {webtoonLanguage === "pt"
              ? `Episódio ${activeEpisode.number}`
              : webtoonLanguage === "en"
              ? `Episode ${activeEpisode.number}`
              : `제 ${activeEpisode.number} 화`}
          </span>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
            {webtoonLanguage === "en"
              ? `Episode ${activeEpisode.number} — ${webtoon.title} (Official English)`
              : webtoonLanguage === "ko"
              ? `제 ${activeEpisode.number} 화 — ${webtoon.title} (한국어 원작)`
              : activeEpisode.title}
          </h1>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto mt-3 font-light leading-relaxed">
            {webtoonLanguage === "en"
              ? `Official English translation of ${webtoon.title}, Chapter ${activeEpisode.number}. All vertical manhwa panels are synchronized in high resolution.`
              : webtoonLanguage === "ko"
              ? `${webtoon.title} 제 ${activeEpisode.number} 화 공식 한국어 웹툰 에디션입니다. 고해상도 세로 스크롤로 감상하세요.`
              : activeEpisode.body}
          </p>
        </div>

        {/* Live Panels Fetching Banner / Skeleton */}
        {isFetchingPanels && (
          <div className={`w-full ${widthClasses[containerWidth]} px-4 py-6 text-center space-y-4`}>
            <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>
                {webtoonLanguage === "pt"
                  ? "Sincronizando páginas oficiais em Português (PT-BR)..."
                  : webtoonLanguage === "en"
                  ? "Synchronizing official English (EN) high-resolution panels..."
                  : "공식 한국어 (KO) 고해상도 웹툰 페이지를 불러오는 중..."}
              </span>
            </div>
            <div className="space-y-2 animate-pulse opacity-40">
              <div className="w-full h-80 bg-zinc-800 rounded-lg" />
              <div className="w-full h-80 bg-zinc-800 rounded-lg" />
            </div>
          </div>
        )}

        {/* Continuous Illustrated Manhwa Strip OR Official Chapter Showcase Card */}
        {currentPanels && currentPanels.length > 0 ? (
          <div className={`w-full ${widthClasses[containerWidth]} flex flex-col items-center gap-0 shadow-2xl bg-black overflow-hidden`}>
            {currentPanels.map((panelUrl, index) => (
              <div key={`${webtoonLanguage}-${index}`} className="w-full relative group bg-black">
                <img
                  src={panelUrl}
                  alt={`Página ${index + 1} de ${currentPanels.length} — ${activeEpisode.title}`}
                  loading={index < 4 ? "eager" : "lazy"}
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.retried && panelUrl.startsWith("http") && !panelUrl.includes("/api/proxy/")) {
                      target.dataset.retried = "true";
                      target.src = `/api/proxy/webtoon-image?url=${encodeURIComponent(panelUrl)}`;
                    } else if (!target.dataset.fallbackCover && webtoon?.cover) {
                      target.dataset.fallbackCover = "true";
                      target.src = webtoon.cover;
                    }
                  }}
                  className="w-full h-auto block select-none pointer-events-auto"
                />
                <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/70 text-zinc-400 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {webtoonLanguage.toUpperCase()} • {index + 1} / {currentPanels.length}
                </span>
              </div>
            ))}
          </div>
        ) : !isFetchingPanels ? (
          /* Official Chapter Overview & Showcase Card for cataloged entries */
          <div className={`w-full ${widthClasses[containerWidth]} px-4 py-8`}>
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-[#12131a] p-6 sm:p-10 shadow-2xl">
              {/* Subtle background glow from webtoon cover */}
              <div
                className="absolute inset-0 opacity-15 blur-3xl pointer-events-none bg-cover bg-center"
                style={{ backgroundImage: `url(${webtoon.cover})` }}
              />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Official Cover Card with Badge */}
                <div className="relative w-48 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/80 group">
                  <img
                    src={webtoon.cover}
                    alt={webtoon.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-md text-black font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                    Capa Oficial
                  </div>
                </div>

                {/* Chapter Story Narrative & Information */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Edição Oficial do Manhwa</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    {activeEpisode.title}
                  </h2>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-zinc-400">
                    <span className="bg-zinc-800/80 px-2.5 py-1 rounded-md text-zinc-300">
                      Capítulo {activeEpisode.number} de {episodes.length}
                    </span>
                    <span className="bg-zinc-800/80 px-2.5 py-1 rounded-md text-zinc-300">
                      {webtoon.tags?.slice(0, 3).join(" • ") || webtoon.category}
                    </span>
                    <span className="bg-zinc-800/80 px-2.5 py-1 rounded-md text-zinc-300">
                      {webtoon.subtitle || "Webtoon Oficial"}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-zinc-800/80 text-sm text-zinc-300 leading-relaxed font-light text-left">
                    <p className="font-medium text-xs uppercase tracking-wider text-emerald-400 mb-1">
                      Sinopse do Episódio:
                    </p>
                    {activeEpisode.body || webtoon.description}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <Button
                      onClick={loadPanels}
                      variant="outline"
                      className="border-emerald-700/60 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 text-xs h-9"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                      <span>Recarregar Páginas Oficiais</span>
                    </Button>

                    {(activeEpisode as any).viewer_url && (
                      <a
                        href={(activeEpisode as any).viewer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors border border-zinc-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Ver no Webtoons Oficial</span>
                      </a>
                    )}

                    {nextEpisode && (
                      <Button
                        asChild
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9"
                      >
                        <Link to={`/webtoon/${webtoon.id}/ler/${nextEpisode.id}`}>
                          <span>Próximo Episódio ({nextEpisode.number})</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Informative footnote for readers */}
              <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
                <p className="text-xs text-zinc-400 font-light max-w-2xl mx-auto">
                  Capítulos sincronizados com a plataforma oficial. Obras com rolagens verticais completas de dezenas a centenas de páginas incluem <strong className="text-zinc-200">The Greatest Estate Developer</strong>, <strong className="text-zinc-200">Lookism</strong>, <strong className="text-zinc-200">Eleceed</strong>, <strong className="text-zinc-200">Return of Mount Hua</strong>, <strong className="text-zinc-200">Doom Breaker</strong>, <strong className="text-zinc-200">Sweet Home</strong>, <strong className="text-zinc-200">Teenage Mercenary</strong>, <strong className="text-zinc-200">Tower of God</strong>, <strong className="text-zinc-200">Solo Leveling</strong> e <strong className="text-zinc-200">Omniscient Reader</strong>.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Bottom Episode Actions & Community Interaction Section */}
        <div className={`w-full ${widthClasses[containerWidth]} px-6 py-12 mt-12 space-y-10 border-t border-zinc-900`}>
          {/* Reaction Bar */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-4">
            <h3 className="text-sm font-medium text-white">O que você achou deste episódio?</h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => handleReact("fire")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-medium transition-all ${
                  userReacted === "fire"
                    ? "bg-rose-500/20 border-rose-500 text-rose-400 scale-105"
                    : "bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                <Flame className="h-4 w-4 text-rose-500" />
                <span>Épico</span>
                <span className="text-zinc-500 font-mono text-[11px]">{reactions.fire}</span>
              </button>

              <button
                onClick={() => handleReact("mindblown")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-medium transition-all ${
                  userReacted === "mindblown"
                    ? "bg-amber-500/20 border-amber-500 text-amber-400 scale-105"
                    : "bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Chocante</span>
                <span className="text-zinc-500 font-mono text-[11px]">{reactions.mindblown}</span>
              </button>

              <button
                onClick={() => handleReact("laugh")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-medium transition-all ${
                  userReacted === "laugh"
                    ? "bg-blue-500/20 border-blue-500 text-blue-400 scale-105"
                    : "bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:border-zinc-500 hover:text-white"
                }`}
              >
                <Laugh className="h-4 w-4 text-blue-400" />
                <span>Demais</span>
                <span className="text-zinc-500 font-mono text-[11px]">{reactions.laugh}</span>
              </button>

              <button
                onClick={handleSuperLike}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-medium transition-all ${
                  superLiked
                    ? "bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105"
                    : "bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:border-red-500/60 hover:text-white"
                }`}
              >
                <Heart className={`h-4 w-4 ${superLiked ? "fill-white" : "text-red-500"}`} />
                <span>Super Like</span>
                <span className={superLiked ? "text-white/90" : "text-zinc-500 font-mono text-[11px]"}>
                  {likesCount}
                </span>
              </button>
            </div>
          </div>

          {/* Episode Jump Navigation (Prev / Next) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevEpisode ? (
              <Button
                asChild
                variant="outline"
                className="h-auto py-4 px-5 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-left flex items-center justify-between group"
              >
                <Link
                  to={`/webtoon/${webtoon.id}/ler/${prevEpisode.id}`}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <div className="flex items-center gap-3">
                    <ArrowLeft className="h-4 w-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Episódio Anterior</span>
                      <span className="text-xs font-medium text-white truncate block max-w-[180px]">
                        Ep. {prevEpisode.number} — {prevEpisode.title}
                      </span>
                    </div>
                  </div>
                </Link>
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {nextEpisode ? (
              <Button
                asChild
                className="h-auto py-4 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-right flex items-center justify-between group shadow-lg shadow-emerald-950/50"
              >
                <Link
                  to={`/webtoon/${webtoon.id}/ler/${nextEpisode.id}`}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">Próximo Episódio</span>
                    <span className="text-xs font-semibold text-white truncate block max-w-[200px]">
                      Ep. {nextEpisode.number} — {nextEpisode.title}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            ) : (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-1" />
                <span className="text-xs font-medium text-white">Você está em dia com esta obra!</span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Novo episódio em breve no cronograma.</span>
              </div>
            )}
          </div>

          {/* Quick Return to Overview */}
          <div className="flex items-center justify-center gap-4 pt-4 text-xs">
            <Link to={`/webtoon/${webtoon.id}`} className="text-zinc-400 hover:text-white transition-colors">
              Página do Webtoon
            </Link>
            <span className="text-zinc-700">·</span>
            <Link to="/webtoons" className="text-zinc-400 hover:text-white transition-colors">
              Catálogo de Webtoons
            </Link>
            <span className="text-zinc-700">·</span>
            <button onClick={scrollToTop} className="text-emerald-400 hover:underline flex items-center gap-1">
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Voltar ao topo</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Back to Top */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-zinc-900/90 hover:bg-emerald-600 text-white border border-zinc-800 shadow-xl transition-all duration-300"
        title="Voltar ao Topo"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  );
};

export default WebtoonReader;
