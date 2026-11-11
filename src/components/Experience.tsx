import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { BookOpen, Newspaper, Bookmark, Wifi } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Leitura no navegador",
    description: "Abra qualquer livro comprado e leia capítulo a capítulo, sem instalar nada",
  },
  {
    icon: Bookmark,
    title: "Capítulos gratuitos",
    description: "Experimente o começo de cada obra antes de reservar o acesso completo",
  },
  {
    icon: Newspaper,
    title: "Notícias editoriais",
    description: "Cultura, literatura e ideias em textos curtos publicados pela redação",
  },
  {
    icon: Wifi,
    title: "Sua estante na nuvem",
    description: "Seus livros ficam salvos na conta e acompanham você em qualquer dispositivo",
  },
];

const Experience = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="experience" className="py-32 lg:py-40 bg-secondary/30" ref={ref}>
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">
            A experiência
          </span>
          <h2 className="text-2xl md:text-3xl font-light mb-4 text-foreground tracking-tight">
            Simplicidade para ler
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">
            Menos fricção, mais leitura — do catálogo à última página
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-8 lg:p-10 rounded-xl border border-border bg-card smooth-hover ${
                  isHovered ? "shadow-lg -translate-y-1" : "shadow-soft"
                }`}
              >
                <Icon className="h-5 w-5 text-primary stroke-[1.5] mb-5" />
                <h3 className="text-base font-normal mb-2 text-card-foreground tracking-tight">{feature.title}</h3>
                <p className="text-xs text-muted-foreground font-light leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Experience;
