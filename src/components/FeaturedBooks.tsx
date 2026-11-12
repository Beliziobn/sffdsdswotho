import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { BookCardContent } from "./BookCard";
import { BookGridSkeleton } from "./skeletons/AppSkeletons";
import { useBooks, type Book } from "@/hooks/useCatalog";
import { useIsMobile } from "@/hooks/use-mobile";

const FALLBACK_FEATURED_BOOKS: Book[] = [
  {
    id: "mod-habitos-atomicos",
    title: "Hábitos Atômicos",
    author: "James Clear",
    description:
      "Um método fácil e comprovado de criar bons hábitos e se livrar dos maus com pequenas mudanças diárias.",
    cover_url: "/og-image.jpg",
    price_cents: 0,
    currency: "BRL",
    category: "Desenvolvimento Pessoal",
    published: true,
    featured: true,
    created_at: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "mod-psicologia-financeira",
    title: "A Psicologia Financeira",
    author: "Morgan Housel",
    description:
      "Lições atemporais sobre fortuna, ganância e felicidade para tomar decisões mais inteligentes com dinheiro.",
    cover_url: "/og-image.jpg",
    price_cents: 0,
    currency: "BRL",
    category: "Finanças & Negócios",
    published: true,
    featured: true,
    created_at: "2026-01-14T00:00:00.000Z",
  },
  {
    id: "mod-1984-orwell",
    title: "1984",
    author: "George Orwell",
    description:
      "Um dos romances mais influentes do século XX sobre vigilância, linguagem, poder e resistência individual.",
    cover_url: "/og-image.jpg",
    price_cents: 0,
    currency: "BRL",
    category: "Literatura Clássica",
    published: true,
    featured: true,
    created_at: "2026-01-13T00:00:00.000Z",
  },
];

const FeaturedBooks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { data: books = [], isLoading } = useBooks();

  const featured = books.filter((b) => b.published && b.featured).slice(0, 3);
  const publishedList = (featured.length ? featured : books.filter((b) => b.published)).slice(0, 3);
  const list = publishedList.length > 0 ? publishedList : FALLBACK_FEATURED_BOOKS;

  const getCardStyle = (index: number) => {
    const baseRotation = [-4, 0, 4];
    const baseX = [-280, 0, 280];
    return { rotate: baseRotation[index] ?? 0, x: baseX[index] ?? 0 };
  };

  return (
    <section id="locations" className="py-24 lg:py-32 bg-background" ref={ref}>
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 block">
            Biblioteca Digital Wotho
          </span>
          <h2 className="text-2xl md:text-3xl font-light mb-3 text-foreground tracking-tight">
            Livros em destaque
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">
            Títulos selecionados para ler direto no navegador, sem download
          </p>
        </div>

        {isLoading && publishedList.length === 0 ? (
          <BookGridSkeleton count={3} />
        ) : isMobile ? (
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
                  initial={false}
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
                      : {
                          opacity: 1,
                          y: 0,
                          rotate: cardStyle.rotate,
                          x: cardStyle.x,
                        }
                  }
                  transition={{ duration: 0.4, ease: "easeOut" }}
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

        <div className="text-center mt-10">
          <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6">
            <Link to="/livros">
              Explorar todo o catálogo
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBooks;
