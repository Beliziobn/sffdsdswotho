import { motion } from "framer-motion";
import { Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ProtectedImage from "./ProtectedImage";
import { Content, contentHref } from "@/hooks/useContents";
import fallbackBanner from "@/assets/hero-reading.jpg";

interface Props {
  item?: Content;
}

const WebtoonHero = ({ item }: Props) => {
  const tags = (item?.tags?.length ? item.tags : ["Isekai", "Trapped In A Game", "Overpowered MC"]).slice(0, 4);

  return (
    <div className="relative w-full h-[70vh] min-h-[420px] overflow-hidden" data-protected-media>
      <ProtectedImage
        src={item?.cover ?? fallbackBanner}
        alt={item ? `Capa de ${item.title}` : "Webtoons em destaque"}
        priority
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />

      <div className="relative h-full flex items-end pb-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-[11px] uppercase tracking-wider text-white/70 mb-4 block">Em destaque</span>
            <h1 className="text-3xl md:text-5xl font-medium text-white tracking-tight max-w-2xl">
              {item?.title ?? "Webtoons & Comics"}
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/80 font-light">{tags.join(", ")}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={item ? contentHref(item) : "#catalogo"}
                className="inline-flex items-center gap-2 bg-white text-foreground px-6 py-3 rounded-full text-sm tracking-wide hover:bg-white/90 transition-colors"
              >
                Começar a ler
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() =>
                  toast.success("Inscrição confirmada", {
                    description: `Você será notificado sobre novos capítulos${item ? ` de ${item.title}` : ""}.`,
                  })
                }
                className="inline-flex items-center gap-2 border border-white/70 text-white px-6 py-3 rounded-full text-sm tracking-wide hover:bg-white/10 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Inscrever-se
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WebtoonHero;
