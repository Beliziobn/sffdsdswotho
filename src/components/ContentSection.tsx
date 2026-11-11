import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import BookCard from "./BookCard";
import { Button } from "./ui/button";
import { Content, contentHref, contentToBook, CONTENT_LABELS } from "@/hooks/useContents";

interface ContentListProps {
  items: Content[];
  showReason?: boolean;
  showSimilarity?: boolean;
  showProgress?: boolean;
}

/** Shared grid that renders any content type through the existing BookCard. */
export const ContentList = ({ items, showReason, showSimilarity, showProgress }: ContentListProps) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
    {items.map((item, index) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay: Math.min(index, 6) * 0.06 }}
      >
        <BookCard
          book={contentToBook(item)}
          href={contentHref(item)}
          badge={CONTENT_LABELS[item.type]}
          reason={showReason ? item.reason : undefined}
          similarity={showSimilarity ? item.similarity : undefined}
          progress={showProgress ? item.progress : undefined}
        />
      </motion.div>
    ))}
  </div>
);

interface ContentSectionProps extends ContentListProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  to?: string;
  toLabel?: string;
  className?: string;
  isLoading?: boolean;
  action?: React.ReactNode;
}

const ContentSection = ({
  eyebrow,
  title,
  subtitle,
  to,
  toLabel = "Ver todos",
  className = "bg-background",
  isLoading,
  action,
  ...listProps
}: ContentSectionProps) => {
  if (!isLoading && listProps.items.length === 0) return null;

  return (
    <section className={`py-24 lg:py-28 ${className}`}>
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          {eyebrow && (
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">{eyebrow}</span>
          )}
          <h2 className="text-2xl md:text-3xl font-light mb-4 text-foreground tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">{subtitle}</p>}
          {action && <div className="mt-6 flex justify-center">{action}</div>}
        </motion.div>

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground font-light">Carregando…</p>
        ) : (
          <ContentList {...listProps} />
        )}

        {to && (
          <div className="text-center mt-12">
            <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6">
              <Link to={to}>
                {toLabel}
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ContentSection;
