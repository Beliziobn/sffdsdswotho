import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Timer, Gift } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Content, contentHref } from "@/hooks/useContents";
import ProtectedImage from "./ProtectedImage";

const pad = (n: number) => String(n).padStart(2, "0");

/** Countdown to the next midnight, refreshed every second. */
const useCountdown = () => {
  const [left, setLeft] = useState(() => {
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    return end.getTime() - Date.now();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      setLeft(Math.max(0, end.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const s = Math.floor(left / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

const TemporaryOffer = ({ item }: { item?: Content }) => {
  const time = useCountdown();
  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="overflow-hidden border border-border bg-card shadow-soft">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-56 shrink-0 aspect-[2/3] md:aspect-auto bg-accent" data-protected-media>
            <ProtectedImage src={item.cover} alt={`Capa de ${item.title}`} className="w-full h-full object-cover" />
          </div>
          <div className="p-8 flex-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 block">
              Ofertas temporárias
            </span>
            <h3 className="text-xl md:text-2xl font-light tracking-tight text-card-foreground mb-3">{item.title}</h3>
            <p className="text-sm text-muted-foreground font-light mb-5 max-w-xl">
              {item.description || "Episódios liberados por tempo limitado. Leia agora antes que a promoção termine."}
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light inline-flex items-center gap-1">
                <Gift className="h-3 w-3" /> 3 episódios grátis
              </span>
              <span className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light inline-flex items-center gap-1 tabular-nums">
                <Timer className="h-3 w-3" /> {time} restantes
              </span>
            </div>
            <Button asChild className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6">
              <Link to={contentHref(item)}>Aproveitar oferta</Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TemporaryOffer;
