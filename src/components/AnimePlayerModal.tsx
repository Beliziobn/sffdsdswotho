import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Anime } from "@/lib/animes";
import { sanitizeTrailerEmbedUrl } from "@/lib/animeMetadataSync";
import { usePlayerAdBlock } from "@/hooks/usePlayerAdBlock";
import { Star, Tv, Calendar, Building2, ExternalLink, ShieldCheck, Play, Pause, Layers, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { WorscoiIntroPlayer } from "@/components/WorscoiIntroPlayer";

interface AnimePlayerModalProps {
  anime: Anime | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AnimePlayerModal = ({ anime, isOpen, onClose }: AnimePlayerModalProps) => {
  usePlayerAdBlock(isOpen);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  if (!anime) return null;

  const seasons = anime.seasons || [];
  const activeSeason = seasons[selectedSeasonIdx] || seasons[0];
  const trailerId = activeSeason?.trailerYoutubeId || anime.trailerYoutubeId || "HkIKAnwLZCw";
  const safeTrailerUrl = sanitizeTrailerEmbedUrl(trailerId, "HkIKAnwLZCw", true);

  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: isPlaying ? "pauseVideo" : "playVideo",
          args: [],
        }),
        "*"
      );
      setIsPlaying(!isPlaying);
    } catch {
      // Ignore cross-origin error
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedSeasonIdx(0);
          setShowIntro(true);
          onClose();
        } else {
          setShowIntro(true);
        }
      }}
    >
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border">
        {/* Top Security & Season Trailer Switcher Bar */}
        <div className="px-4 py-2.5 bg-neutral-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Trailer Oficial Verificado • Sandbox Anti-Redirect</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIntro(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Abertura Oficial Wotho"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Intro Wotho</span>
            </button>

            {seasons.length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pr-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
                {seasons.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSeasonIdx(idx);
                      setShowIntro(true);
                      setIsPlaying(true);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                      selectedSeasonIdx === idx
                        ? "bg-primary text-white"
                        : "bg-white/10 text-neutral-300 hover:bg-white/20"
                    }`}
                  >
                    Temp. {s.seasonNumber} ({s.year})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sandboxed Video Player with Anti-Redirect Hotzone Shields */}
        <div
          className="relative aspect-video w-full bg-black group"
          onContextMenu={(e) => e.preventDefault()}
        >
          {showIntro && (
            <WorscoiIntroPlayer
              title={`${anime.title} • Trailer Oficial`}
              subtitle="Abertura Oficial Wotho"
              onComplete={() => {
                setShowIntro(false);
                setIsPlaying(true);
              }}
            />
          )}

          <iframe
            ref={iframeRef}
            key={`${anime.id}-s${activeSeason?.seasonNumber || 1}-${trailerId}`}
            src={safeTrailerUrl}
            title={`Trailer Oficial de ${anime.title}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="w-full h-full border-0 select-none"
          />

          {/* Top Bar Shield against external YouTube title redirects */}
          <div
            onClick={togglePlayPause}
            className="absolute top-0 left-0 right-0 h-14 z-20 cursor-pointer bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-4"
            title="Clique para Pausar/Reproduzir dentro da plataforma"
          >
            <span className="text-xs text-white font-medium truncate">
              {anime.title} — {activeSeason?.title || "Trailer Oficial"}
            </span>
            <button
              type="button"
              onClick={togglePlayPause}
              className="px-2.5 py-1 rounded bg-primary text-white text-[11px] font-medium flex items-center gap-1"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
              <span>{isPlaying ? "Pausar" : "Reproduzir"}</span>
            </button>
          </div>

          {/* Bottom-right Shield against "Watch on YouTube" external logo click */}
          <div
            onClick={togglePlayPause}
            className="absolute bottom-0 right-10 w-44 h-12 z-20 cursor-pointer"
            title="Reprodução interna protegida"
          />
        </div>

        {/* Video & Anime Info */}
        <div className="p-6 space-y-4">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {anime.status}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {anime.rating.toFixed(1)} ({anime.ratingCount.toLocaleString()} votos)
                </span>
                <span className="text-xs text-muted-foreground">
                  • {seasons.length} {seasons.length === 1 ? "Temporada" : "Temporadas"}
                </span>
              </div>

              <Link
                to={`/animes/${anime.id}`}
                onClick={onClose}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
              >
                Assistir todos os {anime.episodesCount} episódios
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <DialogTitle className="text-xl md:text-2xl font-normal text-foreground">
              {anime.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground italic">
              {anime.japaneseTitle} • {anime.studio} ({anime.year})
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs md:text-sm text-foreground/80 font-light leading-relaxed">
            {activeSeason?.synopsis || anime.synopsis}
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span>Estúdio: {anime.studio}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tv className="h-3.5 w-3.5" />
              <span>{anime.episodesCount} Episódios Mapeados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{anime.season}</span>
            </div>
            <div className="ml-auto font-medium text-foreground">{anime.audio}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnimePlayerModal;
