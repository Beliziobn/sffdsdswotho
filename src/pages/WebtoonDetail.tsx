import { useEffect, useState, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { BookOpen, ArrowRight, Eye, Heart, Check, Search, Filter, RefreshCw, Zap, Sparkles, Share2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ContentSection from "@/components/ContentSection";
import { Button } from "@/components/ui/button";
import { useContent, useEpisodes, useProgress, useTrackInteraction } from "@/hooks/useContents";
import { useSimilar, useBecauseYouRead } from "@/hooks/useRecommendations";
import { formatDate } from "@/lib/format";
import { CommunityReviews } from "@/components/CommunityReviews";
import ShareDialog from "@/components/ShareDialog";

const CHUNK_SIZE = 50;

const WebtoonDetail = () => {
  const { id } = useParams();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const { data: item, isLoading } = useContent(id);
  const { data: episodes = [] } = useEpisodes(id);
  const { data: progress } = useProgress(id);
  const { data: similar = [] } = useSimilar(id, 4);
  const { data: because = [] } = useBecauseYouRead(id, 4);
  const track = useTrackInteraction();

  const [chunkIndex, setChunkIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArc, setSelectedArc] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Dynamic SEO Synchronization
  useEffect(() => {
    if (!item) return;
    const pageTitle = `${item.title} — Webtoon Online | Worsco`;
    document.title = pageTitle;
    const desc = item.description || `Leia o webtoon "${item.title}" em formato scroll vertical na íntegra na Worsco.`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", pageTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", desc);
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", pageTitle);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", desc);
  }, [item]);

  // Generate chunks (1-50, 51-100, etc.)
  const chunks = useMemo(() => {
    const total = episodes.length;
    const count = Math.ceil(total / CHUNK_SIZE);
    const list: { start: number; end: number; index: number }[] = [];
    for (let i = 0; i < count; i++) {
      const start = i * CHUNK_SIZE + 1;
      const end = Math.min((i + 1) * CHUNK_SIZE, total);
      list.push({ start, end, index: i });
    }
    return list;
  }, [episodes.length]);

  // Extract unique arcs from titles or bodies if present
  const arcs = useMemo(() => {
    const set = new Set<string>();
    for (const ep of episodes) {
      if (ep.title.includes("—")) {
        const parts = ep.title.split("—");
        if (parts.length > 1) {
          const arcCandidate = parts[0].replace(/Capítulo\s*\d+\s*[-:]?/i, "").trim();
          if (arcCandidate && arcCandidate.length > 3) set.add(arcCandidate);
        }
      }
    }
    return Array.from(set);
  }, [episodes]);

  // Filter and sort
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (ep) =>
          String(ep.number).includes(q) ||
          ep.title.toLowerCase().includes(q) ||
          ep.body?.toLowerCase().includes(q)
      );
    }

    if (selectedArc !== "all") {
      result = result.filter((ep) => ep.title.includes(selectedArc));
    }

    if (sortOrder === "desc") {
      result.reverse();
    }

    return result;
  }, [episodes, searchQuery, selectedArc, sortOrder]);

  // Displayed episodes (chunked or all)
  const displayedEpisodes = useMemo(() => {
    if (searchQuery.trim() || selectedArc !== "all" || chunkIndex === -1) {
      return filteredEpisodes;
    }
    const start = chunkIndex * CHUNK_SIZE;
    return filteredEpisodes.slice(start, start + CHUNK_SIZE);
  }, [filteredEpisodes, chunkIndex, searchQuery, selectedArc]);

  useEffect(() => {
    if (id) track(id, "view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <p className="pt-40 text-center text-sm text-muted-foreground font-light">Carregando…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <div className="pt-40 text-center">
          <p className="text-sm text-muted-foreground font-light mb-6">Webtoon não encontrado.</p>
          <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal">
            <Link to="/webtoons">Ver webtoons</Link>
          </Button>
        </div>
      </div>
    );
  }

  const nextEpisode =
    episodes.find((e) => e.id === progress?.episode_id) ?? episodes[0];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      <div className="relative w-full h-[60vh] overflow-hidden">
        <motion.img
          src={item.cover || "/placeholder.svg"}
          alt={`Capa de ${item.title}`}
          style={{ y }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-6 md:left-12 lg:left-16 text-white">
          <span className="text-[11px] uppercase tracking-wider text-white/70 mb-3 block">Webtoon · {item.category}</span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight max-w-xl">{item.title}</h1>
          <p className="text-sm font-light text-white/80 mt-2 flex items-center gap-2">
            <BookOpen className="h-3 w-3" />
            {item.author}
          </p>
          <div className="flex items-center gap-5 mt-3 text-xs font-light text-white/70">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {item.views.toLocaleString("pt-BR")} views
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {item.rating_count.toLocaleString("pt-BR")} super likes
            </span>
          </div>
        </div>
      </div>

      <main className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Sinopse</span>
            <p className="text-sm text-muted-foreground font-light leading-relaxed whitespace-pre-line mb-6">
              {item.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-10">
              {Array.from(new Set(item.tags || [])).map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-14 flex-wrap">
              {nextEpisode && (
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal px-6"
                >
                  <Link to={`/webtoon/${item.id}/ep/${nextEpisode.id}`} onClick={() => track(item.id, "read")}>
                    {progress?.episode_id ? "Continuar lendo" : "Começar a ler"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsShareOpen(true)}
                className="rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal gap-2 border-border"
              >
                <Share2 className="h-3.5 w-3.5 text-primary" />
                Compartilhar Webtoon
              </Button>
            </div>

            {episodes.length > 0 ? (
              <>
                {/* Navigation & Filtering Controls */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        Capítulos Disponíveis no App ({filteredEpisodes.length} de {episodes.length})
                      </span>
                      <p className="text-[11px] text-muted-foreground font-light">
                        Todas as páginas são scans reais e originais com rolagem vertical suave
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Search box */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar capítulo..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setChunkIndex(0);
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500 w-56 transition-colors"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Arc selector */}
                      {arcs.length > 1 && (
                        <select
                          value={selectedArc}
                          onChange={(e) => {
                            setSelectedArc(e.target.value);
                            setChunkIndex(0);
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:border-emerald-500 max-w-[200px] truncate"
                        >
                          <option value="all">Todos os Arcos ({arcs.length})</option>
                          {arcs.map((arc) => (
                            <option key={arc} value={arc}>
                              {arc}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Sort order toggle */}
                      <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:border-emerald-500/50 transition-colors flex items-center gap-1.5"
                        title="Inverter ordem"
                      >
                        <span>{sortOrder === "asc" ? "Cap. 1 → Fim" : "Mais Recentes Primeiro"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Chunk Selector Tabs (1-50, 51-100, etc.) */}
                  {chunks.length > 1 && !searchQuery && selectedArc === "all" && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                      {chunks.map((chunk, idx) => (
                        <button
                          key={idx}
                          onClick={() => setChunkIndex(idx)}
                          className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
                            chunkIndex === idx
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                          }`}
                        >
                          Capítulos {chunk.start} – {chunk.end}
                        </button>
                      ))}
                      <button
                        onClick={() => setChunkIndex(-1)}
                        className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                          chunkIndex === -1
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        Exibir Todos ({episodes.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Chapter Items List */}
                <div className="space-y-2.5">
                  {displayedEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border hover:border-emerald-500/50 rounded-xl bg-card p-3.5 transition-all shadow-soft group hover:bg-accent/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border relative">
                          <img
                            src={ep.images?.[0] || item.cover || "/placeholder.svg"}
                            alt={ep.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-[9px] text-white text-center font-mono py-0.5 font-semibold">
                            {ep.images?.length ? `${ep.images.length} págs` : "Oficial"}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-emerald-500">Capítulo {ep.number}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                              {ep.images?.length || 0} páginas reais
                            </span>
                            {progress?.episode_id === ep.id && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium border border-primary/20">
                                Último Lido
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground/70 font-light hidden sm:inline">
                              · {formatDate(ep.published_at)}
                            </span>
                          </div>

                          <h4 className="text-sm font-medium text-foreground tracking-tight truncate mt-0.5 group-hover:text-emerald-500 transition-colors">
                            {ep.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-light">
                            {ep.body || "Acompanhe este capítulo na íntegra com leitor vertical de alta performance."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 flex-shrink-0 self-end sm:self-center">
                        <Button
                          asChild
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs px-5 h-8 shadow-soft"
                        >
                          <Link to={`/webtoon/${item.id}/ep/${ep.id}`}>
                            Ler Agora
                            <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Hub Oficial do Manhwa para obras do catálogo geral */
              <div className="space-y-10">
                {/* Notice & Authenticity Promise Card */}
                <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card/60 backdrop-blur-sm relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                        Catálogo Geral de Webtoons (300+ Obras)
                      </span>
                      <h3 className="text-lg sm:text-xl font-medium text-foreground">
                        Metadados e Lançamentos Oficiais de "{item.title}"
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                        Nossa plataforma respeita a autoria original: <strong>nunca duplicamos capas como páginas falsas nem inserimos capítulos de outros manhwas</strong>. Para ler este título em sua totalidade, consulte os portais oficiais abaixo ou aproveite os manhwas com scans completos já disponíveis no aplicativo.
                      </p>
                    </div>
                  </div>

                  {/* Official Reading Portals */}
                  <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <a
                      href={`https://www.webtoons.com/search?keyword=${encodeURIComponent(item.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-border bg-background hover:border-emerald-500/50 hover:bg-accent/20 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-500 block">WEBTOON Oficial</span>
                        <span className="text-xs font-medium text-foreground group-hover:text-emerald-500 transition-colors">LINE Webtoon</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </a>

                    <a
                      href={`https://comic.naver.com/search?keyword=${encodeURIComponent(item.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-border bg-background hover:border-emerald-500/50 hover:bg-accent/20 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-500 block">Naver Coreia</span>
                        <span className="text-xs font-medium text-foreground group-hover:text-emerald-500 transition-colors">네이버 웹툰</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </a>

                    <a
                      href={`https://page.kakao.com/search/result?keyword=${encodeURIComponent(item.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-border bg-background hover:border-emerald-500/50 hover:bg-accent/20 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-500 block">Kakao / Tapas</span>
                        <span className="text-xs font-medium text-foreground group-hover:text-emerald-500 transition-colors">카카오페이지</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </a>
                  </div>
                </div>

                {/* Showcase Tray of In-App Readable Manhwas */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                        Obras com Scans Completos Prontas para Ler no App
                      </h3>
                      <p className="text-xs text-muted-foreground font-light">
                        Manhwas com centenas de páginas em tiras verticais de alta resolução verificadas
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        id: "wt-solo-leveling",
                        title: "Solo Leveling",
                        cover: "/covers/webtoons/solo-leveling-cover.jpg",
                        details: "3 Capítulos · 82 Páginas Reais",
                        route: "/webtoon/wt-solo-leveling/ep/wt-solo-ep-1",
                      },
                      {
                        id: "wt-omniscient-reader",
                        title: "O Leitor Onisciente",
                        cover: "/covers/webtoons/orv-cover.jpg",
                        details: "2 Capítulos · 73 Páginas Reais",
                        route: "/webtoon/wt-omniscient-reader/ep/wt-orv-ep-1",
                      },
                      {
                        id: "wt-the-beginning-after-the-end",
                        title: "The Beginning After the End",
                        cover: "/covers/webtoons/tbate-cover.jpg",
                        details: "Capítulo 1 · 55 Páginas Reais",
                        route: "/webtoon/wt-the-beginning-after-the-end/ep/wt-tbate-ep-1",
                      },
                      {
                        id: "wt-nano-machine",
                        title: "Nano Machine",
                        cover: "/covers/webtoons/nano-machine-cover.jpg",
                        details: "Capítulo 1 · 21 Páginas Reais",
                        route: "/webtoon/wt-nano-machine/ep/wt-nano-ep-1",
                      },
                    ].map((w) => (
                      <Link
                        key={w.id}
                        to={w.route}
                        className="group p-3 rounded-2xl bg-card border border-border hover:border-emerald-500/50 shadow-soft transition-all flex flex-col"
                      >
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-3">
                          <img
                            src={w.cover}
                            alt={w.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/75 text-emerald-400 border border-emerald-500/30">
                            Scans Ativos
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-emerald-500 transition-colors">
                          {w.title}
                        </h4>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          {w.details}
                        </p>
                        <span className="mt-3 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 py-1.5 px-3 rounded-lg text-center shadow-sm">
                          Ler Agora →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Community Reviews, Comments & Adores */}
            <CommunityReviews
              itemId={id || item.id}
              itemType="webtoon"
              itemTitle={item.title}
              defaultRating={Number(item.rating) || 4.9}
              defaultRatingCount={item.rating_count || 140}
            />
          </motion.div>
        </div>
      </main>

      <ContentSection
        eyebrow="Recomendações"
        title="Readers Also Like"
        subtitle="Webtoons e histórias com o mesmo clima"
        items={similar}
        showSimilarity
        className="bg-secondary/30"
      />

      <ContentSection
        eyebrow="Baseado nesta leitura"
        title={`Porque você leu "${item.title}"`}
        items={because.filter((b) => !similar.some((s) => s.id === b.id))}
        showReason
      />

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        title={`${item.title} — Webtoon Online | Worsco`}
        text={item.description || `Confira o webtoon "${item.title}" para leitura vertical na Worsco.`}
      />

      {/* Schema.org CreativeWorkSeries Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWorkSeries",
            name: item.title,
            description: item.description,
            image: item.cover || "https://worsco.vercel.app/og-image.jpg",
            inLanguage: "pt-BR",
            url: window.location.href,
            genre: item.category,
            publisher: {
              "@type": "Organization",
              name: "Worsco",
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
};

export default WebtoonDetail;
