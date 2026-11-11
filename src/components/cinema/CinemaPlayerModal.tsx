import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePlayerAdBlock } from "@/hooks/usePlayerAdBlock";
import { fetchTVmazeEpisodesByTitle, TVmazeEpisode } from "@/lib/tvmazeApi";
import {
  CinemaItem,
  CinemaServerId,
  CinemaLanguage,
  CINEMA_SERVERS,
  CINEMA_LANGUAGE_OPTIONS,
  getCinemaStreamUrl,
  getCinemaLanguagePreference,
  setCinemaLanguagePreference,
  getNextFallbackServer,
  saveCinemaProgress,
  getCinemaProgressMap,
} from "@/lib/cinema";
import { WorscoiIntroPlayer } from "@/components/WorscoiIntroPlayer";
import {
  Play,
  X,
  ChevronRight,
  ChevronLeft,
  Layers,
  Star,
  Server,
  ExternalLink,
  Clock,
  Film,
  Tv,
  Shield,
  Globe,
  Unlock,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface CinemaPlayerModalProps {
  item: CinemaItem | null;
  initialSeasonNumber?: number;
  initialEpisodeNumber?: number;
  initialServer?: CinemaServerId;
  isOpen: boolean;
  onClose: () => void;
}

export const CinemaPlayerModal = ({
  item,
  initialSeasonNumber,
  initialEpisodeNumber,
  initialServer,
  isOpen,
  onClose,
}: CinemaPlayerModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const { blockedCount } = usePlayerAdBlock(isOpen);
  const [selectedServer, setSelectedServer] = useState<CinemaServerId>(
    initialServer || "vidstuck"
  );
  const [selectedLanguage, setSelectedLanguage] = useState<CinemaLanguage>(() =>
    getCinemaLanguagePreference()
  );
  const [customStreamUrl, setCustomStreamUrl] = useState("");
  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number>(
    initialSeasonNumber || 1
  );
  const [activeEpisodeNumber, setActiveEpisodeNumber] = useState<number>(
    initialEpisodeNumber || 1
  );
  const [tvmazeEpisodes, setTvmazeEpisodes] = useState<TVmazeEpisode[]>([]);

  // Anti-redirect shield while video is playing
  const [isRedirectShieldActive, setIsRedirectShieldActive] = useState(true);
  const [isCenterTemporarilyUnlocked, setIsCenterTemporarilyUnlocked] = useState(false);
  const [shieldBlockedClicks, setShieldBlockedClicks] = useState(0);

  // Sync language preference across components
  useEffect(() => {
    const handleLangUpdate = (e: Event) => {
      const detail = (e as CustomEvent<CinemaLanguage>).detail;
      if (detail === "pt" || detail === "en") {
        setSelectedLanguage(detail);
      } else {
        setSelectedLanguage(getCinemaLanguagePreference());
      }
    };
    window.addEventListener("worscoi_cinema_language_updated", handleLangUpdate);
    return () =>
      window.removeEventListener("worscoi_cinema_language_updated", handleLangUpdate);
  }, []);

  const handleSelectLanguage = (lang: CinemaLanguage) => {
    setSelectedLanguage(lang);
    setCinemaLanguagePreference(lang);
    setIsIframeLoading(true);
    toast.success(
      lang === "pt"
        ? "Idioma definido para Português (PT-BR · Dublado / Legendado)"
        : "Language set to English (Original Audio & Subtitles)"
    );
  };

  const handleTemporaryUnlockCenter = () => {
    setIsCenterTemporarilyUnlocked(true);
  };

  useEffect(() => {
    if (!isCenterTemporarilyUnlocked) return;
    const timer = setTimeout(() => {
      setIsCenterTemporarilyUnlocked(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [isCenterTemporarilyUnlocked]);

  useEffect(() => {
    if (!isOpen || !item || item.type !== "serie") {
      setTvmazeEpisodes([]);
      return;
    }
    let cancelled = false;
    fetchTVmazeEpisodesByTitle(item.originalTitle || item.title).then((eps) => {
      if (!cancelled && eps.length > 0) setTvmazeEpisodes(eps);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, item?.id, item?.type, item?.originalTitle, item?.title]);

  // Sync initial episode & season when item changes
  useEffect(() => {
    if (!item) return;

    if (initialSeasonNumber) {
      setActiveSeasonNumber(initialSeasonNumber);
    } else if (item.seasons && item.seasons.length > 0) {
      setActiveSeasonNumber(item.seasons[0].seasonNumber);
    }

    if (initialEpisodeNumber) {
      setActiveEpisodeNumber(initialEpisodeNumber);
    } else if (item.id) {
      const saved = getCinemaProgressMap()[item.id];
      if (saved?.episodeNumber) {
        setActiveEpisodeNumber(saved.episodeNumber);
        if (saved.seasonNumber) setActiveSeasonNumber(saved.seasonNumber);
      } else {
        setActiveEpisodeNumber(1);
      }
    }
    if (initialServer) {
      setSelectedServer(initialServer);
    } else if (selectedServer === "trailer") {
      setSelectedServer("vidstuck");
    }
  }, [item?.id, initialSeasonNumber, initialEpisodeNumber, initialServer, isOpen]);

  // Reset intro and loading shield when stream changes
  useEffect(() => {
    if (!isOpen) return;
    setShowIntro(true);
    setIsIframeLoading(true);
    // Allow first click in center for 4 seconds after load so user can press initial Play if needed
    setIsCenterTemporarilyUnlocked(true);
  }, [isOpen, item?.id, activeSeasonNumber, activeEpisodeNumber]);

  useEffect(() => {
    if (!isOpen || showIntro) return;
    const timer = setTimeout(() => setIsIframeLoading(false), 900);
    return () => clearTimeout(timer);
  }, [isOpen, showIntro, selectedServer, selectedLanguage]);

  // Automatic failover if a server does not respond within 8.5s
  useEffect(() => {
    if (!isOpen || showIntro || !isIframeLoading || selectedServer === "native") return;
    const failoverTimer = setTimeout(() => {
      const nextSrv = getNextFallbackServer(selectedServer);
      const nextOption = CINEMA_SERVERS.find((s) => s.id === nextSrv);
      setSelectedServer(nextSrv);
      setIsIframeLoading(false);
      toast.info(
        `Servidor anterior não respondeu a tempo. Alternando automaticamente para ${
          nextOption?.shortName || nextSrv
        }.`
      );
    }, 8500);
    return () => clearTimeout(failoverTimer);
  }, [isOpen, showIntro, isIframeLoading, selectedServer]);

  // Track progress periodically while player is open
  useEffect(() => {
    if (!item || !isOpen) return;
    const interval = setInterval(() => {
      saveCinemaProgress(
        item.id,
        50,
        item.type === "serie" ? activeSeasonNumber : undefined,
        item.type === "serie" ? activeEpisodeNumber : undefined
      );
    }, 15000);
    return () => clearInterval(interval);
  }, [item, isOpen, activeSeasonNumber, activeEpisodeNumber]);

  if (!item) return null;

  const seasons = item.seasons || [];
  const currentSeason =
    seasons.find((s) => s.seasonNumber === activeSeasonNumber) || seasons[0];
  const episodes = currentSeason?.episodes || [];
  const activeEpisode =
    episodes.find((e) => e.episodeNumber === activeEpisodeNumber) || episodes[0];

  const currentServerOption = CINEMA_SERVERS.find((s) => s.id === selectedServer);
  const displayTitle =
    selectedLanguage === "en" && item.originalTitle ? item.originalTitle : item.title;

  // Resolve authentic stream URL using IMDb/TMDB ID, selected server, and user language
  const streamUrl = getCinemaStreamUrl(item, {
    server: selectedServer,
    seasonNumber: activeSeasonNumber,
    episodeNumber: activeEpisodeNumber,
    language: selectedLanguage,
  });

  const handleNextEpisode = () => {
    if (episodes.length === 0) return;
    const currentIdx = episodes.findIndex((e) => e.episodeNumber === activeEpisodeNumber);
    if (currentIdx !== -1 && currentIdx < episodes.length - 1) {
      setActiveEpisodeNumber(episodes[currentIdx + 1].episodeNumber);
    } else {
      const seasonIdx = seasons.findIndex((s) => s.seasonNumber === activeSeasonNumber);
      if (seasonIdx !== -1 && seasonIdx < seasons.length - 1) {
        const nextSeason = seasons[seasonIdx + 1];
        setActiveSeasonNumber(nextSeason.seasonNumber);
        if (nextSeason.episodes.length > 0) {
          setActiveEpisodeNumber(nextSeason.episodes[0].episodeNumber);
        }
      }
    }
  };

  const handlePrevEpisode = () => {
    if (episodes.length === 0) return;
    const currentIdx = episodes.findIndex((e) => e.episodeNumber === activeEpisodeNumber);
    if (currentIdx > 0) {
      setActiveEpisodeNumber(episodes[currentIdx - 1].episodeNumber);
    } else {
      const seasonIdx = seasons.findIndex((s) => s.seasonNumber === activeSeasonNumber);
      if (seasonIdx > 0) {
        const prevSeason = seasons[seasonIdx - 1];
        setActiveSeasonNumber(prevSeason.seasonNumber);
        if (prevSeason.episodes.length > 0) {
          const lastEp = prevSeason.episodes[prevSeason.episodes.length - 1];
          setActiveEpisodeNumber(lastEp.episodeNumber);
        }
      }
    }
  };

  const hasNext =
    item.type === "serie" &&
    episodes.length > 0 &&
    (activeEpisodeNumber < episodes[episodes.length - 1].episodeNumber ||
      activeSeasonNumber < seasons[seasons.length - 1]?.seasonNumber);

  const hasPrev =
    item.type === "serie" &&
    episodes.length > 0 &&
    (activeEpisodeNumber > episodes[0].episodeNumber ||
      activeSeasonNumber > seasons[0]?.seasonNumber);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[96vw] bg-[#07090e] border border-white/10 p-0 overflow-hidden text-zinc-100 shadow-2xl rounded-xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-zinc-950/90 border-b border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              {item.type === "filme" ? (
                <Film className="w-3.5 h-3.5" />
              ) : (
                <Tv className="w-3.5 h-3.5" />
              )}
            </span>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white truncate">{displayTitle}</h3>
                {item.type === "serie" && activeEpisode && (
                  <span className="text-xs text-amber-400 font-mono shrink-0">
                    · T{activeSeasonNumber}:E{activeEpisodeNumber}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span>{item.year}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {item.rating.toFixed(1)}
                </span>
                <span>·</span>
                <span className="text-emerald-400 font-medium">
                  {selectedLanguage === "pt"
                    ? "Português (PT-BR)"
                    : "English (Original)"}
                </span>
                <span>·</span>
                <a
                  href={`https://www.imdb.com/title/${item.imdbId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-zinc-300 hover:text-amber-400 transition inline-flex items-center gap-1"
                  title="Ver no IMDb Oficial"
                >
                  IMDb: {item.imdbId}
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* Language Selector (Always 2 Options: Português & English) + Anti-Redirect Status */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-zinc-900 border border-white/15 rounded-lg p-0.5">
              <Globe className="w-3.5 h-3.5 text-amber-400 ml-2 mr-1 shrink-0" />
              {CINEMA_LANGUAGE_OPTIONS.map((langOpt) => (
                <button
                  key={langOpt.id}
                  type="button"
                  onClick={() => handleSelectLanguage(langOpt.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    selectedLanguage === langOpt.id
                      ? "bg-amber-500 text-black shadow-sm"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                  title={langOpt.audioDescription}
                >
                  {langOpt.shortLabel}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsRedirectShieldActive((v) => !v)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                isRedirectShieldActive
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
              }`}
              title="Bloqueia redirecionamentos e popups ao clicar sobre o player em reprodução"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                Anti-Redirecionamento{" "}
                {blockedCount + shieldBlockedClicks > 0
                  ? `(${blockedCount + shieldBlockedClicks})`
                  : "Ativo"}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              aria-label="Fechar player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Server Switcher Bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-black/60 border-b border-white/5 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-[11px] uppercase tracking-wider">Servidor:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {CINEMA_SERVERS.map((srv) => (
              <button
                key={srv.id}
                onClick={() => {
                  setSelectedServer(srv.id);
                  setIsIframeLoading(true);
                  setIsCenterTemporarilyUnlocked(true);
                }}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer shrink-0 font-medium ${
                  selectedServer === srv.id
                    ? "bg-amber-500 text-black shadow-sm"
                    : srv.id === "trailer"
                      ? "bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5"
                      : "bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10"
                }`}
                title={srv.description}
              >
                {srv.shortName}
              </button>
            ))}
          </div>

          {item.type === "serie" && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePrevEpisode}
                disabled={!hasPrev}
                className={`p-1 rounded text-xs transition ${
                  hasPrev
                    ? "text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    : "text-zinc-600 cursor-not-allowed"
                }`}
                title="Episódio Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextEpisode}
                disabled={!hasNext}
                className={`p-1 rounded text-xs transition ${
                  hasNext
                    ? "text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    : "text-zinc-600 cursor-not-allowed"
                }`}
                title="Próximo Episódio"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Video Player Display */}
        <div className="relative aspect-video w-full bg-black group/player">
          {selectedServer === "native" ? (
            <div className="w-full h-full flex flex-col bg-black">
              <div className="flex items-center gap-2 p-2.5 bg-zinc-900/90 border-b border-white/10">
                <input
                  type="url"
                  value={customStreamUrl}
                  onChange={(e) => setCustomStreamUrl(e.target.value)}
                  placeholder="Cole aqui o link direto .mp4 ou .m3u8 do filme/episódio..."
                  className="flex-1 bg-zinc-950 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              {customStreamUrl.trim() ? (
                <video
                  key={customStreamUrl}
                  src={customStreamUrl.trim()}
                  controls
                  autoPlay
                  playsInline
                  className="w-full flex-1 bg-black"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400 text-xs gap-2">
                  <p className="text-sm text-zinc-200 font-medium">
                    Player Nativo HTML5 (Sem Iframe / Sem Anúncios)
                  </p>
                  <p>
                    Cole um link direto <code className="text-amber-400">.mp4</code> ou{" "}
                    <code className="text-amber-400">.m3u8</code> acima para reproduzir imediatamente.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <iframe
                ref={iframeRef}
                key={`${item.id}-${selectedServer}-${selectedLanguage}-${activeSeasonNumber}-${activeEpisodeNumber}`}
                src={streamUrl}
                title={`${displayTitle} Reprodução Cinema`}
                className={`w-full h-full border-0 ${
                  showIntro ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
                referrerPolicy="no-referrer-when-downgrade"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                {...(currentServerOption?.supportsSandbox
                  ? {
                      sandbox:
                        "allow-scripts allow-same-origin allow-forms allow-presentation",
                    }
                  : {})}
                onLoad={() => setIsIframeLoading(false)}
                onError={() => {
                  const nextSrv = getNextFallbackServer(selectedServer);
                  setSelectedServer(nextSrv);
                }}
              />

              {/* Regra Anti-Redirecionamento ao Clicar no Player Reproduzindo:
                  Bloqueia cliques acidentais ou camadas invisíveis de propaganda na área central do vídeo,
                  preservando a barra inferior de controles (56px) totalmente livre. */}
              {!showIntro &&
                !isIframeLoading &&
                isRedirectShieldActive &&
                !isCenterTemporarilyUnlocked &&
                !currentServerOption?.supportsSandbox && (
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShieldBlockedClicks((c) => c + 1);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTemporaryUnlockCenter();
                    }}
                    className="absolute inset-x-0 top-12 bottom-14 z-20 cursor-default flex items-start justify-end p-3 opacity-0 hover:opacity-100 transition-opacity"
                    title="Escudo Anti-Redirecionamento ativo. Use a barra inferior do player ou clique em 'Liberar Clique (6s)' para clicar no centro."
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 border border-emerald-500/40 text-[11px] text-zinc-200 shadow-lg backdrop-blur-md">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Redirecionamento Bloqueado</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemporaryUnlockCenter();
                        }}
                        className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[10px] transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Unlock className="w-2.5 h-2.5" />
                        Pausar / Clicar no Player (6s)
                      </button>
                    </div>
                  </div>
                )}
            </>
          )}
          {showIntro ? (
            <div className="absolute inset-0 z-40">
              <WorscoiIntroPlayer onComplete={() => setShowIntro(false)} allowSkip />
            </div>
          ) : (
            isIframeLoading && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 select-none cursor-wait"
              >
                <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                  Carregando transmissão em{" "}
                  <span className="text-amber-400 font-semibold">
                    {selectedLanguage === "pt" ? "Português (PT-BR)" : "English (EN)"}
                  </span>{" "}
                  ({item.type === "filme" ? "Filme Completo" : `T${activeSeasonNumber}:E${activeEpisodeNumber}`})…
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedServer("vidlink");
                    }}
                    className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Alternar para Servidor 2 (VidLink 4K)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedServer("vidsrc");
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Alternar para Servidor 4 (VidSrc Blindado)
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Bottom Details & Episode Selector */}
        <div className="p-4 sm:p-5 bg-zinc-950/80 border-t border-white/10 max-h-[38vh] overflow-y-auto space-y-4">
          {/* Episode Info if Series */}
          {item.type === "serie" && activeEpisode && (
            <div className="pb-3 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400 font-semibold">
                      Temporada {activeSeasonNumber} · Episódio {activeEpisodeNumber}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <h4 className="text-sm font-semibold text-white">{activeEpisode.title}</h4>
                  </div>
                  {activeEpisode.synopsis && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {activeEpisode.synopsis}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {activeEpisode.duration}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Series Season Tabs & Episodes Carousel / Grid */}
          {item.type === "serie" && seasons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Temporadas & Episódios ({episodes.length} episódios)
                </span>

                {seasons.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {seasons.map((s) => (
                      <button
                        key={s.seasonNumber}
                        onClick={() => {
                          setActiveSeasonNumber(s.seasonNumber);
                          if (s.episodes.length > 0) {
                            setActiveEpisodeNumber(s.episodes[0].episodeNumber);
                          }
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition cursor-pointer shrink-0 ${
                          activeSeasonNumber === s.seasonNumber
                            ? "bg-amber-500 text-black font-semibold"
                            : "bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5"
                        }`}
                      >
                        T{s.seasonNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Episodes List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {episodes.map((ep) => {
                  const isCurrent = activeEpisodeNumber === ep.episodeNumber;
                  return (
                    <div
                      key={ep.episodeNumber}
                      onClick={() => setActiveEpisodeNumber(ep.episodeNumber)}
                      className={`group flex items-center gap-3 p-2.5 rounded-lg border transition cursor-pointer ${
                        isCurrent
                          ? "bg-amber-500/15 border-amber-500/50 text-white"
                          : "bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/10 text-zinc-300"
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
                        {ep.thumbnail ? (
                          <img
                            src={ep.thumbnail}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play
                            className={`w-3.5 h-3.5 ${
                              isCurrent ? "fill-amber-400 text-amber-400" : "text-white opacity-80"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-mono text-amber-400/90 truncate">
                          Ep. {ep.episodeNumber} · {ep.duration}
                        </div>
                        <div className="text-xs font-medium text-white truncate group-hover:text-amber-300 transition">
                          {ep.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Movie Synopsis */}
          {item.type === "filme" && (
            <p className="text-xs text-zinc-300 font-light leading-relaxed">
              {item.synopsis}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CinemaPlayerModal;
