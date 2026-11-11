import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ContentList } from "@/components/ContentSection";
import { Button } from "@/components/ui/button";
import bannerImage from "@/assets/hero-reading.jpg";
import { useForYou } from "@/hooks/useRecommendations";
import { ContentType } from "@/hooks/useContents";

const filters: { value: ContentType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "book", label: "Livros" },
  { value: "webtoon", label: "Webtoons" },
  { value: "news", label: "Notícias" },
  { value: "academic", label: "Acadêmico" },
];

const ForYou = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const [type, setType] = useState<ContentType | "all">("all");
  const { data: items = [], isLoading } = useForYou(24, type);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      <div className="relative w-full h-[50vh] overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 -top-20 -bottom-20">
          <img src={bannerImage} alt="Recomendações personalizadas" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/40" />
        </motion.div>
        <div className="relative h-full flex items-end pb-16">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="text-[11px] uppercase tracking-wider text-white/70 mb-4 block">Recomendações</span>
              <h1 className="text-3xl md:text-5xl font-light text-white tracking-tight">Para Você</h1>
            </motion.div>
          </div>
        </div>
      </div>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={type === f.value ? "default" : "outline"}
                size="sm"
                className="rounded-full text-[11px] uppercase tracking-wider font-normal px-5"
                onClick={() => setType(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground font-light">Carregando recomendações…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground font-light">
              Ainda não temos sinal suficiente. Explore o catálogo para melhorar suas recomendações.
            </p>
          ) : (
            <ContentList items={items} showReason showSimilarity />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForYou;
