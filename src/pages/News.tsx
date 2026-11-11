import { useEffect, useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { Search, RefreshCw, Radio, Archive, Calendar, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import NewsHero from "@/components/news/NewsHero";
import CategoryPills from "@/components/news/CategoryPills";
import EditorialCard from "@/components/news/EditorialCard";
import MissedCarousel from "@/components/news/MissedCarousel";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import bannerImage from "@/assets/hero-news.jpg";
import { useNews } from "@/hooks/useCatalog";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { useContentProtection } from "@/hooks/useContentProtection";
import { NEWS_CATEGORIES, pickFeatured, type CuratedNews } from "@/lib/news";
import { syncDailyNews } from "@/lib/newsSyndication";
import { fetchArchiveTimeline, type ArchiveTimelineEntry } from "@/lib/newsArchiveEngine";

const MONTH_NAMES: Record<string, string> = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Março",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro",
};

const News = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [timeline, setTimeline] = useState<ArchiveTimelineEntry[]>([]);
  const [totalArchived, setTotalArchived] = useState<number>(0);
  useContentProtection();

  useEffect(() => {
    fetchArchiveTimeline().then((res) => {
      setTimeline(res.timeline || []);
      setTotalArchived(res.totalArticles || 0);
    });

    // Check for fresh live RSS and cloud updates on mount
    void syncDailyNews().then((fresh) => {
      if (fresh && fresh.length > 0) {
        void queryClient.invalidateQueries({ queryKey: ["news-feed"] });
        void queryClient.invalidateQueries({ queryKey: ["news"] });
      }
    });
  }, [queryClient]);

  const category = params.get("categoria") ?? "all";
  const order = (params.get("ordem") as "recent" | "oldest") ?? "recent";
  const year = params.get("ano") ?? "all";
  const month = params.get("mes") ?? "all";
  const q = params.get("q") ?? "";

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all" || value === "") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const feed = useNewsFeed({ category, order, q, year, month });
  const items = useMemo(
    () => (feed.data?.pages.flatMap((p) => p.items) ?? []) as CuratedNews[],
    [feed.data],
  );

  const { data: all = [] } = useNews();
  const published = useMemo(
    () => (all.length > 0 ? all.filter((n) => n.published) : items) as CuratedNews[],
    [all, items]
  );

  /** Available years in archive */
  const availableYears = useMemo(() => {
    const yrs = new Set<string>();
    timeline.forEach((t) => yrs.add(String(t.year)));
    published.forEach((p) => {
      const d = new Date(p.published_at);
      if (!isNaN(d.getFullYear())) yrs.add(String(d.getFullYear()));
    });
    if (yrs.size === 0) yrs.add("2026");
    return Array.from(yrs).sort().reverse();
  }, [timeline, published]);

  /** Curation: Top Story flag → engajamento do dia → mais recente. */
  const featured = useMemo(() => pickFeatured(published), [published]);
  const isFilteringHistory = year !== "all" || month !== "all";
  const gridItems = useMemo(
    () => items.filter((i) => (!featured || i.id !== featured.id || category !== "all" || q) || isFilteringHistory),
    [items, featured, category, q, isFilteringHistory],
  );

  const categories = useMemo(() => {
    const fromData = published.map((n) => n.category).filter(Boolean);
    return Array.from(new Set([...NEWS_CATEGORIES, ...fromData]));
  }, [published]);

  const missed = useMemo(
    () => published.filter((n) => !featured || n.id !== featured.id).slice(0, 10),
    [published, featured],
  );

  const { ref, inView } = useInView({ rootMargin: "600px 0px" });
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const updated = await syncDailyNews(true);
      await queryClient.invalidateQueries({ queryKey: ["news-feed"] });
      await queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success("Feeds atualizados com sucesso!", {
        description: `${updated.length} notícias foram sincronizadas automaticamente.`,
      });
    } catch {
      toast.error("Erro ao sincronizar os feeds de notícias.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      <div className="relative w-full h-[50vh] overflow-hidden">
        <motion.img
          src={bannerImage}
          alt="Jornal sobre a mesa"
          style={{ y }}
          className="absolute inset-0 w-full h-[120%] object-cover select-none [-webkit-user-drag:none]"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <main className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-[11px] font-medium text-foreground mb-3">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Feeds Diários Automáticos • Imprensa Oficial</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-3">Portal de Notícias Worscoi</h1>
            <p className="text-sm text-muted-foreground font-light max-w-xl mx-auto">
              Cobertura contínua e aprofundada: futebol, mercado, tendências virais, listas, política, geografia, ciência, literatura e entretenimento global
            </p>
          </div>

          {featured && !q && category === "all" && <NewsHero item={featured} />}

          <div className="mb-10 space-y-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  defaultValue={q}
                  onChange={(e) => setParam("q", e.target.value)}
                  placeholder="Buscar notícias por título ou assunto..."
                  className="pl-9 text-sm font-light rounded-full"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-accent text-xs font-medium text-foreground transition-all disabled:opacity-50"
                  title="Atualizar feeds de notícias agora"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                  <span>{isSyncing ? "Sincronizando..." : "Atualizar Notícias"}</span>
                </button>

                  <Select value={order} onValueChange={(v) => setParam("ordem", v === "recent" ? undefined : v)}>
                  <SelectTrigger className="w-[140px] text-xs font-light rounded-full">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                    <SelectItem value="oldest">Mais antigas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Banner de Arquivo Histórico Permanente & Filtros Cronológicos */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/70 border border-border/80 shadow-xs">
              <div className="flex items-center gap-2.5 text-xs text-foreground/80">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Archive className="h-4 w-4" />
                </span>
                <div>
                  <span className="font-semibold text-foreground">Arquivo Permanente Ativo:</span>{" "}
                  <span className="text-muted-foreground">
                    {totalArchived || published.length} matérias preservadas no histórico imutável (sem expiração ou links quebrados)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-light mr-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Histórico:</span>
                </div>

                <Select value={year} onValueChange={(v) => setParam("ano", v === "all" ? undefined : v)}>
                  <SelectTrigger className="w-[110px] h-8 text-xs font-light rounded-full bg-background">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {availableYears.map((yr) => (
                      <SelectItem key={yr} value={yr}>
                        {yr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={month} onValueChange={(v) => setParam("mes", v === "all" ? undefined : v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs font-light rounded-full bg-background">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {Object.entries(MONTH_NAMES).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {isFilteringHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      setParam("ano", undefined);
                      setParam("mes", undefined);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-full border border-border hover:bg-muted transition-all"
                    title="Limpar filtro histórico"
                  >
                    <X className="h-3 w-3" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
            </div>

            <CategoryPills categories={categories} value={category} onChange={(v) => {
              const next = new URLSearchParams(params);
              if (!v || v === "all") next.delete("categoria");
              else next.set("categoria", v);
              next.delete("q");
              setParams(next, { replace: true });
            }} />

            {category.toLowerCase() === "futebol" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-emerald-500/25 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Ligas Europeias & Gigantes do Continente
                    </h3>
                    <p className="text-xs text-muted-foreground font-light">
                      Filtre diretamente por liga europeia ou pelos principais clubes da Europa
                    </p>
                  </div>
                  {q && (
                    <button
                      type="button"
                      onClick={() => setParam("q", undefined)}
                      className="self-start sm:self-center inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      <span>Mostrar todos ({q})</span>
                    </button>
                  )}
                </div>

                {/* Ligas Europeias */}
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                    Competições & Ligas Nacionais
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Todas as Ligas", query: "" },
                      { label: "🏆 UEFA Champions League", query: "Champions" },
                      { label: "🇪🇸 La Liga (Espanha)", query: "La Liga" },
                      { label: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League (Inglaterra)", query: "Premier League" },
                      { label: "🇩🇪 Bundesliga (Alemanha)", query: "Bundesliga" },
                      { label: "🇮🇹 Serie A (Itália)", query: "Serie A" },
                      { label: "🇫🇷 Ligue 1 (França)", query: "Ligue 1" },
                      { label: "🇵🇹 Liga Portugal", query: "Liga Portugal" },
                    ].map((lg) => {
                      const active = q.toLowerCase() === lg.query.toLowerCase();
                      return (
                        <button
                          key={lg.label}
                          type="button"
                          onClick={() => setParam("q", lg.query || undefined)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                            active
                              ? "bg-emerald-600 text-white border-emerald-600 font-medium shadow-xs"
                              : "bg-background hover:bg-accent text-foreground border-border font-light"
                          }`}
                        >
                          {lg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Principais Clubes Europeus e suas Ligas */}
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                    Clubes Europeus por Liga
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { club: "Real Madrid", league: "La Liga", query: "Real Madrid" },
                      { club: "Barcelona", league: "La Liga", query: "Barcelona" },
                      { club: "Manchester City", league: "Premier League", query: "City" },
                      { club: "Bayern München", league: "Bundesliga", query: "Bayern" },
                      { club: "Liverpool", league: "Premier League", query: "Liverpool" },
                      { club: "Arsenal", league: "Premier League", query: "Arsenal" },
                      { club: "PSG", league: "Ligue 1", query: "PSG" },
                      { club: "Chelsea", league: "Premier League", query: "Chelsea" },
                      { club: "Manchester United", league: "Premier League", query: "Manchester United" },
                      { club: "Atlético de Madrid", league: "La Liga", query: "Atlético de Madrid" },
                      { club: "Borussia Dortmund", league: "Bundesliga", query: "Borussia Dortmund" },
                      { club: "Inter de Milão", league: "Serie A", query: "Inter de Milão" },
                      { club: "Milan", league: "Serie A", query: "Milan" },
                      { club: "Napoli", league: "Serie A", query: "Napoli" },
                      { club: "Benfica", league: "Liga Portugal", query: "Benfica" },
                      { club: "Sporting", league: "Liga Portugal", query: "Sporting" },
                      { club: "FC Porto", league: "Liga Portugal", query: "Porto" },
                    ].map((c) => {
                      const active = q.toLowerCase() === c.query.toLowerCase();
                      return (
                        <button
                          key={c.club}
                          type="button"
                          onClick={() => setParam("q", active ? undefined : c.query)}
                          className={`px-2.5 py-1 rounded-lg text-xs transition-all border inline-flex items-center gap-1.5 ${
                            active
                              ? "bg-primary text-white border-primary font-medium"
                              : "bg-secondary/60 hover:bg-secondary text-foreground border-border/70 font-light"
                          }`}
                        >
                          <span>{c.club}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-background/80 text-muted-foreground"
                            }`}
                          >
                            {c.league}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {feed.isLoading ? (
            <p className="text-sm text-muted-foreground font-light text-center py-16">Carregando notícias...</p>
          ) : gridItems.length === 0 ? (
            <p className="text-sm text-muted-foreground font-light text-center py-16">Nenhuma notícia encontrada.</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                {gridItems.map((item) => (
                  <div key={item.id} className="h-full">
                    <EditorialCard item={item} />
                  </div>
                ))}
              </div>
              <div ref={ref} className="h-12" />
              {feed.isFetchingNextPage && (
                <p className="text-center text-sm text-muted-foreground font-light">Carregando mais…</p>
              )}
            </>
          )}

          <MissedCarousel items={missed} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default News;
