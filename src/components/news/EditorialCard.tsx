import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import ProtectedImage from "@/components/ProtectedImage";
import { formatDate } from "@/lib/format";
import { readingTime, CATEGORY_METADATA, type CuratedNews } from "@/lib/news";
import { getSmartNewsCover } from "@/lib/newsImageResolver";

/** Wide editorial card used in the two-column news grid. */
const EditorialCard = ({ item }: { item: CuratedNews }) => {
  const meta = item.category ? CATEGORY_METADATA[item.category] : null;
  const badgeClasses = meta?.badgeBg || "bg-accent text-accent-foreground border-border";
  const resolvedCover =
    item.cover_url && !item.cover_url.includes("images.unsplash.com")
      ? item.cover_url
      : getSmartNewsCover(item.title, item.category, item.cover_url);

  return (
    <Card className="overflow-hidden border border-border bg-card shadow-soft hover:shadow-lg transition-shadow duration-300 h-full">
      <Link to={`/noticias/${item.slug}`} className="block h-full" data-protected-media>
        <div className="aspect-video overflow-hidden bg-accent relative">
          <ProtectedImage
            src={resolvedCover}
            alt={item.title}
            category={item.category}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          <span className={`absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold border backdrop-blur-md shadow-sm ${badgeClasses}`}>
            {item.category}
          </span>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-2 text-card-foreground tracking-tight leading-snug">{item.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed line-clamp-3 mb-5">
            {item.excerpt || (item.content || "").split(/\n+/)[0]}
          </p>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="truncate max-w-[160px]">{item.author ? item.author : formatDate(item.published_at)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readingTime(item)} min read
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
};

export default EditorialCard;
