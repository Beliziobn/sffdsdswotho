import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Card } from "./ui/card";
import { BookCardContent } from "./BookCard";
import { useBooks } from "@/hooks/useCatalog";
import { useIsMobile } from "@/hooks/use-mobile";

const FeaturedBooks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { data: books = [] } = useBooks();

  const featured = books.filter((b) => b.published && b.featured).slice(0, 3);
  const list = (featured.length ? featured : books.filter((b) => b.published)).slice(0, 3);

  const getCardStyle = (index: number) => {
    const baseRotation = [-4, 0, 4];
    const baseX = [-280, 0, 280];
    return { rotate: baseRotation[index] ?? 0, x: baseX[index] ?? 0 };
  };

  return (
    <section id="locations" className="py-32 lg:py-40 bg-background" ref={ref}>
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">
            Nosso catálogo
          </span>
          <h2 className="text-2xl md:text-3xl font-light mb-4 text-foreground tracking-tight">Livros em destaque</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">
            Títulos selecionados para ler direto no navegador, sem download
          </p>
        </motion.div>

        {isMobile ? (
          <div className="flex flex-col gap-6 w-full overflow-hidden">
            {list.map((book) => (
              <div key={book.id} className="w-full">
                <Card className="overflow-hidden border border-border bg-card shadow-lg w-full">
                  <BookCardContent book={book} />
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative flex justify-center items-center h-[500px]">
            {list.map((book, index) => {
              const isHovered = hoveredIndex === index;
              const cardStyle = getCardStyle(index);
              return (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 50, ...cardStyle }}
                  animate={
                    isInView
                      ? {
                          opacity: 1,
                          y: isHovered ? -20 : 0,
                          rotate: isHovered ? 0 : cardStyle.rotate,
                          x: cardStyle.x,
                          scale: isHovered ? 1.05 : 1,
                          zIndex: isHovered ? 50 : 10 - Math.abs(index - 1),
                        }
                      : {}
                  }
                  transition={{ duration: 0.4, delay: isInView && !hoveredIndex ? index * 0.15 : 0, ease: "easeOut" }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="absolute w-[320px] cursor-pointer"
                  style={{ zIndex: isHovered ? 50 : 10 - Math.abs(index - 1) }}
                >
                  <Card
                    className={`overflow-hidden border border-border bg-card transition-shadow duration-300 ${
                      isHovered ? "shadow-2xl" : "shadow-lg"
                    }`}
                  >
                    <BookCardContent book={book} />
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedBooks;
