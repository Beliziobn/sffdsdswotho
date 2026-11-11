import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedBooks from "@/components/FeaturedBooks";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import ContentSection from "@/components/ContentSection";
import { Button } from "@/components/ui/button";
import { useNews } from "@/hooks/useCatalog";
import { useContents, useTrending } from "@/hooks/useContents";
import { useAuth } from "@/hooks/useAuth";
import { useForYou, useContinueReading } from "@/hooks/useRecommendations";
import { ANIMES_DATA } from "@/lib/animes";
import AnimeCard from "@/components/AnimeCard";
import { CINEMA_CATALOG } from "@/lib/cinema";
import CinemaCard from "@/components/cinema/CinemaCard";

const Index = () => {
  const { data: news = [] } = useNews();
  const latest = news.filter((n) => n.published).slice(0, 3);
  const { user } = useAuth();

  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const { data: continueItems = [] } = useContinueReading(4);
  const { data: forYou = [], isLoading: forYouLoading } = useForYou(4);
  const { data: trending = [] } = useTrending(period, 4);
  const { data: allContents = [] } = useContents({ limit: 60 });

  const featuredCollections = useMemo(
    () => allContents.filter((c) => c.featured).slice(0, 4),
    [allContents],
  );
  const webtoons = useMemo(() => allContents.filter((c) => c.type === "webtoon").slice(0, 4), [allContents]);
  const academic = useMemo(() => allContents.filter((c) => c.type === "academic").slice(0, 4), [allContents]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      <Hero />

      {user && continueItems.length > 0 && (
        <ContentSection
          eyebrow="Retome de onde parou"
          title="Continue Reading"
          items={continueItems}
          showProgress
          to="/continuar-lendo"
          className="bg-secondary/30"
        />
      )}

      <ContentSection
        eyebrow="Recomendações"
        title="Para Você"
        subtitle="Sugestões geradas a partir do seu histórico de leitura"
        items={forYou}
        isLoading={forYouLoading}
        showReason
        showSimilarity
        to="/para-voce"
      />

      <ContentSection
        eyebrow="Em alta"
        title="Most Popular"
        subtitle="O que a comunidade está lendo agora"
        items={trending}
        className="bg-secondary/30"
        action={
          <div className="flex gap-2">
            {(["today", "week", "month"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                className="rounded-full text-[11px] uppercase tracking-wider font-normal px-5"
                onClick={() => setPeriod(p)}
              >
                {p === "today" ? "Hoje" : p === "week" ? "Semana" : "Mês"}
              </Button>
            ))}
          </div>
        }
      />

      <FeaturedBooks />

      <ContentSection
        eyebrow="Coleções"
        title="Featured Collections"
        subtitle="Seleções editoriais da redação"
        items={featuredCollections}
      />

      <ContentSection
        eyebrow="Séries"
        title="Webtoons & Comics"
        items={webtoons}
        to="/webtoons"
        className="bg-secondary/30"
      />

      {/* Seção de Animes em Destaque na Home */}
      <section className="py-20 lg:py-24 bg-card border-y border-border">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-primary font-medium mb-2 block">
                Animações & Séries
              </span>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">
                Animes da Temporada
              </h2>
              <p className="text-xs text-muted-foreground font-light mt-1">
                Acompanhe estreias semanais, trailers e episódios com dublagem e legendas em português.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full text-[11px] uppercase tracking-wider font-normal px-5 self-start md:self-auto"
            >
              <Link to="/animes">
                Ver todos os animes
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {ANIMES_DATA.slice(0, 4).map((anime) => (
              <AnimeCard key={anime.id} item={anime} />
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Cinema & Séries em Destaque na Home */}
      <section className="py-20 lg:py-24 bg-[#0a0d14] text-zinc-100 border-b border-white/5">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-amber-400 font-medium mb-2 block">
                Streaming & Entretenimento
              </span>
              <h2 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                Cinema & Séries Worsco
              </h2>
              <p className="text-xs text-zinc-400 font-light mt-1">
                Grandes produções cinematográficas, clássicos premiados e séries aclamadas pela crítica.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full text-[11px] uppercase tracking-wider font-normal px-5 self-start md:self-auto border-white/20 bg-white/5 hover:bg-amber-500 hover:text-black text-white transition"
            >
              <Link to="/cinema">
                Explorar Catálogo de Cinema
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {CINEMA_CATALOG.slice(0, 4).map((item) => (
              <CinemaCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <ContentSection eyebrow="Pesquisa" title="Academic" items={academic} />

      <section className="py-32 lg:py-40 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Redação</span>
            <h2 className="text-2xl md:text-3xl font-light mb-4 text-foreground tracking-tight">Últimas notícias</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">
              Cultura, literatura e ideias em textos curtos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.map((item) => (
              <div key={item.id}>
                <NewsCard item={item} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              asChild
              variant="outline"
              className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6"
            >
              <Link to="/noticias">
                Ver todas
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Booking />
      <Footer />
    </div>
  );
};

export default Index;
