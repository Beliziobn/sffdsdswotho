import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProtectedImage from "@/components/ProtectedImage";
import { formatDate } from "@/lib/format";
import { byline, photoCredit, readingTime, type CuratedNews } from "@/lib/news";

/** Editorial "top story of the day" block shown above the grid. */
const NewsHero = ({ item }: { item: CuratedNews }) => (
  <section className="mb-16 lg:mb-20">
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <div className="order-2 lg:order-1">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2.5 py-1 bg-accent text-accent-foreground rounded-sm font-light mb-5">
          ✦ {item.category}
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.1] mb-5">
          <Link to={`/noticias/${item.slug}`} className="hover:text-primary transition-colors duration-300">
            {item.title}
          </Link>
        </h2>
        <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed mb-6 max-w-xl">
          {item.excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-7">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readingTime(item)} min read
          </span>
          <span aria-hidden>·</span>
          <span>{formatDate(item.published_at)}</span>
          <span aria-hidden>·</span>
          <span>{byline(item)}</span>
        </div>
        <Button asChild size="sm" className="text-xs font-light">
          <Link to={`/noticias/${item.slug}`}>
            Ler matéria completa
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Link>
        </Button>
      </div>

      <figure className="order-1 lg:order-2 m-0" data-protected-media>
        <div className="overflow-hidden rounded-lg bg-accent shadow-soft aspect-[4/3]">
          <Link to={`/noticias/${item.slug}`} className="block h-full">
            <ProtectedImage
              src={item.cover_url}
              alt={item.title}
              category={item.category}
              priority
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </Link>
        </div>
        <figcaption className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground font-light">
          {photoCredit(item)}
        </figcaption>
      </figure>
    </div>
  </section>
);

export default NewsHero;
