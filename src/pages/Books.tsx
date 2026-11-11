import { useEffect, useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSearchParams, Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { Search, Sparkles, BookOpen, X, Bot } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FreeBookHero from "@/components/books/FreeBookHero";
import BookGridCard from "@/components/books/BookGridCard";
import RecommendedCarousel from "@/components/books/RecommendedCarousel";
import CategoryPills from "@/components/news/CategoryPills";
import { Button } from "@/components/ui/button";
import bannerImage from "@/assets/hero-library.jpg";
import { useContentFeed } from "@/hooks/useContentFeed";
import { useContents, ContentType } from "@/hooks/useContents";
import { useContentProtection } from "@/hooks/useContentProtection";
import { BOOK_CATEGORIES, freeBookOfTheDay } from "@/lib/books";
import { hasOriginalPdf } from "@/lib/originalPdfRegistry";

const TABS = [
  { value: "all", label: "Todos os Acervos" },
  { value: "pdf", label: "Edições em PDF" },
  { value: "book", label: "Livros & Obras" },
  { value: "academic", label: "Artigos Científicos" },
  { value: "curricular", label: "Disciplinas Curriculares" },
];

const Books = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const [params, setParams] = useSearchParams();
  useContentProtection();

  const typeParam = params.get("tipo") ?? "all";
  const contentType: ContentType | undefined =
    typeParam === "academic" ? "academic" : typeParam === "book" ? "book" : undefined;
  const category = params.get("categoria") ?? "all";
  const [search, setSearch] = useState("");

  const feed = useContentFeed({ type: contentType, category });
  const feedItems = useMemo(() => feed.data?.pages.flatMap((p) => p.items) ?? [], [feed.data]);

  const { data: all = [], isLoading: isAllLoading } = useContents({ type: contentType });
  const freeBook = useMemo(() => freeBookOfTheDay(all.filter((i) => i.cover || i.description)), [all]);
  const recommended = useMemo(() => [...all].sort((a, b) => b.rating - a.rating).slice(0, 10), [all]);

  // Combine feed items, modern bestsellers, academic papers, curricular books and PDF editions without duplication
  const combinedItems = useMemo(() => {
    const map = new Map<string, any>();
    for (const it of all) map.set(it.id, it);
    for (const it of feedItems) map.set(it.id, it);
    let list = Array.from(map.values());

    if (typeParam === "pdf") {
      list = list.filter((i) => hasOriginalPdf(i.id) || i.formats?.includes("PDF Original") || i.tags?.includes("PDF Original"));
    } else if (typeParam === "academic") {
      list = list.filter((i) => i.id?.startsWith("sci-") || i.type === "academic" || i.category === "Artigos Científicos");
    } else if (typeParam === "curricular") {
      list = list.filter((i) => i.id?.startsWith("curr-") || i.category === "Disciplinas Curriculares" || i.collection === "Disciplinas Curriculares");
    } else if (typeParam === "book") {
      list = list.filter((i) => !i.id?.startsWith("sci-") && !i.id?.startsWith("curr-") && (i.type === "book" || !i.type));
    }

    if (category && category !== "all") {
      if (category === "Bestsellers Modernos") {
        list = list.filter((i) => i.id?.startsWith("mod-") || i.tags?.includes("Bestseller"));
      } else if (category === "✨ Automação Contínua") {
        list = list.filter((i) => i.id?.startsWith("auto-") || i.tags?.includes("Automático") || i.collection === "Automação Contínua");
      } else {
        list = list.filter((i) => i.category === category);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.author?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [all, feedItems, typeParam, category, search]);

  const categories = useMemo(() => {
    const fromData = all.map((i) => i.category).filter(Boolean);
    return Array.from(new Set(["✨ Automação Contínua", "Bestsellers Modernos", ...BOOK_CATEGORIES, ...fromData]));
  }, [all]);

  const { ref, inView } = useInView({ rootMargin: "600px 0px" });
  useEffect(() => {
    if (inView && feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
  }, [inView, feed]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      <div className="relative w-full h-[50vh] overflow-hidden">
        <motion.img
          src={bannerImage}
          alt="Estantes de livros"
          style={{ y }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-medium mb-3 block">
              Biblioteca Digital Aberta
            </span>
            <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight max-w-2xl mx-auto">
              Grandes Obras, Filosofia & Ciência
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-light mt-3 max-w-xl mx-auto">
              Obras essenciais de Estoicismo, Filosofia, Psicologia, Educação, Hábitos e Desenvolvimento com leitura completa no seu navegador
            </p>
          </div>
        </div>
      </div>

      <main className="py-16 lg:py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Daily Pick Banner */}
          <FreeBookHero book={freeBook} />

          {/* Search bar & Live stats banner */}
          <div className="my-10 max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título ou autor (ex: Marco Aurélio, Kahneman, Paulo Freire, Hábitos Atômicos, Epicteto)..."
                className="w-full pl-11 pr-10 py-3 rounded-full border border-border bg-card text-foreground text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end text-xs text-muted-foreground px-2">
              <span>
                {combinedItems.length} {combinedItems.length === 1 ? "título encontrado" : "títulos disponíveis"}
              </span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {TABS.map((t) => (
              <Button
                key={t.value}
                variant={typeParam === t.value ? "default" : "outline"}
                size="sm"
                className="rounded-full text-[11px] uppercase tracking-wider font-normal px-5"
                onClick={() => setParam("tipo", t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {/* Categories */}
          <div className="mb-10">
            <CategoryPills categories={categories} value={category} onChange={(v) => setParam("categoria", v)} />
          </div>

          {/* Catalog Grid */}
          {feed.isLoading && isAllLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 rounded-lg bg-accent animate-pulse" />
              ))}
            </div>
          ) : combinedItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground font-light">
                Nenhum título encontrado com o filtro aplicado.
              </p>
              {search && (
                <Button variant="outline" size="sm" onClick={() => setSearch("")} className="rounded-full text-xs">
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {combinedItems.map((item) => (
                <BookGridCard key={item.id} book={item} free={item.price_cents === 0 || item.id === freeBook?.id} />
              ))}
            </div>
          )}

          <div ref={ref} className="h-12" />
          {feed.isFetchingNextPage && (
            <p className="text-center text-sm text-muted-foreground font-light">Carregando mais obras…</p>
          )}

          {/* Recommended Carousel */}
          <RecommendedCarousel items={recommended} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Books;
