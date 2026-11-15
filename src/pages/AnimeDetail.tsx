import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import AnimePlayerModal from "@/components/AnimePlayerModal";
import SecureAnimePlayer from "@/components/SecureAnimePlayer";
import { CommunityReviews } from "@/components/CommunityReviews";
import ProtectedImage from "@/components/ProtectedImage";
import {
  ANIMES_DATA,
  Anime,
  getMangaProgress,
  isAnimeInWatchlist,
  toggleAnimeWatchlist,
} from "@/lib/animes";
import { fetchMangaDexChapters, fetchAnimeMangaChapters, MangaDexChapter } from "@/lib/mangadex";
import {
  getAnimeAmbientTheme,
  getCleanEpisodeSynopsis,
  getCleanEpisodeTitle,
  isEpisodeCanon,
  isOriginalAnimationWork,
  resolveCanonBridge,
} from "@/lib/canonBridge";
import { useContentProtection } from "@/hooks/useContentProtection";
import {
  Play,
  Star,
  Bookmark,
  BookmarkCheck,
  Share2,
  Tv,
  ArrowLeft,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  Loader2,
  Layers,
  Search,
  X,
  Download,
  Info,
  LayoutList,
  LayoutGrid,
  Film,
  Check,
} from "lucide-react";
import { downloadRealAnimeEpisode, downloadRealMangaChapter } from "@/lib/mediaDownloaders";
import { toast } from "sonner";
import ShareDialog from "@/components/ShareDialog";
import { CANONICAL_BASE_URL, buildBreadcrumbSchema, usePageSeo } from "@/lib/seo";

