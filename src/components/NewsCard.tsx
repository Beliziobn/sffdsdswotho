import { Link } from "react-router-dom";
import { ArrowRight, Newspaper } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { NewsItem } from "@/hooks/useCatalog";
import { formatDate } from "@/lib/format";
import { CATEGORY_METADATA } from "@/lib/news";
import ProtectedImage from "./ProtectedImage";
import { getSmartNewsCover } from "@/lib/newsImageResolver";

const NewsCard = ({ item }: { item: NewsItem }) => {
  const meta = item.category ? CATEGORY_METADATA[item.category] : null;
  const resolvedCover =
    item.cover_url && !item.cover_url.includes("images.unsplash.com")
      ? item.cover_url
      : getSmartNewsCover(item.title, item.category, item.cover_url);

  return (
    <Card className="overflow-hidden border border-border bg-card shadow-soft hover:shadow-lg transition-shadow duration-300">
      <Link to={`/noticias/${item.slug}`} className="block">
        <div className="relative h-48 overflow-hidden bg-accent">
          <ProtectedImage
            src={resolvedCover}
            alt={item.title}
            category={item.category}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border flex items-center gap-1.5 shadow-xs">
            <Newspaper className={`h-3 w-3 ${meta ? meta.accentColor : "text-primary"}`} />
            <span className="font-medium text-[11px] text-foreground">{item.category}</span>
          </div>
        </div>
      <div className="p-6">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 block">
          {formatDate(item.published_at)}
        </span>
        <h3 className="text-base font-normal mb-2 text-card-foreground tracking-tight">{item.title}</h3>
        <p className="text-xs text-muted-foreground font-light leading-relaxed mb-5 line-clamp-3">
          {item.excerpt || (item.content || "").split(/\n+/)[0]}
        </p>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs font-light px-0">
          Ler notícia
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      </Link>
    </Card>
  );
};

export default NewsCard;
