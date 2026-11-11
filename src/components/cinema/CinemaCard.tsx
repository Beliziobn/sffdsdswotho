import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Star, Plus, Check } from "lucide-react";
import { CinemaItem, toggleCinemaWatchlist, isCinemaInWatchlist } from "@/lib/cinema";

interface CinemaCardProps {
  item: CinemaItem;
  onPlay?: (item: CinemaItem) => void;
  showProgress?: number;
}

export const CinemaCard = ({ item, onPlay, showProgress }: CinemaCardProps) => {
  const [inWatchlist, setInWatchlist] = useState(() => isCinemaInWatchlist(item.id));

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

  return (
    <div className="group relative flex flex-col">
      <Link to={`/cinema/${item.id}`} className="block relative overflow-hidden rounded-md bg-zinc-900 border border-zinc-800/80 aspect-[2/3] transition-all duration-300 group-hover:border-zinc-700 group-hover:shadow-xl">
        {/* Poster Image */}
        <img
          src={item.posterUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3" />

        {/* Top Floating Badge & Action */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
            {item.quality}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className="pointer-events-auto h-7 w-7 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            title={inWatchlist ? "Remover da Minha Lista" : "Adicionar à Minha Lista"}
          >
            {inWatchlist ? <Check className="h-3.5 w-3.5 text-amber-400" /> : <Plus className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Center Play Button on Hover */}
        {onPlay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={handlePlayClick}
              className="pointer-events-auto h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 active:scale-95"
              title="Assistir agora"
            >
              <Play className="h-5 w-5 fill-black ml-0.5" />
            </button>
          </div>
        )}

        {/* Bottom Progress Bar if partially watched */}
        {typeof showProgress === "number" && showProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
            <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${showProgress}%` }} />
          </div>
        )}
      </Link>

      {/* Unboxed Metadata & Title */}
      <div className="pt-2.5 flex flex-col">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-light mb-1">
          <span className="uppercase text-[10px] tracking-wider text-amber-400 font-medium">
            {item.type === "serie" ? "Série" : "Filme"}
          </span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span>{item.year}</span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span className="flex items-center gap-0.5 text-zinc-300 font-normal">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            {item.rating.toFixed(1)}
          </span>
        </div>

        <Link to={`/cinema/${item.id}`} className="text-sm font-normal text-zinc-100 hover:text-white transition-colors truncate tracking-tight">
          {item.title}
        </Link>
        <span className="text-xs text-zinc-500 font-light truncate mt-0.5">
          {item.genres.slice(0, 2).join(" · ")}
        </span>
      </div>
    </div>
  );
};

export default CinemaCard;
