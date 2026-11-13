import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import AnimePlayerModal from "@/components/AnimePlayerModal";
import SecureAnimePlayer from "@/components/SecureAnimePlayer";
import { CommunityReviews } from "@/components/CommunityReviews";
import {
  ANIMES_DATA,
  Anime,
  isAnimeInWatchlist,
  toggleAnimeWatchlist,
} from "@/lib/animes";
import { fetchMangaDexChapters, fetchAnimeMangaChapters, MangaDexChapter } from "@/lib/mangadex";
import { useContentProtection } from "@/hooks/useContentProtection";
import {
  Play,
  Star,
  Bookmark,
  BookmarkCheck,
  Share2,
  Tv,
  ArrowLeft,
  Volume2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Layers,
  Search,
  X,
  Download,
} from "lucide-react";
import { downloadRealAnimeEpisode, downloadRealMangaChapter } from "@/lib/mediaDownloaders";
import { toast } from "sonner";
import ShareDialog from "@/components/ShareDialog";

export const AnimeDetail = () => {
  useContentProtection();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerSectionRef = useRef<HTMLDivElement>(null);

  const anime = useMemo(() => {
    return ANIMES_DATA.find((a) => a.id === id || a.slug === id);
  }, [id]);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState<"episodes" | "manga">("episodes");
  const [activeSeasonNumber, setActiveSeasonNumber] = useState(1);
  const [activeEpisodeNumber, setActiveEpisodeNumber] = useState(1);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [playerAnime, setPlayerAnime] = useState<Anime | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedDubId, setSelectedDubId] = useState("ptbr:0");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Dynamic SEO Synchronization
  useEffect(() => {
    if (!anime) return;
    const pageTitle = `${anime.title} — Streaming de Anime & Mangá | Wotho`;
    document.title = pageTitle;
    const desc = anime.synopsis || `Assista ${anime.title} e leia mangás vinculados na plataforma Wotho.`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", pageTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", desc);
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", pageTitle);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", desc);
  }, [anime]);

  // MangaDex & Multi-Source Live Chapter State
  const [onlineChapters, setOnlineChapters] = useState<MangaDexChapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [mangaLangFilter, setMangaLangFilter] = useState<"pt-br" | "en" | "all">("pt-br");

  useEffect(() => {
    setActiveSeasonNumber(1);
    setActiveEpisodeNumber(1);
    setEpisodeSearch("");
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
    import("@/lib/userProfileStore").then(({ recordUserHistory }) => {
      recordUserHistory({
        itemId: anime.id,
        type: "anime",
        title: anime.title,
        subtitle: `${anime.studio} · ${anime.year}`,
        cover: anime.cover,
        href: `/animes/${anime.id}`,
        progressPercent: Math.min(100, Math.max(12, Math.round((activeEpisodeNumber / Math.max(1, anime.episodesCount || 12)) * 100))),
        detailLabel: `Temporada ${activeSeasonNumber} · Episódio ${activeEpisodeNumber} (Dublado PT-BR)`,
      });
    }).catch(() => {});
  }, [anime, activeSeasonNumber, activeEpisodeNumber]);

  // Fetch real chapters from Multi-Source Manga & MangaDex engine
  useEffect(() => {
    if (!anime) return;
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

  const filteredEpisodes = useMemo(() => {
    if (!episodeSearch.trim()) return currentSeasonEpisodes;
    const q = episodeSearch.toLowerCase().trim();
    return currentSeasonEpisodes.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        ep.synopsis.toLowerCase().includes(q) ||
        String(ep.number) === q
    );
  }, [currentSeasonEpisodes, episodeSearch]);

  const activeEpisode = useMemo(() => {
    return (
      currentSeasonEpisodes.find((ep) => ep.number === activeEpisodeNumber) ||
      currentSeasonEpisodes[0] ||
      anime?.episodes[0]
    );
  }, [currentSeasonEpisodes, activeEpisodeNumber, anime]);

  if (!anime) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navigation />
        <div className="container mx-auto px-6 py-32 text-center">
          <h2 className="text-2xl font-light mb-4 text-foreground">Anime não encontrado</h2>
          <p className="text-sm text-muted-foreground mb-6">
            O anime solicitado não foi localizado em nosso catálogo.
          </p>
          <button
            onClick={() => navigate("/animes")}
            className="px-6 py-2.5 bg-foreground text-background rounded-full text-xs uppercase tracking-wider font-medium"
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

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleSelectEpisodeAndScroll = (epNumber: number) => {
    setActiveEpisodeNumber(epNumber);
    playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
      toast.success("Episódio baixado! Acesse e assista em Meu Perfil → Downloads.", {
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
      toast.success("Capítulo de mangá baixado! Abra em Meu Perfil → Downloads.", {
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

  const firstMangaChapter = anime.manga?.chapters[0];
  const currentBanner = activeSeason?.banner || anime.banner;
  const currentPoster = activeSeason?.poster || anime.cover;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Cinematic Banner Header */}
      <div className="relative w-full h-[55vh] min-h-[380px] overflow-hidden" data-protected-media>
        <img
          src={currentBanner}
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-60 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <div className="relative h-full container mx-auto px-6 lg:px-12 flex flex-col justify-end pb-8">
          <Link
            to="/animes"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para catálogo de animes</span>
          </Link>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="container mx-auto px-6 lg:px-12 -mt-24 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Official Poster + Meta Actions */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start">
            <div className="w-56 md:w-full aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-border/80 bg-accent mb-6 relative group">
              <img
                src={currentPoster}
                alt={`${anime.title} - ${activeSeason?.title || "Poster Oficial"}`}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-white flex items-center justify-between">
                <span>Temporada {activeSeason?.seasonNumber || 1}</span>
                <span className="text-emerald-400 font-medium">Poster Oficial HD</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("episodes");
                  setIsPlayingTrailer(true);
                }}
                className="w-full py-3 px-4 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-soft transition-colors"
              >
                <Play className="h-4 w-4 fill-current" />
                Trailer Oficial da Obra
              </button>

              {firstMangaChapter && (
                <Link
                  to={`/animes/${anime.id}/manga/${firstMangaChapter.id}`}
                  className="w-full py-2.5 px-4 rounded-full bg-primary text-white hover:bg-primary/90 font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-soft transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Ler Mangá Online
                </Link>
              )}

              {activeEpisode && activeSeason && (
                <button
                  type="button"
                  disabled={Boolean(downloadingKey)}
                  onClick={() => handleDownloadEpisode(activeEpisode)}
                  className="w-full py-2.5 px-4 rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {downloadingKey === `ep-${activeSeason.seasonNumber}-${activeEpisode.number}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>
                    {downloadingKey === `ep-${activeSeason.seasonNumber}-${activeEpisode.number}`
                      ? "Baixando Ep..."
                      : `Baixar Ep. ${activeEpisode.number}`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleWatchlist}
                className={`w-full py-2.5 px-4 rounded-full border text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors ${
                  inWatchlist
                    ? "bg-primary/10 border-primary text-primary font-medium"
                    : "bg-card border-border hover:bg-accent text-foreground font-light"
                }`}
              >
                {inWatchlist ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 fill-current" />
                    Salvo na Minha Lista
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Salvar na Lista
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-2.5 px-4 rounded-full border border-border bg-card hover:bg-accent text-xs tracking-wider uppercase text-foreground font-light flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </button>
            </div>

            {/* Quick Metadata Box */}
            <div className="w-full mt-6 p-4 rounded-xl bg-card border border-border space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground font-light">Status Anime:</span>
                <span className="font-medium text-primary">{anime.status}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground font-light">Estúdio:</span>
                <span className="font-medium text-foreground">{anime.studio}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground font-light">Temporadas:</span>
                <span className="font-medium text-foreground">{anime.seasons?.length || 1}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground font-light">Total de Episódios:</span>
                <span className="font-medium text-foreground">{anime.episodesCount}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground font-light">Capítulos Mangá:</span>
                <span className="font-medium text-foreground">{anime.manga?.chaptersCount || 0}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground font-light">Autor da Obra:</span>
                <span className="font-medium text-foreground">{anime.manga?.author || anime.studio}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground font-light">Áudio:</span>
                <span className="font-medium text-foreground">{anime.audio}</span>
              </div>
              {anime.imdbId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Registro IMDb / MAL:</span>
                  <span className="font-mono text-[11px] text-foreground">
                    {anime.imdbId} / #{anime.malId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Title, Synopsis, Tabs (Watch or Read) */}
          <div className="md:col-span-8 lg:col-span-9">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded bg-primary/10 text-primary font-medium">
                {anime.status}
              </span>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{anime.rating.toFixed(1)}</span>
                <span className="text-muted-foreground font-light">
                  ({anime.ratingCount.toLocaleString()} avaliações)
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                <span>{anime.audio}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-light text-foreground tracking-tight mb-1">
              {anime.title}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground italic mb-6">
              {anime.japaneseTitle} • {anime.studio} ({anime.year})
            </p>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.from(new Set(anime.genres || [])).map((genre, idx) => (
                <span
                  key={`${genre}-${idx}`}
                  className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground font-light"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="mb-8">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Sinopse Oficial
              </h3>
              <p className="text-sm md:text-base text-foreground/80 font-light leading-relaxed">
                {anime.synopsis}
              </p>
            </div>

            {/* Section Switcher Tabs: Watch Anime vs Read Manga */}
            <div className="flex items-center gap-3 p-1.5 bg-secondary/60 rounded-xl mb-8 border border-border">
              <button
                type="button"
                onClick={() => setActiveTab("episodes")}
                className={`flex-1 py-3 px-4 rounded-lg text-xs md:text-sm font-medium tracking-wide flex items-center justify-center gap-2 transition-all ${
                  activeTab === "episodes"
                    ? "bg-card text-foreground shadow-soft border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Tv className="h-4 w-4 text-primary" />
                <span>
                  Assistir Anime ({anime.seasons.length}{" "}
                  {anime.seasons.length === 1 ? "Temporada" : "Temporadas"} • {anime.episodesCount} Eps)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("manga")}
                className={`flex-1 py-3 px-4 rounded-lg text-xs md:text-sm font-medium tracking-wide flex items-center justify-center gap-2 transition-all ${
                  activeTab === "manga"
                    ? "bg-card text-foreground shadow-soft border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Ler Mangá Original ({anime.manga?.chaptersCount || 0} Capítulos)</span>
              </button>
            </div>

            {/* TAB 1: WATCH ANIME (Episodes Player & Complete Seasons Hierarchy) */}
            {activeTab === "episodes" && activeSeason && activeEpisode && (
              <div ref={playerSectionRef}>
                {/* Secure Anti-Redirect Video Player */}
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

                {/* Season Selector Bar (Navegação Hierárquica em 3 Níveis: Anime -> Season -> Episode) */}
                <div className="mb-8 p-5 rounded-2xl bg-card border border-border shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <h3 className="text-base font-medium text-foreground">
                        Temporadas Oficiais Mapeadas ({anime.seasons?.length || 1})
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {anime.seasons?.map((s) => {
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
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                            isSeasonActive
                              ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                              : "bg-secondary/40 border-border hover:bg-secondary/80 text-foreground"
                          }`}
                        >
                          <img
                            src={s.poster}
                            alt={s.title}
                            className="w-12 h-16 object-cover rounded-lg flex-shrink-0 border border-white/10"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-semibold">
                                Temporada {s.seasonNumber}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  isSeasonActive
                                    ? "bg-white/20 text-white"
                                    : "bg-background text-muted-foreground"
                                }`}
                              >
                                {s.year}
                              </span>
                            </div>
                            <p
                              className={`text-xs truncate font-medium ${
                                isSeasonActive ? "text-white/95" : "text-foreground/90"
                              }`}
                            >
                              {s.title.replace(/^Temporada\s*\d+\s*:\s*/i, "").trim()}
                            </p>
                            <p
                              className={`text-[10px] mt-1 ${
                                isSeasonActive ? "text-white/80" : "text-muted-foreground"
                              }`}
                            >
                              {s.episodesCount} episódios completos
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Episodes List Section for Current Season */}
                <div className="mb-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-light text-foreground">
                        {activeSeason.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-light">
                        {currentSeasonEpisodes.length} episódios completos com fontes de vídeo únicas e verificadas
                      </p>
                    </div>

                    {/* Episode Filter Input */}
                    {currentSeasonEpisodes.length > 6 && (
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={episodeSearch}
                          onChange={(e) => setEpisodeSearch(e.target.value)}
                          placeholder="Filtrar episódio por nº ou título..."
                          className="w-full pl-9 pr-8 py-1.5 rounded-full bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {episodeSearch && (
                          <button
                            type="button"
                            onClick={() => setEpisodeSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {filteredEpisodes.map((ep) => {
                      const isActive = ep.number === activeEpisode.number;
                      return (
                        <div
                          key={ep.id}
                          onClick={() => handleSelectEpisodeAndScroll(ep.number)}
                          className={`group p-3 md:p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4 ${
                            isActive
                              ? "bg-accent border-primary shadow-soft"
                              : "bg-card border-border hover:bg-accent/40"
                          }`}
                        >
                          <div className="relative w-full sm:w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                            <img
                              src={ep.thumbnail}
                              alt={ep.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                  isActive
                                    ? "bg-primary text-white"
                                    : "bg-white/80 text-foreground group-hover:bg-primary group-hover:text-white"
                                } transition-colors`}
                              >
                                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                              {ep.duration}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-medium text-primary">
                                T{ep.seasonNumber}:Ep. {ep.number}
                              </span>
                              {ep.isFree && (
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">
                                  HD Oficial
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                                Hash: {ep.contentHash.slice(0, 12)}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {ep.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-light">
                              {ep.synopsis}
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
                              title={`Baixar T${ep.seasonNumber}:Ep.${ep.number}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent text-foreground text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                            >
                              {downloadingKey === `ep-${activeSeason.seasonNumber}-${ep.number}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              <span>Baixar</span>
                            </button>
                            <button
                              type="button"
                              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
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
                </div>

                {/* Community Reviews & Ratings for Anime */}
                <CommunityReviews
                  itemId={anime.id}
                  itemType="anime"
                  itemTitle={anime.title}
                  defaultRating={anime.rating}
                  defaultRatingCount={anime.ratingCount}
                />
              </div>
            )}

            {/* TAB 2: READ MANGA (Chapters List & Viewer) */}
            {activeTab === "manga" && (
              <div>
                {/* Manga Headline Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-accent/80 via-accent/40 to-transparent border border-border mb-8 flex flex-col sm:flex-row items-center gap-6">
                  <img
                    src={anime.manga?.cover || anime.cover}
                    alt={anime.manga?.title || anime.title}
                    className="w-32 aspect-[3/4] object-cover rounded-xl shadow-xl border border-border flex-shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">

                    <h3 className="text-xl md:text-2xl font-light text-foreground tracking-tight mb-2">
                      {anime.manga?.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-light mb-1">
                      Roteiro: <strong className="text-foreground">{anime.manga?.author}</strong> • Arte:{" "}
                      <strong className="text-foreground">{anime.manga?.artist}</strong>
                    </p>
                    {anime.manga?.serialization && (
                      <p className="text-xs text-muted-foreground font-light mb-4">
                        Serialização: <strong className="text-foreground">{anime.manga.serialization}</strong>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      {firstMangaChapter && (
                        <Link
                          to={`/animes/${anime.id}/manga/${onlineChapters[0]?.id || firstMangaChapter.id}`}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-medium uppercase tracking-wider transition-colors shadow-soft"
                        >
                          <BookOpen className="h-4 w-4" />
                          Começar do Capítulo 1
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chapters List Section */}
                <div className="mb-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-light text-foreground flex items-center gap-2">
                        <span>Capítulos do Mangá</span>
                        {isLoadingChapters && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      </h3>
                      <p className="text-xs text-muted-foreground font-light">
                        {onlineChapters.length > 0
                          ? `${onlineChapters.length} capítulos oficiais disponíveis para leitura`
                          : `${anime.manga?.chapters.length || 0} capítulos preparados para leitura imediata`}
                      </p>
                    </div>

                    {/* Language Filter */}
                    <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-full text-xs">
                      <button
                        type="button"
                        onClick={() => setMangaLangFilter("pt-br")}
                        className={`px-3 py-1 rounded-full transition-colors ${
                          mangaLangFilter === "pt-br"
                            ? "bg-primary text-white font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🇧🇷 Português (PT-BR)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMangaLangFilter("en")}
                        className={`px-3 py-1 rounded-full transition-colors ${
                          mangaLangFilter === "en"
                            ? "bg-primary text-white font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🇺🇸 Inglês (EN)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMangaLangFilter("all")}
                        className={`px-3 py-1 rounded-full transition-colors ${
                          mangaLangFilter === "all"
                            ? "bg-primary text-white font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        🌐 Todos
                      </button>
                    </div>
                  </div>

                  {isLoadingChapters && onlineChapters.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                      <p className="text-sm font-light text-foreground">
                        Sincronizando capítulos oficiais com servidores MangaDex...
                      </p>
                      <span className="text-xs text-muted-foreground mt-1">
                        Carregando volumes, scans e páginas traduzidas
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {onlineChapters.length > 0
                        ? onlineChapters.map((chapter) => (
                            <div
                              key={chapter.id}
                              className="p-4 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 font-mono font-medium text-sm">
                                  #{chapter.number}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                      {chapter.title}
                                    </h4>
                                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium flex-shrink-0">
                                      {chapter.translatedLanguage.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-light line-clamp-1">
                                    Scan / Grupo: <strong className="text-foreground">{chapter.scanlationGroup}</strong>
                                  </p>
                                  <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                                    {chapter.pagesCount > 0 ? `${chapter.pagesCount} páginas • ` : ""}
                                    Lançamento: {chapter.publishAt}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  disabled={Boolean(downloadingKey)}
                                  onClick={() => handleDownloadMangaChapter(chapter)}
                                  title={`Baixar Capítulo ${chapter.number} em PDF`}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-background hover:bg-accent text-foreground text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                                >
                                  {downloadingKey === `manga-${chapter.id}` ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                  <span>Baixar</span>
                                </button>
                                <Link
                                  to={`/animes/${anime.id}/manga/${chapter.id}`}
                                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-secondary hover:bg-primary hover:text-white text-foreground text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                                >
                                  <span>Ler Capítulo</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))
                        : (anime.manga?.chapters || []).map((chapter) => (
                            <div
                              key={chapter.id}
                              className="p-4 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 font-mono font-medium text-sm">
                                  #{chapter.number}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                      {chapter.title}
                                    </h4>
                                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-green-500/10 text-green-600 font-medium flex-shrink-0">
                                      HD Original
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-light line-clamp-1">
                                    {chapter.description}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                                    {chapter.pagesCount} páginas • {chapter.releaseDate}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  disabled={Boolean(downloadingKey)}
                                  onClick={() => handleDownloadMangaChapter(chapter)}
                                  title={`Baixar Capítulo ${chapter.number} em PDF`}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-background hover:bg-accent text-foreground text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                                >
                                  {downloadingKey === `manga-${chapter.id}` ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                  <span>Baixar</span>
                                </button>
                                <Link
                                  to={`/animes/${anime.id}/manga/${chapter.id}`}
                                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-secondary hover:bg-primary hover:text-white text-foreground text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                                >
                                  <span>Ler Capítulo</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                    </div>
                  )}
                </div>

                {/* Community Reviews & Ratings for Manga */}
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
              <div className="pt-8 border-t border-border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-light text-foreground">
                    Animes & Mangás Relacionados
                  </h3>
                  <Link
                    to="/animes"
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Ver catálogo completo →
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {/* Schema.org TVSeries Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TVSeries",
            name: anime.title,
            description: anime.synopsis,
            image: anime.cover || anime.banner || "https://wotho.vercel.app/og-image.jpg",
            inLanguage: "pt-BR",
            url: `https://wotho.vercel.app${window.location.pathname}`,
            genre: anime.genres,
            publisher: {
              "@type": "Organization",
              name: "Wotho",
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
};

export default AnimeDetail;
