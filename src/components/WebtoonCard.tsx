import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import ProtectedImage from "./ProtectedImage";
import { Content, contentHref } from "@/hooks/useContents";
import { formatPrice } from "@/lib/format";

interface WebtoonCardProps {
  item: Content;
  /** Ranking number engraved on the cover (populares section). */
  rank?: number;
}

const WebtoonCard = ({ item, rank }: WebtoonCardProps) => (
  <Card className="overflow-hidden border border-border bg-card shadow-soft hover:shadow-lg transition-shadow duration-300">
    <Link to={contentHref(item)} className="block" data-protected-media>
      <div className="relative aspect-[2/3] overflow-hidden bg-accent">
        <ProtectedImage
          src={item.cover}
          alt={`Capa de ${item.title}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-emerald-600/90 text-white backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
          <Sparkles className="h-3 w-3 fill-white text-white" />
          <span className="font-medium text-[10px] tracking-wide">
            {item.episode_count ? `${item.episode_count} Capítulos` : "Capítulos Oficiais"}
          </span>
        </div>
        {typeof rank === "number" && (
          <span className="absolute bottom-2 right-3 text-6xl font-light leading-none text-card/80 drop-shadow-[0_2px_8px_hsl(0_0%_0%/0.45)]">
            {rank}
          </span>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-base font-medium mb-1 text-card-foreground tracking-tight">{item.title}</h3>
        <div className="flex items-center gap-1 text-muted-foreground mb-4 text-xs font-light">
          <BookOpen className="h-3 w-3" />
          <span>{item.author}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-5">
          <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light">
            {item.category}
          </span>
          <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-sm font-medium border border-emerald-500/20">
            {item.episode_count ? `${item.episode_count} Caps` : "Oficial"}
          </span>
          {item.subtitle && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light truncate max-w-[150px]">
              {item.subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-light text-foreground">
              {item.price_cents > 0 ? formatPrice(item.price_cents, item.currency) : "Grátis"}
            </span>
            <span className="text-muted-foreground text-xs font-light"> /acesso</span>
          </div>
          <span className="inline-flex items-center text-xs font-light text-primary">
            Ver detalhes
            <ArrowRight className="ml-1 h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  </Card>
);

export const WebtoonCardSkeleton = () => (
  <Card className="overflow-hidden border border-border bg-card shadow-soft">
    <Skeleton className="aspect-[2/3] w-full rounded-none" />
    <div className="p-6 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </Card>
);

/** 3-per-row responsive grid used across the webtoons page. */
export const WebtoonGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
);

export default WebtoonCard;
