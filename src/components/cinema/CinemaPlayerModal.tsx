import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePlayerAdBlock } from "@/hooks/usePlayerAdBlock";
import {
  CinemaItem,
  CinemaServerId,
  CinemaLanguage,
  getCinemaLanguagePreference,
  setCinemaLanguagePreference,
  saveCinemaProgress,
  getCinemaProgressMap,
} from "@/lib/cinema";
import { WorscoCinemaPlayer } from "@/components/cinema/WorscoCinemaPlayer";
import {
  Play,
  X,
  Layers,
  Star,
  ExternalLink,
  Clock,
  Film,
  Tv,
  Shield,
} from "lucide-react";

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
  isOpen,
  onClose,
}: CinemaPlayerModalProps) => {
  const { blockedCount } = usePlayerAdBlock(isOpen);
  const [selectedLanguage, setSelectedLanguage] = useState<CinemaLanguage>(() =>
    getCinemaLanguagePreference()
  );
  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number>(
    initialSeasonNumber || 1
  );
  const [activeEpisodeNumber, setActiveEpisodeNumber] = useState<number>(
    initialEpisodeNumber || 1
  );

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
  };

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
  }, [item?.id, initialSeasonNumber, initialEpisodeNumber, isOpen]);

  if (!item) return null;

  const seasons = item.seasons || [];
  const currentSeason =
    seasons.find((s) => s.seasonNumber === activeSeasonNumber) || seasons[0];
  const episodes = currentSeason?.episodes || [];
  const activeEpisode =
    episodes.find((e) => e.episodeNumber === activeEpisodeNumber) || episodes[0];

  const displayTitle =
    selectedLanguage === "en" && item.originalTitle ? item.originalTitle : item.title;

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

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <Shield className="w-3.5 h-3.5" />
              <span>
                Anti-Redirecionamento {blockedCount > 0 ? `(${blockedCount})` : "Ativo"}
              </span>
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              aria-label="Fechar player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unified Worsco Cinema Player */}
        <div className="p-2 sm:p-4 bg-black">
          <WorscoCinemaPlayer
            item={item}
            language={selectedLanguage}
            onLanguageChange={handleSelectLanguage}
            seasonNumber={activeSeasonNumber}
            episodeNumber={activeEpisodeNumber}
            totalEpisodes={episodes.length}
            episodeTitle={activeEpisode?.title}
            onSelectEpisode={(epNum) => {
              setActiveEpisodeNumber(epNum);
              saveCinemaProgress(item.id, 35, activeSeasonNumber, epNum);
            }}
          />
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

          {/* Series Season Tabs & Episodes Grid */}
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
