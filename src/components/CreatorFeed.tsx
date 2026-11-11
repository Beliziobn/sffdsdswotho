import { motion } from "framer-motion";
import { BadgeCheck, Heart, MessageCircle } from "lucide-react";
import { Card } from "./ui/card";
import ProtectedImage from "./ProtectedImage";
import { Content } from "@/hooks/useContents";

interface Props {
  items: Content[];
}

const RELATIVE = ["há 2 horas", "há 6 horas", "ontem", "há 3 dias"];

/** Creator updates derived from the latest webtoons in the catalogue. */
const CreatorFeed = ({ items }: Props) => {
  const posts = items.slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <div className="space-y-6">
      {posts.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
        >
          <Card className="border border-border bg-card shadow-soft p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-sm font-light text-accent-foreground shrink-0">
                {item.author.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm text-card-foreground">{item.author}</span>
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground font-light">· {RELATIVE[i % RELATIVE.length]}</span>
                </div>
                <p className="text-sm text-muted-foreground font-light mt-2">
                  Novo capítulo de <span className="text-foreground">{item.title}</span> já disponível. Obrigado por
                  acompanharem a série!
                </p>
                <div
                  className="mt-4 rounded-md overflow-hidden border border-border aspect-[16/7] bg-accent"
                  data-protected-media
                >
                  <ProtectedImage
                    src={item.cover}
                    alt={`Prévia de ${item.title}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-5 mt-4 text-xs text-muted-foreground font-light">
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5" /> {120 + item.views % 500}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" /> {12 + item.rating_count}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default CreatorFeed;
