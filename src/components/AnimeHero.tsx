import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Star, Plus, Check, Info, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ProtectedImage from "./ProtectedImage";
import { Anime, isAnimeInWatchlist, toggleAnimeWatchlist } from "@/lib/animes";

interface AnimeHeroProps {
  item: Anime;
  onPlayTrailer: (item: Anime) => void;
}

export const AnimeHero = ({ item, onPlayTrailer }: AnimeHeroProps) => {
  const [inWatchlist, setInWatchlist] = useState(isAnimeInWatchlist(item.id));

  const handleWatchlist = () => {
    const next = toggleAnimeWatchlist(item.id);
    setInWatchlist(next);
    if (next) {
      toast.success("Adicionado à sua lista!", {
        description: `"${item.title}" foi salvo na sua lista de animes.`,
      });
    } else {
      toast.info("Removido da sua lista", {
        description: `"${item.title}" foi removido da sua lista.`,
      });
    }
  };

  return (
    <div className="relative w-full h-[75vh] min-h-[480px] max-h-[750px] overflow-hidden" data-protected-media>
      {/* Background Banner with smooth overlay */}
      <ProtectedImage
        src={item.banner}
        alt={item.title}
        priority
        className="absolute inset-0 w-full h-full object-cover object-top filter brightness-75 scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />

      {/* Hero Content */}
      <div className="relative h-full flex items-end pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded bg-primary text-white font-medium">
                Destaque da Temporada
              </span>
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-white font-light">
                {item.studio}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-black/60 backdrop-blur-md px-2 py-1 rounded">
                <Star className="h-3 w-3 fill-amber-400" />
                <span>{item.rating.toFixed(1)}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight">
              {item.title}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground italic mt-1 mb-3">
              {item.japaneseTitle} • {item.season}
            </p>

            <p className="text-xs md:text-sm text-foreground/80 font-light line-clamp-3 leading-relaxed mb-6">
              {item.synopsis}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onPlayTrailer(item)}
                className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded-full text-xs md:text-sm tracking-wider uppercase font-medium transition-transform active:scale-95 shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                Assistir Trailer
              </button>

              {item.manga?.chapters[0] && (
                <Link
                  to={`/animes/${item.id}/manga/${item.manga.chapters[0].id}`}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-full text-xs md:text-sm tracking-wider uppercase font-medium transition-transform active:scale-95 shadow-lg"
                >
                  <BookOpen className="w-4 h-4" />
                  Ler Mangá
                </Link>
              )}

              <Link
                to={`/animes/${item.id}`}
                className="inline-flex items-center gap-2 bg-card/80 hover:bg-card text-foreground backdrop-blur-md border border-border px-5 py-3 rounded-full text-xs md:text-sm tracking-wider uppercase font-light transition-colors"
              >
                <Info className="w-4 h-4" />
                Episódios ({item.episodesCount})
              </Link>

              <button
                type="button"
                onClick={handleWatchlist}
                className="inline-flex items-center gap-1.5 bg-card/40 hover:bg-card/70 text-foreground backdrop-blur-md border border-border/80 px-4 py-3 rounded-full text-xs tracking-wider uppercase font-light transition-colors"
                title={inWatchlist ? "Remover da lista" : "Salvar na lista"}
              >
                {inWatchlist ? (
                  <>
                    <Check className="w-4 h-4 text-primary" />
                    <span>Salvo</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Minha Lista</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnimeHero;
