import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/consent/CookieConsent";
import TermsGate from "./components/consent/TermsGate";
import CanonicalManager from "./components/CanonicalManager";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { GeoLanguageProvider } from "./lib/geoLanguage";
import { PageShellSkeleton } from "./components/skeletons/AppSkeletons";
import Index from "./pages/Index";

function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const delays = [350, 900, 1800];
    let lastError: unknown;
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastError = err;
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }
    throw lastError;
  });
}

const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Books = lazyWithRetry(() => import("./pages/Books"));
const BookDetail = lazyWithRetry(() => import("./pages/BookDetail"));
const Reader = lazyWithRetry(() => import("./pages/Reader"));
const News = lazyWithRetry(() => import("./pages/News"));
const NewsArticle = lazyWithRetry(() => import("./pages/NewsArticle"));
const Library = lazyWithRetry(() => import("./pages/Library"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const ContentDetail = lazyWithRetry(() => import("./pages/ContentDetail"));
const ContentReader = lazyWithRetry(() => import("./pages/ContentReader"));
const WebtoonDetail = lazyWithRetry(() => import("./pages/WebtoonDetail"));
const Webtoons = lazyWithRetry(() => import("./pages/Webtoons"));
const WebtoonReader = lazyWithRetry(() => import("./pages/WebtoonReader"));
const Animes = lazyWithRetry(() => import("./pages/Animes"));
const AnimeDetail = lazyWithRetry(() => import("./pages/AnimeDetail"));
const Cinema = lazyWithRetry(() => import("./pages/Cinema"));
const CinemaDetail = lazyWithRetry(() => import("./pages/CinemaDetail"));
const ForYou = lazyWithRetry(() => import("./pages/ForYou"));
const ContinueReading = lazyWithRetry(() => import("./pages/ContinueReading"));
const Search = lazyWithRetry(() => import("./pages/Search"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const SiteMapPage = lazyWithRetry(() => import("./pages/SiteMapPage"));
const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const AnimeMangaReader = lazyWithRetry(() => import("./pages/AnimeMangaReader"));
const PurchaseSuccess = lazyWithRetry(() => import("./pages/PurchaseSuccess"));
const PurchaseCancelled = lazyWithRetry(() => import("./pages/PurchaseCancelled"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));

const SpeedInsights = () => null;

const RouteLoadingFallback = () => <PageShellSkeleton />;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const runLazyCloudEditorialSync = () => {
  void import("./lib/editorialStore")
    .then((m) => m.initCloudEditorialSync())
    .catch(() => {});
};

const CloudEditorialQuerySync = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      runLazyCloudEditorialSync();
    }, 4000);

    let debounceTimer: number | null = null;
    let lastInvalidatedAt = 0;

    const handleEditorialUpdated = () => {
      const now = Date.now();
      if (now - lastInvalidatedAt < 2500) return;
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        lastInvalidatedAt = Date.now();
        void qc.invalidateQueries({ queryKey: ["news"] });
        void qc.invalidateQueries({ queryKey: ["news-feed"] });
        void qc.invalidateQueries({ queryKey: ["books"] });
        void qc.invalidateQueries({ queryKey: ["contents"] });
      }, 300);
    };

    window.addEventListener("worscoi_editorial_updated", handleEditorialUpdated);

    return () => {
      window.clearTimeout(syncTimer);
      if (debounceTimer) window.clearTimeout(debounceTimer);
      window.removeEventListener("worscoi_editorial_updated", handleEditorialUpdated);
    };
  }, [qc]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GeoLanguageProvider>
      <CloudEditorialQuerySync />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SpeedInsights />
        <BrowserRouter>
          <AppErrorBoundary>
            <ScrollToTop />
            <CanonicalManager />
            <CookieConsent />
            <TermsGate />
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Index />} />
                <Route path="/inicio" element={<Index />} />
                <Route path="/index.html" element={<Index />} />
                <Route path="/livros" element={<Books />} />
                <Route path="/livro" element={<Books />} />
                <Route path="/books" element={<Books />} />
                <Route path="/livros/:id" element={<BookDetail />} />
                <Route path="/livro/:id" element={<BookDetail />} />
                <Route path="/ler/:id" element={<Reader />} />
                <Route path="/noticias" element={<News />} />
                <Route path="/noticia" element={<News />} />
                <Route path="/news" element={<News />} />
                <Route path="/noticias/:slug" element={<NewsArticle />} />
                <Route path="/noticia/:slug" element={<NewsArticle />} />
                <Route path="/news/:slug" element={<NewsArticle />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/meu-perfil" element={<Profile />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/entrar" element={<Auth />} />
                <Route path="/cadastro" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/conteudo/:id" element={<ContentDetail />} />
                <Route path="/leitura/:id" element={<ContentReader />} />
                <Route path="/webtoons" element={<Webtoons />} />
                <Route path="/webtoon" element={<Webtoons />} />
                <Route path="/webtoon/:id" element={<WebtoonDetail />} />
                <Route path="/webtoons/:id" element={<WebtoonDetail />} />
                <Route path="/webtoon/:id/ep/:episodeId" element={<WebtoonReader />} />
                <Route path="/webtoon/:id/ler/:episodeId" element={<WebtoonReader />} />
                <Route path="/webtoon/:id/ler" element={<WebtoonReader />} />
                <Route path="/animes" element={<Animes />} />
                <Route path="/anime" element={<Animes />} />
                <Route path="/manga" element={<Animes />} />
                <Route path="/mangas" element={<Animes />} />
                <Route path="/animes/:id" element={<AnimeDetail />} />
                <Route path="/anime/:id" element={<AnimeDetail />} />
                <Route path="/animes/:id/manga" element={<AnimeMangaReader />} />
                <Route path="/animes/:id/manga/:chapterId" element={<AnimeMangaReader />} />
                <Route path="/cinema" element={<Cinema />} />
                <Route path="/filme" element={<Cinema />} />
                <Route path="/filmes" element={<Cinema />} />
                <Route path="/serie" element={<Cinema />} />
                <Route path="/series" element={<Cinema />} />
                <Route path="/dorama" element={<Cinema />} />
                <Route path="/doramas" element={<Cinema />} />
                <Route path="/cinema/:id" element={<CinemaDetail />} />
                <Route path="/filme/:id" element={<CinemaDetail />} />
                <Route path="/filmes/:id" element={<CinemaDetail />} />
                <Route path="/serie/:id" element={<CinemaDetail />} />
                <Route path="/series/:id" element={<CinemaDetail />} />
                <Route path="/para-voce" element={<ForYou />} />
                <Route path="/continuar-lendo" element={<ContinueReading />} />
                <Route path="/buscar" element={<Search />} />
                <Route path="/search" element={<Search />} />
                <Route path="/pesquisa" element={<Search />} />
                <Route path="/pesquisar" element={<Search />} />
                <Route path="/compra/sucesso" element={<PurchaseSuccess />} />
                <Route path="/compra/cancelada" element={<PurchaseCancelled />} />
                <Route path="/redefinir-senha" element={<ResetPassword />} />
                <Route path="/mapa-do-site" element={<SiteMapPage />} />
                <Route path="/sitemap" element={<SiteMapPage />} />
                <Route path="/mapa" element={<SiteMapPage />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/termos-de-uso" element={<Terms />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/politica-de-privacidade" element={<Privacy />} />
                <Route path="/sobre" element={<About />} />
                <Route path="/about" element={<About />} />
                <Route path="/quem-somos" element={<About />} />
                <Route path="/contato" element={<Contact />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/fale-conosco" element={<Contact />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </GeoLanguageProvider>
  </QueryClientProvider>
);

export default App;
