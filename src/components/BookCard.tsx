import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Sparkles, FileText } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Book } from "@/hooks/useCatalog";
import { formatPrice } from "@/lib/format";
import { hasOriginalPdf } from "@/lib/originalPdfRegistry";

interface BookCardProps {
  book: Book;
  /** Optional overrides used by the recommendation sections */
  href?: string;
  badge?: string;
  reason?: string;
  similarity?: number;
  progress?: number;
}

export const BookCardContent = ({ book, href, badge, reason, similarity, progress }: BookCardProps) => {
  const hasPdf = hasOriginalPdf(book.id);
  return (
  <Link to={href ?? `/livros/${book.id}`} className="block">
    <div className="relative h-48 overflow-hidden bg-accent">
      <img
        src={book.cover_url || "/placeholder.svg"}
        alt={`Capa do livro ${book.title}`}
        loading="lazy"
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
      />
      {hasPdf && (
        <div className="absolute top-3 left-3 bg-rose-600/95 text-white backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm text-[10px] font-bold">
          <FileText className="h-3 w-3" />
          <span>PDF Original</span>
        </div>
      )}
      {(badge || book.featured) && (
        <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
          <Sparkles className="h-3 w-3 fill-primary text-primary" />
          <span className="font-light text-xs">{badge ?? "Destaque"}</span>
        </div>
      )}
      {typeof progress === "number" && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-card/40">
          <div className="h-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
    <div className="p-6">
      <h3 className="text-base font-normal mb-1 text-card-foreground tracking-tight">{book.title}</h3>
      <div className="flex items-center gap-1 text-muted-foreground mb-4 text-xs font-light">
        <BookOpen className="h-3 w-3" />
        <span>{book.author}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light">
          {book.category}
        </span>
        <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light">
          Leitura online
        </span>
        {typeof similarity === "number" && (
          <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light">
            {Math.round(similarity * 100)}% match
          </span>
        )}
      </div>
      {reason && <p className="text-[11px] text-muted-foreground font-light mb-4">{reason}</p>}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xl font-light text-foreground">{formatPrice(book.price_cents, book.currency)}</span>
          <span className="text-muted-foreground text-xs font-light"> /acesso</span>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs font-light">
          Ver detalhes
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </div>
  </Link>
  );
};

const BookCard = (props: BookCardProps) => (
  <Card className="overflow-hidden border border-border bg-card shadow-soft hover:shadow-lg transition-shadow duration-300">
    <BookCardContent {...props} />
  </Card>
);

export default BookCard;
