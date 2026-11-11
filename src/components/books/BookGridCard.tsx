import { Link } from "react-router-dom";
import { BookOpen, Sparkles, ArrowRight, Microscope, GraduationCap, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import ProtectedImage from "@/components/ProtectedImage";
import { Content } from "@/hooks/useContents";
import { formatPrice } from "@/lib/format";
import { hasOriginalPdf } from "@/lib/originalPdfRegistry";

/** Catalog card: 2/3 cover, title, author, category pill, and direct read action */
const BookGridCard = ({ book, free }: { book: Content; free?: boolean }) => {
  const isFree = free || book.price_cents === 0 || book.id.startsWith("guten-") || book.id.startsWith("sci-") || book.id.startsWith("curr-");
  const isSci = book.id.startsWith("sci-") || book.tags?.includes("Artigo Científico");
  const isCurr = book.id.startsWith("curr-") || book.tags?.includes("Disciplina Curricular");
  const isBestseller = book.id.startsWith("mod-");
  const hasPdf = hasOriginalPdf(book.id);

  const detailLink = `/livros/${book.id}`;
  const readLink = `/ler/${book.id}`;

  return (
    <Card className="overflow-hidden border border-border bg-card shadow-soft hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
      <div className="flex flex-1">
        <Link to={detailLink} className="w-32 sm:w-40 shrink-0 aspect-[2/3] bg-accent overflow-hidden relative" data-protected-media>
          <ProtectedImage
            src={book.cover}
            alt={`Capa do livro ${book.title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hasPdf && (
            <span className="absolute top-2 right-2 bg-rose-600/95 text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur flex items-center gap-1 z-10">
              <FileText className="h-2.5 w-2.5" />
              PDF
            </span>
          )}
          {isSci ? (
            <span className="absolute top-2 left-2 bg-teal-600/95 text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full shadow-sm backdrop-blur flex items-center gap-1">
              <Microscope className="h-2.5 w-2.5" />
              Artigo
            </span>
          ) : isCurr ? (
            <span className="absolute top-2 left-2 bg-indigo-600/95 text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full shadow-sm backdrop-blur flex items-center gap-1">
              <GraduationCap className="h-2.5 w-2.5" />
              Didático
            </span>
          ) : isBestseller ? (
            <span className="absolute top-2 left-2 bg-amber-600/95 text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full shadow-sm backdrop-blur">
              Bestseller
            </span>
          ) : isFree && (
            <span className="absolute top-2 left-2 bg-emerald-600/95 text-white text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full shadow-sm backdrop-blur">
              Completo
            </span>
          )}
        </Link>
        <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 min-w-0">
          <div>
            <Link to={detailLink}>
              <h3 className="text-sm sm:text-base font-normal text-card-foreground tracking-tight line-clamp-2 hover:text-primary transition-colors mb-1.5">
                {book.title}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-3 text-xs font-light">
              {isSci ? <Microscope className="h-3 w-3 shrink-0 text-teal-500" /> : isCurr ? <GraduationCap className="h-3 w-3 shrink-0 text-indigo-500" /> : <BookOpen className="h-3 w-3 shrink-0" />}
              <span className="truncate">{book.author}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-accent text-accent-foreground rounded-sm font-light">
                {book.category}
              </span>
              {book.episode_count && book.episode_count > 1 ? (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-primary/10 text-primary font-medium rounded-sm">
                  {book.episode_count} {isSci ? "Seções" : isCurr ? "Unidades" : "Capítulos"}
                </span>
              ) : null}
              {hasPdf && (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 rounded-sm font-semibold flex items-center gap-1">
                  <FileText className="h-2.5 w-2.5" />
                  PDF Original
                </span>
              )}
              {isSci ? (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-sm font-medium flex items-center gap-1">
                  <Microscope className="h-2.5 w-2.5" />
                  Peer-Reviewed
                </span>
              ) : isCurr ? (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-sm font-medium flex items-center gap-1">
                  <GraduationCap className="h-2.5 w-2.5" />
                  Ensino Curricular
                </span>
              ) : isBestseller ? (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-sm font-medium flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Bestseller
                </span>
              ) : isFree ? (
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-sm font-medium flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Domínio Público
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <div>
              <span className="text-base font-light text-foreground">
                {isFree ? "100% Grátis" : formatPrice(book.price_cents, book.currency)}
              </span>
              {!isFree && book.price_cents > 0 && (
                <span className="text-muted-foreground text-xs font-light"> /acesso</span>
              )}
            </div>
            <Link
              to={readLink}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Ler agora
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BookGridCard;
