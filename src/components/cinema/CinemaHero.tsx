import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Plus, Check, Info } from "lucide-react";
import { CinemaItem, isCinemaInWatchlist, toggleCinemaWatchlist } from "@/lib/cinema";
import { toast } from "sonner";

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
    toast.success(
      added ? `"${item.title}" adicionado à Minha Lista` : `"${item.title}" removido da Minha Lista`
    );
  };

  return (
    <section className="relative w-full min-h-[74vh] max-h-[820px] flex items-end pt-32 pb-14 overflow-hidden bg-[#060608] text-white">
      {/* Cinematic Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={item.backdropUrl}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-55 scale-[1.03] transition-transform duration-1000"
        />
        {/* Measured Scrims blending cleanly into #060608 canvas */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608]/95 via-[#060608]/45 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#060608]/80 to-transparent" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-5"
        >
          {/* Quiet Unboxed Metadata (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-300 tracking-wide tabular-nums">
            <span className="text-white font-semibold">
              {item.type === "serie" ? "Série em Destaque" : "Destaque"}
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>{item.year}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>{item.duration}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="text-white font-semibold">★ {item.rating.toFixed(1)}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>{item.quality}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="text-zinc-300">{item.ageRating}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.06] text-balance">
            {item.title}
          </h1>

          {/* Genres line */}
          <p className="text-xs text-zinc-400 tracking-wide">
            {item.genres.join(" · ")}
          </p>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-zinc-300/90 leading-relaxed line-clamp-3 font-normal max-w-xl">
            {item.synopsis}
          </p>

          {/* Apple TV+ Inspired CTAs: Alabaster Primary + Frosted Glass Secondary */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onPlay(item)}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-sm px-6 py-3 rounded-full flex items-center gap-2.5 shadow-[0_8px_30px_rgba(255,255,255,0.16)] transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="h-4 w-4 fill-black" />
              <span>{item.type === "serie" ? "Assistir Série" : "Assistir Filme"}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleWatchlist}
              className="bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-xl border border-white/15 text-white font-medium text-sm px-5 py-3 rounded-full flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{inWatchlist ? "Na Minha Lista" : "Minha Lista"}</span>
            </button>

            <Link
              to={`/cinema/${item.id}`}
              className="bg-white/[0.04] hover:bg-white/[0.1] backdrop-blur-xl border border-white/10 text-zinc-200 hover:text-white font-medium text-sm px-5 py-3 rounded-full flex items-center gap-2 transition whitespace-nowrap shrink-0"
            >
              <Info className="h-4 w-4" />
              <span>Detalhes</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CinemaHero;
