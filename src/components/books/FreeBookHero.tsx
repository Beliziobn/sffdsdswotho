import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Timer, ArrowRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedImage from "@/components/ProtectedImage";
import { Content, contentHref } from "@/hooks/useContents";
import { hasOriginalPdf } from "@/lib/originalPdfRegistry";

const pad = (n: number) => String(n).padStart(2, "0");

/** Time remaining in the current 24h free cycle (resets at midnight). */
const useFreeCountdown = () => {
  const compute = () => {
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    return Math.max(0, end.getTime() - Date.now());
  };
  const [left, setLeft] = useState(compute);

  useEffect(() => {
    const id = setInterval(() => setLeft(compute()), 1000);
    return () => clearInterval(id);
  }, []);

  const s = Math.floor(left / 1000);
  return `${Math.floor(s / 3600)}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
};

/** Giant "free book of the day" promo card. */
const FreeBookHero = ({ book }: { book?: Content }) => {
  const time = useFreeCountdown();
  if (!book) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-16"
    >
      <Card className="overflow-hidden border border-border bg-card shadow-soft">
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-72 shrink-0 aspect-[2/3] bg-accent" data-protected-media>
            <ProtectedImage
              src={book.cover}
              alt={`Capa do livro ${book.title}`}
              priority
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <Sparkles className="h-3 w-3 fill-primary text-primary" />
              <span className="font-light text-[10px] uppercase tracking-wide">Grátis por 24h</span>
            </div>
          </div>

          <div className="p-8 lg:p-12 flex-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">
              Livro grátis do dia
            </span>
            <h2 className="text-2xl md:text-4xl font-normal tracking-tight text-card-foreground mb-2">{book.title}</h2>
            <p className="text-sm text-muted-foreground font-light mb-5">{book.author}</p>

            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light">
                {book.category}
              </span>
              {hasOriginalPdf(book.id) && (
                <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-sm font-semibold inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  PDF Original Disponível
                </span>
              )}
              <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light inline-flex items-center gap-1 tabular-nums">
                <Timer className="h-3 w-3" /> Restam {time}
              </span>
            </div>

            <p className="text-sm text-muted-foreground font-light leading-relaxed mb-8 max-w-2xl">
              {book.description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                <Link to={`/ler/${book.id}`}>
                  Ler obra completa agora
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              {hasOriginalPdf(book.id) && (
                <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-semibold px-6 border-rose-600/40 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                  <Link to={`/ler/${book.id}?mode=pdf`}>
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Ler em PDF
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6">
                <Link to={contentHref(book)}>
                  Ver capítulos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FreeBookHero;
