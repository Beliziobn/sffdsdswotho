import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Star,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Film,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ProtectedImage from "./ProtectedImage";
import { Anime, isAnimeInWatchlist, toggleAnimeWatchlist } from "@/lib/animes";
import { getAnimeAmbientTheme, isOriginalAnimationWork } from "@/lib/canonBridge";

interface AnimeHeroProps {
  item: Anime;
  items?: Anime[];
  onPlayTrailer: (item: Anime) => void;
}

export const AnimeHero = ({ item, items, onPlayTrailer }: AnimeHeroProps) => {
  const featuredSlides = items && items.length > 0 ? items : [item];
  const [activeIndex, setActiveIndex] = useState(0);
  const current = featuredSlides[activeIndex] || item;

  const [inWatchlist, setInWatchlist] = useState(() => isAnimeInWatchlist(current.id));

  useEffect(() => {
    setInWatchlist(isAnimeInWatchlist(current.id));
    const handleUpdate = () => setInWatchlist(isAnimeInWatchlist(current.id));
    window.addEventListener("worscoi_watchlist_updated", handleUpdate);
    return () => window.removeEventListener("worscoi_watchlist_updated", handleUpdate);
  }, [current.id]);

  // Subtle auto-rotation every 10s when multiple featured works exist
  useEffect(() => {
    if (featuredSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [featuredSlides.length]);

  const ambient = getAnimeAmbientTheme(current);
  const isOriginal = isOriginalAnimationWork(current);
  const hasManga = !isOriginal && Boolean(current.manga?.chapters?.length);

  const handleWatchlist = () => {
    const next = toggleAnimeWatchlist(current.id);
    setInWatchlist(next);
    if (next) {
      toast.success("Adicionado à sua lista!", {
        description: `"${current.title}" foi salvo na sua lista de animes.`,
      });
    } else {
      toast.info("Removido da sua lista", {
        description: `"${current.title}" foi removido da sua lista.`,
      });
    }
  };

  return (
    <section
      className="relative w-full min-h-[540px] lg:min-h-[600px] overflow-hidden border-b border-border/60 bg-background"
      data-protected-media
    >
      {/* Background Cinematic Banner + Ambient Tinted Wash */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0"
        >
          <ProtectedImage
            src={current.banner || current.cover}
            alt={current.title}
            priority
            className="absolute inset-0 w-full h-full object-cover object-top brightness-[0.45] scale-[1.03]"
          />
          <div
            className="absolute inset-0 opacity-60 transition-colors duration-700"
            style={{
              background: `radial-gradient(ellipse 75% 65% at 75% 25%, rgba(${ambient.ambientRgb}, 0.28), transparent 70%)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Atmospheric Stage Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-28 pb-12 lg:pt-32 lg:pb-16 flex flex-col md:flex-row items-end md:items-center justify-between gap-10">
        <div className="max-w-2xl flex-1">
          {/* Editorial Eyebrow (Zero-Pill Clean Typography) */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground mb-3 tabular-nums">
            <span className="font-semibold text-primary">Curadoria em Destaque</span>
            <span aria-hidden="true">·</span>
            <span className="text-foreground/90 font-medium">{current.studio}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
              <Star className="h-3.5 w-3.5 fill-current" />
              {current.rating.toFixed(1)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{current.episodesCount} episódios</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight text-balance leading-[1.12]">
            {current.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 mb-4">
            {current.japaneseTitle} · {current.year}
          </p>

          <p className="text-sm sm:text-base text-foreground/85 font-normal leading-relaxed line-clamp-3 max-w-xl mb-7">
            {ambient.logline} {current.synopsis}
          </p>

          {/* Focused Action Cluster */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/animes/${current.id}?tab=episodes`}
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-transform active:scale-[0.98] shadow-lg whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Assistir Agora</span>
            </Link>

            {hasManga ? (
              <Link
                to={`/animes/${current.id}?tab=manga`}
                className="inline-flex items-center gap-2 bg-card/85 hover:bg-card text-foreground backdrop-blur-md border border-border px-5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeftRight className="w-4 h-4 text-primary" />
                <span>CanonBridge: Mangá ({current.manga.chaptersCount} caps)</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-card/60 backdrop-blur-md border border-border/70 text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Obra Original para Animação</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => onPlayTrailer(current)}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-card/70 hover:bg-card text-foreground backdrop-blur-md border border-border/80 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Ver trailer oficial"
            >
              <Film className="w-4 h-4 text-muted-foreground" />
              <span>Trailer</span>
            </button>

            <button
              type="button"
              onClick={handleWatchlist}
              className={`h-11 w-11 rounded-xl border backdrop-blur-md flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                inWatchlist
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-card/70 hover:bg-card border-border/80 text-foreground"
              }`}
              title={inWatchlist ? "Salvo na sua lista" : "Salvar na minha lista"}
              aria-label={inWatchlist ? "Remover da lista" : "Salvar na lista"}
            >
              {inWatchlist ? (
                <BookmarkCheck className="w-4 h-4 fill-current" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Carousel Controls when multiple featured works */}
          {featuredSlides.length > 1 && (
            <div className="flex items-center gap-3 mt-8">
              <div className="flex items-center gap-1.5">
                {featuredSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Destaque: ${slide.title}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === activeIndex
                        ? "w-7 bg-primary"
                        : "w-2 bg-foreground/25 hover:bg-foreground/45"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      (prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length
                    )
                  }
                  className="h-7 w-7 rounded-lg bg-card/70 border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Destaque anterior"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => (prev + 1) % featuredSlides.length)}
                  className="h-7 w-7 rounded-lg bg-card/70 border border-border/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Próximo destaque"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Crisp 2:3 Poster Showcase (Desktop) */}
        <Link
          to={`/animes/${current.id}`}
          className="hidden md:block w-52 lg:w-60 shrink-0 group relative"
        >
          <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-card transition-transform duration-300 group-hover:scale-[1.02]">
            <ProtectedImage
              src={current.cover}
              alt={current.title}
              className="w-full h-full object-cover"
            />
          </div>
          {hasManga && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <BookOpen className="h-3 w-3 text-primary" />
              <span>{current.manga.title} · {current.manga.chaptersCount} caps</span>
            </div>
          )}
        </Link>
      </div>
    </section>
  );
};

export default AnimeHero;
