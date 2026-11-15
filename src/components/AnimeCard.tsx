import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Star, Bookmark, BookmarkCheck, BookOpen, ArrowLeftRight, Sparkles } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import ProtectedImage from "./ProtectedImage";
import { Anime, isAnimeInWatchlist, toggleAnimeWatchlist } from "@/lib/animes";
import { getAnimeAmbientTheme, isOriginalAnimationWork } from "@/lib/canonBridge";
import { toast } from "sonner";

interface AnimeCardProps {
  item: Anime;
  rank?: number;
  onOpenPlayer?: (item: Anime) => void;
}

export const AnimeCard = ({ item, onOpenPlayer }: AnimeCardProps) => {
  const [inWatchlist, setInWatchlist] = useState(false);
  const navigate = useNavigate();

  const ambient = getAnimeAmbientTheme(item);
  const isOriginal = isOriginalAnimationWork(item);
  const hasManga = !isOriginal && Boolean(item.manga?.chapters?.length || item.manga?.chaptersCount);

  useEffect(() => {
    setInWatchlist(isAnimeInWatchlist(item.id));
    const handleUpdate = () => setInWatchlist(isAnimeInWatchlist(item.id));
    window.addEventListener("worscoi_watchlist_updated", handleUpdate);
    return () => window.removeEventListener("worscoi_watchlist_updated", handleUpdate);
  }, [item.id]);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleAnimeWatchlist(item.id);
    setInWatchlist(added);
    if (added) {
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
    <article className="group flex flex-col">
      {/* Zero-Noise 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-accent border border-border/70 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5">
        <Link to={`/animes/${item.id}`} className="block w-full h-full">
          <ProtectedImage
            src={item.cover}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </Link>

        {/* Subtle Whisper Rating (Single top-left whisper) */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-black/65 backdrop-blur-md px-2 py-0.5 text-[11px] font-medium text-white tabular-nums">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span>{item.rating.toFixed(1)}</span>
        </div>

        {/* Top-Right CanonBridge Indicator + Watchlist Action */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {hasManga && (
            <span
              title="CanonBridge: Sincronizado Anime ⇄ Mangá"
              className="pointer-events-none h-7 px-2 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-white/90 flex items-center gap-1 opacity-85 group-hover:opacity-100 transition-opacity"
            >
              <ArrowLeftRight className="h-2.5 w-2.5" />
            </span>
          )}
          <button
            type="button"
            onClick={handleWatchlistClick}
            className={`h-7 w-7 rounded-md backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
              inWatchlist
                ? "bg-primary text-white opacity-100"
                : "bg-black/60 hover:bg-black/85 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            }`}
            title={inWatchlist ? "Remover da lista" : "Salvar na lista"}
            aria-label={inWatchlist ? "Remover da lista" : "Salvar na lista"}
          >
            {inWatchlist ? (
              <BookmarkCheck className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Quick-Lens Frosted Glass Progressive Disclosure Dock */}
        <div className="pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/95 via-black/80 to-transparent opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 ease-out">
          <p className="text-[11px] text-white/90 leading-snug line-clamp-2 mb-2.5 font-normal">
            {ambient.logline}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/animes/${item.id}?tab=episodes`);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white text-neutral-950 hover:bg-white/90 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Anime</span>
            </button>

            {hasManga ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/animes/${item.id}?tab=manga`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/15 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="h-3 w-3" />
                <span>Mangá</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenPlayer) {
                    onOpenPlayer(item);
                  } else {
                    navigate(`/animes/${item.id}`);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/15 hover:bg-white/25 text-white/95 backdrop-blur-md border border-white/15 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Original</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Zero-Noise Typographic Caption */}
      <div className="pt-2.5 px-0.5">
        <Link to={`/animes/${item.id}`} className="block">
          <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground truncate mt-0.5 tabular-nums">
          {item.studio} · {item.year} · {item.episodesCount} eps
        </p>
      </div>
    </article>
  );
};

export const AnimeCardSkeleton = () => (
  <div className="flex flex-col">
    <Skeleton className="aspect-[2/3] w-full rounded-xl" />
    <div className="pt-2.5 space-y-1.5">
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const AnimeGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
    {children}
  </div>
);

export default AnimeCard;
