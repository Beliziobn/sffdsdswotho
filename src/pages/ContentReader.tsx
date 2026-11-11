import { useEffect, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, List, BookOpen, Layers } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useContent, useEpisodes, useSaveProgress, useTrackInteraction } from "@/hooks/useContents";
import { useChapters } from "@/hooks/useCatalog";
import { prefetchAdjacentChapters } from "@/lib/webtoonSyncEngine";
import { generateDynamicManhwaStoryPanels } from "@/lib/webtoonStoryGenerator";

const ContentReader = () => {
  const { id, episodeId } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading } = useContent(id);
  const { data: bookChapters = [] } = useChapters(id);
  const { data: episodes = [] } = useEpisodes(item?.type === "webtoon" ? id : undefined);
  const saveProgress = useSaveProgress();
  const track = useTrackInteraction();
  const lastSaved = useRef(0);

  // Automatic redirect to full book reader for any book, article or textbook
  useEffect(() => {
    if (
      id &&
      (item?.type === "book" ||
        id.startsWith("guten-") ||
        id.startsWith("sci-") ||
        id.startsWith("curr-") ||
        id.startsWith("mod-") ||
        id.startsWith("auto-"))
    ) {
      navigate(`/ler/${id}`, { replace: true });
    }
  }, [id, item?.type, navigate]);

  const episode = useMemo(() => episodes.find((e) => e.id === episodeId), [episodes, episodeId]);
  const index = episode ? episodes.findIndex((e) => e.id === episode.id) : -1;
  const next = index >= 0 ? episodes[index + 1] : undefined;
  const prev = index > 0 ? episodes[index - 1] : undefined;

  // Prefetch the next 3 chapters' assets into browser cache for zero latency
  useEffect(() => {
    if (id && episode?.number) {
      prefetchAdjacentChapters(id, episode.number, 3);
    }
  }, [id, episode?.number]);

  // Keyboard navigation (ArrowLeft = prev, ArrowRight = next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prev && id) {
        navigate(`/webtoon/${id}/ep/${prev.id}`);
      } else if (e.key === "ArrowRight" && next && id) {
        navigate(`/webtoon/${id}/ep/${next.id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, id, navigate]);

  useEffect(() => {
    if (id) track(id, "read");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, episodeId]);

  useEffect(() => {
    if (!id) return;
    const onScroll = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
      if (pct - lastSaved.current >= 10 || pct >= 99) {
        lastSaved.current = pct;
        saveProgress.mutate({ contentId: id, percentage: pct, episodeId: episodeId ?? null });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, episodeId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <p className="pt-40 text-center text-sm text-muted-foreground font-light">Carregando leitura…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <div className="pt-40 text-center">
          <p className="text-sm text-muted-foreground font-light mb-6">Conteúdo indisponível.</p>
          <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal">
            <Link to="/livros">Ver catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation variant="dark" />

      {/* Floating Reader Quick-Nav Bar */}
      {episode && episodes.length > 0 && (
        <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border py-2.5 px-4 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
            <Link
              to={`/webtoon/${item.id}`}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 truncate max-w-[150px] sm:max-w-xs font-light"
            >
              <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground hidden md:inline text-[11px]">Pular para:</span>
              <select
                value={episode.id}
                onChange={(e) => navigate(`/webtoon/${item.id}/ep/${e.target.value}`)}
                className="bg-card border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500 max-w-[190px] sm:max-w-xs truncate"
              >
                {episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    Cap. {ep.number} — {ep.title.split("—")[0].trim()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={!prev}
                onClick={() => prev && navigate(`/webtoon/${item.id}/ep/${prev.id}`)}
                className="h-7 px-2 text-xs"
                title="Capítulo Anterior (Seta Esquerda)"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] text-muted-foreground font-mono px-1">
                {episode.number}/{episodes.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!next}
                onClick={() => next && navigate(`/webtoon/${item.id}/ep/${next.id}`)}
                className="h-7 px-2 text-xs"
                title="Próximo Capítulo (Seta Direita)"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-10 pb-20 px-4 sm:px-6 lg:px-12">
        <article className="max-w-2xl mx-auto">
          <div className="mb-8">
            <span className="text-[11px] uppercase tracking-wider text-emerald-500 font-semibold mb-2 block">
              {item.title} · Capítulo {episode ? episode.number : 1} de {episodes.length || 1}
            </span>
            <h1 className="text-2xl md:text-3xl font-light text-foreground tracking-tight">
              {episode ? episode.title : item.title}
            </h1>
          </div>

          {(() => {
            const panels =
              episode?.images && episode.images.length > 0
                ? episode.images
                : episode && item
                ? generateDynamicManhwaStoryPanels(item.id, episode.number, episode.title, item.cover, item.title)
                : [];

            return panels.length > 0 ? (
              <div className="space-y-3 mb-10">
                {panels.map((src, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden bg-black shadow-2xl border border-border/50">
                    <img
                      src={src}
                      alt={`${episode?.title || item.title} — painel ${i + 1}`}
                      loading={i < 3 ? "eager" : "lazy"}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.retried && src.startsWith("http") && !src.includes("/api/proxy/")) {
                          target.dataset.retried = "true";
                          target.src = `/api/proxy/webtoon-image?url=${encodeURIComponent(src)}`;
                        }
                      }}
                      className="w-full h-auto block select-none"
                    />
                    <span className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded bg-black/70 text-white/80 font-mono">
                      {i + 1}/{panels.length}
                    </span>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          <div className="text-sm text-muted-foreground font-light leading-relaxed whitespace-pre-line bg-card/60 p-6 rounded-2xl border border-border">
            {episode ? episode.body : item.body || item.description}
          </div>

          <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
            {prev ? (
              <Button asChild variant="outline" className="rounded-full text-xs font-normal">
                <Link to={`/webtoon/${item.id}/ep/${prev.id}`}>
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  Capítulo {prev.number}
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {next ? (
              <Button asChild className="rounded-full text-xs font-normal bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft">
                <Link to={`/webtoon/${item.id}/ep/${next.id}`}>
                  Capítulo {next.number}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="rounded-full text-xs font-normal">
                <Link to={`/webtoon/${item.id}`}>
                  Voltar à Obra Completa
                </Link>
              </Button>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default ContentReader;
