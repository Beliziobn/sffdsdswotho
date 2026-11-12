import { useMemo, useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Share2,
  BookOpen,
  Calendar,
  MessageCircle,
  Pencil,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useArticle, useNews } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { expandNewsToDeepReport, organizeIntoReadableParagraphs, EnrichedNews } from "@/lib/newsExpander";
import { getSmartNewsCover } from "@/lib/newsImageResolver";
import ShareDialog from "@/components/ShareDialog";
import { NewsArticleSkeleton } from "@/components/skeletons/AppSkeletons";

const NewsArticle = () => {
  const { slug } = useParams();
  const { data: rawArticle, isLoading } = useArticle(slug);
  const { data: allNews = [] } = useNews();
  const { isAdmin } = useAuth();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const [liveContent, setLiveContent] = useState<string | null>(null);
  const [liveCover, setLiveCover] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const attemptedUrlRef = useRef<string | null>(null);

  // Guarantee every article is upgraded to clean authentic reporting
  const article: EnrichedNews | null = useMemo(() => {
    if (!rawArticle) return null;
    return expandNewsToDeepReport(rawArticle);
  }, [rawArticle]);

  // Synchronize document title and OpenGraph metadata dynamically
  useEffect(() => {
    if (!article) return;
    const pageTitle = `${article.title} — Wotho Notícias`;
    document.title = pageTitle;

    const desc = article.excerpt || article.title;
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

    import("@/lib/userProfileStore").then(({ recordUserHistory }) => {
      recordUserHistory({
        itemId: article.slug || article.id,
        type: "news",
        title: article.title,
        subtitle: article.category || "Reportagem Especial",
        cover: getSmartNewsCover(article.title, article.category, article.cover_url || undefined),
        href: `/noticias/${article.slug}`,
        progressPercent: 100,
        detailLabel: article.source_name || "Editorial Wotho",
      });
    }).catch(() => {});
  }, [article]);

  // Reset live content and cover on slug change
  useEffect(() => {
    setLiveContent(null);
    setLiveCover(null);
    attemptedUrlRef.current = null;
  }, [slug]);

  // Fetch full authentic article and original cover from publisher at most once per article URL
  useEffect(() => {
    const sourceUrl = article?.source_url;
    if (!sourceUrl || attemptedUrlRef.current === sourceUrl) return;

    const currentParagraphs = (article.content || "").split(/\n\s*\n+/).filter(Boolean);
    const isBrief = currentParagraphs.length < 3 || (article.content || "").length < 400;
    const isUnsplashCover = !article.cover_url || article.cover_url.includes("images.unsplash.com");

    if (isBrief || isUnsplashCover) {
      attemptedUrlRef.current = sourceUrl;
      fetch(`/api/news/extract?url=${encodeURIComponent(sourceUrl)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.content && data.content.length > (article.content?.length || 0)) {
            setLiveContent(data.content);
          }
          if (data?.coverUrl && !data.coverUrl.includes("images.unsplash.com")) {
            setLiveCover(data.coverUrl);
          }
        })
        .catch(() => {});
    }
  }, [article?.source_url, article?.content, article?.cover_url]);

  const activeContent = liveContent || article?.content || "";

  // Find related news from same category or latest
  const relatedNews = useMemo(() => {
    if (!article) return [];
    return allNews
      .filter((n) => n.id !== article.id && (n as any).slug !== article.slug)
      .slice(0, 3);
  }, [allNews, article]);

  // Parse structured blocks from active content with smart paragraph organization
  const contentBlocks = useMemo(() => {
    if (!activeContent) return [];
    const organizedParagraphs = organizeIntoReadableParagraphs(activeContent);

    return organizedParagraphs
      .map((p) => p.trim())
      .filter(Boolean)
      .map((text, idx) => {
        if (text.startsWith("### ")) {
          return { type: "heading", text: text.replace(/^###\s*/, ""), key: idx };
        }
        if (text.startsWith("> ")) {
          return { type: "quote", text: text.replace(/^>\s*/, "").replace(/^"|"$/g, ""), key: idx };
        }
        if (text.includes("\n• ") || text.startsWith("• ")) {
          const items = text.split("\n• ").map((i) => i.replace(/^•\s*/, "").trim()).filter(Boolean);
          return { type: "list", items, key: idx };
        }
        return { type: "paragraph", text, key: idx };
      });
  }, [activeContent]);

  const handleShare = (network?: string) => {
    const url = window.location.href;
    const title = article?.title || "Notícia Wotho";

    if (network === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${url}`)}`, "_blank");
      return;
    }
    if (network === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
      return;
    }

    if (navigator.share) {
      navigator.share({ title, url }).catch(() => undefined);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <NewsArticleSkeleton />
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation variant="dark" />
        <div className="pt-40 text-center">
          <p className="text-sm text-muted-foreground font-light mb-6">Notícia não encontrada.</p>
          <Button asChild variant="outline" className="rounded-full text-[11px] uppercase tracking-wider font-normal">
            <Link to="/noticias">Ver todas as notícias</Link>
          </Button>
        </div>
      </div>
    );
  }

  const readTime = Math.max(
    1,
    Math.round((activeContent.split(/\s+/).filter(Boolean).length || 200) / 180)
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Sticky Top Reading Progress Bar */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1 bg-emerald-500 origin-left z-50 shadow-sm" />
      <Navigation />

      {/* Hero Banner with Authentic Cover */}
      <div className="relative w-full h-[55vh] md:h-[65vh] overflow-hidden bg-zinc-950">
        <img
          src={
            (
              liveCover ||
              (article.cover_url && !article.cover_url.includes("images.unsplash.com")
                ? article.cover_url
                : getSmartNewsCover(article.title, article.category, article.cover_url))
            ).replace(/&amp;/g, "&")
          }
          alt={article.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const current = e.currentTarget.src;
            const rawOriginal = (liveCover || article.cover_url || "").replace(/&amp;/g, "&");
            const proxyUrl = `/api/news/image-proxy?url=${encodeURIComponent(rawOriginal)}`;
            const fallback = getSmartNewsCover(article.title, article.category);
            if (rawOriginal.startsWith("http") && !current.includes("/api/news/image-proxy") && !rawOriginal.includes("images.unsplash.com")) {
              e.currentTarget.src = proxyUrl;
            } else if (current !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/50 to-black/30" />

        <div className="absolute bottom-8 sm:bottom-12 left-0 right-0 px-6 lg:px-12">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 font-medium">
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-semibold shadow-sm">
                {article.category}
              </span>
              <span className="flex items-center gap-1 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full text-[11px]">
                <Calendar className="h-3 w-3" />
                {formatDate(article.published_at)}
              </span>
              <span className="flex items-center gap-1 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full text-[11px]">
                <Clock className="h-3 w-3" />
                {readTime} min de leitura
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-white leading-tight drop-shadow-md">
              {article.title}
            </h1>

            {(article as any).author && (
              <p className="text-xs sm:text-sm text-white/90 font-light flex items-center gap-1.5 pt-1">
                <span>Por</span>
                <span className="font-medium text-emerald-300">
                  {(article as any).source_name || (article as any).author}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="py-12 md:py-20 px-6 lg:px-12">
        <article className="max-w-3xl mx-auto">
          {/* Action bar (Back + Share) */}
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-border">
            <Link
              to="/noticias"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Todas as Notícias
            </Link>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  asChild
                  size="sm"
                  className="rounded-full text-[11px] uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 mr-2 h-8 px-3.5"
                >
                  <Link to={`/admin?tab=news&edit=${encodeURIComponent(article.slug || article.id)}`}>
                    <Pencil className="h-3 w-3 mr-1.5" />
                    Editar Publicação
                  </Link>
                </Button>
              )}
              <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Compartilhar:</span>
              <button
                onClick={() => handleShare("whatsapp")}
                className="p-2 rounded-full border border-border bg-card text-emerald-600 hover:bg-accent transition-colors"
                title="Compartilhar no WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="p-2 rounded-full border border-border bg-card text-sky-500 hover:bg-accent transition-colors"
                title="Compartilhar no X/Twitter"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
                title="Opções de Compartilhamento"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Lead / Subtitle (only shown if distinct from the opening paragraph) */}
          {article.excerpt &&
            contentBlocks.length > 0 &&
            !(contentBlocks[0].text || "")
              .toLowerCase()
              .startsWith(article.excerpt.replace(/\.{3}$/, "").trim().slice(0, 60).toLowerCase()) && (
              <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-accent/40 border-l-4 border-emerald-500 text-foreground font-light text-base sm:text-lg leading-relaxed shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold block mb-1.5">
                  Resumo Editorial
                </span>
                {article.excerpt}
              </div>
            )}

          {/* Rich Body Content organized in clear, comfortable paragraphs */}
          <div className="space-y-6 text-base sm:text-[17.5px] text-foreground/90 font-light leading-[1.85]">
            {contentBlocks.map((block, index) => {
              if (block.type === "heading") {
                return (
                  <h3
                    key={block.key}
                    className="text-xl sm:text-2xl font-medium text-foreground pt-6 pb-1 tracking-tight border-b border-border/50"
                  >
                    {block.text}
                  </h3>
                );
              }

              if (block.type === "quote") {
                return (
                  <blockquote
                    key={block.key}
                    className="my-6 pl-5 border-l-4 border-emerald-500/80 italic text-muted-foreground text-base sm:text-lg bg-card/50 py-3.5 pr-4 rounded-r-xl leading-[1.8]"
                  >
                    "{block.text}"
                  </blockquote>
                );
              }

              if (block.type === "list") {
                return (
                  <ul key={block.key} className="space-y-2.5 pl-4 my-4">
                    {block.items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-foreground/85 leading-[1.8]">
                        <span className="text-emerald-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }

              return (
                <p
                  key={block.key}
                  className={
                    index === 0
                      ? "text-left text-lg sm:text-[19px] text-foreground font-normal leading-[1.85] border-l-4 border-emerald-500 pl-4 sm:pl-5 py-0.5"
                      : "text-left leading-[1.85] tracking-[0.01em]"
                  }
                >
                  {block.text}
                </p>
              );
            })}
          </div>

          {/* Related Articles Section */}
          {relatedNews.length > 0 && (
            <div className="mt-20 pt-10 border-t border-border">
              <span className="text-[11px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold block mb-2">
                Continue Lendo
              </span>
              <h3 className="text-2xl font-light text-foreground tracking-tight mb-8">
                Mais Notícias do Dia
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedNews.map((rel) => {
                  const relSlug = (rel as any).slug || rel.id;
                  return (
                    <Link
                      key={rel.id}
                      to={`/noticias/${relSlug}`}
                      className="group flex flex-col rounded-xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-md transition-all"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-accent relative">
                        <img
                          src={
                            (rel.cover_url && !rel.cover_url.includes("images.unsplash.com")
                              ? rel.cover_url
                              : getSmartNewsCover(rel.title, rel.category, rel.cover_url)
                            ).replace(/&amp;/g, "&")
                          }
                          alt={rel.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const fallback = getSmartNewsCover(rel.title, rel.category);
                            if (e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-white text-[9px] uppercase tracking-wider font-semibold">
                          {rel.category}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-1">
                        <h4 className="text-xs sm:text-sm font-medium text-card-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground mt-3 block">
                          {formatDate(rel.published_at)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-14 pt-6 border-t border-border">
            <Button asChild variant="ghost" className="text-xs font-light text-muted-foreground px-0">
              <Link to="/noticias">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Voltar para todas as notícias
              </Link>
            </Button>
          </div>
        </article>
      </main>

      <ShareDialog
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        title={article.title}
        text={article.excerpt || "Leia esta reportagem completa na Worsco:"}
      />

      {/* Schema.org NewsArticle Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            image: [
              liveCover ||
                article.cover_url ||
                "https://wotho.vercel.app/og-image.jpg",
            ],
            datePublished: article.published_at,
            dateModified: article.published_at,
            author: [
              {
                "@type": "Organization",
                name: "Redação Wotho",
              },
            ],
            publisher: {
              "@type": "Organization",
              name: "Wotho",
              logo: {
                "@type": "ImageObject",
                url: "https://wotho.vercel.app/favicon-512x512.png",
              },
            },
            description: article.excerpt || article.title,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": window.location.href,
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
};

export default NewsArticle;
