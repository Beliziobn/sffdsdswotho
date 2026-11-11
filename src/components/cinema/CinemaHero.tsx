import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Plus, Check, Star, Info, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CinemaItem, isCinemaInWatchlist, toggleCinemaWatchlist } from "@/lib/cinema";

interface CinemaHeroProps {
  item: CinemaItem;
  onPlay: (item: CinemaItem) => void;
}

export const CinemaHero = ({ item, onPlay }: CinemaHeroProps) => {
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    setInWatchlist(isCinemaInWatchlist(item.id));
    const handler = () => setInWatchlist(isCinemaInWatchlist(item.id));
    window.addEventListener("worscoi_cinema_watchlist_updated", handler);
    return () => window.removeEventListener("worscoi_cinema_watchlist_updated", handler);
  }, [item.id]);

  const handleToggleWatchlist = () => {
    const added = toggleCinemaWatchlist(item.id);
    setInWatchlist(added);
  };

  return (
    <div className="relative w-full h-[78vh] min-h-[560px] max-h-[820px] overflow-hidden bg-black text-white">
      {/* Cinematic Backdrop Image with Parallax Depth */}
      <div className="absolute inset-0 z-0">
        <img
          src={item.backdropUrl}
          alt={item.title}
          className="w-full h-full object-cover object-center brightness-60 scale-105 transform transition-transform duration-1000"
        />
        {/* Multilayered Cinematic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a0a0c]/80 to-transparent" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 container mx-auto h-full px-6 lg:px-12 flex flex-col justify-end pb-16 lg:pb-20 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          {/* Clean Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300 font-light mb-3 tracking-wide">
            <span className="uppercase text-amber-400 font-medium">
              {item.type === "serie" ? "Série Canônica" : "Filme em Destaque"}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>{item.year}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>{item.duration}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="flex items-center gap-1 text-amber-400 font-normal">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {item.rating.toFixed(1)}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>{item.quality}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="border border-zinc-700/80 px-1.5 py-0.2 text-[10px] rounded font-mono text-zinc-300">
              {item.ageRating}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white mb-4 leading-tight">
            {item.title}
          </h1>

          {/* Subtitle / Genres */}
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-4 font-normal">
            {item.genres.join(" / ")}
          </p>

          {/* Synopsis */}
          <p className="text-sm text-zinc-300 font-light leading-relaxed mb-8 line-clamp-3 md:line-clamp-4">
            {item.synopsis}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => onPlay(item)}
              className="bg-white hover:bg-zinc-200 text-black font-medium text-xs tracking-wider uppercase px-6 py-5 rounded-full flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4 fill-black" />
              Assistir Agora
            </Button>

            <Button
              asChild
              variant="outline"
              className="bg-black/40 hover:bg-white/10 text-white border-zinc-700 font-medium text-xs tracking-wider uppercase px-6 py-5 rounded-full flex items-center gap-2 backdrop-blur-md transition-colors"
            >
              <Link to={`/cinema/${item.id}`}>
                <Info className="h-4 w-4" />
                Mais Detalhes
              </Link>
            </Button>

            <Button
              onClick={handleToggleWatchlist}
              variant="ghost"
              size="icon"
              className={`h-11 w-11 rounded-full border border-zinc-700/80 backdrop-blur-md transition-all ${
                inWatchlist
                  ? "bg-amber-500/20 text-amber-400 border-amber-400/50"
                  : "bg-black/40 text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
              title={inWatchlist ? "Remover da Minha Lista" : "Adicionar à Minha Lista"}
            >
              {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CinemaHero;
