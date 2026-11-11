import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, Star, Bookmark, BookmarkCheck, Tv } from "lucide-react";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import ProtectedImage from "./ProtectedImage";
import { Anime, isAnimeInWatchlist, toggleAnimeWatchlist } from "@/lib/animes";
import { toast } from "sonner";

interface AnimeCardProps {
  item: Anime;
  rank?: number;
  onOpenPlayer?: (item: Anime) => void;
}

export const AnimeCard = ({ item, rank, onOpenPlayer }: AnimeCardProps) => {
  const [inWatchlist, setInWatchlist] = useState(false);

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
    <Card className="group overflow-hidden border border-border bg-card shadow-soft hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-[3/4] overflow-hidden bg-accent">
        <Link to={`/animes/${item.id}`} className="block w-full h-full">
          <ProtectedImage
            src={item.cover}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-white text-[11px] font-medium">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{item.rating.toFixed(1)}</span>
          </div>

          <button
            type="button"
            onClick={handleWatchlistClick}
            className="pointer-events-auto h-7 w-7 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            title={inWatchlist ? "Remover da lista" : "Salvar na lista"}
          >
            {inWatchlist ? (
              <BookmarkCheck className="h-3.5 w-3.5 text-primary fill-primary" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Rank Number for top list */}
        {typeof rank === "number" && (
          <span className="absolute bottom-1 right-2 text-6xl font-black leading-none text-white/30 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] select-none">
            {rank}
          </span>
        )}

        {/* Quick Play Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          {onOpenPlayer && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenPlayer(item);
              }}
              className="pointer-events-auto transform scale-90 group-hover:scale-100 transition-transform duration-200 bg-white text-foreground hover:bg-primary hover:text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Trailer
            </button>
          )}
        </div>

        {/* Bottom episode pill */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1 bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-foreground font-medium">
          <Tv className="h-3 w-3 text-primary" />
          <span>{item.episodesCount} eps</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-light">
            <span>{item.studio}</span>
            <span>{item.year}</span>
          </div>

          <Link to={`/animes/${item.id}`}>
            <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
          </Link>
          <p className="text-[11px] text-muted-foreground line-clamp-1 italic mt-0.5">
            {item.japaneseTitle}
          </p>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-2 font-light leading-relaxed">
            {item.synopsis}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-xs">
          <div className="flex flex-wrap gap-1">
            {item.genres.slice(0, 1).map((g) => (
              <span
                key={g}
                className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-light"
              >
                {g}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/animes/${item.id}`}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              <Tv className="h-3 w-3" />
              <span>Ver</span>
            </Link>
            <span className="text-border">|</span>
            <Link
              to={`/animes/${item.id}/manga/${item.manga?.chapters[0]?.id || 'sl-cap-1'}`}
              className="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5"
            >
              <span>Ler Mangá</span>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const AnimeCardSkeleton = () => (
  <Card className="overflow-hidden border border-border bg-card shadow-soft">
    <Skeleton className="aspect-[3/4] w-full rounded-none" />
    <div className="p-4 space-y-2.5">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  </Card>
);

export const AnimeGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">{children}</div>
);

export default AnimeCard;
