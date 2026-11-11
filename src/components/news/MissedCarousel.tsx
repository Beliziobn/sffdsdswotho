import { Link } from "react-router-dom";
import ProtectedImage from "@/components/ProtectedImage";
import { readingTime, type CuratedNews } from "@/lib/news";

/** Infinite marquee of compact vertical cards — pauses on hover/touch. */
const MissedCarousel = ({ items }: { items: CuratedNews[] }) => {
  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <section className="mt-20 lg:mt-28">
      <div className="text-center mb-10">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 block">Arquivo</span>
        <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">Não perca</h2>
      </div>

      <div className="group relative -mx-6 lg:-mx-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex gap-6 w-max animate-marquee group-hover:[animation-play-state:paused] [&:active]:[animation-play-state:paused]">
          {loop.map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              to={`/noticias/${item.slug}`}
              className="w-56 shrink-0"
              data-protected-media
              aria-hidden={i >= items.length}
              tabIndex={i >= items.length ? -1 : undefined}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-accent shadow-soft">
                <ProtectedImage
                  src={item.cover_url}
                  alt={item.title}
                  category={item.category}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="mt-3 text-sm font-normal text-foreground tracking-tight line-clamp-2">{item.title}</h3>
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-muted-foreground font-light">
                {readingTime(item)} min read
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissedCarousel;
