import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { BookOpen, ArrowLeft, ArrowRight, Star, Download, Headphones, Share2, Bookmark } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ContentSection from "@/components/ContentSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useContent, useTrackInteraction, useProgress, CONTENT_LABELS } from "@/hooks/useContents";
import { useSimilar, useBecauseYouRead } from "@/hooks/useRecommendations";
import { formatPrice } from "@/lib/format";
import { getOriginalPdfForBook, getDownloadPdfUrl } from "@/lib/originalPdfRegistry";
import { CommunityReviews } from "@/components/CommunityReviews";

const ContentDetail = () => {
  const { id } = useParams();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const { data: item, isLoading } = useContent(id);
  const { data: similar = [] } = useSimilar(id, 4);
  const { data: because = [] } = useBecauseYouRead(id, 4);
  const { data: progress } = useProgress(id);
  const track = useTrackInteraction();
  const [saved, setSaved] = useState(false);

  const originalPdf = id ? getOriginalPdfForBook(id) : undefined;

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
          <p className="text-sm text-muted-foreground font-light mb-6">Conteúdo não encontrado.</p>
          <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal">
            <Link to="/livros">Ver catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: item.title, url }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    }
    track(item.id, "share");
  };

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
          <span className="text-[11px] uppercase tracking-wider text-white/70 mb-3 block">
            {CONTENT_LABELS[item.type]} · {item.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight max-w-xl">{item.title}</h1>
          <p className="text-sm font-light text-white/80 mt-2 flex items-center gap-2">
            <BookOpen className="h-3 w-3" />
            {item.author}
          </p>
          <p className="text-xs font-light text-white/70 mt-2 flex items-center gap-2">
            <Star className="h-3 w-3 fill-white/80 text-white/80" />
            {Number(item.rating).toFixed(1)} · {item.rating_count} avaliações
          </p>
        </div>
      </div>

      <main className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Sinopse</span>
            <p className="text-sm text-muted-foreground font-light leading-relaxed whitespace-pre-line mb-12">
              {item.description}
            </p>

            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Ficha técnica</span>
            <div className="grid sm:grid-cols-2 gap-3 mb-12">
              {[
                ["Formatos", item.formats.length ? item.formats.join(", ") : "Leitura online"],
                ["Idioma", item.language.toUpperCase()],
                ["Ano", item.year ? String(item.year) : "—"],
                ["Tamanho", item.size ?? "—"],
                ["Tempo de leitura", item.read_time ? `${item.read_time} min` : "—"],
                ["Visualizações", item.views.toLocaleString("pt-BR")],
              ].map(([label, value]) => (
                <div key={label} className="border border-border rounded-md bg-card px-5 py-4">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-light block mb-1">
                    {label}
                  </span>
                  <p className="text-sm font-normal text-card-foreground tracking-tight">{value}</p>
                </div>
              ))}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(item.tags)).map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="text-[10px] uppercase tracking-wide px-2 py-1 bg-accent text-accent-foreground rounded-sm font-light"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Community Reviews, Comments & Adores */}
            <CommunityReviews
              itemId={id || item.id}
              itemType={item.type === "academic" ? "book" : item.type === "webtoon" ? "webtoon" : "book"}
              itemTitle={item.title}
              defaultRating={Number(item.rating) || 4.8}
              defaultRatingCount={item.rating_count || 95}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <Card className="p-8 shadow-soft border border-border bg-card sticky top-28">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-light text-foreground">{formatPrice(item.price_cents, item.currency)}</span>
                <span className="text-xs text-muted-foreground font-light">/acesso completo</span>
              </div>

              {typeof progress?.progress_percentage === "number" && progress.progress_percentage > 0 && (
                <div className="mb-6">
                  <div className="h-1 bg-accent rounded-sm overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress.progress_percentage}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-light mt-2">
                    {progress.progress_percentage}% lido
                  </p>
                </div>
              )}

              {originalPdf && (
                <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Livro Físico Original em PDF Anexado</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-light mb-3">
                    Edição física integral digitalizada em alta resolução ({originalPdf.originalPagesCount} páginas • {originalPdf.fileSizeFormatted}).
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-medium w-full"
                    >
                      <Link to={`/ler/${item.id}?mode=pdf`}>
                        <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                        Ler PDF Original
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              <Button
                asChild
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal shadow-md"
              >
                <Link
                  to={
                    item.type === "webtoon" || item.id.startsWith("wt-")
                      ? ["wt-solo-leveling", "wt-omniscient-reader", "wt-the-beginning-after-the-end", "wt-nano-machine"].includes(item.id)
                        ? `/webtoon/${item.id}/ler`
                        : `/webtoon/${item.id}`
                      : item.type === "book" ||
                        item.id.startsWith("guten-") ||
                        item.id.startsWith("sci-") ||
                        item.id.startsWith("curr-") ||
                        item.id.startsWith("mod-") ||
                        item.id.startsWith("auto-")
                      ? originalPdf
                        ? `/ler/${item.id}?mode=pdf`
                        : `/ler/${item.id}`
                      : `/leitura/${item.id}`
                  }
                  onClick={() => track(item.id, "read")}
                >
                  {item.type === "webtoon" || item.id.startsWith("wt-")
                    ? ["wt-solo-leveling", "wt-omniscient-reader", "wt-the-beginning-after-the-end", "wt-nano-machine"].includes(item.id)
                      ? progress?.progress_percentage ? "Continuar lendo" : "Ler obra completa agora"
                      : "Ver Ficha & Lançamentos Oficiais"
                    : originalPdf
                    ? "Ler PDF Original Completo"
                    : progress?.progress_percentage ? "Continuar lendo" : "Ler obra completa agora"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button
                  variant="outline"
                  className="rounded-md text-[11px] uppercase tracking-wider font-normal"
                  onClick={() => {
                    track(item.id, "listen");
                    toast.info("Audiolivro em breve");
                  }}
                >
                  <Headphones className="mr-2 h-3 w-3" />
                  Ouvir
                </Button>

                {originalPdf ? (
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-md text-[11px] uppercase tracking-wider font-normal text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <a
                      href={getDownloadPdfUrl(originalPdf.pdfUrl, `${originalPdf.title}-${originalPdf.author}.pdf`, originalPdf.id)}
                      download={`${originalPdf.title.replace(/[^\w\s-]/g, "")}-${originalPdf.author.replace(/[^\w\s-]/g, "")}.pdf`}
                    >
                      <Download className="mr-2 h-3 w-3" />
                      Baixar PDF
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-md text-[11px] uppercase tracking-wider font-normal"
                    onClick={() => {
                      track(item.id, "download");
                      toast.info("Download disponível");
                    }}
                  >
                    <Download className="mr-2 h-3 w-3" />
                    Baixar
                  </Button>
                )}

                <Button variant="outline" className="rounded-md text-[11px] uppercase tracking-wider font-normal" onClick={share}>
                  <Share2 className="mr-2 h-3 w-3" />
                  Partilhar
                </Button>
                <Button
                  variant="outline"
                  className="rounded-md text-[11px] uppercase tracking-wider font-normal"
                  onClick={() => {
                    setSaved(true);
                    track(item.id, "like");
                    toast.success("Salvo na sua estante");
                  }}
                >
                  <Bookmark className={`mr-2 h-3 w-3 ${saved ? "fill-primary text-primary" : ""}`} />
                  Salvar
                </Button>
              </div>

              <Button asChild variant="ghost" className="w-full mt-3 text-xs font-light text-muted-foreground">
                <Link to="/livros">
                  <ArrowLeft className="mr-2 h-3 w-3" />
                  Voltar ao catálogo
                </Link>
              </Button>
            </Card>
          </motion.div>
        </div>
      </main>

      <ContentSection
        eyebrow="Recomendações"
        title="Leitores também gostaram"
        subtitle="Sugestões por similaridade semântica"
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

      <Footer />
    </div>
  );
};

export default ContentDetail;
