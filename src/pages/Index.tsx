import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import FeaturedBooks from "@/components/FeaturedBooks";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";
import NewsCard, { NewsCardSkeleton } from "@/components/NewsCard";
import ContentSection from "@/components/ContentSection";
import { Button } from "@/components/ui/button";
import { useNews, type NewsItem } from "@/hooks/useCatalog";
import { useContents, useTrending } from "@/hooks/useContents";
import { useAuth } from "@/hooks/useAuth";
import { useForYou, useContinueReading } from "@/hooks/useRecommendations";
import { ANIMES_DATA } from "@/lib/animes";
import AnimeCard from "@/components/AnimeCard";
import { CINEMA_CATALOG } from "@/lib/cinema";
import CinemaCard from "@/components/cinema/CinemaCard";

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fallback-james-webb",
    title: "Telescópio James Webb amplia mapeamento atmosférico de exoplanetas",
    slug: "telescopio-james-webb-detecta-bioassinatura-em-exoplaneta",
    excerpt:
      "Observações espectroscópicas recentes detalham assinaturas químicas em mundos distantes e abrem novas frentes para a astrobiologia.",
    content:
      "Observações espectroscópicas realizadas com instrumentos infravermelhos de alta sensibilidade ampliam a compreensão sobre atmosferas planetárias fora do Sistema Solar.",
    cover_url: "/assets/hero-news.jpg",
    category: "Ciência",
    published: true,
    published_at: "2026-11-08T12:00:00.000Z",
  },
  {
    id: "fallback-ia-regulatorio",
    title: "Debates sobre inteligência artificial e direitos autorais ganham novas diretrizes",
    slug: "marco-regulatorio-de-inteligencia-artificial-e-direitos-autorais",
    excerpt:
      "Especialistas, editoras e desenvolvedores discutem transparência algorítmica e remuneração justa no ecossistema digital.",
    content:
      "O avanço rápido de modelos generativos colocou a proteção de obras literárias, jornalísticas e audiovisuais no centro das agendas regulatórias internacionais.",
    cover_url: "/assets/hero-reading.jpg",
    category: "Tecnologias",
    published: true,
    published_at: "2026-11-07T15:00:00.000Z",
  },
  {
    id: "fallback-startups-br",
    title: "Ecossistema brasileiro de tecnologia amplia investimentos em pesquisa aplicada",
    slug: "startups-brasileiras-de-inteligencia-artificial-captam-aporte-recorde",
    excerpt:
      "Novos aportes priorizam soluções em educação, saúde e produtividade digital desenvolvidas por equipes locais.",
    content:
      "Fundos de capital de risco e centros universitários intensificam parcerias para acelerar projetos de software e infraestrutura de dados no país.",
    cover_url: "/assets/hero-library.jpg",
    category: "Mercado",
    published: true,
    published_at: "2026-11-06T10:00:00.000Z",
  },
];

const Index = () => {
  const { data: news = [], isLoading: newsLoading } = useNews();
  const publishedNews = useMemo(() => news.filter((n) => n.published).slice(0, 3), [news]);
  const latest = publishedNews.length > 0 ? publishedNews : FALLBACK_NEWS;
  const { user } = useAuth();

  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const { data: continueItems = [] } = useContinueReading(4);
  const { data: forYou = [], isLoading: forYouLoading } = useForYou(4);
  const { data: trending = [], isLoading: trendingLoading } = useTrending(period, 4);
  const { data: allContents = [], isLoading: contentsLoading } = useContents({ limit: 60 });

  const featuredCollections = useMemo(
    () => allContents.filter((c) => c.featured).slice(0, 4),
    [allContents],
  );
  const webtoons = useMemo(() => allContents.filter((c) => c.type === "webtoon").slice(0, 4), [allContents]);
  const academic = useMemo(() => allContents.filter((c) => c.type === "academic").slice(0, 4), [allContents]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      <h1 className="sr-only">Wotho — Livros, notícias globais, streaming e webtoons</h1>
      <Hero />

      {user && continueItems.length > 0 && (
        <ContentSection
          eyebrow="Retome de onde parou"
          title="Continuar Lendo"
          items={continueItems}
          showProgress
          to="/continuar-lendo"
          className="bg-secondary/30"
        />
      )}

      <ContentSection
        eyebrow="Recomendações Wotho"
        title="Para Você"
        subtitle="Seleções personalizadas de leitura digital e séries"
        items={forYou}
        isLoading={forYouLoading}
        showReason
        showSimilarity
        to="/para-voce"
      />

      <ContentSection
        eyebrow="Em alta"
        title="Destaques da Semana"
        subtitle="Os títulos mais acessados pelos leitores da Wotho"
        items={trending}
        isLoading={trendingLoading}
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
        title="Coleções Editoriais Wotho"
        subtitle="Curadoria de obras literárias, didáticas e ensaios"
        items={featuredCollections}
        isLoading={contentsLoading}
      />

      <ContentSection
        eyebrow="Séries Ilustradas"
        title="Webtoons & Comics"
        items={webtoons}
        isLoading={contentsLoading}
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
                Cinema & Séries Wotho
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

      <ContentSection
        eyebrow="Pesquisa & Ciência"
        title="Artigos Científicos e Acadêmicos"
        items={academic}
        isLoading={contentsLoading}
      />

      <section className="py-24 lg:py-32 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 block">
              Jornalismo Wotho
            </span>
            <h2 className="text-2xl md:text-3xl font-light mb-3 text-foreground tracking-tight">
              Últimas notícias globais
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">
              Cultura, ciência, tecnologia, literatura e grandes ideias em reportagens diretas
            </p>
          </div>

          {newsLoading && publishedNews.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NewsCardSkeleton />
              <NewsCardSkeleton />
              <NewsCardSkeleton />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latest.map((item) => (
                <div key={item.id}>
                  <NewsCard item={item} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              asChild
              variant="outline"
              className="rounded-full text-[11px] uppercase tracking-wider font-normal px-6"
            >
              <Link to="/noticias">
                Ver todas as notícias
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
