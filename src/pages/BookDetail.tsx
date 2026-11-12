import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { BookOpen, ArrowLeft, ArrowRight, Check, Sparkles, Search, X, FileText, Download, Pencil, Share2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBook, useChapters, usePurchases } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { getOriginalPdfForBook, getDownloadPdfUrl } from "@/lib/originalPdfRegistry";
import { CommunityReviews } from "@/components/CommunityReviews";
import ShareDialog from "@/components/ShareDialog";
import { ContentDetailSkeleton } from "@/components/skeletons/AppSkeletons";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const { data: book, isLoading } = useBook(id);
  const { data: chapters = [] } = useChapters(id);
  const { data: purchases = [], refetch } = usePurchases();
  const { user, isAdmin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [selectedRange, setSelectedRange] = useState<number | "all">("all");
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Dynamic SEO Synchronization
  useEffect(() => {
    if (!book) return;
    const pageTitle = `${book.title} — ${book.author} | Wotho Livros`;
    document.title = pageTitle;
    const desc = book.description || `Leia "${book.title}" por ${book.author} online no navegador na Wotho.`;
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
  }, [book]);

  const originalPdf = useMemo(() => (id ? getOriginalPdfForBook(id) : undefined), [id]);

  const filteredChapters = useMemo(() => {
    let list = chapters;
    if (chapterSearch.trim()) {
      const q = chapterSearch.toLowerCase().trim();
      return list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          String(c.position) === q
      );
    }
    if (selectedRange !== "all") {
      const start = (selectedRange - 1) * 10 + 1;
      const end = selectedRange * 10;
      return list.filter((c) => c.position >= start && c.position <= end);
    }
    return list;
  }, [chapters, chapterSearch, selectedRange]);

  const totalRanges = Math.ceil(chapters.length / 10);

  const purchase = purchases.find((p) => p.book_id === id);
  const owned = purchase?.status === "paid";

  const handleReserve = async () => {
    if (!user) {
      toast.error("Entre na sua conta para reservar");
      navigate("/auth");
      return;
    }
    if (!book) return;
    setSubmitting(true);
    const { error } = await supabase.from("purchases").insert({
      user_id: user.id,
      book_id: book.id,
      amount_cents: book.price_cents,
      currency: book.currency,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível registrar a reserva");
      return;
    }
    toast.success("Reserva registrada! Confirmaremos o pagamento em breve.");
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <ContentDetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <div className="pt-40 text-center">
          <p className="text-sm text-muted-foreground font-light mb-6">Livro não encontrado.</p>
          <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal">
            <Link to="/livros">Ver catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isModern = book.id.startsWith("mod-");
  const isFree = book.price_cents === 0 || book.id.startsWith("guten-") || isModern;
  const canRead = isFree || owned;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      <div className="relative w-full h-[60vh] overflow-hidden">
        <motion.img
          src={book.cover_url || "/placeholder.svg"}
          alt={`Capa do livro ${book.title}`}
          style={{ y }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-6 md:left-12 lg:left-16 text-white">
          <span className="text-[11px] uppercase tracking-wider text-white/70 mb-3 block">
            {book.category} · Edição Integral Completa (Sem Resumos)
          </span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight max-w-xl">{book.title}</h1>
          <p className="text-sm font-light text-white/80 mt-2 flex items-center gap-2">
            <BookOpen className="h-3 w-3" />
            {book.author}
          </p>
          {isAdmin && (
            <div className="mt-4">
              <Button
                asChild
                size="sm"
                className="rounded-full text-[11px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4"
              >
                <Link to={`/admin?tab=books&editBook=${encodeURIComponent(book.id)}`}>
                  <Pencil className="h-3 w-3 mr-1.5" />
                  Editar Obra no Studio Editorial
                </Link>
              </Button>
            </div>
          )}
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
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">Sobre a obra</span>
            <p className="text-sm text-muted-foreground font-light leading-relaxed whitespace-pre-line mb-12">
              {book.description}
            </p>

            <div className="border border-border/80 rounded-xl p-5 bg-card/60 backdrop-blur-sm mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-medium text-foreground tracking-tight">
                    Índice de Capítulos Completo
                  </h3>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    {chapters.length} capítulos e módulos completos com leitura contínua
                  </p>
                </div>
                {canRead && chapters.length > 0 && (
                  <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-normal shrink-0">
                    <Link to={`/ler/${book.id}?cap=0`}>Começar do Capítulo 1</Link>
                  </Button>
                )}
              </div>

              {/* Fast Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => {
                    setChapterSearch(e.target.value);
                    if (e.target.value) setSelectedRange("all");
                  }}
                  placeholder="Buscar capítulo por título ou número..."
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                {chapterSearch && (
                  <button
                    onClick={() => setChapterSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Jump Range Switcher */}
              {!chapterSearch && totalRanges > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2 scrollbar-none">
                  <span className="text-[11px] text-muted-foreground font-light shrink-0 mr-1">
                    Saltos:
                  </span>
                  <button
                    onClick={() => setSelectedRange("all")}
                    className={`px-2.5 py-1 text-[11px] rounded-md transition-colors shrink-0 font-light ${
                      selectedRange === "all"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todos ({chapters.length})
                  </button>
                  {Array.from({ length: totalRanges }, (_, i) => {
                    const blockNum = i + 1;
                    const start = i * 10 + 1;
                    const end = Math.min((i + 1) * 10, chapters.length);
                    return (
                      <button
                        key={blockNum}
                        onClick={() => setSelectedRange(blockNum)}
                        className={`px-2.5 py-1 text-[11px] rounded-md transition-colors shrink-0 font-light ${
                          selectedRange === blockNum
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Cap. {start}–{end}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {filteredChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between border border-border/80 rounded-lg bg-card px-4 sm:px-5 py-3.5 hover:border-primary/50 transition-all group"
                >
                  <div className="pr-4 flex items-start gap-3">
                    <span className="text-xs font-mono font-medium text-muted-foreground w-6 text-right pt-0.5 shrink-0">
                      {chapter.position}.
                    </span>
                    <div>
                      <p className="text-sm font-normal text-card-foreground tracking-tight group-hover:text-primary transition-colors">
                        {chapter.title.replace(/^Cap[íi]tulo\s*\d+\s*:\s*/i, "")}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-light">
                        <span>Capítulo {chapter.position}</span>
                        <span aria-hidden="true">·</span>
                        <span>{isModern ? "Guia & Aplicação Completa" : "Texto Integral"}</span>
                      </div>
                    </div>
                  </div>
                  {canRead && (
                    <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 text-xs font-normal shrink-0">
                      <Link to={`/ler/${book.id}?cap=${chapter.position - 1}`}>
                        Ler
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
              {filteredChapters.length === 0 && chapters.length > 0 && (
                <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card/30">
                  <p className="text-xs text-muted-foreground font-light mb-2">
                    Nenhum capítulo encontrado para "{chapterSearch}".
                  </p>
                  <button
                    onClick={() => setChapterSearch("")}
                    className="text-xs text-primary underline font-light"
                  >
                    Limpar busca de capítulos
                  </button>
                </div>
              )}
              {chapters.length === 0 && (
                <p className="text-xs text-muted-foreground font-light py-8 text-center">
                  Carregando capítulos completos da obra...
                </p>
              )}
            </div>

            {/* Community Reviews, Comments & Adores */}
            <CommunityReviews
              itemId={book.id}
              itemType="book"
              itemTitle={book.title}
              defaultRating={4.9}
              defaultRatingCount={85}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card className="p-8 shadow-soft border border-border bg-card sticky top-28">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-light text-foreground">
                  {isFree ? "100% Grátis" : formatPrice(book.price_cents, book.currency)}
                </span>
                <span className="text-xs text-muted-foreground font-light">
                  {isModern ? "· Bestseller Moderno" : isFree ? "· Domínio Público" : "/acesso completo"}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Leitura online ilimitada com todas as páginas",
                  "Capítulos completos sem restrição",
                  "Ajuste de fonte, tamanho e temas de leitura",
                  "Acesso em qualquer smartphone, tablet ou computador",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground font-light">
                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {canRead ? (
                <div className="space-y-2.5">
                  {originalPdf && (
                    <Button
                      asChild
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-md smooth-hover text-[11px] uppercase tracking-wider font-semibold shadow-md flex items-center justify-center gap-2"
                    >
                      <Link to={`/ler/${book.id}?mode=pdf`}>
                        <FileText className="h-4 w-4" />
                        Ler Edição em PDF Original
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}

                  <Button
                    asChild
                    variant={originalPdf ? "outline" : "default"}
                    className={`w-full ${originalPdf ? "border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"} rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal`}
                  >
                    <Link to={`/ler/${book.id}?mode=text`}>
                      {originalPdf ? "Ler em Modo Texto Adaptado" : "Ler Obra Completa Agora"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  {originalPdf && (
                    <div className="pt-2">
                      <a
                        href={getDownloadPdfUrl(originalPdf.pdfUrl, `${originalPdf.title}-${originalPdf.author}.pdf`, originalPdf.id)}
                        download={`${originalPdf.title.replace(/[^\w\s-]/g, "")}-${originalPdf.author.replace(/[^\w\s-]/g, "")}.pdf`}
                        className="w-full py-2 px-3 border border-border/80 hover:border-border rounded-md text-xs font-light text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 bg-secondary/30"
                      >
                        <Download className="h-3.5 w-3.5 text-rose-500" />
                        <span>Baixar PDF ({originalPdf.fileSizeFormatted})</span>
                      </a>
                      <div className="mt-3 p-3 rounded-lg bg-accent/40 border border-border/60 text-[11px] text-muted-foreground font-light space-y-1">
                        <div className="flex justify-between">
                          <span className="text-foreground font-medium">Páginas físicas:</span>
                          <span>{originalPdf.originalPagesCount} páginas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground font-medium">Acervo:</span>
                          <span className="truncate max-w-[140px] text-right">{originalPdf.sourceRepository}</span>
                        </div>
                        <p className="pt-1 text-[10px] text-muted-foreground/80 leading-normal border-t border-border/40">
                          {originalPdf.editionNotes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : purchase ? (
                <div className="text-center">
                  <Sparkles className="h-4 w-4 text-primary mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground font-light">
                    Reserva pendente — liberamos assim que o pagamento for confirmado.
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal"
                  onClick={handleReserve}
                  disabled={submitting}
                >
                  {submitting ? "Enviando..." : "Reservar livro"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setIsShareOpen(true)}
                className="w-full mt-2.5 rounded-md text-[11px] uppercase tracking-wider font-normal gap-2 border-border"
              >
                <Share2 className="h-3.5 w-3.5 text-primary" />
                Compartilhar Obra
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full mt-3 text-xs font-light text-muted-foreground"
              >
                <Link to="/livros">
                  <ArrowLeft className="mr-2 h-3 w-3" />
                  Voltar ao catálogo
                </Link>
              </Button>
            </Card>
          </motion.div>
        </div>
      </main>

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        title={`${book.title} — ${book.author} | Worsco Livros`}
        text={book.description || `Confira a obra "${book.title}" para leitura online na Worsco.`}
      />

      {/* Schema.org Book Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
            author: {
              "@type": "Person",
              name: book.author,
            },
            description: book.description,
            image: book.cover_url || "https://wotho.vercel.app/og-image.jpg",
            inLanguage: "pt-BR",
            url: window.location.href,
            publisher: {
              "@type": "Organization",
              name: "Wotho",
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
};

export default BookDetail;
