import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/consent/CookieConsent";
import TermsGate from "./components/consent/TermsGate";
import CanonicalManager from "./components/CanonicalManager";
import AppErrorBoundary from "./components/AppErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import { initCloudEditorialSync } from "./lib/editorialStore";

function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (firstError) {
      if (typeof navigator !== "undefined" && navigator.onLine !== false) {
        await new Promise((r) => setTimeout(r, 400));
        return await factory();
      }
      throw firstError;
    }
  });
}

const Books = lazyWithRetry(() => import("./pages/Books"));
const BookDetail = lazyWithRetry(() => import("./pages/BookDetail"));
const Reader = lazyWithRetry(() => import("./pages/Reader"));
const News = lazyWithRetry(() => import("./pages/News"));
const NewsArticle = lazyWithRetry(() => import("./pages/NewsArticle"));
const Library = lazyWithRetry(() => import("./pages/Library"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const ContentDetail = lazyWithRetry(() => import("./pages/ContentDetail"));
const ContentReader = lazyWithRetry(() => import("./pages/ContentReader"));
const WebtoonDetail = lazyWithRetry(() => import("./pages/WebtoonDetail"));
const Webtoons = lazyWithRetry(() => import("./pages/Webtoons"));
const WebtoonReader = lazyWithRetry(() => import("./pages/WebtoonReader"));
const Animes = lazyWithRetry(() => import("./pages/Animes"));
const AnimeDetail = lazyWithRetry(() => import("./pages/AnimeDetail"));
const AnimeMangaReader = lazyWithRetry(() => import("./pages/AnimeMangaReader"));
const Cinema = lazyWithRetry(() => import("./pages/Cinema"));
const CinemaDetail = lazyWithRetry(() => import("./pages/CinemaDetail"));
const ForYou = lazyWithRetry(() => import("./pages/ForYou"));
const ContinueReading = lazyWithRetry(() => import("./pages/ContinueReading"));
const Search = lazyWithRetry(() => import("./pages/Search"));
const PurchaseSuccess = lazyWithRetry(() => import("./pages/PurchaseSuccess"));
const PurchaseCancelled = lazyWithRetry(() => import("./pages/PurchaseCancelled"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const SiteMapPage = lazyWithRetry(() => import("./pages/SiteMapPage"));
const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));

const SpeedInsights = () => null;

const RouteLoadingFallback = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
    <div className="w-24 h-0.5 bg-border overflow-hidden rounded-full">
      <div className="h-full w-1/2 bg-primary animate-pulse rounded-full" />
    </div>
    <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-light">
      Carregando…
    </span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const CloudEditorialQuerySync = () => {
  const qc = useQueryClient();

  useEffect(() => {
    void initCloudEditorialSync();

    const handleEditorialUpdated = () => {
      void qc.invalidateQueries({ queryKey: ["news"] });
      void qc.invalidateQueries({ queryKey: ["news-feed"] });
      void qc.invalidateQueries({ queryKey: ["books"] });
      void qc.invalidateQueries({ queryKey: ["contents"] });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void initCloudEditorialSync();
      }
    };

    window.addEventListener("worscoi_editorial_updated", handleEditorialUpdated);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("worscoi_editorial_updated", handleEditorialUpdated);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [qc]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CloudEditorialQuerySync />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SpeedInsights />
      <BrowserRouter>
        <ScrollToTop />
        <CanonicalManager />
        <CookieConsent />
        <TermsGate />
        <OfflineBanner />
        <AppErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/livros" element={<Books />} />
            <Route path="/livros/:id" element={<BookDetail />} />
            <Route path="/ler/:id" element={<Reader />} />
            <Route path="/noticias" element={<News />} />
            <Route path="/noticias/:slug" element={<NewsArticle />} />
            <Route path="/biblioteca" element={<Library />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/meu-perfil" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/conteudo/:id" element={<ContentDetail />} />
            <Route path="/leitura/:id" element={<ContentReader />} />
            <Route path="/webtoons" element={<Webtoons />} />
            <Route path="/webtoon/:id" element={<WebtoonDetail />} />
            <Route path="/webtoon/:id/ep/:episodeId" element={<WebtoonReader />} />
            <Route path="/webtoon/:id/ler/:episodeId" element={<WebtoonReader />} />
            <Route path="/webtoon/:id/ler" element={<WebtoonReader />} />
            <Route path="/animes" element={<Animes />} />
            <Route path="/animes/:id" element={<AnimeDetail />} />
            <Route path="/animes/:id/manga" element={<AnimeMangaReader />} />
            <Route path="/animes/:id/manga/:chapterId" element={<AnimeMangaReader />} />
            <Route path="/cinema" element={<Cinema />} />
            <Route path="/cinema/:id" element={<CinemaDetail />} />
            <Route path="/para-voce" element={<ForYou />} />
            <Route path="/continuar-lendo" element={<ContinueReading />} />
            <Route path="/buscar" element={<Search />} />
            <Route path="/compra/sucesso" element={<PurchaseSuccess />} />
            <Route path="/compra/cancelada" element={<PurchaseCancelled />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/mapa-do-site" element={<SiteMapPage />} />
            <Route path="/sitemap" element={<SiteMapPage />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/contacto" element={<Contact />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AppErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