export const AnimeDetail = () => {
  useContentProtection();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerSectionRef = useRef<HTMLDivElement>(null);

  const anime = useMemo(() => {
    return ANIMES_DATA.find((a) => a.id === id || a.slug === id);
  }, [id]);

  const initialTab = searchParams.get("tab") === "manga" ? "manga" : "episodes";
  const initialSeason = Math.max(1, parseInt(searchParams.get("season") || "1", 10) || 1);
  const initialEp = Math.max(1, parseInt(searchParams.get("ep") || "1", 10) || 1);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState<"episodes" | "manga">(initialTab);
  const [activeSeasonNumber, setActiveSeasonNumber] = useState(initialSeason);
  const [activeEpisodeNumber, setActiveEpisodeNumber] = useState(initialEp);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [paceFilter, setPaceFilter] = useState<"all" | "canon">("all");
  const [episodeDensity, setEpisodeDensity] = useState<"list" | "grid">("list");
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [playerAnime, setPlayerAnime] = useState<Anime | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedDubId, setSelectedDubId] = useState("ptbr:0");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Sync URL query params if navigated via Spotlight / Quick-Lens
  useEffect(() => {
    const qTab = searchParams.get("tab");
    const qSeason = parseInt(searchParams.get("season") || "", 10);
    const qEp = parseInt(searchParams.get("ep") || "", 10);
    const qChap = parseInt(searchParams.get("chap") || "", 10);

    if (qTab === "manga") {
      setActiveTab("manga");
    } else if (qTab === "episodes") {
      setActiveTab("episodes");
    }
    if (Number.isFinite(qSeason) && qSeason > 0) {
      setActiveSeasonNumber(qSeason);
    }
    if (Number.isFinite(qEp) && qEp > 0) {
      setActiveEpisodeNumber(qEp);
      setActiveTab("episodes");
    }
    if (Number.isFinite(qChap) && qChap > 0 && anime) {
      setActiveTab("manga");
    }
  }, [searchParams, anime]);

  // Dynamic SEO Synchronization
  usePageSeo(
    anime
      ? {
          title: `${anime.title} — Streaming de Anime & Mangá | Wotho`,
          description:
            anime.synopsis ||
            `Assista ${anime.title} e leia mangás vinculados na plataforma Wotho.`,
          canonicalPath: `/animes/${anime.id}`,
          ogType: "video.tv_show",
          ogImage: anime.cover || anime.banner || `${CANONICAL_BASE_URL}/og-image.jpg`,
          ogImageAlt: anime.title,
          jsonLd: [
            {
              "@context": "https://schema.org",
              "@type": "TVSeries",
              name: anime.title,
              alternateName: anime.japaneseTitle || undefined,
              description: anime.synopsis,
              image: anime.cover || anime.banner || `${CANONICAL_BASE_URL}/og-image.jpg`,
              inLanguage: "pt-BR",
              url: `${CANONICAL_BASE_URL}/animes/${anime.id}`,
              genre: anime.genres,
              numberOfEpisodes: anime.episodesCount,
              ...(anime.studio
                ? { productionCompany: { "@type": "Organization", name: anime.studio } }
                : {}),
              ...(anime.rating
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: anime.rating,
                      bestRating: 10,
                      ratingCount: anime.ratingCount || 1000,
                    },
                  }
                : {}),
              publisher: {
                "@type": "Organization",
                name: "Wotho",
              },
            },
            buildBreadcrumbSchema([
              { name: "Wotho", path: "/" },
              { name: "Animes", path: "/animes" },
              { name: anime.title, path: `/animes/${anime.id}` },
            ]),
          ],
        }
      : null
  );

  // MangaDex & Multi-Source Live Chapter State
  const [onlineChapters, setOnlineChapters] = useState<MangaDexChapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [mangaLangFilter, setMangaLangFilter] = useState<"pt-br" | "en" | "all">("pt-br");

  useEffect(() => {
    const qTab = searchParams.get("tab") === "manga" ? "manga" : "episodes";
    const qSeason = parseInt(searchParams.get("season") || "1", 10) || 1;
    const qEp = parseInt(searchParams.get("ep") || "1", 10) || 1;
    setActiveTab(qTab);
    setActiveSeasonNumber(qSeason);
    setActiveEpisodeNumber(qEp);
    setEpisodeSearch("");
    setPaceFilter("all");
  }, [id]);

  useEffect(() => {
    if (anime) {
      setInWatchlist(isAnimeInWatchlist(anime.id));
      const handleUpdate = () => setInWatchlist(isAnimeInWatchlist(anime.id));
      window.addEventListener("worscoi_watchlist_updated", handleUpdate);
      return () => window.removeEventListener("worscoi_watchlist_updated", handleUpdate);
    }
  }, [anime]);

  useEffect(() => {
    if (!anime) return;
    import("@/lib/userProfileStore")
      .then(({ recordUserHistory }) => {
        recordUserHistory({
          itemId: anime.id,
          type: "anime",
          title: anime.title,
          subtitle: `${anime.studio} · ${anime.year}`,
          cover: anime.cover,
          href: `/animes/${anime.id}`,
          progressPercent: Math.min(
            100,
            Math.max(12, Math.round((activeEpisodeNumber / Math.max(1, anime.episodesCount || 12)) * 100))
          ),
          detailLabel: `Temporada ${activeSeasonNumber} · Episódio ${activeEpisodeNumber}`,
        });
      })
      .catch(() => {});
  }, [anime, activeSeasonNumber, activeEpisodeNumber]);

  // Fetch real chapters from Multi-Source Manga & MangaDex engine
  useEffect(() => {
    if (!anime || isOriginalAnimationWork(anime)) return;
    let isMounted = true;
    setIsLoadingChapters(true);

    fetchAnimeMangaChapters(anime.id)
      .then((chList) => {
        if (!isMounted) return;
        if (chList.length > 0) {
          setOnlineChapters(chList);
        } else if (anime.manga?.mangadexId) {
          return fetchMangaDexChapters(anime.manga.mangadexId, mangaLangFilter).then((fallback) => {
            if (isMounted) setOnlineChapters(fallback);
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to load manga chapters:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingChapters(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anime, mangaLangFilter]);

  const relatedAnimes = useMemo(() => {
    if (!anime) return [];
    return ANIMES_DATA.filter(
      (a) => a.id !== anime.id && a.genres.some((g) => anime.genres.includes(g))
    ).slice(0, 4);
  }, [anime]);

  const activeSeason = useMemo(() => {
    if (!anime) return null;
    return anime.seasons?.find((s) => s.seasonNumber === activeSeasonNumber) || anime.seasons?.[0];
  }, [anime, activeSeasonNumber]);

  const currentSeasonEpisodes = useMemo(() => {
    return activeSeason?.episodes || anime?.episodes || [];
  }, [activeSeason, anime]);

  const fillerCountInSeason = useMemo(() => {
    if (!anime) return 0;
    return currentSeasonEpisodes.filter(
      (ep) => !isEpisodeCanon(anime.id, ep.seasonNumber, ep.number)
    ).length;
  }, [anime, currentSeasonEpisodes]);

  const filteredEpisodes = useMemo(() => {
    let base = currentSeasonEpisodes;
    if (paceFilter === "canon" && anime) {
      base = base.filter((ep) => isEpisodeCanon(anime.id, ep.seasonNumber, ep.number));
    }
    if (!episodeSearch.trim()) return base;
    const q = episodeSearch.toLowerCase().trim();
    return base.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        ep.synopsis.toLowerCase().includes(q) ||
        String(ep.number) === q
    );
  }, [currentSeasonEpisodes, paceFilter, episodeSearch, anime]);

  const activeEpisode = useMemo(() => {
    return (
      currentSeasonEpisodes.find((ep) => ep.number === activeEpisodeNumber) ||
      currentSeasonEpisodes[0] ||
      anime?.episodes[0]
    );
  }, [currentSeasonEpisodes, activeEpisodeNumber, anime]);

  const isOriginal = useMemo(() => (anime ? isOriginalAnimationWork(anime) : false), [anime]);
  const ambientTheme = useMemo(() => (anime ? getAnimeAmbientTheme(anime) : null), [anime]);
  const savedMangaProgress = useMemo(() => (anime ? getMangaProgress(anime.id) : null), [anime]);

  const activeBridge = useMemo(() => {
    if (!anime || !activeEpisode) return null;
    return resolveCanonBridge(
      anime,
      "anime",
      activeEpisode.number,
      activeSeason?.seasonNumber || 1
    );
  }, [anime, activeEpisode, activeSeason]);

  // Resolve target manga chapter route ID for a given chapter number
  const getMangaReaderPath = (chapterNum: number) => {
    if (!anime) return "/animes";
    const matchOnline = onlineChapters.find(
      (ch) => Math.round(ch.numericNumber) === chapterNum
    );
    if (matchOnline) return `/animes/${anime.id}/manga/${encodeURIComponent(matchOnline.id)}`;
    const matchLocal = anime.manga?.chapters?.find((ch) => ch.number === chapterNum);
    if (matchLocal) return `/animes/${anime.id}/manga/${encodeURIComponent(matchLocal.id)}`;
    const firstChapter = onlineChapters[0]?.id || anime.manga?.chapters?.[0]?.id;
    return firstChapter
      ? `/animes/${anime.id}/manga/${encodeURIComponent(firstChapter)}`
      : `/animes/${anime.id}/manga`;
  };

  if (!anime) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navigation />
        <div className="container mx-auto px-6 py-32 text-center">
          <h2 className="text-2xl font-semibold mb-3 text-foreground">Anime não encontrado</h2>
          <p className="text-sm text-muted-foreground mb-6">
            O anime solicitado não foi localizado em nosso catálogo.
          </p>
          <button
            onClick={() => navigate("/animes")}
            className="px-6 py-2.5 bg-foreground text-background rounded-xl text-xs font-semibold cursor-pointer"
          >
            Voltar para Animes
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleWatchlist = () => {
    const next = toggleAnimeWatchlist(anime.id);
    setInWatchlist(next);
    if (next) {
      toast.success("Adicionado à sua lista!", {
        description: `"${anime.title}" foi salvo na sua lista.`,
      });
    } else {
      toast.info("Removido da sua lista", {
        description: `"${anime.title}" foi removido da sua lista.`,
      });
    }
  };

  const handleSelectEpisodeAndScroll = (epNumber: number, seasonNum?: number) => {
    if (seasonNum && seasonNum !== activeSeasonNumber) {
      setActiveSeasonNumber(seasonNum);
    }
    setActiveTab("episodes");
    setActiveEpisodeNumber(epNumber);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "episodes");
      if (seasonNum) next.set("season", String(seasonNum));
      next.set("ep", String(epNumber));
      return next;
    }, { replace: true });
    window.setTimeout(() => {
      playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  const handleDownloadEpisode = async (ep: NonNullable<typeof activeEpisode>) => {
    if (!anime || !activeSeason || downloadingKey) return;
    const key = `ep-${activeSeason.seasonNumber}-${ep.number}`;
    setDownloadingKey(key);
    const toastId = toast.loading(
      `Baixando ${anime.title} · T${activeSeason.seasonNumber} Ep.${ep.number}...`
    );
    try {
      await downloadRealAnimeEpisode({
        anime,
        season: activeSeason,
        episode: ep,
        dubId: selectedDubId,
      });
      toast.success("Episódio baixado e verificado (SHA-256 ✓).", {
        description: "Disponível em Meu Perfil → Downloads.",
        id: toastId,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível baixar este episódio no momento.",
        { id: toastId }
      );
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDownloadMangaChapter = async (ch: {
    id: string;
    number: string | number;
    numericNumber?: number;
    title: string;
    chapterUrl?: string;
    mangadexChapterId?: string;
    pages?: string[];
  }) => {
    if (!anime || downloadingKey) return;
    const key = `manga-${ch.id}`;
    setDownloadingKey(key);
    const lang: "pt" | "en" | "ja" = mangaLangFilter === "en" ? "en" : "pt";
    const toastId = toast.loading(`Compilando Mangá Cap. ${ch.number} em PDF...`);
    try {
      await downloadRealMangaChapter({
        anime,
        chapter: ch,
        language: lang,
      });
      toast.success("Capítulo de mangá baixado em PDF!", {
        description: "Abra em Meu Perfil → Downloads.",
        id: toastId,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível baixar este capítulo no momento.",
        { id: toastId }
      );
    } finally {
      setDownloadingKey(null);
    }
  };

  const firstMangaChapter = onlineChapters[0] || anime.manga?.chapters[0];
  const currentBanner = activeSeason?.banner || anime.banner;
  const currentPoster = activeSeason?.poster || anime.cover;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Atmospheric Banner Header */}
      <div className="relative w-full h-[46vh] min-h-[340px] overflow-hidden" data-protected-media>
        <img
          src={currentBanner}
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.45] transition-all duration-500"
        />
        {ambientTheme && (
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(ellipse 70% 60% at 70% 25%, rgba(${ambientTheme.ambientRgb}, 0.25), transparent 70%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <div className="relative h-full container mx-auto px-6 lg:px-12 flex flex-col justify-end pb-10">
          <Link
            to="/animes"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-8 w-fit transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o catálogo</span>
          </Link>
        </div>
      </div>

      {/* Main Layout */}
      <div className="container mx-auto px-6 lg:px-12 -mt-24 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Clean 2:3 Poster + Unified Single Decision Action Cluster */}
          <aside className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start">
            <div className="w-52 md:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-border/80 bg-accent mb-5">
              <ProtectedImage
                src={currentPoster}
                alt={`${anime.title} — Temporada ${activeSeason?.seasonNumber || 1}`}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>

            {/* Single Decision Action Cluster (No 5-button tower) */}
            <div className="w-full space-y-2.5">
              {activeEpisode && activeSeason && (
                <button
                  type="button"
                  onClick={() => handleSelectEpisodeAndScroll(activeEpisode.number)}
                  className="w-full py-3 px-4 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] cursor-pointer whitespace-nowrap"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    Assistir T{activeSeason.seasonNumber}: Ep. {activeEpisode.number}
                  </span>
                </button>
              )}

              {/* Contextual CanonBridge Action OR Original Indicator */}
              {!isOriginal && activeBridge ? (
                <Link
                  to={getMangaReaderPath(activeBridge.targetChapter)}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>{activeBridge.ctaLabel}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPlayingTrailer(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-accent border border-border text-foreground font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Film className="h-3.5 w-3.5 text-primary" />
                  <span>Assistir Trailer Oficial</span>
                </button>
              )}

              {/* Compact 4-Icon Utility Strip */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWatchlist}
                  className={`h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                    inWatchlist
                      ? "bg-primary/15 border-primary text-primary"
                      : "bg-card border-border hover:bg-accent text-foreground"
                  }`}
                  title={inWatchlist ? "Salvo na Minha Lista" : "Salvar na Lista"}
                  aria-label="Salvar na Lista"
                >
                  {inWatchlist ? (
                    <BookmarkCheck className="h-4 w-4 fill-current" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </button>

                {activeEpisode && activeSeason ? (
                  <button
                    type="button"
                    disabled={Boolean(downloadingKey)}
                    onClick={() => handleDownloadEpisode(activeEpisode)}
                    className="h-10 rounded-xl border border-border bg-card hover:bg-accent text-foreground flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                    title={`Baixar T${activeSeason.seasonNumber}:Ep.${activeEpisode.number} (SHA-256 Verificado)`}
                    aria-label="Baixar Episódio"
                  >
                    {downloadingKey ===
                    `ep-${activeSeason.seasonNumber}-${activeEpisode.number}` ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPlayingTrailer(true)}
                    className="h-10 rounded-xl border border-border bg-card hover:bg-accent text-foreground flex items-center justify-center transition-colors cursor-pointer"
                    title="Trailer"
                    aria-label="Trailer"
                  >
                    <Film className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowTechnicalSpecs((prev) => !prev)}
                  className={`h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                    showTechnicalSpecs
                      ? "bg-accent border-primary/50 text-primary"
                      : "bg-card border-border hover:bg-accent text-foreground"
                  }`}
                  title="Ficha Técnica e Registros"
                  aria-label="Ficha Técnica"
                  aria-expanded={showTechnicalSpecs}
                >
                  <Info className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="h-10 rounded-xl border border-border bg-card hover:bg-accent text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  title="Compartilhar obra"
                  aria-label="Compartilhar"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Expandable On-Demand Technical Specifications */}
            {showTechnicalSpecs && (
              <div className="w-full mt-4 p-4 rounded-xl bg-card border border-border space-y-2.5 text-xs animate-in fade-in duration-150">
                <div className="flex justify-between pb-2 border-b border-border/70">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-foreground">{anime.status}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border/70">
                  <span className="text-muted-foreground">Estúdio</span>
                  <span className="font-medium text-foreground">{anime.studio}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border/70 tabular-nums">
                  <span className="text-muted-foreground">Temporadas / Eps</span>
                  <span className="font-medium text-foreground">
                    {anime.seasons?.length || 1} · {anime.episodesCount} eps
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border/70 tabular-nums">
                  <span className="text-muted-foreground">Obra Original</span>
                  <span className="font-medium text-foreground">
                    {isOriginal
                      ? "Original para Animação"
                      : `${anime.manga?.chaptersCount || 0} capítulos`}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-border/70">
                  <span className="text-muted-foreground">Autor</span>
                  <span className="font-medium text-foreground truncate max-w-[140px]">
                    {anime.manga?.author || anime.studio}
                  </span>
                </div>
                {anime.imdbId && (
                  <div className="flex justify-between tabular-nums">
                    <span className="text-muted-foreground">IMDb / MAL</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {anime.imdbId} · #{anime.malId}
                    </span>
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* Right Column: Editorial Overview + CanonBridge Switcher + Player / Chapters */}
          <div className="md:col-span-8 lg:col-span-9">
            {/* Zero-Pill Editorial Eyebrow */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground mb-2.5 tabular-nums">
              <span className="font-semibold text-primary">{anime.status}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="h-3.5 w-3.5 fill-current" />
                {anime.rating.toFixed(1)}
              </span>
              <span>({anime.ratingCount.toLocaleString()} avaliações)</span>
              <span aria-hidden="true">·</span>
              <span>{anime.audio}</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight text-balance mb-1.5">
              {anime.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              {anime.japaneseTitle} · {anime.studio} · {anime.year}
            </p>

            {/* Unboxed Typographic Genres */}
            <p className="text-xs text-muted-foreground mb-6">
              {Array.from(new Set(anime.genres || [])).join(" · ")}
            </p>

            {/* Synopsis */}
            <div className="mb-8 max-w-3xl">
              <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                {anime.synopsis}
              </p>
            </div>

            {/* Unified Segmented Mode Switcher + CanonBridge™ Status Strip */}
            <div className="rounded-2xl bg-card border border-border p-3 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-secondary/70 rounded-xl w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("episodes")}
                  className={`flex-1 lg:flex-initial px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === "episodes"
                      ? "bg-card text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Tv className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Anime ({anime.seasons.length}{" "}
                    {anime.seasons.length === 1 ? "Temp." : "Temps."} · {anime.episodesCount} eps)
                  </span>
                </button>

                {!isOriginal && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("manga")}
                    className={`flex-1 lg:flex-initial px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                      activeTab === "manga"
                        ? "bg-card text-foreground shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span>Mangá ({anime.manga?.chaptersCount || 0} caps)</span>
                  </button>
                )}
              </div>

              {/* CanonBridge™ Live Equivalence Banner */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 px-2 text-xs">
                {!isOriginal && activeBridge ? (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ArrowLeftRight className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        <strong className="text-foreground">CanonBridge:</strong>{" "}
                        {activeBridge.bannerText}
                      </span>
                    </div>
                    <Link
                      to={getMangaReaderPath(activeBridge.targetChapter)}
                      className="inline-flex items-center gap-1 text-primary font-semibold hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>Ler Cap. {activeBridge.targetChapter}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      <strong className="text-foreground">Obra Original para Animação</strong> ·{" "}
                      História concebida diretamente para TV/Cinema
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* TAB 1: WATCH ANIME */}
            {activeTab === "episodes" && activeSeason && activeEpisode && (
              <div ref={playerSectionRef}>
                {/* Secure Anti-Redirect Video Player with Unified Audio & Subtitles Popover */}
                <div className="mb-8">
                  <SecureAnimePlayer
                    animeTitle={anime.title}
                    season={activeSeason}
                    episode={activeEpisode}
                    onSelectEpisode={(epNum) => setActiveEpisodeNumber(epNum)}
                    onDubChange={(dubId) => setSelectedDubId(dubId)}
                    onNextEpisode={() => {
                      const idx = currentSeasonEpisodes.findIndex(
                        (e) => e.number === activeEpisode.number
                      );
                      if (idx !== -1 && idx < currentSeasonEpisodes.length - 1) {
                        setActiveEpisodeNumber(currentSeasonEpisodes[idx + 1].number);
                      } else {
                        const nextSeason = anime.seasons?.find(
                          (s) => s.seasonNumber === activeSeason.seasonNumber + 1
                        );
                        if (nextSeason && nextSeason.episodes.length > 0) {
                          setActiveSeasonNumber(nextSeason.seasonNumber);
                          setActiveEpisodeNumber(nextSeason.episodes[0].number);
                          toast.success(`Iniciando ${nextSeason.title}!`);
                        }
                      }
                    }}
                    onPreviousEpisode={() => {
                      const idx = currentSeasonEpisodes.findIndex(
                        (e) => e.number === activeEpisode.number
                      );
                      if (idx > 0) {
                        setActiveEpisodeNumber(currentSeasonEpisodes[idx - 1].number);
                      } else if (activeSeason.seasonNumber > 1) {
                        const prevSeason = anime.seasons?.find(
                          (s) => s.seasonNumber === activeSeason.seasonNumber - 1
                        );
                        if (prevSeason && prevSeason.episodes.length > 0) {
                          setActiveSeasonNumber(prevSeason.seasonNumber);
                          setActiveEpisodeNumber(
                            prevSeason.episodes[prevSeason.episodes.length - 1].number
                          );
                        }
                      }
                    }}
                    hasNextEpisode={
                      currentSeasonEpisodes.findIndex((e) => e.number === activeEpisode.number) <
                        currentSeasonEpisodes.length - 1 ||
                      !!anime.seasons?.find((s) => s.seasonNumber === activeSeason.seasonNumber + 1)
                    }
                    hasPreviousEpisode={
                      currentSeasonEpisodes.findIndex((e) => e.number === activeEpisode.number) > 0 ||
                      activeSeason.seasonNumber > 1
                    }
                  />
                </div>

                {/* Season Selector */}
                {anime.seasons && anime.seasons.length > 1 && (
                  <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-card border border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Temporadas ({anime.seasons.length})
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {anime.seasons.map((s) => {
                        const isSeasonActive = s.seasonNumber === activeSeason.seasonNumber;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setActiveSeasonNumber(s.seasonNumber);
                              setEpisodeSearch("");
                              if (s.episodes.length > 0) {
                                setActiveEpisodeNumber(s.episodes[0].number);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                              isSeasonActive
                                ? "bg-primary text-white border-primary shadow-md"
                                : "bg-secondary/40 border-border hover:bg-secondary/80 text-foreground"
                            }`}
                          >
                            <img
                              src={s.poster}
                              alt={s.title}
                              className="w-11 aspect-[2/3] object-cover rounded-lg shrink-0 border border-white/10"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1 mb-0.5 tabular-nums">
                                <span className="text-xs font-semibold">
                                  Temporada {s.seasonNumber}
                                </span>
                                <span
                                  className={`text-[11px] ${
                                    isSeasonActive ? "text-white/85" : "text-muted-foreground"
                                  }`}
                                >
                                  {s.year}
                                </span>
                              </div>
                              <p
                                className={`text-xs truncate font-medium ${
                                  isSeasonActive ? "text-white" : "text-foreground/90"
                                }`}
                              >
                                {s.title.replace(/^Temporada\s*\d+\s*:\s*/i, "").trim()}
                              </p>
                              <p
                                className={`text-[11px] mt-0.5 tabular-nums ${
                                  isSeasonActive ? "text-white/80" : "text-muted-foreground"
                                }`}
                              >
                                {s.episodesCount} episódios
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Episodes Header + Pace Filter + Density Toggle */}
                <div className="mb-12">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {activeSeason.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        {filteredEpisodes.length} de {currentSeasonEpisodes.length} episódios
                        {fillerCountInSeason > 0 && paceFilter === "canon"
                          ? ` (${fillerCountInSeason} fillers ocultados)`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Pace Intelligence Filter (All vs Canon Only) */}
                      <div className="flex items-center p-1 bg-secondary/70 border border-border rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() => setPaceFilter("all")}
                          className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                            paceFilter === "all"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaceFilter("canon")}
                          className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                            paceFilter === "canon"
                              ? "bg-card text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Apenas Canônicos</span>
                        </button>
                      </div>

                      {/* Density Toggle (Editorial List vs Compact Grid) */}
                      <div className="flex items-center p-1 bg-secondary/70 border border-border rounded-lg">
                        <button
                          type="button"
                          onClick={() => setEpisodeDensity("list")}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            episodeDensity === "list"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Lista Editorial"
                          aria-label="Lista Editorial"
                        >
                          <LayoutList className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEpisodeDensity("grid")}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            episodeDensity === "grid"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Grade Compacta"
                          aria-label="Grade Compacta"
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Episode Search */}
                      {currentSeasonEpisodes.length > 6 && (
                        <div className="relative w-full sm:w-56">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            value={episodeSearch}
                            onChange={(e) => setEpisodeSearch(e.target.value)}
                            placeholder="Filtrar nº ou título..."
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          {episodeSearch && (
                            <button
                              type="button"
                              onClick={() => setEpisodeSearch("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Episode List / Compact Grid */}
                  {episodeDensity === "list" ? (
                    <div className="space-y-3">
                      {filteredEpisodes.map((ep) => {
                        const isActive = ep.number === activeEpisode.number;
                        const epBridge = resolveCanonBridge(
                          anime,
                          "anime",
                          ep.number,
                          ep.seasonNumber
                        );
                        const cleanTitle = getCleanEpisodeTitle(ep);
                        const cleanSummary = getCleanEpisodeSynopsis(anime, ep);

                        return (
                          <div
                            key={ep.id}
                            onClick={() => handleSelectEpisodeAndScroll(ep.number)}
                            className={`group p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4 ${
                              isActive
                                ? "bg-accent border-primary shadow-sm"
                                : "bg-card border-border hover:bg-accent/40"
                            }`}
                          >
                            <div className="relative w-full sm:w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-secondary">
                              <img
                                src={ep.thumbnail}
                                alt={cleanTitle}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                    isActive
                                      ? "bg-primary text-white"
                                      : "bg-white/85 text-neutral-900 group-hover:bg-primary group-hover:text-white"
                                  } transition-colors`}
                                >
                                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono tabular-nums">
                                {ep.duration}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs mb-1 tabular-nums">
                                <span className="font-mono font-semibold text-primary">
                                  T{ep.seasonNumber}:Ep. {ep.number}
                                </span>
                                {epBridge.isFiller ? (
                                  <span className="text-[11px] text-amber-500 font-medium">
                                    · Filler
                                  </span>
                                ) : !isOriginal && epBridge.supported ? (
                                  <Link
                                    to={getMangaReaderPath(epBridge.targetChapter)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                                    title={`Abrir no Mangá (${epBridge.equivSpan})`}
                                  >
                                    <span>·</span>
                                    <ArrowLeftRight className="h-3 w-3 text-primary" />
                                    <span>{epBridge.equivSpan}</span>
                                  </Link>
                                ) : null}
                              </div>

                              <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {cleanTitle}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                {cleanSummary}
                              </p>
                            </div>

                            <div className="sm:self-center flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={Boolean(downloadingKey)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadEpisode(ep);
                                }}
                                title={`Baixar T${ep.seasonNumber}:Ep.${ep.number} · Integridade SHA-256 verificada`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-foreground text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                {downloadingKey ===
                                `ep-${activeSeason.seasonNumber}-${ep.number}` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                                <span>Baixar</span>
                              </button>
                              <button
                                type="button"
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  isActive
                                    ? "bg-primary text-white"
                                    : "bg-secondary text-foreground group-hover:bg-primary group-hover:text-white"
                                }`}
                              >
                                {isActive ? "Reproduzindo" : "Assistir"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Compact Grid Mode */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {filteredEpisodes.map((ep) => {
                        const isActive = ep.number === activeEpisode.number;
                        const epBridge = resolveCanonBridge(
                          anime,
                          "anime",
                          ep.number,
                          ep.seasonNumber
                        );
                        const cleanTitle = getCleanEpisodeTitle(ep);
                        return (
                          <div
                            key={ep.id}
                            onClick={() => handleSelectEpisodeAndScroll(ep.number)}
                            className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isActive
                                ? "bg-accent border-primary shadow-sm"
                                : "bg-card border-border hover:bg-accent/40"
                            }`}
                          >
                            <div>
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary mb-2.5">
                                <img
                                  src={ep.thumbnail}
                                  alt={cleanTitle}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono tabular-nums">
                                  {ep.duration}
                                </span>
                                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-[10px] font-semibold text-white tabular-nums">
                                  Ep. {ep.number}
                                </span>
                              </div>

                              <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {cleanTitle}
                              </h4>
                              <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                                {epBridge.isFiller
                                  ? "Episódio Filler"
                                  : !isOriginal && epBridge.supported
                                  ? `Adapta ${epBridge.equivSpan}`
                                  : `Temporada ${ep.seasonNumber}`}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border/60">
                              <button
                                type="button"
                                disabled={Boolean(downloadingKey)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadEpisode(ep);
                                }}
                                title="Baixar episódio"
                                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="h-3 w-3" />
                                <span>Baixar</span>
                              </button>
                              <span
                                className={`text-[11px] font-semibold ${
                                  isActive ? "text-primary" : "text-foreground/80 group-hover:text-primary"
                                }`}
                              >
                                {isActive ? "No Player" : "Assistir →"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Community Reviews */}
                <CommunityReviews
                  itemId={anime.id}
                  itemType="anime"
                  itemTitle={anime.title}
                  defaultRating={anime.rating}
                  defaultRatingCount={anime.ratingCount}
                />
              </div>
            )}

            {/* TAB 2: READ MANGA (Streamlined Editorial Header + CanonBridge Reverse Links) */}
            {activeTab === "manga" && !isOriginal && (
              <div>
                <div className="p-5 rounded-2xl bg-card border border-border mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="min-w-0">
                    <p className="text-xs text-primary font-semibold mb-1">
                      Obra Original Sincronizada
                    </p>
                    <h3 className="text-xl font-semibold text-foreground truncate">
                      {anime.manga?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Roteiro: <strong className="text-foreground">{anime.manga?.author}</strong> ·
                      Arte: <strong className="text-foreground">{anime.manga?.artist}</strong>
                      {anime.manga?.serialization ? ` · ${anime.manga.serialization}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {savedMangaProgress && (
                      <Link
                        to={getMangaReaderPath(savedMangaProgress.chapterNumber)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-accent border border-border text-foreground text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        <Check className="h-3.5 w-3.5 text-primary" />
                        <span>Continuar Cap. {savedMangaProgress.chapterNumber}</span>
                      </Link>
                    )}

                    {firstMangaChapter && (
                      <Link
                        to={`/animes/${anime.id}/manga/${encodeURIComponent(firstMangaChapter.id)}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Ler do Capítulo 1</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Chapters List Section */}
                <div className="mb-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <span>Capítulos Disponíveis</span>
                        {isLoadingChapters && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      </h3>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {onlineChapters.length > 0
                          ? `${onlineChapters.length} capítulos oficiais carregados`
                          : `${anime.manga?.chapters.length || 0} capítulos locais prontos para leitura`}
                      </p>
                    </div>

                    {/* Language Segmented Filter */}
                    <div className="flex items-center gap-1 bg-secondary/70 border border-border p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setMangaLangFilter("pt-br")}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          mangaLangFilter === "pt-br"
                            ? "bg-card text-foreground font-semibold shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Português (PT-BR)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMangaLangFilter("en")}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          mangaLangFilter === "en"
                            ? "bg-card text-foreground font-semibold shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        English (EN)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMangaLangFilter("all")}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          mangaLangFilter === "all"
                            ? "bg-card text-foreground font-semibold shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Todos
                      </button>
                    </div>
                  </div>

                  {isLoadingChapters && onlineChapters.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                      <p className="text-sm text-foreground">
                        Sincronizando capítulos oficiais...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {(onlineChapters.length > 0
                        ? onlineChapters.map((chapter) => ({
                            id: chapter.id,
                            number: chapter.number,
                            numericNumber: chapter.numericNumber,
                            title: chapter.title,
                            subtitle: `${chapter.scanlationGroup}${
                              chapter.pagesCount > 0 ? ` · ${chapter.pagesCount} págs` : ""
                            } · ${chapter.publishAt}`,
                            langTag: chapter.translatedLanguage.toUpperCase(),
                            raw: chapter,
                          }))
                        : (anime.manga?.chapters || []).map((chapter) => ({
                            id: chapter.id,
                            number: chapter.number,
                            numericNumber: chapter.number,
                            title: chapter.title,
                            subtitle: `${chapter.description} · ${chapter.pagesCount} págs`,
                            langTag: "PT-BR",
                            raw: chapter,
                          }))
                      ).map((item) => {
                        const reverseBridge = resolveCanonBridge(
                          anime,
                          "manga",
                          item.numericNumber
                        );
                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 font-mono font-semibold text-sm tabular-nums">
                                #{item.number}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                    {item.title}
                                  </h4>
                                  <span className="text-[11px] text-muted-foreground tabular-nums">
                                    · {item.langTag}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                              {reverseBridge.supported && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSelectEpisodeAndScroll(
                                      reverseBridge.targetEpisode,
                                      reverseBridge.targetSeason
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-xs font-medium text-foreground transition-colors whitespace-nowrap cursor-pointer tabular-nums"
                                  title={`Assistir episódio correspondente (${reverseBridge.equivSpan})`}
                                >
                                  <ArrowLeftRight className="h-3 w-3 text-primary" />
                                  <span>{reverseBridge.equivSpan}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={Boolean(downloadingKey)}
                                onClick={() => handleDownloadMangaChapter(item.raw)}
                                title={`Baixar Capítulo ${item.number} em PDF`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-foreground text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                              >
                                {downloadingKey === `manga-${item.id}` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                                <span>PDF</span>
                              </button>

                              <Link
                                to={`/animes/${anime.id}/manga/${encodeURIComponent(item.id)}`}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                              >
                                <span>Ler</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Community Reviews for Manga */}
                <CommunityReviews
                  itemId={anime.id}
                  itemType="manga"
                  itemTitle={`Mangá ${anime.manga?.title || anime.title}`}
                  defaultRating={anime.rating}
                  defaultRatingCount={Math.round((anime.ratingCount || 100) * 0.7)}
                />
              </div>
            )}

            {/* Related Animes */}
            {relatedAnimes.length > 0 && (
              <div className="pt-10 border-t border-border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">
                    Obras Relacionadas
                  </h3>
                  <Link
                    to="/animes"
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Ver catálogo completo →
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {relatedAnimes.map((item) => (
                    <AnimeCard
                      key={item.id}
                      item={item}
                      onOpenPlayer={(it) => setPlayerAnime(it)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimePlayerModal
        anime={playerAnime || (isPlayingTrailer ? anime : null)}
        isOpen={!!playerAnime || isPlayingTrailer}
        onClose={() => {
          setPlayerAnime(null);
          setIsPlayingTrailer(false);
        }}
      />

      <ShareDialog
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        title={`${anime.title} — Streaming de Anime & Mangá | Wotho`}
        text={anime.synopsis || `Assista ${anime.title} na plataforma Wotho.`}
      />

      <Footer />
    </div>
  );
};

export default AnimeDetail;
