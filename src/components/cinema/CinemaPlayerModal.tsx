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
import { Play, X, Clock, ExternalLink } from "lucide-react";

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
  usePlayerAdBlock(isOpen);
  const [selectedLanguage, setSelectedLanguage] = useState<CinemaLanguage>(() =>
    getCinemaLanguagePreference()
  );
  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number>(
    initialSeasonNumber || 1
  );
  const [activeEpisodeNumber, setActiveEpisodeNumber] = useState<number>(
    initialEpisodeNumber || 1
  );

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
  }, [item, initialSeasonNumber, initialEpisodeNumber, isOpen]);

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
      <DialogContent className="max-w-5xl w-[96vw] bg-[#060608] border border-white/10 p-0 overflow-hidden text-zinc-100 shadow-2xl rounded-3xl">
        {/* Clean Spatial Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-zinc-950/90 border-b border-white/[0.08] backdrop-blur-2xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate tracking-tight">
                {displayTitle}
              </h3>
              {item.type === "serie" && activeEpisode && (
                <span className="text-xs text-zinc-400 font-mono tabular-nums shrink-0">
                  · T{activeSeasonNumber}:E{activeEpisodeNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 tabular-nums mt-0.5">
              <span>{item.year}</span>
              <span aria-hidden="true">·</span>
              <span className="text-white font-medium">★ {item.rating.toFixed(1)}</span>
              <span aria-hidden="true">·</span>
              <span>{item.quality}</span>
              <span aria-hidden="true">·</span>
              <a
                href={`https://www.imdb.com/title/${item.imdbId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-zinc-400 hover:text-white transition inline-flex items-center gap-1"
                title="Ver no IMDb Oficial"
              >
                IMDb: {item.imdbId}
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-zinc-300 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Fechar player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Player */}
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
        <div className="p-5 bg-zinc-950/90 border-t border-white/[0.08] max-h-[38vh] overflow-y-auto space-y-4">
          {item.type === "serie" && activeEpisode && (
            <div className="pb-3 border-b border-white/[0.07]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono tabular-nums text-zinc-400">
                      T{activeSeasonNumber} · Ep. {activeEpisodeNumber}
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <h4 className="text-sm font-medium text-white">{activeEpisode.title}</h4>
                  </div>
                  {activeEpisode.synopsis && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {activeEpisode.synopsis}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-xs text-zinc-400 font-mono tabular-nums">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>{activeEpisode.duration}</span>
                </div>
              </div>
            </div>
          )}

          {item.type === "serie" && seasons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">
                  Temporadas & Episódios ({episodes.length})
                </span>

                {seasons.length > 1 && (
                  <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
                    {seasons.map((s) => (
                      <button
                        key={s.seasonNumber}
                        type="button"
                        onClick={() => {
                          setActiveSeasonNumber(s.seasonNumber);
                          if (s.episodes.length > 0) {
                            setActiveEpisodeNumber(s.episodes[0].episodeNumber);
                          }
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full transition cursor-pointer shrink-0 ${
                          activeSeasonNumber === s.seasonNumber
                            ? "bg-white text-black font-semibold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        T{s.seasonNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {episodes.map((ep) => {
                  const isCurrent = activeEpisodeNumber === ep.episodeNumber;
                  return (
                    <button
                      key={ep.episodeNumber}
                      type="button"
                      onClick={() => setActiveEpisodeNumber(ep.episodeNumber)}
                      className={`group text-left flex items-center gap-3 p-2.5 rounded-2xl border transition cursor-pointer ${
                        isCurrent
                          ? "bg-white/[0.1] border-white/25 text-white"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15 text-zinc-300"
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-xl bg-zinc-900 shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
                        {ep.thumbnail ? (
                          <img
                            src={ep.thumbnail}
                            alt={ep.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <Play
                            className={`w-3.5 h-3.5 ${
                              isCurrent ? "fill-white text-white" : "text-white/80"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-mono tabular-nums text-zinc-400 truncate">
                          Ep. {ep.episodeNumber} · {ep.duration}
                        </div>
                        <div className="text-xs font-medium text-white truncate">
                          {ep.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {item.type === "filme" && (
            <p className="text-xs text-zinc-300 leading-relaxed">{item.synopsis}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CinemaPlayerModal;
