import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Plus, Check } from "lucide-react";
import {
  CinemaItem,
  toggleCinemaWatchlist,
  isCinemaInWatchlist,
  prefetchCinemaStream,
} from "@/lib/cinema";

interface CinemaCardProps {
  item: CinemaItem;
  onPlay?: (item: CinemaItem) => void;
  showProgress?: number;
}

export const CinemaCard = ({ item, onPlay, showProgress }: CinemaCardProps) => {
  const [inWatchlist, setInWatchlist] = useState(() => isCinemaInWatchlist(item.id));
  const [imgError, setImgError] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleCinemaWatchlist(item.id);
    setInWatchlist(added);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    if (onPlay) {
      e.preventDefault();
      e.stopPropagation();
      onPlay(item);
    }
  };

  const handlePrefetch = () => {
    prefetchCinemaStream(item, 1, 1, "dublado");
  };

  return (
    <article
      className="group relative flex flex-col"
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
    >
      <Link
        to={`/cinema/${item.id}`}
        className="block relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/[0.08] aspect-[2/3] transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:border-white/20 group-hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.85)]"
      >
        {!imgError && item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-900 to-zinc-950">
            <span className="text-xs font-medium text-zinc-400 line-clamp-3">{item.title}</span>
          </div>
        )}

        {/* Measured Contrast Scrim on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Subtle Top-Right Rating & Watchlist Action */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleToggle}
            className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-200 cursor-pointer"
            title={inWatchlist ? "Remover da Minha Lista" : "Adicionar à Minha Lista"}
            aria-label={inWatchlist ? "Remover da Minha Lista" : "Adicionar à Minha Lista"}
          >
            {inWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </button>

          <span className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md text-[11px] font-medium text-white/95 border border-white/10 tabular-nums">
            ★ {item.rating.toFixed(1)}
          </span>
        </div>

        {/* Hover Watch Cue + Translucent Play Button */}
        {onPlay && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="text-[11px] font-medium text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
              Assistir · {item.quality}
            </span>
            <button
              type="button"
              onClick={handlePlayClick}
              className="pointer-events-auto h-9 w-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Assistir agora"
              aria-label={`Assistir ${item.title}`}
            >
              <Play className="h-4 w-4 fill-black ml-0.5" />
            </button>
          </div>
        )}

        {/* Alabaster Thin Progress Indicator */}
        {typeof showProgress === "number" && showProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-10">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(4, showProgress))}%` }}
            />
          </div>
        )}
      </Link>

      {/* Silent Metadata: Strictly 2 Clean Neutral Lines */}
      <div className="pt-2.5 px-0.5 flex flex-col">
        <Link
          to={`/cinema/${item.id}`}
          className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors truncate tracking-tight"
        >
          {item.title}
        </Link>
        <span className="text-xs text-zinc-500 truncate mt-0.5 tabular-nums">
          {item.year} · {item.genres[0] || (item.type === "serie" ? "Série" : "Filme")}
        </span>
      </div>
    </article>
  );
};

export { CinemaCardSkeleton } from "../skeletons/AppSkeletons";
export default CinemaCard;
